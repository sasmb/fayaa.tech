import { HttpError } from "wasp/server";
import type { File, LongVideoJob, VideoTask } from "wasp/entities";
import {
  getDownloadFileSignedURLFromS3,
  uploadLocalFileToS3,
} from "../file-upload/s3Utils";
import { getCuratedHomepageStorageKeys } from "../landing-page/homepageConfig";
import { estimateLongVideoPlan } from "./longVideoPlanning";
import {
  defaultLongVideoMediaOps,
  failAndRefundLongVideoJob,
  processLongVideoJobSplit,
  syncLongVideoJob,
  validateExternalMediaUrl,
} from "./longVideoProcessor";
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
import {
  resolvePublicHomepageShowcase,
  setFilePublicVisibility,
  setVideoTaskPublicVisibility,
  type PublicHomepageShowcasePayload,
  type ToggleFilePublicInput,
  type ToggleVideoPublicInput,
} from "./showcaseService";
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
    isPublic: false,
    featuredOnHome: false,
    publicTitle: null,
    publicCategory: null,
    storageKey: null,
    posterUrl: null,
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

export interface SubmitLongVideoInput {
  sourceVideoUrl: string;
  referenceImageUrls: string[];
  prompt?: string;
  resolution?: "480p" | "720p" | "1080p";
  variant?: "light" | "pro";
  trimStartSec?: number;
  totalDurationSec: number;
}

export interface LongVideoJobSummary {
  id: string;
  status: string;
  variant: string;
  resolution: string;
  prompt: string | null;
  sourceVideoUrl: string;
  totalDurationSec: number;
  segmentCount: number;
  completedCount: number;
  creditCost: number;
  outputVideoUrl: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

async function resolveFreshJobUrl(job: LongVideoJob): Promise<LongVideoJob> {
  if (job.status === "COMPLETED" && job.outputStorageKey) {
    try {
      const signed = await getDownloadFileSignedURLFromS3({
        s3Key: job.outputStorageKey,
      });
      return { ...job, outputVideoUrl: signed };
    } catch {
      return job;
    }
  }
  return job;
}

export const submitLongVideoGenjutsu = async (
  args: SubmitLongVideoInput,
  context: any
): Promise<LongVideoJobSummary> => {
  const activeUserId = context.user?.id;
  if (!activeUserId) {
    throw new HttpError(
      401,
      "Please sign in or create an account to generate videos."
    );
  }

  let credentials: { apiKey: string; baseUrl: string };
  try {
    credentials = readServerCredentials(activeUserId);
  } catch (err: unknown) {
    throw new HttpError(
      401,
      err instanceof Error ? err.message : "Connect your Higgsfield API key"
    );
  }

  try {
    await validateExternalMediaUrl(args.sourceVideoUrl);
  } catch (err: unknown) {
    throw new HttpError(
      400,
      err instanceof Error ? err.message : "Invalid source video URL."
    );
  }

  if (!Array.isArray(args.referenceImageUrls) || args.referenceImageUrls.length < 1) {
    throw new HttpError(400, "Add at least one reference image for Genjutsu.");
  }

  const totalDurationSec = Number(args.totalDurationSec);
  if (!Number.isFinite(totalDurationSec) || totalDurationSec <= 30) {
    throw new HttpError(
      400,
      "Long-video pipeline is only required when source duration exceeds 30 seconds."
    );
  }

  const trimStartSec = Math.max(0, Number(args.trimStartSec || 0));
  const resolution =
    args.resolution === "1080p" || args.resolution === "720p"
      ? args.resolution
      : "480p";
  const variant = args.variant === "pro" ? "pro" : "light";

  const plan = estimateLongVideoPlan({
    totalDurationSec,
    trimStartSec,
    resolution,
    variant,
  });

  const dbUser = await context.entities.User.findUnique({
    where: { id: activeUserId },
    select: { id: true, isAdmin: true, credits: true },
  });
  const isAdmin = Boolean(dbUser?.isAdmin);

  const { count: reserved } = await context.entities.User.updateMany({
    where: { id: activeUserId, credits: { gte: plan.credits } },
    data: { credits: { decrement: plan.credits } },
  });

  if (reserved === 0 && !isAdmin) {
    throw new HttpError(
      402,
      `Insufficient credits (${dbUser?.credits ?? 0} available, ${plan.credits} needed for ${plan.segmentCount}×30s clips). Please upgrade or buy credits to process this video.`
    );
  }

  const chargedCredits = reserved > 0 ? plan.credits : 0;

  let createdJob: LongVideoJob;
  try {
    createdJob = await context.entities.LongVideoJob.create({
      data: {
        userId: activeUserId,
        status: "SPLITTING",
        variant,
        resolution,
        prompt: args.prompt?.trim() || null,
        sourceVideoUrl: args.sourceVideoUrl,
        referenceImageUrls: args.referenceImageUrls,
        trimStartSec,
        totalDurationSec: plan.totalDurationSec,
        segmentCount: plan.segmentCount,
        completedCount: 0,
        creditCost: chargedCredits,
        segments: {
          create: plan.segments.map((seg) => ({
            index: seg.index,
            startSec: seg.startSec,
            durationSec: seg.durationSec,
            status: "PENDING",
          })),
        },
      },
    });
  } catch (err: unknown) {
    if (chargedCredits > 0) {
      await context.entities.User.update({
        where: { id: activeUserId },
        data: { credits: { increment: chargedCredits } },
      });
    }
    throw new HttpError(
      500,
      err instanceof Error ? err.message : "Failed to initialize long video job."
    );
  }

  const platformClient = createPlatformClient(credentials);
  const mediaOps = defaultLongVideoMediaOps(uploadLocalFileToS3);
  void processLongVideoJobSplit({
    jobId: createdJob.id,
    entities: context.entities,
    platformClient,
    mediaOps,
  }).catch(async (err: unknown) => {
    await failAndRefundLongVideoJob({
      jobId: createdJob.id,
      userId: activeUserId,
      creditCost: chargedCredits,
      errorMessage:
        err instanceof Error ? err.message : "Unexpected backend split failure.",
      entities: context.entities,
    }).catch(() => {});
  });

  return createdJob;
};

export const getLongVideoJobStatus = async (
  { jobId }: { jobId: string },
  context: any
): Promise<LongVideoJob> => {
  if (!context.user?.id) {
    throw new HttpError(401, "Authentication required");
  }
  const job = await context.entities.LongVideoJob.findUnique({
    where: { id: jobId },
  });
  if (!job) {
    throw new HttpError(404, "Long video job not found.");
  }
  if (job.userId !== context.user.id && !context.user.isAdmin) {
    throw new HttpError(403, "Forbidden");
  }

  if (job.status === "COMPLETED") {
    return resolveFreshJobUrl(job);
  }
  if (job.status === "FAILED" || job.status === "SPLITTING" || job.status === "STITCHING") {
    return job;
  }

  const timeSinceUpdateMs = Date.now() - new Date(job.updatedAt).getTime();
  if (timeSinceUpdateMs < 5000) {
    return job;
  }

  try {
    const credentials = readServerCredentials(context.user.id);
    const updated = await syncLongVideoJob({
      job,
      entities: context.entities,
      platformClient: createPlatformClient(credentials),
      mediaOps: defaultLongVideoMediaOps(uploadLocalFileToS3),
    });
    return resolveFreshJobUrl(updated || job);
  } catch {
    return job;
  }
};

export const getUserLongVideoJobs = async (
  _args: void,
  context: any
): Promise<LongVideoJob[]> => {
  if (!context.user?.id) return [];
  const jobs = await context.entities.LongVideoJob.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return Promise.all(jobs.map((job: LongVideoJob) => resolveFreshJobUrl(job)));
};

export const cancelLongVideoJob = async (
  { jobId }: { jobId: string },
  context: any
): Promise<LongVideoJob> => {
  if (!context.user?.id) {
    throw new HttpError(401, "Authentication required");
  }
  const job = await context.entities.LongVideoJob.findUnique({
    where: { id: jobId },
  });
  if (!job) {
    throw new HttpError(404, "Long video job not found.");
  }
  if (job.userId !== context.user.id && !context.user.isAdmin) {
    throw new HttpError(403, "Forbidden");
  }
  if (job.status === "COMPLETED" || job.status === "FAILED") {
    return job;
  }

  const segments = await context.entities.LongVideoSegment.findMany({
    where: { jobId: job.id },
    orderBy: { index: "asc" },
  });
  const activeIds = segments
    .filter((s: any) => s.status === "PROCESSING" && s.requestId)
    .map((s: any) => s.requestId);

  let platformClient;
  try {
    platformClient = createPlatformClient(readServerCredentials(context.user.id));
  } catch {
    platformClient = undefined;
  }

  await failAndRefundLongVideoJob({
    jobId: job.id,
    userId: job.userId,
    creditCost: job.creditCost,
    errorMessage: "Canceled",
    entities: context.entities,
    activeRequestIds: activeIds,
    platformClient,
  });

  return context.entities.LongVideoJob.findUnique({ where: { id: job.id } });
};

export const getPublicHomepageShowcase = async (
  _args: void,
  context: any
): Promise<PublicHomepageShowcasePayload> => {
  return resolvePublicHomepageShowcase({
    entities: context.entities,
    curatedStorageKeys: getCuratedHomepageStorageKeys(),
    resolveStorageKey: (s3Key) => getDownloadFileSignedURLFromS3({ s3Key }),
  });
};

export const toggleVideoPublicVisibility = async (
  args: ToggleVideoPublicInput,
  context: any
): Promise<VideoTask> => {
  return setVideoTaskPublicVisibility({
    args,
    user: context.user,
    entities: context.entities,
    createHttpError: (status, message) => new HttpError(status, message),
  });
};

export const toggleFilePublicVisibility = async (
  args: ToggleFilePublicInput,
  context: any
): Promise<File> => {
  return setFilePublicVisibility({
    args,
    user: context.user,
    entities: context.entities,
    createHttpError: (status, message) => new HttpError(status, message),
  });
};
