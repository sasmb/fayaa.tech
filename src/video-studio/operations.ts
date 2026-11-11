import { HttpError } from "wasp/server";
import type { VideoTask } from "wasp/entities";
import { getModel, parseSettings } from "./hf/generation/catalog";
import type { GenerationPlane } from "./hf/generation/catalog/types";
import { urls } from "./hf/generation/catalog/mappers";
import {
  MissingCredentialsError,
  parseCredentialInput,
} from "./hf/generation/credentials";
import {
  createPlatformClient,
  PlatformError,
  type QueuedGeneration,
  type StatusResult,
} from "./hf/generation/platform";
import { toPlatform } from "./hf/generation/to-platform";
import {
  requireUploadContentType,
  type UploadTicket,
} from "./hf/generation/upload-contract";
import { creditCostForResolution, syncVideoTaskStatus } from "./taskSync";

const DEFAULT_HF_BASE_URL = "https://api.higgsfield.ai";
const customCredentialsByScope = new Map<string, string>();

function credentialScope(userId?: string): string {
  return userId ?? "default";
}

function readStoredApiKey(userId?: string): string | null {
  const custom =
    customCredentialsByScope.get(credentialScope(userId)) ??
    customCredentialsByScope.get("default");
  if (custom && custom.trim()) return custom.trim();
  const envKey = process.env.HF_CREDENTIALS?.trim();
  return envKey ? envKey : null;
}

function readServerCredentials(userId?: string): {
  apiKey: string;
  baseUrl: string;
} {
  const apiKey = readStoredApiKey(userId);
  if (!apiKey) throw new MissingCredentialsError();
  const baseUrl = (
    process.env.HF_API_BASE_URL || DEFAULT_HF_BASE_URL
  ).trim();
  return { apiKey, baseUrl };
}

function parseRequestIds(data: unknown): string[] {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError(400, "Invalid status payload");
  }
  const requestIds = (data as { requestIds?: unknown }).requestIds;
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    throw new HttpError(400, "Invalid request ids");
  }
  return requestIds.map((requestId) => {
    if (typeof requestId !== "string" || !requestId) {
      throw new HttpError(400, "Invalid request id");
    }
    return requestId;
  });
}

// ============================================================================
// HIGGSFIELD APP-TEMPLATES OPERATIONS (Genjutsu Studio)
// ============================================================================

export const hfSavePlatformCredentials = async (
  args: unknown,
  context: { user?: { id: string } | null }
): Promise<void> => {
  try {
    const { apiKey } = parseCredentialInput(args);
    customCredentialsByScope.set(credentialScope(context.user?.id), apiKey);
  } catch (err: unknown) {
    throw new HttpError(
      400,
      err instanceof Error ? err.message : "Enter an API key"
    );
  }
};

export const hfClearPlatformCredentials = async (
  _args: void,
  context: { user?: { id: string } | null }
): Promise<void> => {
  customCredentialsByScope.delete(credentialScope(context.user?.id));
};

export const hfHasPlatformCredentials = async (
  _args: void,
  context: { user?: { id: string } | null }
): Promise<boolean> => {
  return readStoredApiKey(context.user?.id) !== null;
};

export const hfCreateUploadTicket = async (
  args: { contentType?: unknown },
  context: { user?: { id: string } | null }
): Promise<UploadTicket> => {
  let contentType: string;
  try {
    contentType = requireUploadContentType(args?.contentType);
  } catch (err: unknown) {
    throw new HttpError(
      400,
      err instanceof Error
        ? err.message
        : "Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, or WAV."
    );
  }

  let credentials: { apiKey: string; baseUrl: string };
  try {
    credentials = readServerCredentials(context.user?.id);
  } catch {
    throw new HttpError(
      401,
      "Connect your Higgsfield API key in the sidebar before uploading."
    );
  }

  try {
    return await createPlatformClient(credentials).createUpload(contentType);
  } catch (error) {
    const status = error instanceof PlatformError ? error.status : 502;
    if (status === 401 || status === 403) {
      throw new HttpError(
        status,
        "Higgsfield rejected your API key. Update it in the sidebar and try again."
      );
    }
    if (status === 429) {
      throw new HttpError(
        429,
        "Higgsfield upload rate limit reached. Wait a moment and try again."
      );
    }
    throw new HttpError(
      502,
      "Could not prepare reference upload with Higgsfield. Try again."
    );
  }
};

export const hfSubmitGeneration = async (
  plane: GenerationPlane,
  context: {
    user?: { id: string } | null;
    entities: {
      User: any;
      VideoTask: any;
    };
  }
): Promise<QueuedGeneration> => {
  let parsed: GenerationPlane;
  let path: string;
  let body: Record<string, unknown>;
  try {
    const model = getModel(plane.model);
    parsed = {
      ...plane,
      settings: parseSettings(model, plane.settings),
    };
    const req = toPlatform(parsed);
    path = req.path;
    body = req.body;
  } catch (err: unknown) {
    throw new HttpError(
      400,
      err instanceof Error ? err.message : "Invalid generation parameters"
    );
  }

  let credentials: { apiKey: string; baseUrl: string };
  try {
    credentials = readServerCredentials(context.user?.id);
  } catch (err: unknown) {
    throw new HttpError(
      401,
      err instanceof Error ? err.message : "Connect your Higgsfield API key"
    );
  }

  const resolution =
    typeof parsed.settings.resolution === "string"
      ? parsed.settings.resolution
      : "720p";
  const variant =
    typeof parsed.settings.variant === "string"
      ? parsed.settings.variant
      : path;
  const durationSec =
    typeof parsed.settings.duration === "number"
      ? parsed.settings.duration
      : 5;
  const requiredCredits = creditCostForResolution(
    resolution,
    variant,
    durationSec
  );
  const activeUserId = context.user?.id;
  if (!activeUserId) {
    throw new HttpError(
      401,
      "Please sign in or create an account to generate videos."
    );
  }

  const dbUser = await context.entities.User.findUnique({
    where: { id: activeUserId },
    select: { id: true, email: true, isAdmin: true, credits: true },
  });
  const isAdmin = Boolean(dbUser?.isAdmin);

  const { count: reserved } = await context.entities.User.updateMany({
    where: { id: activeUserId, credits: { gte: requiredCredits } },
    data: { credits: { decrement: requiredCredits } },
  });
  if (reserved === 0 && !isAdmin) {
    throw new HttpError(
      402,
      `Insufficient credits (${dbUser?.credits ?? 0} available, ${requiredCredits} needed). Please subscribe to a plan or buy credits on the Pricing page to generate videos.`
    );
  }

  let queued: QueuedGeneration;
  try {
    queued = await createPlatformClient(credentials).submit(path, body);
  } catch (err: unknown) {
    if (activeUserId && reserved > 0) {
      await context.entities.User.update({
        where: { id: activeUserId },
        data: { credits: { increment: requiredCredits } },
      });
    }
    throw new HttpError(
      err instanceof PlatformError ? err.status : 502,
      err instanceof Error ? err.message : "Platform submission failed"
    );
  }

  if (activeUserId) {
    const sourceVideoUrl =
      urls(parsed, "source")[0] ?? urls(parsed, "video")[0] ?? "";
    const referenceImageUrls = [
      ...urls(parsed, "reference"),
      ...urls(parsed, "start"),
    ];
    await context.entities.VideoTask.create({
      data: {
        userId: activeUserId,
        provider: "HIGGSFIELD",
        model: path,
        requestId: queued.requestId,
        prompt: parsed.prompt.text.trim() || null,
        sourceVideoUrl,
        referenceImageUrls,
        resolution,
        status: "PROCESSING",
      },
    });
  }

  return queued;
};

export const hfGetGenerationStatuses = async (
  data: unknown,
  context: {
    user?: { id: string } | null;
    entities: {
      User: any;
      VideoTask: any;
    };
  }
): Promise<StatusResult[]> => {
  const requestIds = parseRequestIds(data);
  const client = createPlatformClient(readServerCredentials(context.user?.id));

  return Promise.all(
    requestIds.map(async (requestId): Promise<StatusResult> => {
      const existingTask = await context.entities.VideoTask.findUnique({
        where: { requestId },
      });

      // If the background worker already settled this task as COMPLETED, return it directly
      if (
        existingTask &&
        existingTask.status === "COMPLETED" &&
        existingTask.outputVideoUrl
      ) {
        return {
          requestId,
          status: {
            status: "completed",
            requestId,
            video: { url: existingTask.outputVideoUrl },
          },
        };
      }

      try {
        const status = await client.status(requestId);
        // Settle corresponding DB VideoTask if present
        if (existingTask && existingTask.status === "PROCESSING") {
          const videoUrl = status.video?.url;
          if (status.status === "completed" && videoUrl) {
            await context.entities.VideoTask.updateMany({
              where: { id: existingTask.id, status: "PROCESSING" },
              data: {
                status: "COMPLETED",
                outputVideoUrl: videoUrl,
              },
            });
          } else if (
            status.status === "failed" ||
            status.status === "nsfw" ||
            status.status === "canceled"
          ) {
            const transitioned = await context.entities.VideoTask.updateMany({
              where: { id: existingTask.id, status: "PROCESSING" },
              data: {
                status: "FAILED",
                error:
                  status.status === "nsfw"
                    ? "Blocked by the content filter"
                    : status.status === "canceled"
                      ? "Canceled"
                      : typeof status.error === "string" && status.error.trim()
                        ? status.error
                        : "Generation failed",
              },
            });
            if (transitioned.count > 0) {
              await context.entities.User.update({
                where: { id: existingTask.userId },
                data: {
                  credits: {
                    increment: creditCostForResolution(
                      existingTask.resolution,
                      existingTask.model
                    ),
                  },
                },
              });
            }
          }
        }
        return { requestId, status };
      } catch (caught) {
        // If the upstream poll had a transient network error (e.g. fetch failed / timeout)
        // while the task is still processing, keep it in_progress rather than failing the client run.
        const isTransient =
          !(caught instanceof PlatformError) ||
          caught.status >= 500 ||
          caught.status === 429;
        if (isTransient && (!existingTask || existingTask.status === "PROCESSING")) {
          return {
            requestId,
            status: {
              status: "in_progress",
              requestId,
            },
          };
        }
        return {
          requestId,
          error: caught instanceof Error ? caught.message : String(caught),
        };
      }
    })
  );
};

export const hfCancelGeneration = async (
  data: unknown,
  context: {
    user?: { id: string } | null;
    entities: {
      User: any;
      VideoTask: any;
    };
  }
): Promise<void> => {
  const [requestId] = parseRequestIds(data);
  const client = createPlatformClient(readServerCredentials(context.user?.id));
  await client.cancel(requestId!);

  const task = await context.entities.VideoTask.findUnique({
    where: { requestId: requestId! },
  });
  if (task && task.status === "PROCESSING") {
    const transitioned = await context.entities.VideoTask.updateMany({
      where: { id: task.id, status: "PROCESSING" },
      data: {
        status: "FAILED",
        error: "Canceled",
      },
    });
    if (transitioned.count > 0) {
      await context.entities.User.update({
        where: { id: task.userId },
        data: {
          credits: {
            increment: creditCostForResolution(task.resolution, task.model),
          },
        },
      });
    }
  }
};

// ============================================================================
// LEGACY OPERATIONS (Retained for backwards compatibility until removed)
// ============================================================================

export const createGenjutsuTask = async (
  {
    sourceVideoUrl,
    referenceImageUrls,
    prompt,
    resolution = "720p",
  }: {
    provider?: "HIGGSFIELD" | "MUAPI";
    sourceVideoUrl: string;
    referenceImageUrls: string[];
    prompt?: string;
    resolution?: string;
    model?: string;
    creditCost?: number;
    sceneControlMode?: "video" | "image";
  },
  context: any
): Promise<VideoTask> => {
  const queued = await hfSubmitGeneration(
    {
      model: "genjutsu",
      prompt: { text: prompt ?? "" },
      media: {
        source: [
          {
            id: sourceVideoUrl,
            url: sourceVideoUrl,
            role: "source",
            kind: "video",
          },
        ],
        reference: referenceImageUrls.map((url) => ({
          id: url,
          url,
          role: "reference" as const,
          kind: "image" as const,
        })),
      },
      settings: { resolution },
    },
    context
  );

  const task = await context.entities.VideoTask.findUnique({
    where: { requestId: queued.requestId },
  });
  if (task) return task;

  return {
    id: queued.requestId,
    userId: context.user?.id ?? "",
    provider: "HIGGSFIELD",
    model: "higgsfield/genjutsu/motion-transfer/v1.0",
    requestId: queued.requestId,
    prompt: prompt ?? null,
    sourceVideoUrl,
    referenceImageUrls,
    outputVideoUrl: null,
    resolution,
    status: "PROCESSING",
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const getVideoTaskStatus = async (
  { taskId }: { taskId: string },
  context: any
): Promise<VideoTask> => {
  const task = await context.entities.VideoTask.findUnique({
    where: { id: taskId },
  });
  if (!task) {
    throw new HttpError(404, "Task entity missing");
  }
  if (context.user && task.userId !== context.user.id) {
    throw new HttpError(403, "Forbidden");
  }
  if (task.status === "COMPLETED" || task.status === "FAILED") {
    return task;
  }
  const timeSinceLastUpdateMs =
    Date.now() - new Date(task.updatedAt).getTime();
  if (timeSinceLastUpdateMs < 10000) {
    return task;
  }
  return await syncVideoTaskStatus(task, context.entities);
};

export const getUserVideoTasks = async (
  _args: void,
  context: any
): Promise<VideoTask[]> => {
  if (!context.user?.id) return [];
  return context.entities.VideoTask.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: "desc" },
  });
};
