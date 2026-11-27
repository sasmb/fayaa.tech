import type { VideoTask } from "wasp/entities";
import { usdToCredits } from "./pricing";
import { MOTION_MODELS } from "./templates";

interface MuApiPollingResponse {
  status: string;
  outputs?: string[];
  output?: { video_url?: string };
  error?: string;
}

interface HiggsfieldPollingResponse {
  status: string;
  video?: { url?: string };
  output_url?: string;
  video_url?: string;
  error?: unknown;
}

export interface TaskSyncEntities {
  VideoTask: {
    findUnique: (args: { where: { id: string } }) => Promise<VideoTask | null>;
    update: (args: {
      where: { id: string };
      data: Partial<VideoTask>;
    }) => Promise<VideoTask>;
    updateMany: (args: {
      where: { id: string; status?: string };
      data: Partial<VideoTask>;
    }) => Promise<{ count: number }>;
  };
  User: {
    update: (args: {
      where: { id: string };
      data: { credits: { increment: number } };
    }) => Promise<any>;
  };
}

const MAX_TASK_DURATION_MS = 30 * 60 * 1000; // 30 minutes render timeout safeguard

export function creditCostForResolution(
  resolution?: string,
  modelOrVariant?: string,
  durationSec?: number
): number {
  const sec = Math.max(4, Math.min(30, Math.ceil(durationSec || 5)));
  const matchedModel = MOTION_MODELS.find(
    (m) =>
      m.id === modelOrVariant ||
      m.name.toLowerCase() === modelOrVariant?.toLowerCase() ||
      (modelOrVariant === "pro" && m.id.includes("genjutsu/motion-transfer")) ||
      (modelOrVariant === "light" && m.id.includes("genjutsu-light"))
  );

  const isPro =
    modelOrVariant === "pro" ||
    modelOrVariant === "higgsfield/genjutsu/motion-transfer/v1.0";
  const fallbackRates = isPro
    ? { "480p": 0.159, "720p": 0.3405, "1080p": 0.816 }
    : { "480p": 0.025, "720p": 0.05, "1080p": 0.1 };

  const rates = matchedModel?.usdPerSecByRes ?? fallbackRates;
  const resKey = (
    resolution === "1080p" || resolution === "480p" ? resolution : "720p"
  ) as "480p" | "720p" | "1080p";
  const usdPerSec = rates[resKey] ?? rates["720p"];
  const totalUsd = Number((sec * usdPerSec).toFixed(2));
  // Provider cost x markup, at 30 credits per $1 (see pricing.ts).
  return usdToCredits(totalUsd);
}

function formatProviderError(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const detail =
      (error as { detail?: unknown; message?: unknown }).detail ??
      (error as { message?: unknown }).message;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}

/**
 * Checks external provider status (Higgsfield or MuAPI) for a single VideoTask,
 * updating its database state to COMPLETED or FAILED as appropriate.
 *
 * Safe for concurrent execution from both interactive user queries
 * and recurring background pg-boss workers. Credit refunds on failure are atomic.
 */
export async function syncVideoTaskStatus(
  task: VideoTask,
  entities: TaskSyncEntities
): Promise<VideoTask> {
  // If already in a terminal state, return immediately
  if (task.status === "COMPLETED" || task.status === "FAILED") {
    return task;
  }

  // Refund what was actually charged when it was recorded; older tasks fall back to an estimate.
  const refundAmount =
    task.creditsCharged ?? creditCostForResolution(task.resolution, task.model);

  // 1. Check for stale/timed-out tasks (e.g. 30+ minutes stuck in PROCESSING)
  const taskAgeMs = Date.now() - new Date(task.createdAt).getTime();
  if (taskAgeMs > MAX_TASK_DURATION_MS) {
    const transitioned = await entities.VideoTask.updateMany({
      where: { id: task.id, status: "PROCESSING" },
      data: {
        status: "FAILED",
        error: "Render timed out after 30 minutes without upstream completion.",
      },
    });

    if (transitioned.count > 0) {
      await entities.User.update({
        where: { id: task.userId },
        data: { credits: { increment: refundAmount } },
      });
    }

    const updated = await entities.VideoTask.findUnique({
      where: { id: task.id },
    });
    return updated || task;
  }

  // 2. Poll the upstream AI provider
  try {
    if (task.provider === "MUAPI") {
      const res = await fetch(
        `https://api.muapi.ai/api/v1/predictions/${task.requestId}/result`,
        {
          headers: { "x-api-key": process.env.MUAPI_API_KEY || "" },
        }
      );

      if (res.ok) {
        const data = (await res.json()) as MuApiPollingResponse;
        const outputUrl = data.outputs?.[0] || data.output?.video_url;
        if (data.status === "completed" && outputUrl) {
          const transitioned = await entities.VideoTask.updateMany({
            where: { id: task.id, status: "PROCESSING" },
            data: {
              status: "COMPLETED",
              outputVideoUrl: outputUrl,
            },
          });
          if (transitioned.count > 0) {
            const updated = await entities.VideoTask.findUnique({
              where: { id: task.id },
            });
            return updated || task;
          }
        } else if (
          data.status === "failed" ||
          data.status === "error" ||
          data.status === "canceled"
        ) {
          const transitioned = await entities.VideoTask.updateMany({
            where: { id: task.id, status: "PROCESSING" },
            data: {
              status: "FAILED",
              error: data.error || "MuAPI rendering pipeline failure",
            },
          });

          if (transitioned.count > 0) {
            await entities.User.update({
              where: { id: task.userId },
              data: { credits: { increment: refundAmount } },
            });
          }

          const updated = await entities.VideoTask.findUnique({
            where: { id: task.id },
          });
          return updated || task;
        }
      }
    } else {
      // Default / HIGGSFIELD
      const baseUrl = (
        process.env.HF_API_BASE_URL || "https://api.higgsfield.ai"
      ).replace(/\/+$/, "");
      const res = await fetch(
        `${baseUrl}/requests/${encodeURIComponent(task.requestId)}/status`,
        {
          headers: {
            Authorization: `Key ${process.env.HF_CREDENTIALS || ""}`,
          },
        }
      );

      if (res.ok) {
        const data = (await res.json()) as HiggsfieldPollingResponse;
        const outputVideoUrl =
          data.video?.url || data.output_url || data.video_url;
        if (data.status === "completed" && outputVideoUrl) {
          const transitioned = await entities.VideoTask.updateMany({
            where: { id: task.id, status: "PROCESSING" },
            data: {
              status: "COMPLETED",
              outputVideoUrl,
            },
          });
          if (transitioned.count > 0) {
            const updated = await entities.VideoTask.findUnique({
              where: { id: task.id },
            });
            return updated || task;
          }
        } else if (
          data.status === "failed" ||
          data.status === "nsfw" ||
          data.status === "canceled"
        ) {
          const reason =
            data.status === "nsfw"
              ? "Blocked by the content filter"
              : data.status === "canceled"
                ? "Canceled"
                : formatProviderError(
                    data.error,
                    "Higgsfield processing exception"
                  );
          const transitioned = await entities.VideoTask.updateMany({
            where: { id: task.id, status: "PROCESSING" },
            data: {
              status: "FAILED",
              error: reason,
            },
          });

          if (transitioned.count > 0) {
            await entities.User.update({
              where: { id: task.userId },
              data: { credits: { increment: refundAmount } },
            });
          }

          const updated = await entities.VideoTask.findUnique({
            where: { id: task.id },
          });
          return updated || task;
        }
      }
    }
  } catch (error) {
    console.warn(
      `[syncVideoTaskStatus] Network error checking task ${task.id}:`,
      error
    );
  }

  return task;
}
