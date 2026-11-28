import { HttpError } from "wasp/server";
import type {
  DeleteSiteMedia,
  GetAllSiteMedia,
  GetPublicSiteMedia,
  MoveSiteMedia,
  UpsertSiteMedia,
} from "wasp/server/operations";
import * as z from "zod";

import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import { siteMediaInputSchema, type SiteMediaInput, type SiteMediaItem } from "./siteMedia";

const SELECT = {
  id: true,
  slot: true,
  title: true,
  tag: true,
  videoUrl: true,
  posterUrl: true,
  aspect: true,
  sortOrder: true,
  enabled: true,
  creditName: true,
  sourceUrl: true,
  platform: true,
} as const;

function assertAdmin(user: { isAdmin?: boolean } | undefined | null) {
  if (!user) throw new HttpError(401, "Please sign in.");
  if (!user.isAdmin) throw new HttpError(403, "Only admins can manage site media.");
}

/** Enabled media for the public homepage. */
export const getPublicSiteMedia: GetPublicSiteMedia<void, SiteMediaItem[]> = async (_args, context) => {
  return context.entities.SiteMedia.findMany({
    where: { enabled: true },
    orderBy: [{ slot: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: SELECT,
  });
};

/** Everything, including switched-off rows, for /admin/site-media. */
export const getAllSiteMedia: GetAllSiteMedia<void, SiteMediaItem[]> = async (_args, context) => {
  assertAdmin(context.user);
  return context.entities.SiteMedia.findMany({
    orderBy: [{ slot: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: SELECT,
  });
};

export const upsertSiteMedia: UpsertSiteMedia<SiteMediaInput, SiteMediaItem> = async (rawArgs, context) => {
  assertAdmin(context.user);
  const { id, sortOrder, ...data } = ensureArgsSchemaOrThrowHttpError(siteMediaInputSchema, rawArgs);

  if (id) {
    return context.entities.SiteMedia.update({
      where: { id },
      data: { ...data, ...(sortOrder !== undefined ? { sortOrder } : {}) },
      select: SELECT,
    });
  }

  const last = await context.entities.SiteMedia.findFirst({
    where: { slot: data.slot },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return context.entities.SiteMedia.create({
    data: { ...data, sortOrder: sortOrder ?? (last ? last.sortOrder + 1 : 0) },
    select: SELECT,
  });
};

export const deleteSiteMedia: DeleteSiteMedia<{ id: string }, { id: string }> = async (rawArgs, context) => {
  assertAdmin(context.user);
  const { id } = ensureArgsSchemaOrThrowHttpError(z.object({ id: z.string().uuid() }), rawArgs);
  await context.entities.SiteMedia.delete({ where: { id } });
  return { id };
};

/** Swaps a row with its neighbour in the same slot. */
export const moveSiteMedia: MoveSiteMedia<{ id: string; direction: "up" | "down" }, SiteMediaItem[]> = async (rawArgs, context) => {
  assertAdmin(context.user);
  const { id, direction } = ensureArgsSchemaOrThrowHttpError(
    z.object({ id: z.string().uuid(), direction: z.enum(["up", "down"]) }),
    rawArgs
  );
  const item = await context.entities.SiteMedia.findUnique({ where: { id }, select: SELECT });
  if (!item) throw new HttpError(404, "Clip not found.");

  const siblings = await context.entities.SiteMedia.findMany({
    where: { slot: item.slot },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const ids: string[] = siblings.map((s: { id: string }) => s.id);
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (to >= 0 && to < ids.length) {
    [ids[from], ids[to]] = [ids[to]!, ids[from]!];
  }
  await Promise.all(
    ids.map((rowId: string, index: number) =>
      context.entities.SiteMedia.update({ where: { id: rowId }, data: { sortOrder: index } })
    )
  );
  return context.entities.SiteMedia.findMany({
    where: { slot: item.slot },
    orderBy: { sortOrder: "asc" },
    select: SELECT,
  });
};
