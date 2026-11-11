import {
  hfCancelGeneration,
  hfClearPlatformCredentials,
  hfGetGenerationStatuses,
  hfHasPlatformCredentials,
  hfSavePlatformCredentials,
  hfSubmitGeneration,
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
