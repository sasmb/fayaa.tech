"use client"

import { useCallback, useEffect, useState } from "react"
import { getUserVideoTasks } from "wasp/client/operations"
import type { VideoTask } from "wasp/entities"

import {
  cancelGeneration,
  getGenerationStatuses,
  submitGeneration,
} from "../../generation/actions"
import { getModel } from "../../generation/catalog"
import type { GenerationPlane } from "../../generation/catalog"
import type { GenerationStatus } from "../../generation/platform"
import { stopWatching, watchRequest } from "../../generation/poll"

import {
  aspectFromSettings,
  loadHistory,
  saveHistory,
  type RunRecord,
} from "./history"

/**
 * The studio's generation controller: submits planes to the platform through
 * the server action, keeps every run in IndexedDB-backed history, and resumes
 * polls for runs that were still in flight when the page reloaded.
 */
export function useRuns(userId?: string | null) {
  const [records, setRecords] = useState<RunRecord[]>([])
  const [loadedScope, setLoadedScope] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const currentScope = userId ?? "guest"
  const loaded = loadedScope === currentScope

  const update = useCallback((id: string, patch: Partial<RunRecord>) => {
    setRecords((current) =>
      current.map((r) => (r.id === id ? { ...r, ...patch } : r))
    )
  }, [])

  const watch = useCallback(
    (record: RunRecord) => {
      watchRequest(record.requestId, {
        deadline: record.createdAt + 15 * 60_000,
      })
        .then((status) => update(record.id, settle(status)))
        .catch((caught: unknown) => {
          update(record.id, {
            status: "failed",
            error: caught instanceof Error ? caught.message : String(caught),
          })
        })
    },
    [update]
  )

  useEffect(() => {
    let alive = true
    setRecords([])
    setLoadedScope(null)
    void Promise.all([
      loadHistory(userId),
      userId
        ? getUserVideoTasks().catch(() => [] as VideoTask[])
        : Promise.resolve([] as VideoTask[]),
    ]).then(([stored, serverTasks]) => {
      if (!alive) return
      const byRequestId = new Map<string, RunRecord>(
        stored.map((r) => [r.requestId, r])
      )
      for (const task of serverTasks) {
        const mappedStatus =
          task.status === "COMPLETED" && task.outputVideoUrl
            ? "completed"
            : task.status === "FAILED"
              ? "failed"
              : "running"
        const existing = byRequestId.get(task.requestId)
        if (!existing) {
          byRequestId.set(task.requestId, {
            id: task.requestId,
            requestId: task.requestId,
            taskId: task.id,
            isPublic: Boolean(task.isPublic),
            surface: "video",
            modelId: "genjutsu",
            modelLabel: "Higgsfield Genjutsu",
            prompt: task.prompt ?? "",
            settings: { resolution: task.resolution },
            aspect: 16 / 9,
            status: mappedStatus,
            urls: task.outputVideoUrl ? [task.outputVideoUrl] : [],
            ...(task.error ? { error: task.error } : {}),
            createdAt: new Date(task.createdAt).getTime(),
          })
        } else {
          byRequestId.set(task.requestId, {
            ...existing,
            taskId: task.id,
            isPublic: Boolean(task.isPublic),
            ...(mappedStatus === "completed" && existing.status !== "completed"
              ? {
                  status: "completed",
                  urls: [task.outputVideoUrl!],
                  error: undefined,
                }
              : {}),
          })
        }
      }
      const merged = Array.from(byRequestId.values()).sort(
        (a, b) => b.createdAt - a.createdAt
      )
      setRecords(merged)
      setLoadedScope(currentScope)
      for (const record of merged) {
        if (record.status === "running") {
          watch(record)
        }
      }
      // Reconcile any recent failed runs that have no output URLs in case a transient
      // network blip caused the client to mark a run failed before it completed on the server.
      const recoverable = merged.filter(
        (r) =>
          r.status === "failed" &&
          r.urls.length === 0 &&
          r.error !== "Canceled" &&
          Date.now() - r.createdAt < 24 * 60 * 60_000
      )
      if (recoverable.length > 0) {
        void getGenerationStatuses({
          requestIds: recoverable.map((r) => r.requestId),
        })
          .then((results) => {
            if (!alive) return
            for (const res of results) {
              if ("status" in res) {
                if (res.status.status === "completed") {
                  update(res.requestId, {
                    ...settle(res.status),
                    error: undefined,
                  })
                } else if (
                  res.status.status === "in_progress" ||
                  res.status.status === "queued"
                ) {
                  const target = recoverable.find(
                    (r) => r.requestId === res.requestId
                  )
                  if (target) {
                    update(target.id, { status: "running", error: undefined })
                    watch(target)
                  }
                }
              }
            }
          })
          .catch(() => {
            // Ignore background recovery errors
          })
      }
    })
    return () => {
      alive = false
      stopWatching()
    }
  }, [currentScope, update, userId, watch])

  useEffect(() => {
    if (loaded) void saveHistory(records, userId)
  }, [loaded, records, userId])

  const submit = useCallback(
    async (
      plane: GenerationPlane,
      projectId?: string
    ): Promise<RunRecord | null> => {
      setError(null)
      const model = getModel(plane.model)
      try {
        const queued = await submitGeneration(plane)
        const record: RunRecord = {
          id: queued.requestId,
          requestId: queued.requestId,
          surface: model.surface,
          modelId: model.id,
          modelLabel: model.label,
          prompt: plane.prompt.text,
          settings: plane.settings,
          ...(projectId ? { projectId } : {}),
          aspect: aspectFromSettings(plane.settings),
          status: "running",
          urls: [],
          createdAt: Date.now(),
        }
        setRecords((current) => [record, ...current])
        watch(record)
        return record
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught))
        return null
      }
    },
    [watch]
  )

  const cancel = useCallback(
    async (id: string) => {
      const record = records.find((r) => r.id === id)
      if (!record || record.status !== "running") return
      try {
        await cancelGeneration({ requestIds: [record.requestId] })
        update(id, { status: "failed", error: "Canceled" })
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught))
      }
    },
    [records, update]
  )

  const remove = useCallback((id: string) => {
    setRecords((current) => current.filter((r) => r.id !== id))
  }, [])

  const running = records.filter((r) => r.status === "running")

  return { records, running, loaded, error, submit, cancel, remove, setError }
}

function settle(status: GenerationStatus): Partial<RunRecord> {
  const urls = [
    ...(status.images?.map((i) => i.url) ?? []),
    ...(status.video ? [status.video.url] : []),
  ]
  if (status.status === "completed" && urls.length > 0)
    return { status: "completed", urls }
  const reason =
    status.status === "nsfw"
      ? "Blocked by the content filter"
      : status.status === "canceled"
        ? "Canceled"
        : (describeError(status.error) ??
          "The generation did not produce media")
  return { status: "failed", error: reason }
}

function describeError(error: unknown): string | undefined {
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const detail =
      (error as { detail?: unknown; message?: unknown }).detail ??
      (error as { message?: unknown }).message
    if (typeof detail === "string") return detail
  }
  return undefined
}
