import { describe, expect, it, vi } from "vitest";

import {
  HERO_SHOWCASE_CARDS,
  HOMEPAGE_LAYOUT,
  getActiveHomepageSections,
  mergeCommunityShowcaseShots,
  resolveHeroShowcaseCards,
  resolveStorageUrl,
} from "./homepageConfig";
import {
  resolvePublicHomepageShowcase,
  setFilePublicVisibility,
  setVideoTaskPublicVisibility,
} from "../video-studio/showcaseService";

class MockHttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

describe("homepageConfig declarative layout & storage resolution", () => {
  it("filters disabled sections while preserving declared section order", () => {
    const customLayout = [
      { ...HOMEPAGE_LAYOUT[3]!, enabled: true },
      { ...HOMEPAGE_LAYOUT[2]!, enabled: false },
      { ...HOMEPAGE_LAYOUT[0]!, enabled: true },
    ];
    const active = getActiveHomepageSections(customLayout);
    expect(active.map((s) => s.id)).toEqual(["community-showcase", "hero-showcase"]);
  });

  it("prefers server-resolved storage URLs, then R2 public base URL, then fallback URL", () => {
    expect(
      resolveStorageUrl(
        "curated/clip.mp4",
        "https://fallback.example/clip.mp4",
        { "curated/clip.mp4": "https://signed-r2.example/clip.mp4?sig=1" },
        "https://pub.r2.dev"
      )
    ).toBe("https://signed-r2.example/clip.mp4?sig=1");

    expect(
      resolveStorageUrl(
        "curated/clip.mp4",
        "https://fallback.example/clip.mp4",
        undefined,
        "https://pub.r2.dev/"
      )
    ).toBe("https://pub.r2.dev/curated/clip.mp4");

    expect(
      resolveStorageUrl(undefined, "https://fallback.example/clip.mp4")
    ).toBe("https://fallback.example/clip.mp4");
  });

  it("prepends live public storage videos ahead of curated community fallback shots", () => {
    const merged = mergeCommunityShowcaseShots([
      {
        id: "task-123",
        sourceKind: "video_task",
        title: "R2 Neon Sprint",
        creator: "@nova",
        aspect: "portrait",
        category: "action",
        featuredOnHome: false,
        videoUrl: "https://pub.r2.dev/u1/neon.mp4",
        posterUrl: "https://pub.r2.dev/u1/neon.jpg",
        sourceVideoUrl: "https://pub.r2.dev/u1/src.mp4",
        referenceImageUrl: "https://pub.r2.dev/u1/neon.jpg",
        prompt: "Neon sprint motion transfer",
        createdAt: "2026-11-18T12:00:00.000Z",
      },
    ]);

    expect(merged[0]).toMatchObject({
      id: "task-123",
      title: "R2 Neon Sprint",
      videoUrl: "https://pub.r2.dev/u1/neon.mp4",
      isFromStorage: true,
    });
    expect(merged.length).toBeGreaterThan(1);
    expect(merged.slice(1).some((s) => s.id === "comm-1")).toBe(true);
  });

  it("applies admin-featured showcase video onto primary hero card", () => {
    const heroCards = resolveHeroShowcaseCards(HERO_SHOWCASE_CARDS, [
      {
        id: "task-hero",
        sourceKind: "video_task",
        title: "Featured Hero Clip",
        creator: "@admin",
        aspect: "portrait",
        category: "fashion",
        featuredOnHome: true,
        videoUrl: "https://pub.r2.dev/featured/hero.mp4",
        posterUrl: "https://pub.r2.dev/featured/hero.jpg",
        sourceVideoUrl: "https://pub.r2.dev/featured/src.mp4",
        referenceImageUrl: "https://pub.r2.dev/featured/hero.jpg",
        prompt: "Featured hero clip",
        createdAt: "2026-11-18T12:00:00.000Z",
      },
    ]);

    expect(heroCards[0]!.videoUrl).toBe("https://pub.r2.dev/featured/hero.mp4");
    expect(heroCards[0]!.outputImage).toBe("https://pub.r2.dev/featured/hero.jpg");
  });
});

describe("resolvePublicHomepageShowcase privacy & R2 URL resolution", () => {
  it("excludes private or incomplete records and redacts user identities unless showNamePublicly is true", async () => {
    const findTasks = vi.fn().mockResolvedValue([
      {
        id: "pub-1",
        isPublic: true,
        status: "COMPLETED",
        featuredOnHome: true,
        publicTitle: "Public Cyber Dance",
        publicCategory: "dance",
        storageKey: "user-1/pub-1.mp4",
        outputVideoUrl: "https://cdn.fallback/pub-1.mp4",
        sourceVideoUrl: "https://cdn.fallback/src-1.mp4",
        referenceImageUrls: ["https://cdn.fallback/ref-1.jpg"],
        prompt: "Cyber dance prompt",
        createdAt: new Date("2026-11-18T10:00:00Z"),
        user: { username: "cyber_creator", name: "Alex", showNamePublicly: true },
      },
      {
        id: "priv-1",
        isPublic: false,
        status: "COMPLETED",
        storageKey: "user-2/secret.mp4",
        outputVideoUrl: "https://cdn.fallback/secret.mp4",
        user: { username: "secret_user", showNamePublicly: true },
      },
      {
        id: "pending-1",
        isPublic: true,
        status: "PROCESSING",
        storageKey: "user-1/pending.mp4",
        outputVideoUrl: null,
      },
    ]);

    const findFiles = vi.fn().mockResolvedValue([
      {
        id: "file-pub",
        isPublic: true,
        type: "video/mp4",
        name: "parkour-reel.mp4",
        s3Key: "user-1/parkour-reel.mp4",
        createdAt: new Date("2026-11-18T11:00:00Z"),
        user: { username: "hidden_author", showNamePublicly: false },
      },
      {
        id: "file-priv",
        isPublic: false,
        type: "video/mp4",
        name: "private-vault.mp4",
        s3Key: "user-2/private-vault.mp4",
      },
    ]);

    const resolveStorageKey = vi.fn(async (key: string) => `https://r2.signed/${key}`);

    const result = await resolvePublicHomepageShowcase({
      entities: { VideoTask: { findMany: findTasks }, File: { findMany: findFiles } },
      resolveStorageKey,
      curatedStorageKeys: ["curated/intro.mp4"],
    });

    expect(findTasks).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublic: true, status: "COMPLETED" } })
    );
    expect(findFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublic: true, type: { startsWith: "video/" } },
      })
    );

    expect(result.heroFeatured).toHaveLength(1);
    expect(result.heroFeatured[0]!.id).toBe("task-pub-1");

    expect(result.communityVideos).toHaveLength(2);
    expect(result.communityVideos[0]).toMatchObject({
      id: "task-pub-1",
      creator: "@cyber_creator",
      videoUrl: "https://r2.signed/user-1/pub-1.mp4",
      category: "dance",
    });
    expect(result.communityVideos[1]).toMatchObject({
      id: "file-file-pub",
      title: "parkour-reel",
      creator: "@fayaa_creator",
      videoUrl: "https://r2.signed/user-1/parkour-reel.mp4",
    });

    expect(result.resolvedStorageUrls).toEqual({
      "curated/intro.mp4": "https://r2.signed/curated/intro.mp4",
    });
  });

  it("falls back to stored outputVideoUrl if R2 signing fails", async () => {
    const result = await resolvePublicHomepageShowcase({
      entities: {
        VideoTask: {
          findMany: async () => [
            {
              id: "t1",
              isPublic: true,
              status: "COMPLETED",
              storageKey: "u/t1.mp4",
              outputVideoUrl: "https://fallback.example/t1.mp4",
              referenceImageUrls: [],
              createdAt: "2026-11-18T10:00:00Z",
            },
          ],
        },
        File: { findMany: async () => [] },
      },
      resolveStorageKey: async () => {
        throw new Error("Missing R2 credentials");
      },
    });

    expect(result.communityVideos).toHaveLength(1);
    expect(result.communityVideos[0]!.videoUrl).toBe("https://fallback.example/t1.mp4");
  });
});

describe("public visibility permission & ownership enforcement", () => {
  const createHttpError = (status: number, message: string) =>
    new MockHttpError(status, message);

  it("blocks unauthenticated users (401) and non-authorized regular users (403)", async () => {
    const entities = {
      VideoTask: { findUnique: vi.fn(), update: vi.fn() },
    };

    await expect(
      setVideoTaskPublicVisibility({
        args: { taskId: "t1", isPublic: true },
        user: null,
        entities,
        createHttpError,
      })
    ).rejects.toMatchObject({ statusCode: 401 });

    await expect(
      setVideoTaskPublicVisibility({
        args: { taskId: "t1", isPublic: true },
        user: { id: "u1", canPublishPublic: false, isAdmin: false },
        entities,
        createHttpError,
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("blocks publishing another user's video (403) and featuring on hero without admin (403)", async () => {
    const entities = {
      VideoTask: {
        findUnique: vi.fn().mockResolvedValue({
          id: "t1",
          userId: "owner-1",
          status: "COMPLETED",
        }),
        update: vi.fn(),
      },
    };

    await expect(
      setVideoTaskPublicVisibility({
        args: { taskId: "t1", isPublic: true },
        user: { id: "other-user", canPublishPublic: true, isAdmin: false },
        entities,
        createHttpError,
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    await expect(
      setVideoTaskPublicVisibility({
        args: { taskId: "t1", isPublic: true, featuredOnHome: true },
        user: { id: "owner-1", canPublishPublic: true, isAdmin: false },
        entities,
        createHttpError,
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("allows eligible owner to publish/unpublish completed VideoTask and resets featuredOnHome on unpublish", async () => {
    const update = vi.fn(async ({ where, data }) => ({ id: where.id, ...data }));
    const entities = {
      VideoTask: {
        findUnique: vi.fn().mockResolvedValue({
          id: "t1",
          userId: "u1",
          status: "COMPLETED",
        }),
        update,
      },
    };

    await setVideoTaskPublicVisibility({
      args: {
        taskId: "t1",
        isPublic: true,
        publicTitle: "  My Remix  ",
        publicCategory: "dance",
      },
      user: { id: "u1", canPublishPublic: true, isAdmin: false },
      entities,
      createHttpError,
    });

    expect(update).toHaveBeenLastCalledWith({
      where: { id: "t1" },
      data: {
        isPublic: true,
        publicTitle: "My Remix",
        publicCategory: "dance",
      },
    });

    await setVideoTaskPublicVisibility({
      args: { taskId: "t1", isPublic: false },
      user: { id: "u1", canPublishPublic: true, isAdmin: false },
      entities,
      createHttpError,
    });

    expect(update).toHaveBeenLastCalledWith({
      where: { id: "t1" },
      data: {
        isPublic: false,
        featuredOnHome: false,
      },
    });
  });

  it("enforces same permission and ownership checks for R2 File visibility", async () => {
    const update = vi.fn(async ({ where, data }) => ({ id: where.id, ...data }));
    const entities = {
      File: {
        findUnique: vi.fn().mockResolvedValue({ id: "f1", userId: "u1" }),
        update,
      },
    };

    await expect(
      setFilePublicVisibility({
        args: { fileId: "f1", isPublic: true },
        user: { id: "u1", canPublishPublic: false, isAdmin: false },
        entities,
        createHttpError,
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    await setFilePublicVisibility({
      args: { fileId: "f1", isPublic: true },
      user: { id: "u1", canPublishPublic: true, isAdmin: false },
      entities,
      createHttpError,
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: "f1" },
      data: { isPublic: true },
    });
  });
});
