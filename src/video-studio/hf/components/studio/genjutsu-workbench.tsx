"use client"

import { FayaaMark } from "../../../../client/design/FayaaLogo"
import { useEffect, useMemo, useRef, useState } from "react"
import type { DragEvent } from "react"
import { Link } from "react-router"
import {
  AlertCircle,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  Coins,
  Crown,
  Download,
  Eye,
  FolderOpen,
  Globe,
  Loader2,
  LogIn,
  LogOut,
  Maximize2,
  Pencil,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  User,
  Video as VideoIcon,
  Wand2,
  X,
} from "lucide-react"

import { logout, useAuth } from "wasp/client/auth"
import { toggleVideoPublicVisibility } from "wasp/client/operations"
import { routes } from "wasp/client/router"

import { getUserAvatarUrl } from "../../../../user/defaultAvatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../client/components/ui/dropdown-menu"

import { Button } from "../ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { genjutsu } from "../../generation/catalog/models/genjutsu"
import type { GenerationPlane, MediaItem } from "../../generation/catalog"
import type { RunRecord } from "../../lib/studio/history"
import {
  uploadAsset,
  type AssetLibraryItem,
  type AssetSelection,
} from "../../lib/studio/uploads"
import { cn } from "../../lib/utils"

import { ModelSelectorModal } from "../../../components/ModelSelectorModal"
import { FayaaWatermark } from "../../../components/FayaaWatermark"
import { useWatermark } from "../../../lib/watermark-store"
import { MOTION_MODELS } from "../../../templates"
import {
  estimateLongVideoPlan,
  maxClipDurationSec,
  segmentCredits,
} from "../../../longVideoPlanning"
import { LongVideoPieces } from "./long-video-pieces"
import type { MotionModel, VideoQuality } from "../../../types"

import { AssetLibraryModal } from "./asset-library"
import { GenerationTile } from "./generation-card"
import { HeroComposition } from "./hero-composition"
import { IconTile } from "./icon-tile"
import { ScreenEmptyState } from "./screen-empty-state"
import { MediaThumb } from "./media-thumb"
import { studioClip } from "../../../studioClips"
import { ExamplePresets, TEMPLATES, type TemplateItem } from "./template-picker"

/* ── Types & Presets ──────────────────────────────────────────────────────── */

type TopSidebarTab = "create-video" | "edit-video" | "motion-control"
type GenjutsuMode = "motion-transfer" | "object-swap" | "restyle" | "lite"
type StageTab = "history" | "motion-library" | "styles" | "how-it-works"
type FeedFilter = "all" | "trends" | "products" | "restyle"

interface StylePreset {
  id: string
  name: string
  tagline: string
  category: string
  promptSuffix: string
  thumb: string
  beforeThumb: string
  badge?: string
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "none",
    name: "Natural Realism (No Style Override)",
    tagline: "Keep realistic textures while transferring motion & identity",
    category: "Photoreal",
    promptSuffix: "",
    thumb: studioClip("trend-dance"),
    beforeThumb: studioClip("trend-dance"),
  },
  {
    id: "anime-cel",
    name: "Cel-Shaded Anime",
    tagline: "Crisp hand-drawn ink lines & vibrant sakuga shading",
    category: "Illustration",
    promptSuffix:
      "Style: cel-shaded 2D anime aesthetic, crisp ink linework, vibrant Studio Trigger palette, expressive cel lighting.",
    thumb: studioClip("grwm-anime"),
    beforeThumb: studioClip("trend-dance"),
    badge: "Popular",
  },
  {
    id: "claymation",
    name: "Stop-Motion Claymation",
    tagline: "Tactile sculpted plasticine with miniature studio lighting",
    category: "3D & Tactile",
    promptSuffix:
      "Style: handcrafted stop-motion claymation, visible thumbprint plasticine textures, miniature stage lighting, shallow tilt-shift depth of field.",
    thumb: studioClip("skate-dog"),
    beforeThumb: studioClip("snap-transition"),
    badge: "New",
  },
  {
    id: "knitted-yarn",
    name: "Knitted Yarn World",
    tagline: "Cozy crocheted wool fibers & stitched felt environments",
    category: "3D & Tactile",
    promptSuffix:
      "Style: macro knitted wool and crocheted yarn world, fuzzy tactile fibers, stitched felt details, warm softbox studio illumination.",
    thumb: studioClip("sneaker-unbox"),
    beforeThumb: studioClip("street-interview"),
    badge: "New",
  },
  {
    id: "cinematic-3d",
    name: "Cinematic 3D Animation",
    tagline: "Stylized feature-film 3D character rendering & subsurface skin",
    category: "3D & Tactile",
    promptSuffix:
      "Style: stylized feature-film 3D animation, soft subsurface scattering, expressive stylized proportions, rich volumetric rim lighting.",
    thumb: studioClip("ember-dance"),
    beforeThumb: studioClip("gym-spin"),
  },
  {
    id: "hollywood-action",
    name: "Hollywood Action Anamorphic",
    tagline: "35mm anamorphic lens flares, teal-and-orange grade & film grain",
    category: "Cinematic",
    promptSuffix:
      "Style: Hollywood 35mm anamorphic action cinema, subtle horizontal lens flares, teal and amber color grade, organic 35mm Kodak film grain.",
    thumb: studioClip("cliff-freeze"),
    beforeThumb: studioClip("night-market-pov"),
  },
]

interface CommunityExample {
  id: string
  title: string
  category: Exclude<FeedFilter, "all">
  videoUrl: string
  /** The clip loaded as the motion source when the example is remixed. */
  sourceVideoUrl: string
  referenceImages: { url: string; name: string }[]
  prompt: string
  mode: GenjutsuMode
  styleId: string
}

/** Motion library: FAYAA's own renders, each one remixable into the sidebar. */
const COMMUNITY_MASONRY: CommunityExample[] = [
  {
    id: "trend-dance",
    title: "Bedroom dance trend",
    category: "trends",
    videoUrl: studioClip("trend-dance"),
    sourceVideoUrl: studioClip("trend-dance"),
    referenceImages: [],
    prompt: "Recast the dancer into @Image1 with the same moves in the same LED-lit bedroom.",
    mode: "motion-transfer",
    styleId: "none",
  },
  {
    id: "sneaker-hook",
    title: "Sneaker slam hook",
    category: "products",
    videoUrl: studioClip("sneaker-hook"),
    sourceVideoUrl: studioClip("sneaker-hook"),
    referenceImages: [],
    prompt: "Swap the sneaker for @Image1, keeping the slam, the bounce and the camera move.",
    mode: "object-swap",
    styleId: "none",
  },
  {
    id: "grwm-anime",
    title: "GRWM anime switch",
    category: "restyle",
    videoUrl: studioClip("grwm-anime"),
    sourceVideoUrl: studioClip("grwm-anime"),
    referenceImages: [],
    prompt: "Restyle the whole clip as a 90s cel-shaded anime opening. Motion stays as filmed.",
    mode: "restyle",
    styleId: "anime-cel",
  },
  {
    id: "snap-transition",
    title: "Snap outfit transition",
    category: "trends",
    videoUrl: studioClip("snap-transition"),
    sourceVideoUrl: studioClip("snap-transition"),
    referenceImages: [],
    prompt: "Recast the person into @Image1 and keep the snap transition into the evening look.",
    mode: "motion-transfer",
    styleId: "none",
  },
  {
    id: "perfume-spin",
    title: "Perfume spin ad",
    category: "products",
    videoUrl: studioClip("perfume-spin"),
    sourceVideoUrl: studioClip("perfume-spin"),
    referenceImages: [],
    prompt: "Swap the bottle for @Image1 with the same light ribbons and hand catch.",
    mode: "object-swap",
    styleId: "none",
  },
  {
    id: "night-market-pov",
    title: "Night market POV",
    category: "restyle",
    videoUrl: studioClip("night-market-pov"),
    sourceVideoUrl: studioClip("night-market-pov"),
    referenceImages: [],
    prompt: "Restyle the POV run as an anamorphic action film with teal and amber grading.",
    mode: "restyle",
    styleId: "hollywood-action",
  },
  {
    id: "ember-dance",
    title: "Ember dance break",
    category: "trends",
    videoUrl: studioClip("ember-dance"),
    sourceVideoUrl: studioClip("ember-dance"),
    referenceImages: [],
    prompt: "Recast the dancer into @Image1 with flame trails on every move.",
    mode: "motion-transfer",
    styleId: "none",
  },
  {
    id: "sneaker-unbox",
    title: "Glow unboxing",
    category: "products",
    videoUrl: studioClip("sneaker-unbox"),
    sourceVideoUrl: studioClip("sneaker-unbox"),
    referenceImages: [],
    prompt: "Swap the product in the box for @Image1, same light spill and floating spin.",
    mode: "object-swap",
    styleId: "none",
  },
  {
    id: "ember-skate",
    title: "Ember skate line",
    category: "restyle",
    videoUrl: studioClip("ember-skate"),
    sourceVideoUrl: studioClip("ember-skate"),
    referenceImages: [],
    prompt: "Restyle the skate line as stylised feature-film 3D animation.",
    mode: "restyle",
    styleId: "cinematic-3d",
  },
  {
    id: "gym-spin",
    title: "Box jump 360",
    category: "trends",
    videoUrl: studioClip("gym-spin"),
    sourceVideoUrl: studioClip("gym-spin"),
    referenceImages: [],
    prompt: "Recast the athlete into @Image1 with the same box jump and 360 spin.",
    mode: "motion-transfer",
    styleId: "none",
  },
  {
    id: "burger-drop",
    title: "Burger drop",
    category: "products",
    videoUrl: studioClip("burger-drop"),
    sourceVideoUrl: studioClip("burger-drop"),
    referenceImages: [],
    prompt: "Swap the burger for @Image1 with the same slow-motion drop and chef reveal.",
    mode: "object-swap",
    styleId: "none",
  },
  {
    id: "cliff-freeze",
    title: "Cliff jump freeze",
    category: "restyle",
    videoUrl: studioClip("cliff-freeze"),
    sourceVideoUrl: studioClip("cliff-freeze"),
    referenceImages: [],
    prompt: "Restyle the cliff jump with a 35mm anamorphic look and film grain.",
    mode: "restyle",
    styleId: "hollywood-action",
  },
  {
    id: "skate-dog",
    title: "Skater dog",
    category: "trends",
    videoUrl: studioClip("skate-dog"),
    sourceVideoUrl: studioClip("skate-dog"),
    referenceImages: [],
    prompt: "Recast the dog into @Image1, same skateboard line down the boardwalk.",
    mode: "motion-transfer",
    styleId: "none",
  },
  {
    id: "street-interview",
    title: "Street interview twist",
    category: "trends",
    videoUrl: studioClip("street-interview"),
    sourceVideoUrl: studioClip("street-interview"),
    referenceImages: [],
    prompt: "Recast the presenter into @Image1 for the same street interview.",
    mode: "motion-transfer",
    styleId: "none",
  },
]

interface MotionControlSample {
  id: string
  title: string
  videoUrl: string
}

const MOTION_CONTROL_SAMPLES: MotionControlSample[] = [
  { id: "motion-trend-dance", title: "Bedroom dance trend", videoUrl: studioClip("trend-dance") },
  { id: "motion-ember-dance", title: "Ember dance break", videoUrl: studioClip("ember-dance") },
  { id: "motion-gym-spin", title: "Box jump 360", videoUrl: studioClip("gym-spin") },
  { id: "motion-snap-transition", title: "Snap outfit transition", videoUrl: studioClip("snap-transition") },
  { id: "motion-skate-dog", title: "Skater dog", videoUrl: studioClip("skate-dog") },
]

const EMPTY_HISTORY_IMAGES: readonly [string, string, string] = [
  studioClip("trend-dance"),
  studioClip("grwm-anime"),
  studioClip("sneaker-hook"),
]

/* ── Main Workbench Component ─────────────────────────────────────────────── */

export interface GenjutsuWorkbenchProps {
  libraryItems: AssetLibraryItem[]
  runs: RunRecord[]
  runningRuns: RunRecord[]
  generating: boolean
  canceling: boolean
  userCredits: number
  isGuestPreview?: boolean
  guestRemainingFormatted?: string
  onForceExpireGuest?: () => void
  onRequireGuestSignup?: () => void
  errorMessage?: string
  onSubmitPlane: (plane: GenerationPlane) => void
  onCancelGenerating: () => void
  /** Preview-first long videos: pay for and render the rest. */
  onApprovePreview?: (runId: string) => void
  /** Preview-first long videos: keep the first piece as the final video. */
  onKeepPreview?: (runId: string) => void
  onOpenSubscriptions: () => void
  onOpenAllGenerations: () => void
}

function formatVideoAspect(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const d = gcd(width, height)
  return `${width}×${height} (${Math.round(width / d)}:${Math.round(height / d)})`
}

export function GenjutsuWorkbench({
  libraryItems,
  runs,
  runningRuns,
  generating,
  canceling,
  userCredits,
  isGuestPreview = false,
  errorMessage: studioError,
  onSubmitPlane,
  onCancelGenerating,
  onApprovePreview,
  onKeepPreview,
}: GenjutsuWorkbenchProps) {
  const { data: authUser } = useAuth()
  const canPublishPublic = Boolean(authUser?.canPublishPublic || authUser?.isAdmin)
  const [publicOverrides, setPublicOverrides] = useState<Record<string, boolean>>({})
  const [togglingPublicId, setTogglingPublicId] = useState<string | null>(null)

  const handleToggleRunPublic = async (run: RunRecord) => {
    if (!canPublishPublic || !run.taskId || togglingPublicId === run.taskId) return
    const currentlyPublic = publicOverrides[run.id] ?? Boolean(run.isPublic)
    const nextPublic = !currentlyPublic
    setTogglingPublicId(run.taskId)
    setPublicOverrides((prev) => ({ ...prev, [run.id]: nextPublic }))
    try {
      await toggleVideoPublicVisibility({
        taskId: run.taskId,
        isPublic: nextPublic,
        publicCategory: "ugc",
      })
    } catch {
      setPublicOverrides((prev) => ({ ...prev, [run.id]: currentlyPublic }))
    } finally {
      setTogglingPublicId(null)
    }
  }
  // Navigation & Mode states
  const [sidebarTab, setSidebarTab] = useState<TopSidebarTab>("create-video")
  const [mode, setMode] = useState<GenjutsuMode>("motion-transfer")
  const [stageTab, setStageTab] = useState<StageTab>("motion-library")
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all")

  // Model selection modal
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false)
  const [selectedMotionModel, setSelectedMotionModel] = useState<MotionModel>(
    () => MOTION_MODELS[0]!
  )
  const [sceneControlEnabled, setSceneControlEnabled] = useState<boolean>(true)
  const [sceneControlMode, setSceneControlMode] = useState<"video" | "image">("video")
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState<boolean>(false)

  // Popup 1: "NEW IN GENJUTSU: RESTYLE" modal -> Popup 2: Top-right Credit Usage notice
  const [showRestyleModal, setShowRestyleModal] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("fayaa.restyleModalSeen") !== "1"
    } catch {
      return true
    }
  })
  const [showCreditPopup, setShowCreditPopup] = useState<boolean>(false)

  // Style Drawer / Selector state
  const [selectedStyleId, setSelectedStyleId] = useState<string>("none")
  const [stylePickerOpen, setStylePickerOpen] = useState<boolean>(false)

  // Full-frame uncropped media preview modal
  const [fullFrameMedia, setFullFrameMedia] = useState<{
    type: "video" | "image"
    url: string
    title: string
    aspectRatio?: string
  } | null>(null)
  const [sourceVideoAspect, setSourceVideoAspect] = useState<string | null>(null)
  const { watermarkEnabled, toggleWatermark } = useWatermark(true)

  useEffect(() => {
    if (!fullFrameMedia) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullFrameMedia(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [fullFrameMedia])

  // Left-sidebar inputs (empty by default so new users start afresh with no preloaded media)
  const [sourceVideo, setSourceVideo] = useState<MediaItem | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(10)
  const [trimRange, setTrimRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 5,
  })

  const [referenceImages, setReferenceImages] = useState<MediaItem[]>([])
  const [promptEnabled, setPromptEnabled] = useState<boolean>(false)
  // Long videos: render and pay for piece 1 first, then decide on the rest.
  const [previewFirst, setPreviewFirst] = useState<boolean>(false)
  const [prompt, setPrompt] = useState<string>("")
  const [resolution, setResolution] = useState<VideoQuality>("480p")

  // Ensure switching or logging out of a user account starts with a clean workspace
  // without wiping state when initial auth session resolves on page load.
  const prevAuthUserIdRef = useRef<string | undefined>(authUser?.id)
  useEffect(() => {
    if (prevAuthUserIdRef.current === authUser?.id) return
    const wasInitialUndefined = prevAuthUserIdRef.current === undefined
    prevAuthUserIdRef.current = authUser?.id
    if (wasInitialUndefined) return
    setSourceVideo(null)
    setReferenceImages([])
    setPrompt("")
    setPromptEnabled(false)
    setVideoDuration(10)
    setTrimRange({ start: 0, end: 5 })
  }, [authUser?.id])

  const selectedDurationSec = useMemo(
    () => Math.max(4, Math.round((trimRange.end - trimRange.start) * 10) / 10),
    [trimRange.end, trimRange.start]
  )

  const realtimeCost = useMemo(
    () =>
      estimateLongVideoPlan({
        totalDurationSec: selectedDurationSec,
        trimStartSec: trimRange.start,
        resolution,
        variant:
          selectedMotionModel.id === "higgsfield/genjutsu/motion-transfer/v1.0"
            ? "pro"
            : "light",
        usdPerSecByRes: selectedMotionModel.usdPerSecByRes,
      }),
    [selectedMotionModel, resolution, selectedDurationSec, trimRange.start]
  )

  const applyDurationPreset = (seconds: number) => {
    const maxDur = Math.max(4, videoDuration)
    const capped = Math.max(4, Math.min(maxDur, seconds))
    const nextStart = trimRange.start + capped <= maxDur ? trimRange.start : 0
    setTrimRange({ start: nextStart, end: nextStart + capped })
  }

  // Upload & mention state
  const [uploadingVideo, setUploadingVideo] = useState<boolean>(false)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Elapsed timer for active run
  const [elapsedSec, setElapsedSec] = useState<number>(0)

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)

  const activeStyle = useMemo(
    () =>
      STYLE_PRESETS.find((s) => s.id === selectedStyleId) ?? STYLE_PRESETS[0]!,
    [selectedStyleId]
  )

  const catalogMaxReferences = genjutsu.roles.reference ?? 4
  const maxImagesForMode = useMemo(() => {
    if (sidebarTab === "motion-control") return 1
    if (mode === "restyle") return 1
    return catalogMaxReferences
  }, [catalogMaxReferences, mode, sidebarTab])

  // Active runs for Genjutsu
  const genjutsuRuns = useMemo(
    () => runs.filter((r: RunRecord) => r.modelId === genjutsu.id),
    [runs]
  )
  const activeGeneratingRun = useMemo(
    () =>
      runningRuns.find((r: RunRecord) => r.modelId === genjutsu.id) ??
      genjutsuRuns.find((r: RunRecord) => r.status === "running"),
    [genjutsuRuns, runningRuns]
  )

  const activeRunId = activeGeneratingRun?.id
  const activeRunCreatedAt = activeGeneratingRun?.createdAt
  const prevActiveRunIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!activeRunId || !activeRunCreatedAt) {
      prevActiveRunIdRef.current = undefined
      setElapsedSec(0)
      return
    }
    if (prevActiveRunIdRef.current !== activeRunId) {
      prevActiveRunIdRef.current = activeRunId
      setStageTab("history")
    }
    const tick = () => {
      setElapsedSec(
        Math.max(0, Math.floor((Date.now() - activeRunCreatedAt) / 1000))
      )
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [activeRunCreatedAt, activeRunId])

  // Close Restyle modal and show the top-right Credit Usage notice
  const closeRestyleModal = (openStylesTab = false) => {
    setShowRestyleModal(false)
    try {
      sessionStorage.setItem("fayaa.restyleModalSeen", "1")
    } catch {
      // ignore storage errors
    }
    if (openStylesTab) {
      setStageTab("styles")
      setMode("restyle")
    }
    if (authUser) setShowCreditPopup(true)
  }

  // Upload helper used by both AssetLibraryModal and drag-and-drop on slots
  const handleAssetUpload = async (file: File): Promise<AssetSelection> => {
    return uploadAsset(file)
  }

  // Attach source video from AssetLibraryModal or direct drop
  const applyVideoSelection = (selection: AssetSelection) => {
    setSourceVideo({
      id: selection.id,
      url: selection.src,
      role: "source",
      kind: "video",
      name: selection.name,
    })
    setVideoDuration(10)
    setTrimRange({ start: 0, end: 5 })
  }

  const removeSourceVideo = () => {
    setSourceVideo(null)
    setSourceVideoAspect(null)
    setVideoDuration(10)
    setTrimRange({ start: 0, end: 5 })
  }

  const handleDirectVideoDrop = async (file: File) => {
    setLocalError(null)
    setUploadingVideo(true)
    try {
      const uploaded = await handleAssetUpload(file)
      if (uploaded.kind !== "video") {
        throw new Error(
          "Please upload an MP4, MOV, or WebM video (4s or longer)."
        )
      }
      applyVideoSelection(uploaded)
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to upload reference video."
      )
    } finally {
      setUploadingVideo(false)
    }
  }

  // Attach reference images from AssetLibraryModal or direct drop
  const applyImageSelections = (selections: AssetSelection[]) => {
    if (!selections.length) return
    setReferenceImages((prev) => {
      if (maxImagesForMode === 1) {
        const first = selections[0]!
        return [
          {
            id: first.id,
            url: first.src,
            role: "reference",
            kind: "image",
            name: first.name ?? "Reference_1",
          },
        ]
      }
      const remaining = Math.max(0, maxImagesForMode - prev.length)
      const toAdd: MediaItem[] = selections.slice(0, remaining).map((sel, i) => ({
        id: sel.id,
        url: sel.src,
        role: "reference",
        kind: "image",
        name: sel.name ?? `Reference_${prev.length + i + 1}`,
      }))
      return [...prev, ...toAdd]
    })
  }

  const handleDirectImagesDrop = async (files: File[]) => {
    if (!files.length) return
    setLocalError(null)
    const remaining =
      maxImagesForMode === 1 ? 1 : maxImagesForMode - referenceImages.length
    if (remaining <= 0) {
      setLocalError(
        `Maximum of ${maxImagesForMode} reference image(s) allowed in this mode.`
      )
      return
    }
    const slice = files.slice(0, remaining)
    setUploadingImage(true)
    try {
      const uploadedList: AssetSelection[] = []
      for (const file of slice) {
        const uploaded = await handleAssetUpload(file)
        if (uploaded.kind !== "image") {
          throw new Error("Reference slots only accept image files (JPG, PNG, WebP).")
        }
        uploadedList.push(uploaded)
      }
      applyImageSelections(uploadedList)
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to upload reference image."
      )
    } finally {
      setUploadingImage(false)
    }
  }

  const injectImageToken = (indexOneBased: number) => {
    const token = `@Image${indexOneBased}`
    setPromptEnabled(true)
    const el = promptTextareaRef.current
    if (!el) {
      let nextCursor = 0
      setPrompt((cur) => {
        const next = `${cur}${cur.endsWith(" ") || !cur ? "" : " "}${token} `
        nextCursor = next.length
        return next
      })
      requestAnimationFrame(() => {
        const mounted = promptTextareaRef.current
        if (mounted) {
          mounted.focus()
          mounted.setSelectionRange(nextCursor, nextCursor)
        }
      })
      return
    }
    const start = el.selectionStart ?? prompt.length
    const end = el.selectionEnd ?? prompt.length
    const before = prompt.slice(0, start)
    const after = prompt.slice(end)
    const needsLeadingSpace =
      before.length > 0 && !before.endsWith(" ") && !before.endsWith("@")
    const cleanBefore = before.endsWith("@") ? before.slice(0, -1) : before
    const insertedPrefix = `${cleanBefore}${needsLeadingSpace ? " " : ""}${token} `
    const next = `${insertedPrefix}${after}`
    const cursorPos = insertedPrefix.length
    setPrompt(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursorPos, cursorPos)
    })
  }

  const loadExampleIntoWorkspace = (ex: CommunityExample) => {
    if (sidebarTab === "motion-control") {
      setSidebarTab(ex.mode === "object-swap" ? "edit-video" : "create-video")
    }
    setMode(ex.mode)
    setSelectedStyleId(ex.styleId)
    setSourceVideo({
      id: `src-${ex.id}`,
      url: ex.sourceVideoUrl,
      role: "source",
      kind: "video",
      name: `${ex.title.replace(/\s+/g, "_")}_Motion.mp4`,
    })
    setVideoDuration(10)
    setTrimRange({ start: 0, end: 5 })
    setReferenceImages(
      ex.referenceImages.map((img, i) => ({
        id: `ref-${ex.id}-${i}`,
        url: img.url,
        role: "reference",
        kind: "image",
        name: img.name,
      }))
    )
    setPrompt(ex.prompt)
    setPromptEnabled(Boolean(ex.prompt))
    setLocalError(null)
  }

  const loadTemplateIntoWorkspace = (tpl: TemplateItem) => {
    const srcMedia = tpl.media?.find((m) => m.role === "source") ?? null
    const refMedia = tpl.media?.filter((m) => m.role === "reference") ?? []
    if (srcMedia) {
      setSourceVideo(srcMedia)
      setVideoDuration(10)
      setTrimRange({ start: 0, end: 5 })
    }
    if (refMedia.length > 0) setReferenceImages(refMedia)
    setPrompt(tpl.prompt)
    setPromptEnabled(Boolean(tpl.prompt))
    const tplRes = tpl.settings?.resolution
    if (tplRes === "480p" || tplRes === "720p" || tplRes === "1080p") {
      setResolution(tplRes)
    }
    setLocalError(null)
  }

  const canSubmit =
    Boolean(sourceVideo) &&
    referenceImages.length >= 1 &&
    !uploadingVideo &&
    !uploadingImage &&
    !submitting &&
    !generating

  const handleGenerate = async () => {
    if (generating || submitting) return
    setLocalError(null)
    if (!sourceVideo) {
      setLocalError(
        sidebarTab === "motion-control"
          ? "Add a source motion video (4s or longer, long videos auto-split cleanly)."
          : "Add a reference video (4s or longer, long videos auto-split cleanly)."
      )
      return
    }
    if (referenceImages.length < 1) {
      setLocalError(
        sidebarTab === "motion-control"
          ? "Add your character with visible face and body."
          : "Add at least 1 character, product, or clothes reference image."
      )
      return
    }

    const hasCustomPrompt =
      sidebarTab === "motion-control"
        ? Boolean(prompt.trim())
        : promptEnabled && Boolean(prompt.trim())

    const basePrompt = hasCustomPrompt
      ? prompt.trim()
      : sidebarTab === "motion-control"
        ? "Transfer motion from reference video into character with high temporal consistency and realistic physics."
        : "Recast the motion of the reference video using @Image1 with coherent lighting and natural physical movement."

    const modeInstruction =
      sidebarTab === "motion-control"
        ? `Mode: Motion control character transfer. Background source: ${sceneControlEnabled ? sceneControlMode : "auto"}.`
        : mode === "object-swap"
          ? "Mode: Isolated object/character swap while preserving surrounding scene layout."
          : mode === "restyle" || selectedStyleId !== "none"
            ? "Mode: Full-frame style redraw while locking original camera and subject motion."
            : ""

    const composedPrompt = [
      basePrompt,
      modeInstruction,
      sidebarTab !== "motion-control" ? activeStyle.promptSuffix : "",
    ]
      .filter(Boolean)
      .join(" ")

    const variant =
      selectedMotionModel.id === "higgsfield/genjutsu/motion-transfer/v1.0"
        ? "pro"
        : "light"
    // Light renders at most 15s per request and Pro 30s. Anything longer is split into
    // clips and stitched on the server, otherwise the model silently cuts the output.
    const clipLimitSec = maxClipDurationSec(variant)
    // A trimmed selection is also cut on the server: the single-request path always
    // sends the whole file, so the chosen start/end would otherwise be ignored.
    const isTrimmed =
      trimRange.start > 0.05 || trimRange.end < videoDuration - 0.05
    const isLongForm = selectedDurationSec > clipLimitSec || isTrimmed
    const plane: GenerationPlane = {
      model: genjutsu.id,
      prompt: { text: composedPrompt },
      settings: {
        resolution,
        variant,
        duration: isLongForm
          ? selectedDurationSec
          : Math.max(4, Math.min(clipLimitSec, Math.round(selectedDurationSec))),
        ...(isLongForm
          ? {
              trimStartSec: trimRange.start,
              longForm: true,
              ...(previewFirst && realtimeCost.segmentCount > 1
                ? { previewFirst: true }
                : {}),
            }
          : {}),
      },
      media: {
        source: [sourceVideo],
        reference: referenceImages.slice(0, maxImagesForMode),
      },
    }

    setSubmitting(true)
    try {
      onSubmitPlane(plane)
      setStageTab("history")
    } finally {
      setSubmitting(false)
    }
  }

  const autoRunTriggeredRef = useRef(false)
  useEffect(() => {
    if (autoRunTriggeredRef.current) return
    if (typeof window === "undefined") return
    if (isGuestPreview) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("autorun") === "1" && sourceVideo && referenceImages.length >= 1) {
      autoRunTriggeredRef.current = true
      setShowRestyleModal(false)
      setStageTab("history")
      const url = new URL(window.location.href)
      url.searchParams.delete("autorun")
      window.history.replaceState({}, "", url.toString())
      void handleGenerate()
    }
  }, [isGuestPreview, sourceVideo, referenceImages])

  const filteredMasonry = useMemo(
    () =>
      feedFilter === "all"
        ? COMMUNITY_MASONRY
        : COMMUNITY_MASONRY.filter((item) => item.category === feedFilter),
    [feedFilter]
  )

  // Credit calculations for the top-right credit popup
  const displayCredits = userCredits ?? 0
  const planTotalCredits = Math.max(displayCredits, 800)
  const usedPercent = Math.min(
    99,
    Math.max(
      15,
      Math.round(((planTotalCredits - displayCredits) / planTotalCredits) * 100)
    )
  )

  const activeError = localError ?? studioError ?? null

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-fy-ink text-white select-none">
      {/* ══════════════════════════════════════════════════════════════════════
          GLOBAL TOP HEADER BAR (Matches Genjutsu Studio Screenshots 1, 2, 3)
         ══════════════════════════════════════════════════════════════════════ */}
      <header className="flex h-[52px] w-full shrink-0 items-center justify-between border-b border-white/[0.07] bg-fy-ink px-4">
        <div className="flex items-center gap-5 overflow-x-auto">
          {/* FAYAA Brand Mark */}
          <Link
            to={routes.LandingPageRoute.to}
            className="fy-heat-bg flex size-8 shrink-0 items-center justify-center rounded-fy-sm text-fy-on-accent shadow-[0_8px_24px_-8px_rgb(255_91_31/0.8)] transition-transform duration-500 ease-fy-out hover:rotate-[-8deg] hover:scale-105"
            title="Back to Fayaa Explore"
          >
            <FayaaMark className="size-[18px]" />
          </Link>

          {/* Primary Nav Links */}
          <nav className="flex items-center gap-5 text-xs font-medium text-zinc-400">
            <Link
              to={routes.LandingPageRoute.to}
              className="transition-colors hover:text-white"
            >
              Explore
            </Link>
            <Link
              to={routes.StudioRoute.to}
              className="inline-flex items-center gap-1.5 font-bold text-fy-accent"
            >
              <span>Video Studio</span>
              <span className="rounded bg-fy-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-fy-accent">
                Genjutsu
              </span>
            </Link>
            <Link
              to={routes.PricingPageRoute.to}
              className="transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <button
              type="button"
              onClick={() => {
                setSidebarTab("edit-video")
                setMode("object-swap")
              }}
              className="hidden cursor-pointer items-center gap-1 rounded-full border border-fy-accent/35 bg-fy-accent/10 px-2.5 py-0.5 text-[11px] font-bold text-fy-accent transition-colors hover:bg-fy-accent/20 md:inline-flex"
            >
              <span>Also supports 2+ min videos</span>
              <ChevronRight className="size-3" />
            </button>
          </nav>
        </div>

        {/* Right Global Actions: Search | Upgrade 30% OFF | Enterprise | Assets | Credits & User */}
        <div className="flex shrink-0 items-center gap-2">

          {/* Watermark Toggle (Available for Test & Paying Users) */}
          <button
            type="button"
            onClick={toggleWatermark}
            title={
              watermarkEnabled
                ? "Watermark ON: Click to disable watermark (Paying / Test User feature)"
                : "Watermark OFF: Click to enable watermark"
            }
            className={cn(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-all select-none",
              watermarkEnabled
                ? "border-fy-accent/40 bg-fy-accent/10 text-white hover:bg-fy-accent/20"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full transition-all",
                watermarkEnabled ? "bg-fy-accent shadow-[0_0_8px_#ff5b1f]" : "bg-zinc-600"
              )}
            />
            <span className="font-mono text-[11px] hidden sm:inline">Watermark:</span>
            <span className={watermarkEnabled ? "text-fy-accent font-bold font-mono text-[11px]" : "text-zinc-400 font-mono text-[11px]"}>
              {watermarkEnabled ? "ON" : "OFF"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsModelModalOpen(true)}
            aria-label="Search models and motion library"
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <Search className="size-3.5" />
          </button>

          <Link
            to={routes.PricingPageRoute.to}
            className="relative inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.05] px-3 text-xs font-semibold text-white transition-colors hover:bg-white/[0.1]"
          >
            <Rocket className="size-3.5 text-fy-accent" />
            <span>Upgrade</span>
            <span className=" -bottom-2 left-1/2 -translate-x-1/2 absolute rounded-full bg-fy-rose px-1.5 py-0.2 text-[8px] font-extrabold tracking-wider text-white uppercase shadow">
              SAVE 20%
            </span>
          </Link>

          <span
            title="Enterprise plans coming soon"
            className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-zinc-400 xl:inline-flex"
          >
            <Sparkles className="size-3 text-zinc-500" />
            <span>Enterprise</span>
            <span className="rounded bg-white/10 px-1 py-0.2 text-[8px] font-bold tracking-wider text-zinc-400 uppercase">
              Soon
            </span>
          </span>

          <AssetLibraryModal
            items={libraryItems}
            onUpload={handleAssetUpload}
            onSelect={(sel) => {
              if (sel.kind === "video") applyVideoSelection(sel)
              else if (sel.kind === "image") applyImageSelections([sel])
            }}
            trigger={
              <button
                type="button"
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.09]"
              >
                <FolderOpen className="size-3.5 text-fy-success" />
                <span>Assets</span>
              </button>
            }
          />

          <button
            type="button"
            onClick={() => setShowCreditPopup((v) => !v)}
            title="View credit usage"
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-semibold text-fy-amber transition-colors hover:bg-white/[0.09]"
          >
            <Coins className="size-3.5" />
            <span>{displayCredits}</span>
          </button>

          {authUser ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Account profile and options"
                    title={authUser.email ?? "Account"}
                    className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] pr-2 pl-0.5 transition-colors hover:border-fy-accent/60 focus:outline-none"
                  >
                    <img
                      src={getUserAvatarUrl(authUser)}
                      alt="User avatar"
                      className="size-7 rounded-full bg-white object-cover"
                    />
                    <ChevronRight className="size-3.5 rotate-90 text-zinc-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-50 w-56 rounded-2xl border border-white/12 bg-fy-surface-1 p-1.5 text-white shadow-2xl backdrop-blur-md"
                >
                  <div className="border-b border-white/[0.08] px-3 py-2">
                    <p className="truncate text-xs font-semibold text-white">
                      {authUser.username || authUser.email || "Creator"}
                    </p>
                    {authUser.email ? (
                      <p className="truncate text-[11px] text-zinc-400">
                        {authUser.email}
                      </p>
                    ) : null}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link
                      to={routes.AccountRoute.to}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <User className="size-3.5 text-zinc-400" />
                      <span>Account Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to={routes.PricingPageRoute.to}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                      <Crown className="size-3.5 text-fy-accent" />
                      <span>Plans & Credits</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-white/[0.08]" />
                  <DropdownMenuItem
                    onClick={() => void logout()}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <LogOut className="size-3.5" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => void logout()}
                title="Log out"
                className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 hover:text-white"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          ) : (
            <Link
              to={routes.LoginRoute.to}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-fy-accent px-3 text-xs font-bold text-black transition-transform hover:scale-105 hover:bg-fy-accent-hover"
            >
              <LogIn className="size-3.5" />
              <span>Log In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main 2-Pane Workspace Body */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* ══════════════════════════════════════════════════════════════════════
          POPUP 1: "NEW IN GENJUTSU: RESTYLE" MODAL (Higgsfield Dialog)
         ══════════════════════════════════════════════════════════════════════ */}
        <Dialog
          open={showRestyleModal}
          onOpenChange={(next) => {
            if (!next) closeRestyleModal(false)
          }}
        >
          <DialogContent
            size="xs"
            className="w-full max-w-[380px] overflow-hidden rounded-[26px] border border-white/15 bg-fy-surface-1 p-0 shadow-[0_28px_90px_rgba(0,0,0,0.88)]"
          >
            <DialogTitle className="sr-only">New in Genjutsu: Restyle</DialogTitle>
            <DialogDescription className="sr-only">
              Pick a style or build one from your images, and the whole video is
              redrawn in it. Motion stays as filmed.
            </DialogDescription>

            {/* Restyle preview: a FAYAA anime restyle render */}
            <div className="relative h-[230px] w-full overflow-hidden bg-fy-surface-2">
              <MediaThumb src={studioClip("grwm-anime")} alt="Video restyled as anime" mode="always" />
              <span className="absolute bottom-3 left-3 z-[2] rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                Restyle: anime
              </span>

              {/* Bottom Gradient Fade */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-fy-surface-1 to-transparent" />

              {/* Close X Button */}
              <DialogClose
                onClick={() => closeRestyleModal(false)}
                aria-label="Close Restyle announcement"
                className="absolute top-3.5 right-3.5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white/90 backdrop-blur-md transition-colors hover:bg-black/70"
              >
                <X className="size-4" />
              </DialogClose>
            </div>

            {/* Bottom Content Copy */}
            <div className="flex flex-col items-center px-6 pt-3 pb-6 text-center">
              <span className="text-[10px] font-bold tracking-[0.14em] text-fy-accent uppercase">
                NEW IN GENJUTSU
              </span>
              <h2 className="mt-1 font-display text-[38px] leading-none font-black tracking-[0.04em] text-white uppercase">
                RESTYLE
              </h2>
              <p className="mt-2.5 max-w-[290px] text-xs leading-relaxed text-zinc-400">
                Pick a style or build one from your images, and the whole video is
                redrawn in it. Motion stays as filmed.
              </p>
              <Button
                size="lg"
                onClick={() => closeRestyleModal(true)}
                className="mt-5 h-10 rounded-xl bg-fy-accent px-6 text-xs font-bold text-black shadow-[0_8px_24px_rgba(255,91,31,0.25)] hover:bg-fy-accent-hover"
              >
                Explore styles
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════════════
          POPUP 2: TOP-RIGHT CREDIT USAGE POPOVER (Appears after closing Popup 1)
         ══════════════════════════════════════════════════════════════════════ */}
        {showCreditPopup && authUser ? (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-14 right-4 z-40 flex w-[360px] items-start gap-3.5 rounded-2xl border border-white/12 bg-fy-surface-2/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Circular yellow coin/gauge badge */}
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-fy-amber/80 bg-fy-amber/10 text-fy-amber">
              <Coins className="size-4" />
              <span className=" -top-0.5 -right-0.5 absolute flex size-3.5 items-center justify-center rounded-full bg-fy-amber text-[9px] font-black text-black">
                !
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-xs font-bold text-fy-amber">
                You&apos;ve used {usedPercent}% of your credits
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                {userCredits} credits left. Your plan renews on Nov 17
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Link to={routes.PricingPageRoute.to}>
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-white px-3.5 text-xs font-semibold text-black hover:bg-zinc-200"
                  >
                    Upgrade
                  </Button>
                </Link>
                <Link to={routes.PricingPageRoute.to}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-white/15 bg-white/[0.04] px-3.5 text-xs font-medium text-white hover:bg-white/[0.1]"
                  >
                    Add credits
                  </Button>
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCreditPopup(false)}
              aria-label="Dismiss credit notice"
              className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-zinc-400 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : null}

        {/* ══════════════════════════════════════════════════════════════════════
          LEFT PANEL: GENJUTSU CREATION SIDEBAR (308px)
         ══════════════════════════════════════════════════════════════════════ */}
        <aside className="flex h-full w-[308px] shrink-0 flex-col border-r border-white/[0.07] bg-fy-ink">
          {/* Top Mode Tabs: Create Video | Edit Video | Motion Control (Higgsfield Tabs) */}
          <div className="shrink-0 border-b border-white/[0.07] px-3 pt-2">
            <Tabs
              variant="underline"
              value={sidebarTab}
              onValueChange={(value) => {
                const id = value as TopSidebarTab
                setSidebarTab(id)
                if (id === "edit-video") {
                  setMode("object-swap")
                  const lite = MOTION_MODELS.find((m) => m.id.includes("genjutsu-light"))
                  if (lite) setSelectedMotionModel(lite)
                } else if (id === "motion-control") {
                  setMode("motion-transfer")
                  setReferenceImages((prev) => prev.slice(0, 1))
                  const mc = MOTION_MODELS.find((m) => m.id.includes("genjutsu-light"))
                  if (mc) setSelectedMotionModel(mc)
                } else {
                  setMode("motion-transfer")
                  const gj = MOTION_MODELS.find((m) => m.id.includes("higgsfield/genjutsu/motion-transfer"))
                  if (gj) setSelectedMotionModel(gj)
                }
              }}
            >
              <TabsList className="w-full justify-between">
                <TabsTrigger value="create-video" className="text-xs">
                  Create Video
                </TabsTrigger>
                <TabsTrigger value="edit-video" className="text-xs">
                  Edit Video
                </TabsTrigger>
                <TabsTrigger value="motion-control" className="text-xs">
                  Motion Control
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Scrollable Left Form Controls */}
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
            <div className="flex items-start gap-2 rounded-xl border border-fy-accent/25 bg-fy-accent/[0.06] px-2.5 py-2 text-[11px] leading-snug text-zinc-200">
              <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-fy-accent" />
              <span>
                <strong className="text-fy-accent">Videos up to 2+ min supported:</strong>{" "}
                long uploads auto-split into 15s (Light) or 30s (Pro) passes and return one final video.
              </span>
            </div>
            {sidebarTab === "motion-control" ? (
              /* ══════════════════════════════════════════════════════════════════
                 MOTION CONTROL SIDEBAR CONTROLS (Screenshots 2 & 3)
                 ══════════════════════════════════════════════════════════════════ */
              <>
                {/* Motion Control Banner */}
                <div className="relative h-[92px] w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                  <MediaThumb src={studioClip("ember-dance")} alt="Motion Control" className="opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />

                  <button
                    type="button"
                    onClick={() => setStageTab("how-it-works")}
                    className="absolute top-2.5 right-2.5 inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md transition-colors hover:bg-black/80"
                  >
                    <BookOpen className="size-2.5" />
                    How it works
                  </button>

                  <div className="absolute bottom-2.5 left-3 flex flex-col">
                    <span className="font-display text-sm font-black tracking-wide text-fy-accent uppercase">
                      MOTION CONTROL
                    </span>
                    <span className="text-[10px] text-zinc-300">
                      Control motion with video references
                    </span>
                  </div>
                </div>

                {/* Slot 1: Add motion to copy */}
                <div
                  onDragOver={(e: DragEvent) => e.preventDefault()}
                  onDrop={(e: DragEvent) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files?.[0]
                    if (file) void handleDirectVideoDrop(file)
                  }}
                  className={cn(
                    "relative flex min-h-[128px] flex-col justify-center overflow-hidden rounded-xl border border-dashed transition-colors",
                    sourceVideo
                      ? "border-white/15 bg-fy-surface-2 p-2"
                      : "border-white/12 bg-fy-surface-2/80 hover:border-white/25 hover:bg-fy-surface-2"
                  )}
                >
                  {sourceVideo ? (
                    <div className="flex flex-col gap-2">
                      <div className="relative min-h-[160px] max-h-[220px] aspect-video w-full overflow-hidden rounded-lg bg-black/95 border border-white/10 group flex items-center justify-center">
                        <video
                          src={sourceVideo.url}
                          className="size-full object-contain"
                          controls
                          muted
                          playsInline
                          onLoadedMetadata={(e) => {
                            // Keep one decimal so a 15.4s upload is not mistaken for 15s.
                            const dur = Math.max(
                              4,
                              Math.round((e.currentTarget.duration || 10) * 10) / 10
                            )
                            setVideoDuration(dur)
                            setTrimRange({ start: 0, end: dur })
                            const w = e.currentTarget.videoWidth
                            const h = e.currentTarget.videoHeight
                            if (w && h) {
                              setSourceVideoAspect(formatVideoAspect(w, h))
                            }
                          }}
                        />
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 pointer-events-none">
                          <span className="rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30 backdrop-blur">
                            FULL FRAME
                          </span>
                          {sourceVideoAspect && (
                            <span className="rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300 border border-white/10 backdrop-blur">
                              {sourceVideoAspect}
                            </span>
                          )}
                        </div>
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setFullFrameMedia({
                                type: "video",
                                url: sourceVideo.url,
                                title: sourceVideo.name ?? "Motion_Copy.mp4",
                                aspectRatio: sourceVideoAspect ?? undefined,
                              })
                            }
                            aria-label="View Full Frame"
                            title="Expand to Full Frame"
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:bg-fy-accent hover:text-black border border-white/10 backdrop-blur transition-all"
                          >
                            <Maximize2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={removeSourceVideo}
                            aria-label="Remove motion video"
                            title="Remove video"
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:bg-red-500 hover:text-white border border-white/10 backdrop-blur transition-all"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 px-0.5">
                        <span className="truncate font-medium text-zinc-200 max-w-[170px]" title={sourceVideo.name}>
                          {sourceVideo.name ?? "Motion_Copy.mp4"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setFullFrameMedia({
                                type: "video",
                                url: sourceVideo.url,
                                title: sourceVideo.name ?? "Motion_Copy.mp4",
                                aspectRatio: sourceVideoAspect ?? undefined,
                              })
                            }
                            className="text-fy-accent hover:underline flex items-center gap-0.5 text-[10px] font-medium cursor-pointer"
                          >
                            <Maximize2 className="size-2.5" /> Inspect full
                          </button>
                          <span className="font-mono text-zinc-300">
                            {trimRange.start.toFixed(1)}s – {trimRange.end.toFixed(1)}s
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <AssetLibraryModal
                      items={libraryItems}
                      onUpload={handleAssetUpload}
                      accept={["video"]}
                      onSelect={applyVideoSelection}
                      trigger={
                        <button
                          type="button"
                          disabled={uploadingVideo}
                          className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 px-3 py-5 text-center"
                        >
                          <span className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300">
                            {uploadingVideo ? (
                              <Loader2 className="size-4 animate-spin text-fy-accent" />
                            ) : (
                              <VideoIcon className="size-4" />
                            )}
                          </span>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold text-zinc-200">
                              {uploadingVideo ? "Uploading video…" : "Add motion or long video"}
                            </span>
                            <span className="rounded-full border border-fy-accent/35 bg-fy-accent/10 px-2 py-0.5 text-[10px] font-bold text-fy-accent">
                              Long Video Ready • Auto Split
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              4s to multi-minute MP4 / MOV (up to 250 MB)
                            </span>
                          </div>
                        </button>
                      }
                    />
                  )}
                </div>

                {/* Slot 2: Add your character */}
                <div
                  onDragOver={(e: DragEvent) => e.preventDefault()}
                  onDrop={(e: DragEvent) => {
                    e.preventDefault()
                    const files = Array.from(e.dataTransfer.files ?? [])
                    if (files.length) void handleDirectImagesDrop(files)
                  }}
                  className={cn(
                    "relative flex min-h-[128px] flex-col justify-center overflow-hidden rounded-xl border border-dashed transition-colors",
                    referenceImages.length > 0
                      ? "border-white/15 bg-fy-surface-2 p-2"
                      : "border-white/12 bg-fy-surface-2/80 hover:border-white/25 hover:bg-fy-surface-2"
                  )}
                >
                  {referenceImages.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <div className="relative aspect-[4/3] max-h-[180px] w-full overflow-hidden rounded-lg bg-black/95 border border-white/10 group flex items-center justify-center">
                        <img
                          src={referenceImages[0].url}
                          alt={referenceImages[0].name ?? "Character"}
                          className="size-full object-contain"
                        />
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 pointer-events-none">
                          <span className="rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30 backdrop-blur">
                            FULL FRAME
                          </span>
                        </div>
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setFullFrameMedia({
                                type: "image",
                                url: referenceImages[0].url,
                                title: referenceImages[0].name ?? "Character Reference",
                              })
                            }
                            aria-label="View Full Frame"
                            title="Expand Full Photo"
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:bg-fy-accent hover:text-black border border-white/10 backdrop-blur transition-all"
                          >
                            <Maximize2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setReferenceImages([])}
                            aria-label="Remove character image"
                            title="Remove photo"
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:bg-red-500 hover:text-white border border-white/10 backdrop-blur transition-all"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 px-0.5">
                        <span className="truncate font-medium text-zinc-200 max-w-[170px]" title={referenceImages[0].name}>
                          {referenceImages[0].name ?? "Character Reference"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFullFrameMedia({
                              type: "image",
                              url: referenceImages[0].url,
                              title: referenceImages[0].name ?? "Character Reference",
                            })
                          }
                          className="text-fy-accent hover:underline flex items-center gap-0.5 text-[10px] font-medium cursor-pointer"
                        >
                          <Maximize2 className="size-2.5" /> Inspect full
                        </button>
                      </div>
                    </div>
                  ) : (
                    <AssetLibraryModal
                      items={libraryItems}
                      onUpload={handleAssetUpload}
                      accept={["image"]}
                      maxSelections={1}
                      onSelectMany={applyImageSelections}
                      trigger={
                        <button
                          type="button"
                          disabled={uploadingImage}
                          className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 px-3 py-5 text-center"
                        >
                          <span className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300">
                            {uploadingImage ? (
                              <Loader2 className="size-4 animate-spin text-fy-accent" />
                            ) : (
                              <User className="size-4" />
                            )}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-zinc-200">
                              {uploadingImage ? "Uploading character…" : "Add your character"}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              Image with visible face and body
                            </span>
                          </div>
                        </button>
                      }
                    />
                  )}
                </div>

                {/* Model Row */}
                <div className="flex flex-col gap-1 rounded-xl border border-white/[0.07] bg-fy-surface-2 p-2.5">
                  <span className="text-[10px] text-zinc-400">Model</span>
                  <button
                    type="button"
                    onClick={() => setIsModelModalOpen(true)}
                    className="group flex cursor-pointer items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white transition-colors group-hover:text-fy-accent">
                        {selectedMotionModel.name}
                      </span>
                      <span className="text-xs">⚡</span>
                    </div>
                    <ChevronRight className="size-3.5 text-zinc-400 transition-colors group-hover:text-white" />
                  </button>
                </div>

                {/* Quality Row */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-fy-surface-2 px-3 py-2.5">
                  <span className="text-xs font-medium text-zinc-200">Quality</span>
                  <div className="flex items-center gap-1.5">
                    {(["480p", "720p", "1080p"] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setResolution(q)}
                        className={cn(
                          "cursor-pointer rounded px-2 py-0.5 text-xs font-semibold transition-colors",
                          resolution === q
                            ? "bg-white/15 text-white"
                            : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video Length Row */}
                <div className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-fy-surface-2 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">
                      Video Length
                    </span>
                    <span className="font-mono text-xs font-semibold text-fy-accent">
                      {selectedDurationSec.toFixed(1)}s ({realtimeCost.billableSeconds}s billed)
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: "5s", sec: 5 },
                      { label: "10s", sec: 10 },
                      { label: "15s", sec: 15 },
                      { label: "Full", sec: videoDuration },
                    ].map((preset) => {
                      const active = Math.abs(selectedDurationSec - Math.min(videoDuration, preset.sec)) < 0.6
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyDurationPreset(preset.sec)}
                          className={cn(
                            "cursor-pointer rounded-md border py-1 text-[11px] font-semibold transition-colors",
                            active
                              ? "border-fy-accent/60 bg-fy-accent/15 text-fy-accent"
                              : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                          )}
                        >
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={Math.max(4, videoDuration)}
                    step={0.5}
                    value={Math.min(Math.max(4, videoDuration), selectedDurationSec)}
                    onChange={(e) => applyDurationPreset(Number(e.target.value))}
                    className="h-1 w-full accent-fy-accent"
                  />
                </div>

                {/* Scene Control Mode (Screenshot 3) */}
                <div className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-fy-surface-2 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">
                      Scene control mode
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={sceneControlEnabled}
                      onClick={() => setSceneControlEnabled((v) => !v)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                        sceneControlEnabled ? "bg-fy-accent" : "bg-white/15"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block size-3.5 transform rounded-full transition-transform",
                          sceneControlEnabled
                            ? "translate-x-4 bg-black"
                            : "translate-x-1 bg-zinc-300"
                        )}
                      />
                    </button>
                  </div>

                  {sceneControlEnabled ? (
                    <>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSceneControlMode("video")}
                          className={cn(
                            "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-all",
                            sceneControlMode === "video"
                              ? "border-fy-accent/50 bg-white/10 text-white"
                              : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white"
                          )}
                        >
                          <VideoIcon className="size-3.5" />
                          <span>Video</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSceneControlMode("image")}
                          className={cn(
                            "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-medium transition-all",
                            sceneControlMode === "image"
                              ? "border-fy-accent/50 bg-white/10 text-white"
                              : "border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white"
                          )}
                        >
                          <Box className="size-3.5" />
                          <span>Image</span>
                        </button>
                      </div>
                      <p className="text-[10px] leading-tight text-zinc-400">
                        Choose where the background should come from: the character
                        image or the motion video
                      </p>
                    </>
                  ) : null}
                </div>

                {/* Advanced Settings Drawer */}
                <div className="flex flex-col rounded-xl border border-white/[0.07] bg-fy-surface-2">
                  <button
                    type="button"
                    onClick={() => setAdvancedSettingsOpen((v) => !v)}
                    className="flex w-full cursor-pointer items-center justify-between p-2.5 text-xs font-medium text-zinc-200"
                  >
                    <span>Advanced settings</span>
                    <ChevronRight
                      className={cn(
                        "size-3.5 text-zinc-400 transition-transform",
                        advancedSettingsOpen && "rotate-90"
                      )}
                    />
                  </button>
                  {advancedSettingsOpen ? (
                    <div className="p-2.5 pt-0">
                      <textarea
                        rows={2}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Optional additional prompt details..."
                        className="w-full resize-none rounded-lg border border-white/10 bg-black/50 p-2 text-xs leading-relaxed text-white placeholder:text-zinc-500 focus:border-fy-accent/60 focus:outline-none"
                      />
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              /* ══════════════════════════════════════════════════════════════════
                 CREATE VIDEO & EDIT VIDEO CONTROLS (Screenshots 1, 4, 5)
                 ══════════════════════════════════════════════════════════════════ */
              <>
                {/* 1. Model Identity Banner Card */}
                <div className="relative h-[108px] w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                  <MediaThumb src={studioClip("snap-transition")} alt="FAYAA Genjutsu" className="opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

                  <button
                    type="button"
                    onClick={() => setIsModelModalOpen(true)}
                    className="absolute top-2.5 right-2.5 inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md transition-colors hover:bg-black/75"
                  >
                    <Pencil className="size-2.5" />
                    Change
                  </button>

                  <div className="absolute bottom-2.5 left-3 flex flex-col">
                    <span className="font-display text-sm font-black tracking-wide text-fy-accent uppercase">
                      {selectedMotionModel.name.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-zinc-300">
                      Motion transfer, object swap &amp; restyle
                    </span>
                  </div>
                </div>

                {/* 2. Segmented Mode Toggle: Motion transfer | Objects swap */}
                <Tabs
                  variant="segmented"
                  value={mode === "object-swap" ? "object-swap" : "motion-transfer"}
                  onValueChange={(val) => setMode(val as GenjutsuMode)}
                >
                  <TabsList fullWidth indicator={false} className="grid grid-cols-2">
                    <TabsTrigger
                      value="motion-transfer"
                      start={<Eye className="size-3.5" />}
                      className="text-xs"
                    >
                      Motion transfer
                    </TabsTrigger>
                    <TabsTrigger
                      value="object-swap"
                      start={<RefreshCw className="size-3.5" />}
                      className="text-xs"
                    >
                      Objects swap
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* 3. Style New Apply > Row */}
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStylePickerOpen((v) => !v)}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between rounded-xl border p-2 transition-colors",
                      selectedStyleId !== "none"
                        ? "border-fy-accent/40 bg-fy-accent/[0.06]"
                        : "border-white/[0.07] bg-fy-surface-2 hover:border-white/15"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-8 w-11 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-zinc-800">
                        <MediaThumb src={activeStyle.thumb} alt={activeStyle.name} mode="hover" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">
                          {selectedStyleId === "none" ? "Style" : activeStyle.name}
                        </span>
                        <span className="rounded bg-fy-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-fy-accent">
                          New
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-xs text-zinc-400">
                      {selectedStyleId === "none" ? "Apply" : "Change"}
                      <ChevronRight
                        className={cn(
                          "size-3.5 transition-transform",
                          stylePickerOpen && "rotate-90"
                        )}
                      />
                    </span>
                  </button>

                  {stylePickerOpen ? (
                    <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-fy-surface-2 p-2">
                      {STYLE_PRESETS.map((preset) => {
                        const active = preset.id === selectedStyleId
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setSelectedStyleId(preset.id)
                              if (preset.id !== "none") setMode("restyle")
                              setStylePickerOpen(false)
                            }}
                            className={cn(
                              "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border text-left transition-all",
                              active
                                ? "border-fy-accent ring-1 ring-fy-accent/40"
                                : "border-white/10 hover:border-white/25"
                            )}
                          >
                            <div className="relative h-14 w-full overflow-hidden bg-zinc-900">
                              <MediaThumb src={preset.thumb} alt={preset.name} mode="hover" />
                              {active ? (
                                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-fy-accent text-black">
                                  <Check className="size-2.5 stroke-[3]" />
                                </span>
                              ) : null}
                            </div>
                            <span className="truncate bg-fy-surface-3 px-2 py-1 text-[10px] font-medium text-zinc-200">
                              {preset.id === "none" ? "No Override" : preset.name}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>

                {/* 4. Reference Video Dropzone */}
                <div
                  onDragOver={(e: DragEvent) => e.preventDefault()}
                  onDrop={(e: DragEvent) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files?.[0]
                    if (file) void handleDirectVideoDrop(file)
                  }}
                  className={cn(
                    "relative flex min-h-[140px] flex-col justify-center overflow-hidden rounded-xl border border-dashed transition-colors",
                    sourceVideo
                      ? "border-white/15 bg-fy-surface-2 p-2"
                      : "border-white/12 bg-fy-surface-2/80 hover:border-white/25 hover:bg-fy-surface-2"
                  )}
                >
                  {sourceVideo ? (
                    <div className="flex flex-col gap-2">
                      <div className="relative min-h-[160px] max-h-[220px] aspect-video w-full overflow-hidden rounded-lg bg-black/95 border border-white/10 group flex items-center justify-center">
                        <video
                          src={sourceVideo.url}
                          className="size-full object-contain"
                          controls
                          muted
                          playsInline
                          onLoadedMetadata={(e) => {
                            // Keep one decimal so a 15.4s upload is not mistaken for 15s.
                            const dur = Math.max(
                              4,
                              Math.round((e.currentTarget.duration || 10) * 10) / 10
                            )
                            setVideoDuration(dur)
                            setTrimRange({ start: 0, end: dur })
                            const w = e.currentTarget.videoWidth
                            const h = e.currentTarget.videoHeight
                            if (w && h) {
                              setSourceVideoAspect(formatVideoAspect(w, h))
                            }
                          }}
                        />
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 pointer-events-none">
                          <span className="rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30 backdrop-blur">
                            FULL FRAME
                          </span>
                          {sourceVideoAspect && (
                            <span className="rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300 border border-white/10 backdrop-blur">
                              {sourceVideoAspect}
                            </span>
                          )}
                        </div>
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setFullFrameMedia({
                                type: "video",
                                url: sourceVideo.url,
                                title: sourceVideo.name ?? "Motion_Reference.mp4",
                                aspectRatio: sourceVideoAspect ?? undefined,
                              })
                            }
                            aria-label="View Full Frame"
                            title="Expand to Full Frame"
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:bg-fy-accent hover:text-black border border-white/10 backdrop-blur transition-all"
                          >
                            <Maximize2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={removeSourceVideo}
                            aria-label="Remove reference video"
                            title="Remove video"
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:bg-red-500 hover:text-white border border-white/10 backdrop-blur transition-all"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 rounded-lg bg-black/40 px-2 py-1.5">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="truncate font-medium text-zinc-200">
                            {sourceVideo.name ?? "Motion_Reference.mp4"}
                          </span>
                          <span className="font-mono text-fy-accent">
                            {trimRange.start.toFixed(1)}s – {trimRange.end.toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="range"
                            min={0}
                            max={Math.max(0, trimRange.end - 4)}
                            step={0.5}
                            value={trimRange.start}
                            onChange={(e) =>
                              setTrimRange((r) => ({
                                ...r,
                                start: Math.max(
                                  0,
                                  Math.min(Number(e.target.value), r.end - 4)
                                ),
                              }))
                            }
                            className="h-1 flex-1 accent-fy-accent"
                          />
                          <input
                            type="range"
                            min={Math.min(videoDuration, trimRange.start + 4)}
                            max={Math.max(4, videoDuration)}
                            step={0.5}
                            value={trimRange.end}
                            onChange={(e) =>
                              setTrimRange((r) => ({
                                ...r,
                                end: Math.max(
                                  Number(e.target.value),
                                  Math.min(videoDuration, r.start + 4)
                                ),
                              }))
                            }
                            className="h-1 flex-1 accent-fy-accent"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <AssetLibraryModal
                      items={libraryItems}
                      onUpload={handleAssetUpload}
                      accept={["video"]}
                      onSelect={applyVideoSelection}
                      trigger={
                        <button
                          type="button"
                          disabled={uploadingVideo}
                          className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 px-4 py-6 text-center"
                        >
                          <span className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300">
                            {uploadingVideo ? (
                              <Loader2 className="size-4 animate-spin text-fy-accent" />
                            ) : (
                              <VideoIcon className="size-4" />
                            )}
                          </span>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold text-zinc-200">
                              {uploadingVideo
                                ? "Uploading motion video…"
                                : sidebarTab === "edit-video"
                                  ? "Add a video (short or long) to edit"
                                  : "Add a short or long video to swap"}
                            </span>
                            <span className="rounded-full border border-fy-accent/35 bg-fy-accent/10 px-2 py-0.5 text-[10px] font-bold text-fy-accent">
                              Long Video Ready • Auto Split
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              4s to multi-minute MP4 / MOV (up to 250 MB)
                            </span>
                          </div>
                        </button>
                      }
                    />
                  )}
                </div>

                {/* 5. Reference Images Row (Screenshot 1: (+) button + thumbnails) */}
                <div
                  onDragOver={(e: DragEvent) => e.preventDefault()}
                  onDrop={(e: DragEvent) => {
                    e.preventDefault()
                    const files = Array.from(e.dataTransfer.files ?? [])
                    if (files.length) void handleDirectImagesDrop(files)
                  }}
                  className="flex flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-fy-surface-2 p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <AssetLibraryModal
                      items={libraryItems}
                      onUpload={handleAssetUpload}
                      accept={["image"]}
                      maxSelections={maxImagesForMode}
                      onSelectMany={applyImageSelections}
                      trigger={
                        <button
                          type="button"
                          disabled={uploadingImage}
                          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/[0.03] text-zinc-400 transition-colors hover:border-fy-accent/50 hover:bg-white/[0.06] hover:text-white"
                          title="Add reference image"
                        >
                          {uploadingImage ? (
                            <Loader2 className="size-4 animate-spin text-fy-accent" />
                          ) : (
                            <Plus className="size-4" />
                          )}
                        </button>
                      }
                    />

                    {referenceImages.length === 0 ? (
                      <div className="flex flex-1 items-center gap-2 pl-1">
                        <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-zinc-400">
                          <User className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-zinc-300">
                            Add character or product
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Up to {maxImagesForMode} {maxImagesForMode === 1 ? "image" : "images"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5">
                        {referenceImages.map((img, idx) => (
                          <div
                            key={img.id}
                            className="group relative size-12 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/95 flex items-center justify-center cursor-pointer"
                            onClick={() => injectImageToken(idx + 1)}
                            title={`Click to insert @Image${idx + 1}`}
                          >
                            <img
                              src={img.url}
                              alt={img.name ?? `Reference ${idx + 1}`}
                              className="size-full object-contain"
                            />
                            <span className="pointer-events-none absolute bottom-0.5 left-0.5 rounded bg-black/85 px-1 py-0.2 font-mono text-[8px] font-semibold text-fy-accent">
                              Ref {idx + 1}
                            </span>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFullFrameMedia({
                                    type: "image",
                                    url: img.url,
                                    title: img.name ?? `Reference Photo ${idx + 1}`,
                                  })
                                }}
                                title="Inspect full frame"
                                className="flex size-5 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white hover:bg-fy-accent hover:text-black transition-colors"
                              >
                                <Maximize2 className="size-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReferenceImages((prev) =>
                                    prev.filter((item) => item.id !== img.id)
                                  )
                                }}
                                title="Remove reference"
                                className="flex size-5 cursor-pointer items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:bg-red-500 hover:text-white transition-colors"
                              >
                                <X className="size-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Prompt Toggle Row */}
                <div className="flex flex-col rounded-xl border border-white/[0.07] bg-fy-surface-2 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">
                      Prompt
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={promptEnabled}
                      onClick={() => setPromptEnabled((v) => !v)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                        promptEnabled ? "bg-fy-accent" : "bg-white/15"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block size-3.5 transform rounded-full transition-transform",
                          promptEnabled
                            ? "translate-x-4 bg-black"
                            : "translate-x-1 bg-zinc-300"
                        )}
                      />
                    </button>
                  </div>

                  {promptEnabled ? (
                    <div className="relative mt-2.5 flex flex-col gap-2">
                      <textarea
                        ref={promptTextareaRef}
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe how to recast the video's motion using @Image1..."
                        className="w-full resize-none rounded-lg border border-white/10 bg-black/50 p-2 text-xs leading-relaxed text-white placeholder:text-zinc-500 focus:border-fy-accent/60 focus:outline-none"
                      />

                      {referenceImages.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {referenceImages.map((img, i) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => injectImageToken(i + 1)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-fy-accent/30 bg-fy-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-fy-accent hover:bg-fy-accent/20"
                            >
                              @Image{i + 1}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* 7. Model Selector Row */}
                <div className="flex flex-col gap-1 rounded-xl border border-white/[0.07] bg-fy-surface-2 p-2.5">
                  <span className="text-[10px] text-zinc-400">Model</span>
                  <button
                    type="button"
                    onClick={() => setIsModelModalOpen(true)}
                    className="group flex cursor-pointer items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white transition-colors group-hover:text-fy-accent">
                        {selectedMotionModel.name}
                      </span>
                      <span className="rounded bg-fy-accent px-1 py-0.2 text-[9px] font-bold text-black">
                        New
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-zinc-400 transition-colors group-hover:text-white" />
                  </button>
                </div>

                {/* 8. Quality Row */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-fy-surface-2 px-3 py-2.5">
                  <span className="text-xs font-medium text-zinc-200">Quality</span>
                  <div className="flex items-center gap-1.5">
                    {(["480p", "720p", "1080p"] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setResolution(q)}
                        className={cn(
                          "cursor-pointer rounded px-2 py-0.5 text-xs font-semibold transition-colors",
                          resolution === q
                            ? "bg-white/15 text-white"
                            : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8b. Video Length Selector Row */}
                <div className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-fy-surface-2 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">
                      Video Length
                    </span>
                    <span className="font-mono text-xs font-semibold text-fy-accent">
                      {selectedDurationSec.toFixed(1)}s ({realtimeCost.billableSeconds}s billed)
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: "5s", sec: 5 },
                      { label: "10s", sec: 10 },
                      { label: "15s", sec: 15 },
                      { label: "Full", sec: videoDuration },
                    ].map((preset) => {
                      const active = Math.abs(selectedDurationSec - Math.min(videoDuration, preset.sec)) < 0.6
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyDurationPreset(preset.sec)}
                          className={cn(
                            "cursor-pointer rounded-md border py-1 text-[11px] font-semibold transition-colors",
                            active
                              ? "border-fy-accent/60 bg-fy-accent/15 text-fy-accent"
                              : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                          )}
                        >
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={Math.max(4, videoDuration)}
                    step={0.5}
                    value={Math.min(Math.max(4, videoDuration), selectedDurationSec)}
                    onChange={(e) => applyDurationPreset(Number(e.target.value))}
                    className="h-1 w-full accent-fy-accent"
                  />
                </div>
              </>
            )}

            {/* Validation / error banner */}
            {activeError ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-[11px] text-red-200"
              >
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-400" />
                <span className="flex-1 leading-snug">{activeError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setLocalError(null)
                  }}
                  className="text-red-300 hover:text-white"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Sticky Bottom Real-Time Cost Breakdown + Generate Button */}
          <div className="shrink-0 border-t border-white/[0.07] bg-fy-ink p-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-fy-surface-2 px-2.5 py-1.5 text-[11px]">
              <div className="flex flex-col min-w-0">
                <span className="truncate font-semibold text-zinc-200">
                  {selectedMotionModel.name} • {resolution}
                </span>
                <span className="font-mono text-[10px] text-zinc-400">
                  ${realtimeCost.usdPerSec.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}/s × {realtimeCost.billableSeconds}s
                  {realtimeCost.segmentCount > 1 ? ` (${realtimeCost.segmentCount} clips)` : ""}
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-mono text-xs font-bold text-fy-accent">
                  {realtimeCost.credits} cr (~${realtimeCost.totalUsd.toFixed(2)})
                </span>
                <span className="text-[9px] text-zinc-500">
                  {realtimeCost.segmentCount > 1 ? "Auto-split & stitch" : "Real-time estimate"}
                </span>
              </div>
            </div>

            {realtimeCost.segmentCount > 1 ? (
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/[0.08] bg-fy-surface-2 px-2.5 py-1.5 text-[11px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={previewFirst}
                  onChange={(e) => setPreviewFirst(e.target.checked)}
                  className="mt-0.5 accent-fy-accent"
                />
                <span>
                  <strong className="text-zinc-100">Preview the first piece first</strong>
                  <span className="block text-[10px] text-zinc-500">
                    Pay{" "}
                    {segmentCredits(
                      realtimeCost.segments[0]!.durationSec,
                      resolution,
                      selectedMotionModel.id === "higgsfield/genjutsu/motion-transfer/v1.0"
                        ? "pro"
                        : "light"
                    )}{" "}
                    cr now, then approve the rest or keep just the preview.
                  </span>
                </span>
              </label>
            ) : null}

            <Button
              size="lg"
              onClick={() => void handleGenerate()}
              disabled={submitting || generating || uploadingVideo || uploadingImage}
              className={cn(
                "h-11 w-full rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                canSubmit
                  ? "bg-fy-accent text-black shadow-[0_8px_28px_rgba(255,91,31,0.28)] hover:bg-fy-accent-hover"
                  : "bg-fy-accent-700/60 text-black/80 hover:bg-fy-accent-700/80"
              )}
            >
              {submitting || generating ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {submitting ? "Synthesizing…" : "Processing…"}
                </span>
              ) : (
                <>
                  <span>Generate</span>
                  <Sparkles className="size-3.5 fill-black" />
                  <span>
                    {realtimeCost.credits} cr (~${realtimeCost.totalUsd.toFixed(2)})
                  </span>
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════════════════
          RIGHT MAIN STAGE: TOP SUB-NAV + HERO + MASONRY DISCOVERY / HISTORY
         ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-fy-ink">
          {/* Top Stage Navigation Bar: History | Motion Library | Styles New | How it works (Higgsfield Tabs) */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.07] px-6">
            <Tabs
              variant="pill"
              value={
                sidebarTab === "motion-control" &&
                  stageTab !== "history" &&
                  stageTab !== "how-it-works"
                  ? "motion-library"
                  : stageTab
              }
              onValueChange={(val) => setStageTab(val as StageTab)}
            >
              {sidebarTab === "motion-control" ? (
                <TabsList>
                  <TabsTrigger
                    value="history"
                    start={<FolderOpen className="size-3.5" />}
                    end={
                      genjutsuRuns.length > 0 ? (
                        <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-zinc-300">
                          {genjutsuRuns.length}
                        </span>
                      ) : undefined
                    }
                  >
                    History
                  </TabsTrigger>
                  <TabsTrigger
                    value="motion-library"
                    start={<Globe className="size-3.5" />}
                  >
                    Motion Library
                  </TabsTrigger>
                  <TabsTrigger
                    value="how-it-works"
                    start={<BookOpen className="size-3.5" />}
                  >
                    How it works
                  </TabsTrigger>
                </TabsList>
              ) : (
                <TabsList>
                  <TabsTrigger
                    value="history"
                    start={<FolderOpen className="size-3.5" />}
                    end={
                      genjutsuRuns.length > 0 ? (
                        <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] text-zinc-300">
                          {genjutsuRuns.length}
                        </span>
                      ) : undefined
                    }
                  >
                    History
                  </TabsTrigger>
                  <TabsTrigger
                    value="motion-library"
                    start={<Globe className="size-3.5" />}
                  >
                    Motion Library
                  </TabsTrigger>
                  <TabsTrigger
                    value="styles"
                    start={<Wand2 className="size-3.5" />}
                    end={
                      <span className="rounded bg-fy-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-fy-accent">
                        New
                      </span>
                    }
                  >
                    Styles
                  </TabsTrigger>
                  <TabsTrigger
                    value="how-it-works"
                    start={<BookOpen className="size-3.5" />}
                  >
                    How it works
                  </TabsTrigger>
                </TabsList>
              )}
            </Tabs>

            {/* Active In-Flight Telemetry Pill */}
            {activeGeneratingRun ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-fy-accent/30 bg-fy-accent/10 px-3 py-1 text-xs font-medium text-fy-accent">
                <Loader2 className="size-3.5 animate-spin" />
                <span>
                  Status: Processing Video •{" "}
                  {String(Math.floor(elapsedSec / 60)).padStart(2, "0")}:
                  {String(elapsedSec % 60).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  disabled={canceling}
                  onClick={onCancelGenerating}
                  aria-label="Cancel generation"
                  className="ml-1 inline-flex cursor-pointer items-center rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-zinc-200 transition-colors hover:bg-red-500/80 hover:text-white disabled:opacity-50"
                >
                  {canceling ? "Canceling…" : "Cancel"}
                </button>
              </div>
            ) : null}
          </div>

          {/* Scrollable Stage Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-7">
              {/* ── MOTION CONTROL STAGE (Screenshots 2 & 3) ─────────────── */}
              {sidebarTab === "motion-control" &&
                stageTab !== "history" &&
                stageTab !== "how-it-works" ? (
                <div className="flex flex-col gap-8">
                  {/* Hero Banner: RECREATE ANY [MOTION] WITH YOUR IMAGE */}
                  <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-fy-surface-1 p-6 lg:flex-row lg:items-center">
                    <div className="flex max-w-[500px] flex-col gap-2.5">
                      <h1 className="font-display text-2xl font-black tracking-tight text-white uppercase sm:text-[32px] leading-tight">
                        RECREATE ANY{" "}
                        <span className="text-fy-accent font-mono">
                          [MOTION]
                        </span>{" "}
                        WITH YOUR IMAGE
                      </h1>
                      <p className="text-sm leading-relaxed text-zinc-400">
                        Copy motion from any video and place your character into
                        the same movement
                      </p>
                    </div>

                    {/* Fanned 3 Polaroid Character Images */}
                    <div className="relative flex items-center justify-center pr-4 py-3 shrink-0">
                      <div className="relative h-44 w-32 -rotate-12 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl transition-transform hover:scale-105 hover:z-20">
                        <MediaThumb src={studioClip("trend-dance")} alt="Motion Character 1" />
                      </div>
                      <div className="relative h-48 w-36 -ml-8 -rotate-2 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl z-10 transition-transform hover:scale-105 hover:z-20">
                        <MediaThumb src={studioClip("ember-dance")} alt="Motion Character 2" />
                      </div>
                      <div className="relative h-44 w-32 -ml-8 rotate-12 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl transition-transform hover:scale-105 hover:z-20">
                        <MediaThumb src={studioClip("gym-spin")} alt="Motion Character 3" />
                      </div>
                    </div>
                  </div>

                  {/* Section: Start by copying motion from library */}
                  <div className="flex flex-col gap-4">
                    <h2 className="text-sm font-bold text-white tracking-wide">
                      Start by copying motion from library
                    </h2>

                    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
                      {MOTION_CONTROL_SAMPLES.map((sample) => (
                        <MotionLibraryVerticalCard
                          key={sample.id}
                          sample={sample}
                          isSelected={sourceVideo?.id === sample.id}
                          onSelect={() => {
                            setSourceVideo({
                              id: sample.id,
                              url: sample.videoUrl,
                              role: "source",
                              kind: "video",
                              name: sample.title,
                            })
                            setVideoDuration(10)
                            setTrimRange({ start: 0, end: 10 })
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ── TAB 1: MOTION LIBRARY (Default View from Screenshot) ──────── */}
              {sidebarTab !== "motion-control" && stageTab === "motion-library" ? (
                <>
                  {/* Hero: copy on the left, a fan of live FAYAA renders on the right */}
                  <div className="fy-grain relative isolate flex flex-col gap-6 overflow-hidden rounded-fy-xl border border-white/[0.07] bg-[radial-gradient(90%_120%_at_0%_0%,rgb(255_91_31/0.16),transparent_55%),radial-gradient(70%_100%_at_100%_100%,rgb(255_46_126/0.10),transparent_60%)] bg-fy-surface-1 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex max-w-[520px] flex-col gap-3">
                      <span className="fy-eyebrow text-fy-accent-300">Genjutsu motion library</span>
                      <h1 className="fy-display text-[34px] text-white sm:text-[44px]">
                        One video in.
                        <span className="fy-text-heat block">Many viral posts out.</span>
                      </h1>
                      <p className="max-w-[440px] text-sm leading-relaxed text-fy-muted">
                        Pick a clip below to load its motion, then recast it with your
                        character, swap in your product, or redraw it in a new style.
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {[
                          { label: "Motion transfer", tab: "create-video" as const, mode: "motion-transfer" as const },
                          { label: "Product swap", tab: "edit-video" as const, mode: "object-swap" as const },
                          { label: "Restyle", tab: "create-video" as const, mode: "restyle" as const },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => {
                              setSidebarTab(chip.tab)
                              setMode(chip.mode)
                              if (chip.mode === "restyle") setStageTab("styles")
                            }}
                            className={cn(
                              "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                              mode === chip.mode
                                ? "border-fy-accent/60 bg-fy-accent/15 text-fy-accent-200"
                                : "border-white/12 bg-white/[0.04] text-fy-muted hover:border-white/25 hover:text-white"
                            )}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative hidden h-[220px] w-[300px] shrink-0 items-center justify-center sm:flex" aria-hidden>
                      <div className="absolute left-0 h-[190px] w-[108px] -rotate-[8deg] overflow-hidden rounded-fy-md border border-white/15 shadow-2xl">
                        <MediaThumb src={studioClip("trend-dance")} />
                      </div>
                      <div className="relative z-10 h-[220px] w-[124px] overflow-hidden rounded-fy-lg border border-white/25 shadow-[0_24px_60px_-12px_rgb(255_91_31/0.45)]">
                        <MediaThumb src={studioClip("grwm-anime")} />
                      </div>
                      <div className="absolute right-0 h-[190px] w-[108px] rotate-[8deg] overflow-hidden rounded-fy-md border border-white/15 shadow-2xl">
                        <MediaThumb src={studioClip("sneaker-hook")} />
                      </div>
                    </div>
                  </div>

                  {/* Category chips */}
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-white">Start from a clip</h2>
                    <div className="flex gap-1.5 overflow-x-auto rounded-full border border-white/[0.07] bg-fy-surface-1 p-1">
                      {(
                        [
                          { id: "all", label: "All" },
                          { id: "trends", label: "Trends" },
                          { id: "products", label: "Products" },
                          { id: "restyle", label: "Restyle" },
                        ] as const
                      ).map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setFeedFilter(chip.id)}
                          className={cn(
                            "cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                            feedFilter === chip.id
                              ? "bg-white text-fy-ink"
                              : "text-fy-muted hover:text-white"
                          )}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vertical clip grid: every tile is a live FAYAA render */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {filteredMasonry.map((item) => (
                      <MasonryVideoCard
                        key={item.id}
                        item={item}
                        onRemix={() => loadExampleIntoWorkspace(item)}
                      />
                    ))}
                  </div>
                </>
              ) : null}

              {/* ── TAB 2: STYLES GALLERY ────────────────────────────────────── */}
              {stageTab === "styles" ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="inline-flex items-center gap-2">
                        <IconTile as={Wand2} gradient="green" />
                        <span className="text-[11px] font-bold tracking-widest text-fy-accent uppercase">
                          NEW IN GENJUTSU
                        </span>
                      </div>
                      <h2 className="mt-1 font-display text-2xl font-black text-white uppercase">
                        RESTYLE PRESETS & WORKFLOW TEMPLATES
                      </h2>
                      <p className="mt-1 text-xs text-zinc-400">
                        Pick a visual preset below to redraw your entire reference
                        video while keeping camera paths and choreography intact.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {STYLE_PRESETS.map((preset) => {
                      const isSelected = preset.id === selectedStyleId
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            setSelectedStyleId(preset.id)
                            if (preset.id !== "none") setMode("restyle")
                          }}
                          className={cn(
                            "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-fy-surface-1 transition-all",
                            isSelected
                              ? "border-fy-accent shadow-[0_0_28px_rgba(255,91,31,0.16)]"
                              : "border-white/10 hover:border-white/25"
                          )}
                        >
                          <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                            <MediaThumb src={preset.thumb} alt={preset.name} mode="hover" className="transition-transform duration-500 ease-fy-out group-hover:scale-[1.04]" />
                            {preset.badge ? (
                              <span className="absolute top-3 left-3 rounded-md bg-fy-accent px-2 py-0.5 text-[10px] font-bold text-black">
                                {preset.badge}
                              </span>
                            ) : null}
                            {isSelected ? (
                              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-fy-accent px-2.5 py-0.5 text-[10px] font-bold text-black">
                                <Check className="size-3 stroke-[3]" />
                                Active
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-1 flex-col justify-between p-4">
                            <div>
                              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                                {preset.category}
                              </span>
                              <h3 className="mt-0.5 text-sm font-bold text-white">
                                {preset.name}
                              </h3>
                              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                                {preset.tagline}
                              </p>
                            </div>
                            <div className="mt-4">
                              <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                className={cn(
                                  "w-full rounded-lg text-xs font-semibold",
                                  isSelected
                                    ? "bg-fy-accent text-black hover:bg-fy-accent-hover"
                                    : "border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
                                )}
                              >
                                {isSelected
                                  ? "Selected in Sidebar"
                                  : "Apply Style"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Official Higgsfield ExamplePresets Triptych Templates */}
                  <div className="mt-4 flex flex-col gap-3">
                    <h3 className="text-sm font-bold tracking-wider text-zinc-300 uppercase">
                      Ready-to-Run Genjutsu Templates
                    </h3>
                    <ExamplePresets
                      items={TEMPLATES}
                      onUse={loadTemplateIntoWorkspace}
                      tryLabel="Load in Sidebar"
                      className="max-w-none"
                    />
                  </div>
                </div>
              ) : null}

              {/* ── TAB 3: HISTORY (User's Real Genjutsu Generations) ─────────── */}
              {stageTab === "history" ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-xl font-black text-white uppercase">
                        YOUR GENJUTSU GENERATIONS
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Every completed video is saved to your account and can be
                        opened, downloaded, or remixed.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStageTab("motion-library")}
                      className="rounded-lg border-white/15 bg-white/[0.04] text-xs text-zinc-200 hover:bg-white/10"
                    >
                      Browse Motion Library
                    </Button>
                  </div>

                  {genjutsuRuns.length === 0 ? (
                    <ScreenEmptyState
                      images={EMPTY_HISTORY_IMAGES}
                      title="No Genjutsu generations yet"
                      description="Upload a motion video + character reference in the left sidebar, or remix any community video to start rendering."
                      action={
                        <Button
                          onClick={() => setStageTab("motion-library")}
                          className="rounded-xl bg-fy-accent px-5 text-xs font-bold text-black hover:bg-fy-accent-hover"
                        >
                          Explore Motion Library
                        </Button>
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {genjutsuRuns.map((run) => {
                        const videoUrl = run.urls?.[0]
                        const isPublicRun =
                          publicOverrides[run.id] ?? Boolean(run.isPublic)
                        const tileState =
                          run.status === "completed"
                            ? "ready"
                            : run.status === "failed"
                              ? "failed"
                              : "generating"
                        return (
                          <GenerationTile
                            key={run.id}
                            state={tileState}
                            generatingLabel={
                              run.longVideoProgressLabel ??
                              `Processing Genjutsu (${String(Math.floor(elapsedSec / 60)).padStart(2, "0")}:${String(elapsedSec % 60).padStart(2, "0")})`
                            }
                            generatingDetail={
                              run.pieces && run.pieces.length > 1 ? (
                                <LongVideoPieces pieces={run.pieces} />
                              ) : undefined
                            }
                            failureLabel={
                              run.error ??
                              "Generation did not return a playable video."
                            }
                            src={videoUrl}
                            title={run.prompt}
                            generation={
                              videoUrl
                                ? {
                                  src: videoUrl,
                                  mediaType: "video",
                                  prompt: run.prompt,
                                  model: genjutsu.label,
                                  createdAt: run.createdAt,
                                  settings: run.settings,
                                }
                                : undefined
                            }
                            media={
                              videoUrl ? (
                                <div className="relative size-full flex items-center justify-center bg-black">
                                  <video
                                    src={videoUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="size-full object-contain"
                                  />
                                  {isPublicRun && (
                                    <span className="pointer-events-none absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-fy-accent px-2 py-0.5 text-[10px] font-black text-black uppercase shadow">
                                      <Globe className="size-3" /> Public
                                    </span>
                                  )}
                                  {watermarkEnabled && (
                                    <FayaaWatermark size="default" position="bottom-right" />
                                  )}
                                </div>
                              ) : undefined
                            }
                            actions={
                              videoUrl
                                ? [
                                  {
                                    id: "remix",
                                    label: "Remix prompt",
                                    icon: RotateCcw,
                                    onSelect: () => {
                                      setPrompt(run.prompt)
                                      setPromptEnabled(true)
                                    },
                                  },
                                  ...(canPublishPublic &&
                                  run.taskId &&
                                  run.status === "completed"
                                    ? [
                                        {
                                          id: "toggle-public",
                                          label: isPublicRun
                                            ? "Make Private"
                                            : "Publish to Showcase",
                                          icon: Globe,
                                          onSelect: () => {
                                            void handleToggleRunPublic(run)
                                          },
                                        },
                                      ]
                                    : []),
                                  {
                                    id: "download",
                                    label: "Download MP4",
                                    icon: Download,
                                  },
                                ]
                                : undefined
                            }
                            className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-fy-surface-1"
                          >
                            {run.awaitingApproval ? (
                              <div className="absolute inset-x-3 bottom-3 z-[3] flex flex-col gap-2 rounded-xl bg-black/75 p-2.5 backdrop-blur-md">
                                <span className="text-[11px] font-semibold text-zinc-100">
                                  Preview of piece 1 is ready. Happy with it?
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onApprovePreview?.(run.id)}
                                    className="flex-1 rounded-lg bg-fy-accent px-2 py-1.5 text-[11px] font-bold text-black hover:bg-fy-accent-hover"
                                  >
                                    Render the rest ({run.awaitingApproval.remainingCredits} cr)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onKeepPreview?.(run.id)}
                                    className="rounded-lg border border-white/20 px-2 py-1.5 text-[11px] font-semibold text-zinc-200 hover:bg-white/10"
                                  >
                                    Keep preview only
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </GenerationTile>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {/* ── TAB 4: HOW IT WORKS GUIDE ─────────────────────────────────── */}
              {stageTab === "how-it-works" ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-fy-surface-1 p-6 md:flex-row md:items-center">
                    <div>
                      <span className="text-[11px] font-bold tracking-widest text-fy-accent uppercase">
                        WORKFLOW ARCHITECTURE
                      </span>
                      <h2 className="mt-1 font-display text-2xl font-black text-white uppercase">
                        HOW FAYAA GENJUTSU WORKS
                      </h2>
                      <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
                        Genjutsu extracts exact skeletal choreography, camera
                        trajectories, and scene timing from your source video and
                        re-renders them with your uploaded character, product, or
                        visual style.
                      </p>
                    </div>
                    <HeroComposition
                      images={EMPTY_HISTORY_IMAGES}
                      alt="Genjutsu 3-step showcase"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-fy-surface-1 p-5">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-fy-accent/15 font-mono text-xs font-bold text-fy-accent">
                        01
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        1. Upload Motion Video (4s or longer)
                      </h3>
                      <p className="text-xs leading-relaxed text-zinc-400">
                        Drop any MP4, MOV, or WebM clip into the first slot. Use
                        the inline frame trimmer handles to isolate the exact
                        choreography segment you want to transfer.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-fy-surface-1 p-5">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-fy-accent/15 font-mono text-xs font-bold text-fy-accent">
                        02
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        2. Add Characters, Products, or Clothes
                      </h3>
                      <p className="text-xs leading-relaxed text-zinc-400">
                        Upload up to 4 reference images in Motion Transfer or
                        Objects Swap mode (or 1 in Restyle). Click any thumbnail
                        badge <code className="text-fy-accent">[Ref 1]</code> to
                        inject <code className="text-fy-accent">@Image1</code>{" "}
                        into your prompt.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-fy-surface-1 p-5">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-fy-accent/15 font-mono text-xs font-bold text-fy-accent">
                        03
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        3. Pick a Style or Generate Directly
                      </h3>
                      <p className="text-xs leading-relaxed text-zinc-400">
                        Apply a{" "}
                        <strong className="text-white">Restyle</strong> preset
                        (Anime, Claymation, Knitted Yarn, 3D Animation) or keep
                        photorealistic fidelity, then hit{" "}
                        <strong className="text-fy-accent">Generate</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Floating help button matching Screenshot 3 */}
      <button
        type="button"
        onClick={() => setStageTab("how-it-works")}
        className="fixed bottom-4 right-4 z-30 flex size-7 items-center justify-center rounded-full border border-white/10 bg-fy-surface-2 text-zinc-400 hover:text-white hover:bg-white/10 shadow-lg cursor-pointer transition-colors"
        title="Need help? View how it works"
      >
        <span className="text-xs font-semibold">?</span>
      </button>

      {/* Model Selector Modal matching Screenshots 4 & 5 */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        models={MOTION_MODELS}
        selectedModel={selectedMotionModel}
        onSelectModel={(m) => setSelectedMotionModel(m)}
      />

      {/* Full-Frame Uncropped Media Preview Modal */}
      {fullFrameMedia && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={fullFrameMedia.title}
          onClick={() => setFullFrameMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 md:p-8 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl bg-[#0E0E12] border border-white/15 overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-fy-surface-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  FULL FRAME • UNCROPPED
                </span>
                <span className="truncate text-xs font-semibold text-white max-w-[240px] sm:max-w-md">
                  {fullFrameMedia.title}
                </span>
                {fullFrameMedia.aspectRatio && (
                  <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono text-zinc-300 border border-white/10 hidden sm:inline-block">
                    {fullFrameMedia.aspectRatio}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleWatermark}
                  title="Toggle watermark on/off"
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer select-none",
                    watermarkEnabled
                      ? "border-fy-accent/40 bg-fy-accent/10 text-white"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      watermarkEnabled ? "bg-fy-accent shadow-[0_0_6px_#ff5b1f]" : "bg-zinc-600"
                    )}
                  />
                  <span>Watermark: {watermarkEnabled ? "ON" : "OFF"}</span>
                </button>
                <a
                  href={fullFrameMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Eye className="size-3" /> Open in tab
                </a>
                <button
                  type="button"
                  onClick={() => setFullFrameMedia(null)}
                  aria-label="Close full frame preview"
                  className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Uncropped Media Viewport */}
            <div className="relative flex flex-1 items-center justify-center min-h-[300px] max-h-[76vh] overflow-hidden bg-black/95 p-3 sm:p-6 group">
              <div className="relative flex items-center justify-center max-h-[70vh] max-w-full">
                {fullFrameMedia.type === "video" ? (
                  <video
                    src={fullFrameMedia.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl"
                  />
                ) : (
                  <img
                    src={fullFrameMedia.url}
                    alt={fullFrameMedia.title}
                    className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl"
                  />
                )}
                {watermarkEnabled && (
                  <FayaaWatermark
                    size="hero"
                    position="bottom-right"
                    avoidControls={fullFrameMedia.type === "video"}
                  />
                )}
              </div>
            </div>

            {/* Modal Footer: Informative Self-Explanatory Context */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-white/10 bg-fy-surface-1 px-4 py-2.5 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-fy-accent" />
                Preserved 100% native aspect ratio — no borders, head, or feet are cropped during AI transfer.
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Press ESC or click outside to close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Motion library tile: a live 9:16 FAYAA render with a Remix action ──── */

const CATEGORY_LABEL: Record<CommunityExample["category"], string> = {
  trends: "Trend",
  products: "Product swap",
  restyle: "Restyle",
}

function MasonryVideoCard({
  item,
  onRemix,
}: {
  item: CommunityExample
  onRemix: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Remix ${item.title}`}
      onClick={onRemix}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onRemix()
        }
      }}
      className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-fy-lg border border-white/[0.07] bg-fy-surface-2 transition-all duration-300 ease-fy-out hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[0_24px_50px_-20px_rgb(0_0_0/0.9)] focus-visible:ring-2 focus-visible:ring-fy-accent/70 focus-visible:outline-none"
    >
      <MediaThumb
        src={item.videoUrl}
        alt={item.title}
        className="transition-transform duration-700 ease-fy-out group-hover:scale-[1.04]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />

      <span className="absolute top-2.5 left-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md">
        {CATEGORY_LABEL[item.category]}
      </span>

      <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
          <p className="truncate text-[11px] text-white/60">Made with FAYAA</p>
        </div>
        <span className="inline-flex shrink-0 translate-y-1 items-center gap-1 rounded-full bg-fy-accent px-2.5 py-1 text-[11px] font-bold text-fy-on-accent opacity-0 transition-all duration-300 ease-fy-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <Sparkles className="size-3" />
          Remix
        </span>
      </div>
    </div>
  )
}

function MotionLibraryVerticalCard({
  sample,
  isSelected,
  onSelect,
}: {
  sample: MotionControlSample
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "group relative flex aspect-[9/16] cursor-pointer flex-col overflow-hidden rounded-fy-lg border bg-fy-surface-2 text-left transition-all duration-300 ease-fy-out",
        isSelected
          ? "border-fy-accent ring-2 ring-fy-accent/40 shadow-[0_0_24px_rgba(255,91,31,0.25)]"
          : "border-white/[0.08] hover:-translate-y-0.5 hover:border-white/25 hover:shadow-xl"
      )}
    >
      <MediaThumb
        src={sample.videoUrl}
        alt={sample.title}
        className="transition-transform duration-700 ease-fy-out group-hover:scale-[1.04]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

      {isSelected ? (
        <span className="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-fy-accent text-fy-on-accent">
          <Check className="size-3 stroke-[3]" />
        </span>
      ) : null}

      <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex flex-col gap-0.5">
        <span className="truncate text-xs font-semibold text-white">{sample.title}</span>
        <span className="truncate text-[10px] text-white/60">
          {isSelected ? "Loaded as motion" : "Use this motion"}
        </span>
      </div>
    </button>
  )
}
