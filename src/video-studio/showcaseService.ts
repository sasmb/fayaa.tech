export type ShowcaseCategory = "all" | "dance" | "fashion" | "action" | "ugc";

export type ShowcaseVideoCategory = "dance" | "fashion" | "action" | "ugc";

export interface PublicShowcaseItem {
  id: string;
  sourceKind: "video_task" | "file";
  title: string;
  creator: string;
  aspect: "portrait" | "landscape";
  category: ShowcaseCategory;
  featuredOnHome: boolean;
  videoUrl: string;
  posterUrl: string;
  sourceVideoUrl: string;
  referenceImageUrl: string;
  prompt: string;
  createdAt: string;
}

export interface PublicHomepageShowcasePayload {
  heroFeatured: PublicShowcaseItem[];
  communityVideos: PublicShowcaseItem[];
  resolvedStorageUrls: Record<string, string>;
}

export interface ToggleVideoPublicInput {
  taskId: string;
  isPublic: boolean;
  publicTitle?: string;
  publicCategory?: ShowcaseVideoCategory;
  featuredOnHome?: boolean;
}

export interface ToggleFilePublicInput {
  fileId: string;
  isPublic: boolean;
}

export type StorageKeyResolver = (storageKey: string) => Promise<string | undefined>;

const VALID_CATEGORIES = new Set<ShowcaseCategory>([
  "all",
  "dance",
  "fashion",
  "action",
  "ugc",
]);

function normalizeCategory(raw?: string | null): ShowcaseCategory {
  if (raw && VALID_CATEGORIES.has(raw as ShowcaseCategory)) {
    return raw as ShowcaseCategory;
  }
  return "ugc";
}

function resolvePublicCreatorHandle(user?: {
  username?: string | null;
  name?: string | null;
  showNamePublicly?: boolean | null;
} | null): string {
  if (!user?.showNamePublicly) {
    return "@fayaa_creator";
  }
  const raw = (user.username || user.name || "").trim();
  if (!raw || raw.includes("@")) {
    return "@fayaa_creator";
  }
  return raw.startsWith("@") ? raw : `@${raw}`;
}

async function resolveMediaUrl(
  storageKey: string | null | undefined,
  fallbackUrl: string | null | undefined,
  resolveStorageKey: StorageKeyResolver
): Promise<string | undefined> {
  if (storageKey && storageKey.trim()) {
    try {
      const signed = await resolveStorageKey(storageKey.trim());
      if (signed && signed.trim()) {
        return signed.trim();
      }
    } catch {
      // Fall back to stored output URL when R2 signing env is not configured locally.
    }
  }
  if (fallbackUrl && fallbackUrl.trim()) {
    return fallbackUrl.trim();
  }
  return undefined;
}

/**
 * Resolves only explicitly published (`isPublic = true`) VideoTasks and video Files
 * from R2/S3 storage into sanitized public homepage showcase payloads.
 */
export async function resolvePublicHomepageShowcase({
  entities,
  resolveStorageKey,
  curatedStorageKeys = [],
}: {
  entities: {
    VideoTask: { findMany: (args: any) => Promise<any[]> };
    File: { findMany: (args: any) => Promise<any[]> };
  };
  resolveStorageKey: StorageKeyResolver;
  curatedStorageKeys?: string[];
}): Promise<PublicHomepageShowcasePayload> {
  const [publicTasks, publicFiles] = await Promise.all([
    entities.VideoTask.findMany({
      where: {
        isPublic: true,
        status: "COMPLETED",
      },
      orderBy: [{ featuredOnHome: "desc" }, { updatedAt: "desc" }],
      take: 36,
      include: {
        user: {
          select: {
            username: true,
            name: true,
            showNamePublicly: true,
          },
        },
      },
    }),
    entities.File.findMany({
      where: {
        isPublic: true,
        type: {
          startsWith: "video/",
        },
      },
      orderBy: { createdAt: "desc" },
      take: 24,
      include: {
        user: {
          select: {
            username: true,
            name: true,
            showNamePublicly: true,
          },
        },
      },
    }),
  ]);

  const communityVideos: PublicShowcaseItem[] = [];

  for (const task of publicTasks) {
    // Defense in depth: never expose non-public or incomplete tasks.
    if (task?.isPublic !== true || task?.status !== "COMPLETED") continue;

    const videoUrl = await resolveMediaUrl(
      task.storageKey,
      task.outputVideoUrl,
      resolveStorageKey
    );
    if (!videoUrl) continue;

    const posterUrl =
      (typeof task.posterUrl === "string" && task.posterUrl.trim()) ||
      (Array.isArray(task.referenceImageUrls) && task.referenceImageUrls[0]) ||
      "";

    communityVideos.push({
      id: `task-${task.id}`,
      sourceKind: "video_task",
      title:
        (typeof task.publicTitle === "string" && task.publicTitle.trim()) ||
        (typeof task.prompt === "string" && task.prompt.trim().slice(0, 48)) ||
        "FAYAA Genjutsu Render",
      creator: resolvePublicCreatorHandle(task.user),
      aspect: "portrait",
      category: normalizeCategory(task.publicCategory),
      featuredOnHome: Boolean(task.featuredOnHome),
      videoUrl,
      posterUrl,
      sourceVideoUrl: task.sourceVideoUrl || videoUrl,
      referenceImageUrl:
        (Array.isArray(task.referenceImageUrls) && task.referenceImageUrls[0]) ||
        posterUrl,
      prompt: task.prompt || "Recast motion with FAYAA Genjutsu.",
      createdAt:
        task.createdAt instanceof Date
          ? task.createdAt.toISOString()
          : String(task.createdAt ?? new Date().toISOString()),
    });
  }

  for (const file of publicFiles) {
    // Defense in depth: only expose explicitly public video files.
    if (file?.isPublic !== true) continue;
    if (typeof file?.type === "string" && !file.type.startsWith("video/")) continue;

    const videoUrl = await resolveMediaUrl(
      file.s3Key,
      undefined,
      resolveStorageKey
    );
    if (!videoUrl) continue;

    communityVideos.push({
      id: `file-${file.id}`,
      sourceKind: "file",
      title:
        (typeof file.name === "string" && file.name.replace(/\.[^.]+$/, "")) ||
        "FAYAA Community Clip",
      creator: resolvePublicCreatorHandle(file.user),
      aspect: "landscape",
      category: "ugc",
      featuredOnHome: false,
      videoUrl,
      posterUrl: "",
      sourceVideoUrl: videoUrl,
      referenceImageUrl: "",
      prompt: "Remix this public FAYAA community motion clip in Studio.",
      createdAt:
        file.createdAt instanceof Date
          ? file.createdAt.toISOString()
          : String(file.createdAt ?? new Date().toISOString()),
    });
  }

  const resolvedStorageUrls: Record<string, string> = {};
  for (const key of curatedStorageKeys) {
    const resolved = await resolveMediaUrl(key, undefined, resolveStorageKey);
    if (resolved) {
      resolvedStorageUrls[key] = resolved;
    }
  }

  return {
    heroFeatured: communityVideos.filter((item) => item.featuredOnHome),
    communityVideos,
    resolvedStorageUrls,
  };
}

/**
 * Authorizes and toggles `isPublic` (and optional showcase metadata) on a VideoTask.
 * Enforces `canPublishPublic` / `isAdmin` plus record ownership.
 */
export async function setVideoTaskPublicVisibility({
  args,
  user,
  entities,
  createHttpError,
}: {
  args: ToggleVideoPublicInput;
  user?: {
    id?: string;
    isAdmin?: boolean | null;
    canPublishPublic?: boolean | null;
  } | null;
  entities: {
    VideoTask: {
      findUnique: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
    };
  };
  createHttpError: (status: number, message: string) => Error;
}) {
  if (!user?.id) {
    throw createHttpError(401, "Authentication required");
  }

  const canPublish = Boolean(user.isAdmin || user.canPublishPublic);
  if (!canPublish) {
    throw createHttpError(
      403,
      "Your account does not have permission to publish videos publicly."
    );
  }

  if (!args.taskId?.trim()) {
    throw createHttpError(400, "taskId is required.");
  }

  const task = await entities.VideoTask.findUnique({
    where: { id: args.taskId },
  });
  if (!task) {
    throw createHttpError(404, "Video task not found.");
  }

  if (task.userId !== user.id && !user.isAdmin) {
    throw createHttpError(
      403,
      "You can only change public visibility on your own videos."
    );
  }

  if (args.isPublic && task.status !== "COMPLETED") {
    throw createHttpError(
      400,
      "Only completed videos can be published to the public showcase."
    );
  }

  if (args.featuredOnHome === true && !user.isAdmin) {
    throw createHttpError(
      403,
      "Only admins can feature videos in the homepage hero."
    );
  }

  const nextFeatured = !args.isPublic
    ? false
    : typeof args.featuredOnHome === "boolean"
      ? args.featuredOnHome
      : undefined;

  return entities.VideoTask.update({
    where: { id: task.id },
    data: {
      isPublic: args.isPublic,
      ...(args.publicTitle !== undefined
        ? { publicTitle: args.publicTitle.trim() || null }
        : {}),
      ...(args.publicCategory !== undefined
        ? { publicCategory: args.publicCategory }
        : {}),
      ...(nextFeatured !== undefined ? { featuredOnHome: nextFeatured } : {}),
    },
  });
}

/**
 * Authorizes and toggles `isPublic` on an uploaded R2/S3 File record.
 */
export async function setFilePublicVisibility({
  args,
  user,
  entities,
  createHttpError,
}: {
  args: ToggleFilePublicInput;
  user?: {
    id?: string;
    isAdmin?: boolean | null;
    canPublishPublic?: boolean | null;
  } | null;
  entities: {
    File: {
      findUnique: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
    };
  };
  createHttpError: (status: number, message: string) => Error;
}) {
  if (!user?.id) {
    throw createHttpError(401, "Authentication required");
  }

  const canPublish = Boolean(user.isAdmin || user.canPublishPublic);
  if (!canPublish) {
    throw createHttpError(
      403,
      "Your account does not have permission to publish storage videos publicly."
    );
  }

  if (!args.fileId?.trim()) {
    throw createHttpError(400, "fileId is required.");
  }

  const file = await entities.File.findUnique({
    where: { id: args.fileId },
  });
  if (!file) {
    throw createHttpError(404, "File not found.");
  }

  if (file.userId !== user.id && !user.isAdmin) {
    throw createHttpError(
      403,
      "You can only change public visibility on your own files."
    );
  }

  return entities.File.update({
    where: { id: file.id },
    data: {
      isPublic: args.isPublic,
    },
  });
}
