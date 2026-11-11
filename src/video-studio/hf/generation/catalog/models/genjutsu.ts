import { urls } from "../mappers"
import type { GenerationPlane, ModelEntry, PlatformRequest } from "../types"

const genjutsuSettings = {
  resolution: {
    type: "enum",
    values: ["480p", "720p", "1080p"],
    default: "480p",
  },
  variant: {
    type: "enum",
    values: ["light", "pro"],
    default: "light",
  },
  duration: {
    type: "range",
    min: 4,
    max: 30,
    step: 1,
    default: 5,
  },
} as const satisfies ModelEntry["settings"]

function mapGenjutsu(plane: GenerationPlane): PlatformRequest {
  const video = urls(plane, "source")[0] ?? urls(plane, "video")[0]
  const images = [...urls(plane, "reference"), ...urls(plane, "start")]
  if (!video) {
    throw new Error("Add a source video to use Higgsfield Genjutsu.")
  }
  if (!images.length) {
    throw new Error("Add at least one reference image to use Higgsfield Genjutsu.")
  }
  const prompt = plane.prompt.text.trim()
  const isPro = plane.settings.variant === "pro"
  return {
    path: isPro
      ? "higgsfield/genjutsu/motion-transfer/v1.0"
      : "higgsfield/genjutsu-light/motion-transfer/v1.0",
    body: {
      video_url: video,
      image_urls: images,
      resolution: plane.settings.resolution,
      ...(prompt ? { prompt } : {}),
    },
  }
}

export const genjutsu: ModelEntry = {
  id: "genjutsu",
  surface: "video",
  label: "Higgsfield Genjutsu",
  roles: { source: 1, reference: 4 },
  requiredRoles: ["source", "reference"],
  settings: genjutsuSettings,
  icon: "higgsfield",
  order: 1,
  toPlatform: mapGenjutsu,
}

export default genjutsu

