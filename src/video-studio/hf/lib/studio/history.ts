import type { Surface } from "../../generation/catalog"

import { defaultKv, type Kv } from "./kv"

export type RunStatus = "running" | "completed" | "failed"

/** One generation request and everything the studio shows about it. */
export interface RunRecord {
  id: string
  /** Platform request id; running rows resume their poll from it after a reload. */
  requestId: string
  surface: Surface
  modelId: string
  modelLabel: string
  prompt: string
  settings: Record<string, unknown>
  /** Owning project, when generated from a project view. */
  projectId?: string
  /** Aspect ratio as width / height, used by the justified feed before media loads. */
  aspect: number
  status: RunStatus
  /** Result URLs: one video or N images. */
  urls: string[]
  /** Long-form split+stitch job tracking metadata when duration exceeds 30s. */
  longVideoJobId?: string
  longVideoProgressLabel?: string
  segmentCount?: number
  completedCount?: number
  /** Optional persisted database VideoTask id and public visibility state. */
  taskId?: string
  isPublic?: boolean
  error?: string
  createdAt: number
}

const KEY_PREFIX = "history.v1"
const MAX_RECORDS = 400

function keyForUser(userId?: string | null): string {
  return userId ? `${KEY_PREFIX}.${userId}` : `${KEY_PREFIX}.guest`
}

export async function loadHistory(
  userId?: string | null,
  kv: Kv = defaultKv()
): Promise<RunRecord[]> {
  const stored = await kv.get<unknown>(keyForUser(userId))
  if (!Array.isArray(stored)) return []
  return stored.filter(isRunRecord)
}

export async function saveHistory(
  records: RunRecord[],
  userId?: string | null,
  kv: Kv = defaultKv()
): Promise<void> {
  await kv.set(keyForUser(userId), records.slice(0, MAX_RECORDS))
}

function isRunRecord(value: unknown): value is RunRecord {
  if (value === null || typeof value !== "object") return false
  const r = value as Record<string, unknown>
  return (
    typeof r.id === "string" &&
    typeof r.requestId === "string" &&
    typeof r.modelId === "string" &&
    typeof r.prompt === "string" &&
    typeof r.createdAt === "number" &&
    Array.isArray(r.urls)
  )
}

/** Parses "16:9" / "9:16" / "1:1" style enum values; 1 when unknown. */
export function aspectFromSettings(settings: Record<string, unknown>): number {
  const raw = settings.aspect_ratio ?? settings.aspectRatio ?? settings.ratio
  if (typeof raw !== "string") return 1
  const [w, h] = raw.split(/[:x/]/).map(Number)
  return w && h ? w / h : 1
}
