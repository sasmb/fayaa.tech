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
  submitSeedanceVideo,
} from "wasp/client/operations"

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

export interface SubmitSeedanceRequest {
  prompt: string
  totalDurationSec: number
  resolution?: "480p" | "720p" | "1080p"
  aspectRatio?: string
}

export async function submitSeedance(
  data: SubmitSeedanceRequest
): Promise<{
  id: string
  status: string
  segmentCount: number
  creditCost: number
}> {
  return (await submitSeedanceVideo(data)) as unknown as {
    id: string
    status: string
    segmentCount: number
    creditCost: number
  }
}

export async function getLongVideoStatus(jobId: string) {
  return await getLongVideoJobStatus({ jobId })
}

export async function listLongVideoJobs() {
  return await getUserLongVideoJobs()
}

export async function cancelLongVideo(jobId: string) {
  return await cancelLongVideoJob({ jobId })
}
