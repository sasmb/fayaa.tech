import {
  SEEDANCE_ASPECT_RATIOS,
  SEEDANCE_MAX_TOTAL_SEC,
  SEEDANCE_MIN_DURATION_SEC,
  SEEDANCE_MODEL_ID,
  SEEDANCE_RESOLUTIONS,
  SEEDANCE_TEXT_TO_VIDEO_PATH,
} from "../../../../seedancePlanning"
import type { GenerationPlane, ModelEntry, PlatformRequest } from "../types"

const seedanceSettings = {
  resolution: {
    type: "enum",
    values: SEEDANCE_RESOLUTIONS,
    default: "720p",
  },
  aspect_ratio: {
    type: "enum",
    values: SEEDANCE_ASPECT_RATIOS,
    default: "16:9",
  },
  duration: {
    type: "range",
    min: SEEDANCE_MIN_DURATION_SEC,
    max: SEEDANCE_MAX_TOTAL_SEC,
    step: 1,
    default: 10,
  },
} as const satisfies ModelEntry["settings"]

/**
 * Seedance runs on MuAPI through the submitSeedanceVideo action, not the Higgsfield
 * platform. This map only validates the plane; the "muapi:" path is never sent.
 */
function mapSeedance(plane: GenerationPlane): PlatformRequest {
  const prompt = plane.prompt.text.trim()
  if (!prompt) throw new Error("Describe the video you want Seedance to make.")
  return {
    path: `muapi:${SEEDANCE_TEXT_TO_VIDEO_PATH}`,
    body: {
      prompt,
      resolution: plane.settings.resolution,
      aspect_ratio: plane.settings.aspect_ratio,
      duration: plane.settings.duration,
    },
  }
}

export const seedance: ModelEntry = {
  id: SEEDANCE_MODEL_ID,
  surface: "video",
  label: "Seedance 2.5",
  roles: {},
  requirePrompt: true,
  settings: seedanceSettings,
  icon: "seedance",
  order: 2,
  toPlatform: mapSeedance,
}

export default seedance
