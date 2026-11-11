import { create } from "zustand"

export type GenjutsuWorkflowMode =
  | "motion_transfer"
  | "lite"
  | "object_swap"
  | "restyle"

export type ReferenceRoleType = "subject" | "scene" | "object" | "style"

export interface ReferenceImageSlot {
  id: string
  url: string
  name?: string
  badgeLabel: string // e.g., "[Ref 1]"
  badgeToken: string // e.g., "@Image1"
  roleType: ReferenceRoleType
  uploading?: boolean
}

export interface GenjutsuStylePreset {
  id: string
  label: string
  badge: string
  thumbnail: string
  promptKeywords: string
}

export const GENJUTSU_STYLE_PRESETS: GenjutsuStylePreset[] = [
  {
    id: "none",
    label: "Custom Prompt Only",
    badge: "Raw",
    thumbnail:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    promptKeywords: "",
  },
  {
    id: "cel_shaded_anime",
    label: "Cel-Shaded Anime",
    badge: "2D Anime",
    thumbnail:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
    promptKeywords:
      "cel-shaded anime aesthetic, crisp hand-drawn ink linework, vibrant Makoto Shinkai atmospheric lighting, dynamic anime shading, high-contrast 2D animation frames",
  },
  {
    id: "claymation",
    label: "Claymation Studio",
    badge: "Stop-Motion",
    thumbnail:
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&q=80",
    promptKeywords:
      "handcrafted plasticine claymation stop-motion style, tactile thumbprint clay textures, miniature studio practical lighting, Aardman / Laika stop-motion look",
  },
  {
    id: "knitted_yarn",
    label: "Knitted Yarn World",
    badge: "Wool Craft",
    thumbnail:
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&q=80",
    promptKeywords:
      "intricate knitted wool and crocheted yarn world, fuzzy macro fiber textures, stitched felt details, warm miniature tilt-shift lighting",
  },
  {
    id: "cinematic_3d",
    label: "Cinematic 3D Render",
    badge: "Pixar / Unreal",
    thumbnail:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
    promptKeywords:
      "stylized 3D feature animation render, subsurface scattering skin shaders, Unreal Engine 5 global illumination, volumetric rim lighting, Octane render",
  },
  {
    id: "hollywood_action",
    label: "Hollywood Action",
    badge: "IMAX 70mm",
    thumbnail:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80",
    promptKeywords:
      "photorealistic IMAX 70mm anamorphic cinema lens, dramatic teal-and-orange blockbuster color grading, volumetric atmosphere, hyper-detailed photoreal textures",
  },
]

export interface GenjutsuWorkspaceState {
  sourceVideo: {
    url: string | null
    name: string | null
    duration: number
    trimRange: { start: number; end: number }
    uploading: boolean
  }
  referenceImages: ReferenceImageSlot[]
  activeWorkflow: GenjutsuWorkflowMode
  activePresetId: string
  rawPrompt: string

  resolution: "480p" | "720p" | "1080p"
  aspectRatio: "9:16" | "16:9" | "1:1"
  strength: number
  seed: number
  seedLocked: boolean
  hasMask: boolean

  setSourceVideo: (video: {
    url: string | null
    name?: string | null
    duration?: number
    uploading?: boolean
  }) => void
  setSourceDuration: (duration: number) => void
  updateTrimRange: (start: number, end: number) => void
  clearSourceVideo: () => void

  addReferenceImage: (item: {
    id?: string
    url: string
    name?: string
    roleType?: ReferenceRoleType
  }) => void
  updateReferenceRole: (id: string, roleType: ReferenceRoleType) => void
  removeReferenceImage: (id: string) => void

  setWorkflow: (workflow: GenjutsuWorkflowMode) => void
  setPreset: (presetId: string) => void
  setRawPrompt: (prompt: string) => void
  appendTokenToPrompt: (token: string) => void
  setResolution: (resolution: "480p" | "720p" | "1080p") => void
  setAspectRatio: (aspectRatio: "9:16" | "16:9" | "1:1") => void
  setStrength: (strength: number) => void
  setSeed: (seed: number) => void
  setSeedLocked: (locked: boolean) => void
  setHasMask: (hasMask: boolean) => void
  hydrateFromRemix: (payload: {
    sourceVideoUrl?: string
    referenceImageUrls?: string[]
    prompt?: string
    resolution?: "480p" | "720p" | "1080p"
  }) => void
  resetWorkspace: () => void
}

function reindexReferences(
  items: ReferenceImageSlot[]
): ReferenceImageSlot[] {
  return items.slice(0, 4).map((item, idx) => ({
    ...item,
    badgeLabel: `[Ref ${idx + 1}]`,
    badgeToken: `@Image${idx + 1}`,
  }))
}

export const useGenjutsuWorkspace = create<GenjutsuWorkspaceState>((set) => ({
  sourceVideo: {
    url: null,
    name: null,
    duration: 10,
    trimRange: { start: 0, end: 10 },
    uploading: false,
  },
  referenceImages: [],
  activeWorkflow: "motion_transfer",
  activePresetId: "none",
  rawPrompt: "",

  resolution: "720p",
  aspectRatio: "9:16",
  strength: 0.85,
  seed: 73920148,
  seedLocked: false,
  hasMask: false,

  setSourceVideo: ({ url, name, duration, uploading = false }) =>
    set((state) => {
      const nextDuration = duration ?? state.sourceVideo.duration ?? 10
      return {
        sourceVideo: {
          url,
          name: name ?? state.sourceVideo.name,
          duration: nextDuration,
          trimRange: {
            start: 0,
            end: Math.min(Math.max(nextDuration, 4), 15),
          },
          uploading,
        },
      }
    }),

  setSourceDuration: (duration) =>
    set((state) => {
      const bounded = Math.max(1, Math.round(duration * 10) / 10)
      return {
        sourceVideo: {
          ...state.sourceVideo,
          duration: bounded,
          trimRange: {
            start: 0,
            end: Math.min(bounded, 15),
          },
        },
      }
    }),

  updateTrimRange: (start, end) =>
    set((state) => ({
      sourceVideo: {
        ...state.sourceVideo,
        trimRange: {
          start: Math.max(0, Math.min(start, end - 0.5)),
          end: Math.max(start + 0.5, end),
        },
      },
    })),

  clearSourceVideo: () =>
    set({
      sourceVideo: {
        url: null,
        name: null,
        duration: 10,
        trimRange: { start: 0, end: 10 },
        uploading: false,
      },
    }),

  addReferenceImage: ({ id, url, name, roleType }) =>
    set((state) => {
      if (state.referenceImages.length >= 4) return state
      const defaultRoles: ReferenceRoleType[] = [
        "subject",
        "scene",
        "object",
        "style",
      ]
      const idx = state.referenceImages.length
      const next: ReferenceImageSlot = {
        id: id ?? `${url}-${Date.now()}-${idx}`,
        url,
        ...(name ? { name } : {}),
        badgeLabel: `[Ref ${idx + 1}]`,
        badgeToken: `@Image${idx + 1}`,
        roleType: roleType ?? defaultRoles[idx] ?? "subject",
      }
      return {
        referenceImages: reindexReferences([...state.referenceImages, next]),
      }
    }),

  updateReferenceRole: (id, roleType) =>
    set((state) => ({
      referenceImages: state.referenceImages.map((img) =>
        img.id === id ? { ...img, roleType } : img
      ),
    })),

  removeReferenceImage: (id) =>
    set((state) => ({
      referenceImages: reindexReferences(
        state.referenceImages.filter((img) => img.id !== id)
      ),
    })),

  setWorkflow: (activeWorkflow) =>
    set((state) => ({
      activeWorkflow,
      resolution:
        activeWorkflow === "lite" ? "480p" : state.resolution,
    })),

  setPreset: (activePresetId) => set({ activePresetId }),
  setRawPrompt: (rawPrompt) => set({ rawPrompt }),

  appendTokenToPrompt: (token) =>
    set((state) => {
      const current = state.rawPrompt
      const separator =
        current.length === 0 || current.endsWith(" ") ? "" : " "
      return { rawPrompt: `${current}${separator}${token} ` }
    }),

  setResolution: (resolution) => set({ resolution }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setStrength: (strength) => set({ strength }),
  setSeed: (seed) => set({ seed }),
  setSeedLocked: (seedLocked) => set({ seedLocked }),
  setHasMask: (hasMask) => set({ hasMask }),

  hydrateFromRemix: ({
    sourceVideoUrl,
    referenceImageUrls,
    prompt,
    resolution,
  }) =>
    set((state) => ({
      sourceVideo: sourceVideoUrl
        ? {
            url: sourceVideoUrl,
            name: "Remixed Motion Source.mp4",
            duration: 10,
            trimRange: { start: 0, end: 10 },
            uploading: false,
          }
        : state.sourceVideo,
      referenceImages: referenceImageUrls
        ? reindexReferences(
            referenceImageUrls.slice(0, 4).map((url, idx) => ({
              id: `${url}-${idx}`,
              url,
              badgeLabel: `[Ref ${idx + 1}]`,
              badgeToken: `@Image${idx + 1}`,
              roleType: idx === 0 ? "subject" : "scene",
            }))
          )
        : state.referenceImages,
      rawPrompt: prompt ?? state.rawPrompt,
      resolution: resolution ?? state.resolution,
    })),

  resetWorkspace: () =>
    set({
      sourceVideo: {
        url: null,
        name: null,
        duration: 10,
        trimRange: { start: 0, end: 10 },
        uploading: false,
      },
      referenceImages: [],
      activeWorkflow: "motion_transfer",
      activePresetId: "none",
      rawPrompt: "",
      hasMask: false,
    }),
}))

/**
 * Compiles the structured Genjutsu workspace state (user prompt, @Image1..@Image4
 * role bindings, style preset keywords, workflow mode) into the prompt string
 * expected by `higgsfield/genjutsu/motion-transfer/v1.0`.
 */
export function compileGenjutsuPrompt(state: {
  rawPrompt: string
  referenceImages: ReferenceImageSlot[]
  activePresetId: string
  activeWorkflow: GenjutsuWorkflowMode
}): string {
  const parts: string[] = []
  const trimmed = state.rawPrompt.trim()

  if (trimmed) {
    parts.push(trimmed)
  } else if (state.referenceImages.length > 0) {
    const bindings = state.referenceImages
      .map((img) => `${img.badgeToken} (${img.roleType})`)
      .join(", ")
    parts.push(
      `Recast the motion of the source video using the uploaded reference identity and scene anchors: ${bindings}.`
    )
  }

  const preset = GENJUTSU_STYLE_PRESETS.find(
    (p) => p.id === state.activePresetId
  )
  if (preset && preset.promptKeywords) {
    parts.push(`Visual Style: ${preset.promptKeywords}.`)
  }

  if (state.activeWorkflow === "object_swap") {
    parts.push(
      "Mode: Targeted Object/Character Swap preserving surrounding motion and scene continuity."
    )
  } else if (state.activeWorkflow === "restyle") {
    parts.push(
      "Mode: Full-frame structural restyle locked to source motion trajectory."
    )
  }

  return parts.join(" ").trim()
}

