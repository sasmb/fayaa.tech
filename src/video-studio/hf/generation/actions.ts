import {
  cancelLongVideoJob,
  getLongVideoJobStatus,
  getUserLongVideoJobs,
  hfCancelGeneration,
  hfClearPlatformCredentials,
  hfGetGenerationStatuses,
  hfHasPlatformCredentials,
  hfSavePlatformCredentials,
  hfSubmitGeneration,
  submitLongVideoGenjutsu,
} from "wasp/client/operations"

import type { LongVideoJob } from "wasp/entities"

import type { LongVideoPieceState } from "../../longVideoPlanning"
import type { GenerationPlane } from "./catalog/types"
import type { QueuedGeneration, StatusResult } from "./platform"

export async function savePlatformCredentials(data: unknown): Promise<void> {
  await hfSavePlatformCredentials(
    data as { apiKey?: string; api_key?: string }
  )
}

export async function clearPlatformCredentials(): Promise<void> {
  await hfClearPlatformCredentials()
}

export async function hasPlatformCredentials(): Promise<boolean> {
  return (await hfHasPlatformCredentials()) as unknown as boolean
}

export async function submitGeneration(
  plane: GenerationPlane
): Promise<QueuedGeneration> {
  return (await hfSubmitGeneration(plane)) as unknown as QueuedGeneration
}

export async function getGenerationStatuses(
  data: unknown
): Promise<StatusResult[]> {
  return (await hfGetGenerationStatuses(
    data as { requestIds: string[] }
  )) as unknown as StatusResult[]
}

export async function cancelGeneration(data: unknown): Promise<void> {
  await hfCancelGeneration(data as { requestIds: string[] })
}

export interface SubmitLongVideoRequest {
  sourceVideoUrl: string
  referenceImageUrls: string[]
  prompt?: string
  resolution?: "480p" | "720p" | "1080p"
  variant?: "light" | "pro"
  trimStartSec?: number
  totalDurationSec: number
}

export async function submitLongVideo(
  data: SubmitLongVideoRequest
): Promise<{
  id: string
  status: string
  segmentCount: number
  creditCost: number
}> {
  return (await submitLongVideoGenjutsu(data)) as unknown as {
    id: string
    status: string
    segmentCount: number
    creditCost: number
  }
}

type LongVideoJobWithPieces = LongVideoJob & { pieces?: LongVideoPieceState[] }

export async function getLongVideoStatus(
  jobId: string
): Promise<LongVideoJobWithPieces> {
  return (await getLongVideoJobStatus({ jobId })) as unknown as LongVideoJobWithPieces
}

export async function listLongVideoJobs(): Promise<LongVideoJobWithPieces[]> {
  return (await getUserLongVideoJobs()) as unknown as LongVideoJobWithPieces[]
}

export async function cancelLongVideo(jobId: string) {
  return await cancelLongVideoJob({ jobId })
}
