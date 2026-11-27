"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getUserVideoTasks } from "wasp/client/operations"
import type { LongVideoJob as LongVideoJobEntity, VideoTask } from "wasp/entities"

import {
  approveLongVideo,
  cancelGeneration,
  cancelLongVideo,
  keepLongVideoPreviewOnly,
  getGenerationStatuses,
  getLongVideoStatus,
  listLongVideoJobs,
  submitGeneration,
  submitLongVideo,
  submitSeedance,
  type SubmitLongVideoRequest,
  type SubmitSeedanceRequest,
} from "../../generation/actions"
import { getModel } from "../../generation/catalog"
import type { GenerationPlane } from "../../generation/catalog"
import type { GenerationStatus } from "../../generation/platform"
import { stopWatching, watchRequest } from "../../generation/poll"
import {
  estimateLongVideoPlan,
  formatLongVideoProgressLabel,
  type LongVideoPieceState,
} from "../../../longVideoPlanning"

type LongVideoJob = LongVideoJobEntity & { pieces?: LongVideoPieceState[] }

/** Credits still owed for a preview-first job: full price minus what was charged. */
function remainingCreditsFor(job: LongVideoJob): number {
  const full = estimateLongVideoPlan({
    totalDurationSec: job.totalDurationSec,
    trimStartSec: job.trimStartSec,
    resolution: job.resolution,
    variant: job.variant,
  }).credits
  return Math.max(0, full - job.creditCost)
}
import { SEEDANCE_VARIANT } from "../../../seedancePlanning"

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
  const longPollTimersRef = useRef<Map<string, number>>(new Map())
  const currentScope = userId ?? "guest"
  const loaded = loadedScope === currentScope

  const update = useCallback((id: string, patch: Partial<RunRecord>) => {
    setRecords((current) =>
      current.map((r) => (r.id === id ? { ...r, ...patch } : r))
    )
  }, [])

  const stopLongWatch = useCallback((jobId?: string) => {
    if (jobId) {
      const timer = longPollTimersRef.current.get(jobId)
      if (timer) window.clearTimeout(timer)
      longPollTimersRef.current.delete(jobId)
      return
    }
    for (const timer of longPollTimersRef.current.values()) {
      window.clearTimeout(timer)
    }
    longPollTimersRef.current.clear()
  }, [])

  const watchLongJob = useCallback(
    (recordId: string, jobId: string) => {
      if (longPollTimersRef.current.has(jobId)) return
      const scheduleNext = (delayMs: number) => {
        const timer = window.setTimeout(async () => {
          longPollTimersRef.current.delete(jobId)
          try {
            const job = await getLongVideoStatus(jobId)
            const progressLabel = formatLongVideoProgressLabel({
              status: job.status,
              segmentCount: job.segmentCount,
              completedCount: job.completedCount,
              variant: job.variant,
            })
            if (job.status === "COMPLETED" && job.outputVideoUrl) {
              update(recordId, {
                status: "completed",
                urls: [job.outputVideoUrl],
                completedCount: job.segmentCount,
                longVideoProgressLabel: progressLabel,
                error: undefined,
              })
              return
            }
            if (job.status === "AWAITING_APPROVAL" && job.previewVideoUrl) {
              update(recordId, {
                status: "completed",
                urls: [job.previewVideoUrl],
                completedCount: 1,
                longVideoProgressLabel: "Preview ready",
                awaitingApproval: { remainingCredits: remainingCreditsFor(job) },
              })
              return
            }
            if (job.status === "FAILED") {
              update(recordId, {
                status: "failed",
                longVideoProgressLabel: progressLabel,
                error: job.error ?? "Long video generation failed.",
              })
              return
            }
            update(recordId, {
              completedCount: job.completedCount,
              segmentCount: job.segmentCount,
              longVideoProgressLabel: progressLabel,
              ...(job.pieces ? { pieces: job.pieces } : {}),
            })
            scheduleNext(5000)
          } catch {
            scheduleNext(8000)
          }
        }, delayMs)
        longPollTimersRef.current.set(jobId, timer)
      }
      scheduleNext(4000)
    },
    [update]
  )

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
      userId
        ? listLongVideoJobs().catch(() => [] as LongVideoJob[])
        : Promise.resolve([] as LongVideoJob[]),
    ]).then(([stored, serverTasks, longJobs]) => {
      if (!alive) return
      const byRequestId = new Map<string, RunRecord>(
        stored.map((r) => [r.requestId, r])
      )
      for (const job of longJobs) {
        const key = `long-${job.id}`
        const awaiting =
          job.status === "AWAITING_APPROVAL" && Boolean(job.previewVideoUrl)
        const mappedStatus =
          (job.status === "COMPLETED" && job.outputVideoUrl) || awaiting
            ? "completed"
            : job.status === "FAILED"
              ? "failed"
              : "running"
        const progressLabel = formatLongVideoProgressLabel({
          status: job.status,
          segmentCount: job.segmentCount,
          completedCount: job.completedCount,
          variant: job.variant,
        })
        const isSeedance = job.variant === SEEDANCE_VARIANT
        byRequestId.set(key, {
          id: key,
          requestId: key,
          longVideoJobId: job.id,
          longVideoProgressLabel: progressLabel,
          segmentCount: job.segmentCount,
          completedCount: job.completedCount,
          ...(job.pieces ? { pieces: job.pieces } : {}),
          surface: "video",
          modelId: isSeedance ? "seedance" : "genjutsu",
          modelLabel: isSeedance ? "Seedance 2.5" : "Higgsfield Genjutsu",
          prompt: job.prompt ?? "",
          settings: {
            resolution: job.resolution,
            variant: job.variant,
            duration: job.totalDurationSec,
            ...(job.aspectRatio ? { aspect_ratio: job.aspectRatio } : {}),
          },
          aspect: job.aspectRatio
            ? aspectFromSettings({ aspect_ratio: job.aspectRatio })
            : 16 / 9,
          status: mappedStatus,
          urls: awaiting
            ? [job.previewVideoUrl!]
            : job.outputVideoUrl
              ? [job.outputVideoUrl]
              : [],
          ...(awaiting
            ? { awaitingApproval: { remainingCredits: remainingCreditsFor(job) } }
            : {}),
          ...(job.error ? { error: job.error } : {}),
          createdAt: new Date(job.createdAt).getTime(),
        })
      }
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
          if (record.longVideoJobId) {
            watchLongJob(record.id, record.longVideoJobId)
          } else {
            watch(record)
          }
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
      stopLongWatch()
    }
  }, [currentScope, stopLongWatch, update, userId, watch, watchLongJob])

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

  const submitLong = useCallback(
    async (
      input: SubmitLongVideoRequest,
      projectId?: string
    ): Promise<RunRecord | null> => {
      setError(null)
      try {
        const queued = await submitLongVideo(input)
        const key = `long-${queued.id}`
        const record: RunRecord = {
          id: key,
          requestId: key,
          longVideoJobId: queued.id,
          longVideoProgressLabel: formatLongVideoProgressLabel({
            status: queued.status,
            segmentCount: queued.segmentCount,
            completedCount: 0,
          }),
          segmentCount: queued.segmentCount,
          completedCount: 0,
          surface: "video",
          modelId: "genjutsu",
          modelLabel: "Higgsfield Genjutsu",
          prompt: input.prompt ?? "",
          settings: {
            resolution: input.resolution ?? "480p",
            variant: input.variant ?? "light",
            duration: input.totalDurationSec,
          },
          ...(projectId ? { projectId } : {}),
          aspect: 16 / 9,
          status: "running",
          urls: [],
          createdAt: Date.now(),
        }
        setRecords((current) => [record, ...current])
        watchLongJob(record.id, queued.id)
        return record
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught))
        return null
      }
    },
    [watchLongJob]
  )

  const submitSeedanceRun = useCallback(
    async (
      input: SubmitSeedanceRequest,
      projectId?: string
    ): Promise<RunRecord | null> => {
      setError(null)
      try {
        const queued = await submitSeedance(input)
        const key = `long-${queued.id}`
        const record: RunRecord = {
          id: key,
          requestId: key,
          longVideoJobId: queued.id,
          longVideoProgressLabel: formatLongVideoProgressLabel({
            status: queued.status,
            segmentCount: queued.segmentCount,
            completedCount: 0,
            variant: SEEDANCE_VARIANT,
          }),
          segmentCount: queued.segmentCount,
          completedCount: 0,
          surface: "video",
          modelId: "seedance",
          modelLabel: "Seedance 2.5",
          prompt: input.prompt,
          settings: {
            resolution: input.resolution ?? "720p",
            variant: SEEDANCE_VARIANT,
            duration: input.totalDurationSec,
            aspect_ratio: input.aspectRatio ?? "16:9",
          },
          ...(projectId ? { projectId } : {}),
          aspect: aspectFromSettings({ aspect_ratio: input.aspectRatio ?? "16:9" }),
          status: "running",
          urls: [],
          createdAt: Date.now(),
        }
        setRecords((current) => [record, ...current])
        watchLongJob(record.id, queued.id)
        return record
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught))
        return null
      }
    },
    [watchLongJob]
  )

  const cancel = useCallback(
    async (id: string) => {
      const record = records.find((r) => r.id === id)
      if (!record || record.status !== "running") return
      try {
        if (record.longVideoJobId) {
          stopLongWatch(record.longVideoJobId)
          await cancelLongVideo(record.longVideoJobId)
        } else {
          await cancelGeneration({ requestIds: [record.requestId] })
        }
        update(id, { status: "failed", error: "Canceled" })
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught))
      }
    },
    [records, stopLongWatch, update]
  )

  const approvePreview = useCallback(
    async (id: string) => {
      const record = records.find((r) => r.id === id)
      if (!record?.longVideoJobId || !record.awaitingApproval) return
      setError(null)
      try {
        await approveLongVideo(record.longVideoJobId)
        update(id, {
          status: "running",
          urls: [],
          awaitingApproval: undefined,
          longVideoProgressLabel: "Rendering the rest of your video…",
        })
        watchLongJob(id, record.longVideoJobId)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught))
      }
    },
    [records, update, watchLongJob]
  )

  const keepPreview = useCallback(
    async (id: string) => {
      const record = records.find((r) => r.id === id)
      if (!record?.longVideoJobId || !record.awaitingApproval) return
      setError(null)
      try {
        const job = (await keepLongVideoPreviewOnly(record.longVideoJobId)) as {
          outputVideoUrl?: string | null
        }
        update(id, {
          status: "completed",
          awaitingApproval: undefined,
          longVideoProgressLabel: "Final video ready",
          ...(job?.outputVideoUrl ? { urls: [job.outputVideoUrl] } : {}),
        })
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

  return {
    records,
    running,
    loaded,
    error,
    submit,
    submitLong,
    submitSeedance: submitSeedanceRun,
    cancel,
    approvePreview,
    keepPreview,
    remove,
    setError,
  }
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
