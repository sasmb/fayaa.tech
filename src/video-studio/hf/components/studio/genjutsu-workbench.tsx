"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { DragEvent } from "react"
import { Link } from "react-router"
import {
  AlertCircle,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  Clock,
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
  TrendingUp,
  User,
  Video as VideoIcon,
  Wand2,
  X,
} from "lucide-react"

import { logout, useAuth } from "wasp/client/auth"
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
import { MOTION_MODELS, calculateRealtimeVideoCost } from "../../../templates"
import type { MotionModel, VideoQuality } from "../../../types"

import { AssetLibraryModal } from "./asset-library"
import { GenerationTile } from "./generation-card"
import { HeroComposition } from "./hero-composition"
import { IconTile } from "./icon-tile"
import { ScreenEmptyState } from "./screen-empty-state"
import { ExamplePresets, TEMPLATES, type TemplateItem } from "./template-picker"

/* ── Types & Presets ──────────────────────────────────────────────────────── */

type TopSidebarTab = "create-video" | "edit-video" | "motion-control"
type GenjutsuMode = "motion-transfer" | "object-swap" | "restyle" | "lite"
type StageTab = "history" | "motion-library" | "styles" | "how-it-works"
type FeedFilter = "fayaa" | "trending" | "new"

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
    thumb:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    beforeThumb:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
  {
    id: "anime-cel",
    name: "Cel-Shaded Anime",
    tagline: "Crisp hand-drawn ink lines & vibrant sakuga shading",
    category: "Illustration",
    promptSuffix:
      "Style: cel-shaded 2D anime aesthetic, crisp ink linework, vibrant Studio Trigger palette, expressive cel lighting.",
    thumb:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80",
    beforeThumb:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    badge: "Popular",
  },
  {
    id: "claymation",
    name: "Stop-Motion Claymation",
    tagline: "Tactile sculpted plasticine with miniature studio lighting",
    category: "3D & Tactile",
    promptSuffix:
      "Style: handcrafted stop-motion claymation, visible thumbprint plasticine textures, miniature stage lighting, shallow tilt-shift depth of field.",
    thumb:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80",
    beforeThumb:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    badge: "New",
  },
  {
    id: "knitted-yarn",
    name: "Knitted Yarn World",
    tagline: "Cozy crocheted wool fibers & stitched felt environments",
    category: "3D & Tactile",
    promptSuffix:
      "Style: macro knitted wool and crocheted yarn world, fuzzy tactile fibers, stitched felt details, warm softbox studio illumination.",
    thumb:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
    beforeThumb:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    badge: "New",
  },
  {
    id: "cinematic-3d",
    name: "Cinematic 3D Animation",
    tagline: "Stylized feature-film 3D character rendering & subsurface skin",
    category: "3D & Tactile",
    promptSuffix:
      "Style: stylized feature-film 3D animation, soft subsurface scattering, expressive stylized proportions, rich volumetric rim lighting.",
    thumb:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80",
    beforeThumb:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  },
  {
    id: "hollywood-action",
    name: "Hollywood Action Anamorphic",
    tagline: "35mm anamorphic lens flares, teal-and-orange grade & film grain",
    category: "Cinematic",
    promptSuffix:
      "Style: Hollywood 35mm anamorphic action cinema, subtle horizontal lens flares, teal and amber color grade, organic 35mm Kodak film grain.",
    thumb:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
    beforeThumb:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
]

interface CommunityExample {
  id: string
  title: string
  author: string
  category: "fayaa" | "trending" | "new"
  aspect: "square" | "landscape" | "portrait"
  videoUrl: string
  sourceVideoUrl: string
  posterUrl: string
  sourcePosterUrl: string
  referenceImages: { url: string; name: string }[]
  prompt: string
  mode: GenjutsuMode
  styleId: string
  views: string
}

const COMMUNITY_MASONRY: CommunityExample[] = [
  {
    id: "cuff-lens-pov",
    title: "Handcuff Lens Transition POV",
    author: "@fayaa_official",
    category: "trending",
    aspect: "landscape",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-changing-lights-1240-large.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    posterUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    sourcePosterUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
    referenceImages: [
      {
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
        name: "Locker_Room_Actor.jpg",
      },
    ],
    prompt:
      "Recast the subject into @Image1 framed through the metallic ring foreground in a blue locker room.",
    mode: "motion-transfer",
    styleId: "none",
    views: "1.4M",
  },
  {
    id: "aerial-drop-pov",
    title: "Top-Down Skyfall Reaction",
    author: "@kora.motion",
    category: "trending",
    aspect: "landscape",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40033-large.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    posterUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
    sourcePosterUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    referenceImages: [
      {
        url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
        name: "Creator_TopDown.jpg",
      },
    ],
    prompt:
      "Transform the performer into @Image1 with wide-angle overhead camera perspective over turf grass.",
    mode: "motion-transfer",
    styleId: "none",
    views: "890K",
  },
  {
    id: "cash-fan-flex",
    title: "Money Fan Slow-Mo Flex",
    author: "@lux_reels",
    category: "trending",
    aspect: "portrait",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-in-a-studio-with-colored-lights-42407-large.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    posterUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    sourcePosterUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
    referenceImages: [
      {
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
        name: "Protagonist_Portrait.jpg",
      },
    ],
    prompt:
      "Recast the character into @Image1 holding the fanned prop with exact finger and wrist choreography.",
    mode: "motion-transfer",
    styleId: "none",
    views: "2.7M",
  },
  {
    id: "night-street-shades",
    title: "Night Street Puffer Freestyle",
    author: "@fayaa_official",
    category: "fayaa",
    aspect: "landscape",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-posing-in-neon-light-39879-large.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    posterUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    sourcePosterUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    referenceImages: [
      {
        url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
        name: "Streetwear_Stylist.jpg",
      },
    ],
    prompt:
      "Recast the performer into @Image1 wearing glossy sunglasses and white puffer jacket on a city street at night.",
    mode: "motion-transfer",
    styleId: "hollywood-action",
    views: "640K",
  },
  {
    id: "stadium-sideline-sprint",
    title: "Champions Touchline Celebration",
    author: "@pitch_vfx",
    category: "trending",
    aspect: "square",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-changing-lights-1240-large.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    posterUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
    sourcePosterUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    referenceImages: [
      {
        url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
        name: "Coach_Character.jpg",
      },
    ],
    prompt:
      "Swap the sideline coach into @Image1 sprinting down the stadium touchline in front of the cheering crowd.",
    mode: "object-swap",
    styleId: "hollywood-action",
    views: "3.1M",
  },
  {
    id: "anime-restyle-couch",
    title: "3D Stylized Living Room Recast",
    author: "@fayaa_official",
    category: "new",
    aspect: "landscape",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40033-large.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    posterUrl:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80",
    sourcePosterUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    referenceImages: [
      {
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80",
        name: "Stylized_Character.jpg",
      },
    ],
    prompt:
      "Restyle the entire video into @Image1 with warm afternoon window light and stylized 3D character rendering.",
    mode: "restyle",
    styleId: "cinematic-3d",
    views: "520K",
  },
]

interface MotionControlSample {
  id: string
  title: string
  author: string
  posterUrl: string
  videoUrl: string
}

const MOTION_CONTROL_SAMPLES: MotionControlSample[] = [
  {
    id: "motion-sweater-dance",
    title: "Kitchen Sweater Groove",
    author: "@chloe.dance",
    posterUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40033-large.mp4",
  },
  {
    id: "motion-parking-freestyle",
    title: "Parking Lot Freestyle",
    author: "@marcus_moves",
    posterUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-changing-lights-1240-large.mp4",
  },
  {
    id: "motion-living-room-flex",
    title: "Living Room Energy Flex",
    author: "@tasha_flow",
    posterUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-in-a-studio-with-colored-lights-42407-large.mp4",
  },
  {
    id: "motion-night-park-groove",
    title: "Midnight Park Flow",
    author: "@jaylen_step",
    posterUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-posing-in-neon-light-39879-large.mp4",
  },
  {
    id: "motion-hallway-runway",
    title: "Hallway Fashion Pose",
    author: "@hailey_vogue",
    posterUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80",
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40033-large.mp4",
  },
]

const EMPTY_HISTORY_IMAGES: readonly [string, string, string] = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
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
  onOpenSubscriptions: () => void
  onOpenAllGenerations: () => void
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
}: GenjutsuWorkbenchProps) {
  const { data: authUser } = useAuth()
  // Navigation & Mode states
  const [sidebarTab, setSidebarTab] = useState<TopSidebarTab>("create-video")
  const [mode, setMode] = useState<GenjutsuMode>("motion-transfer")
  const [stageTab, setStageTab] = useState<StageTab>("motion-library")
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("trending")

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
  const [restyleSliderPos, setRestyleSliderPos] = useState<number>(62)

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
    () => Math.max(4, Math.min(30, Math.round((trimRange.end - trimRange.start) * 10) / 10)),
    [trimRange.end, trimRange.start]
  )

  const realtimeCost = useMemo(
    () =>
      calculateRealtimeVideoCost(
        selectedMotionModel,
        resolution,
        selectedDurationSec
      ),
    [selectedMotionModel, resolution, selectedDurationSec]
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
    setShowCreditPopup(true)
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
          "Please upload an MP4, MOV, or WebM video (4s to 30s)."
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
          ? "Add motion to copy (4 to 30 seconds)."
          : "Add a reference video (4 to 30 seconds) to extract motion."
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

    const plane: GenerationPlane = {
      model: genjutsu.id,
      prompt: { text: composedPrompt },
      settings: {
        resolution,
        variant:
          selectedMotionModel.id === "higgsfield/genjutsu/motion-transfer/v1.0"
            ? "pro"
            : "light",
        duration: Math.max(4, Math.min(30, Math.round(selectedDurationSec))),
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

  const filteredMasonry = useMemo(() => {
    if (feedFilter === "fayaa") {
      return COMMUNITY_MASONRY.filter((item) => item.category === "fayaa")
    }
    if (feedFilter === "new") {
      return [...COMMUNITY_MASONRY].reverse()
    }
    return COMMUNITY_MASONRY
  }, [feedFilter])

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
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#09090A] text-white select-none">
      {/* ══════════════════════════════════════════════════════════════════════
          GLOBAL TOP HEADER BAR (Matches Genjutsu Studio Screenshots 1, 2, 3)
         ══════════════════════════════════════════════════════════════════════ */}
      <header className="flex h-[52px] w-full shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#09090A] px-4">
        <div className="flex items-center gap-5 overflow-x-auto">
          {/* FAYAA Brand Mark */}
          <Link
            to={routes.LandingPageRoute.to}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-black transition-transform hover:scale-105"
            title="Back to Fayaa Explore"
          >
            <span className="font-display text-base font-black tracking-tighter">
              F
            </span>
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
              className="inline-flex items-center gap-1.5 font-bold text-[#D9FF00]"
            >
              <span>Video Studio</span>
              <span className="rounded bg-[#D9FF00]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#D9FF00]">
                Genjutsu
              </span>
            </Link>
            <Link
              to={routes.PricingPageRoute.to}
              className="transition-colors hover:text-white"
            >
              Pricing
            </Link>
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
                ? "border-[#D9FF00]/40 bg-[#D9FF00]/10 text-white hover:bg-[#D9FF00]/20"
                : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full transition-all",
                watermarkEnabled ? "bg-[#D9FF00] shadow-[0_0_8px_#D9FF00]" : "bg-zinc-600"
              )}
            />
            <span className="font-mono text-[11px] hidden sm:inline">Watermark:</span>
            <span className={watermarkEnabled ? "text-[#D9FF00] font-bold font-mono text-[11px]" : "text-zinc-400 font-mono text-[11px]"}>
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
            <Rocket className="size-3.5 text-[#D9FF00]" />
            <span>Upgrade</span>
            <span className=" -bottom-2 left-1/2 -translate-x-1/2 absolute rounded-full bg-[#FF2E93] px-1.5 py-0.2 text-[8px] font-extrabold tracking-wider text-white uppercase shadow">
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
                <FolderOpen className="size-3.5 text-[#4ADE80]" />
                <span>Assets</span>
              </button>
            }
          />

          <button
            type="button"
            onClick={() => setShowCreditPopup((v) => !v)}
            title="View credit usage"
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-xs font-semibold text-[#FACC15] transition-colors hover:bg-white/[0.09]"
          >
            <Coins className="size-3.5" />
            <span>{displayCredits}</span>
          </button>

          {authUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account profile and options"
                  title={authUser.email ?? "Account"}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white transition-transform hover:scale-105 focus:outline-none"
                >
                  <img
                    src={getUserAvatarUrl(authUser)}
                    alt="User avatar"
                    className="size-full object-cover"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-50 w-56 rounded-2xl border border-white/12 bg-[#141418] p-1.5 text-white shadow-2xl backdrop-blur-md"
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
                    <Crown className="size-3.5 text-[#C8FF00]" />
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
          ) : (
            <Link
              to={routes.LoginRoute.to}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#C8FF00] px-3 text-xs font-bold text-black transition-transform hover:scale-105 hover:bg-[#d8ff3e]"
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
            className="w-full max-w-[380px] overflow-hidden rounded-[26px] border border-white/15 bg-[#121215] p-0 shadow-[0_28px_90px_rgba(0,0,0,0.88)]"
          >
            <DialogTitle className="sr-only">New in Genjutsu: Restyle</DialogTitle>
            <DialogDescription className="sr-only">
              Pick a style or build one from your images, and the whole video is
              redrawn in it. Motion stays as filmed.
            </DialogDescription>

            {/* Top Split Before/After Interactive Preview */}
            <div
              className="relative h-[230px] w-full cursor-ew-resize overflow-hidden bg-zinc-900"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const pct = ((e.clientX - rect.left) / rect.width) * 100
                setRestyleSliderPos(Math.min(92, Math.max(8, pct)))
              }}
            >
              {/* Right / Underlying Original Video Frame */}
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80"
                alt="Original filmed motion"
                className="size-full object-cover"
              />
              {/* Left / Restyled 3D Character Frame */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: `inset(0 ${100 - restyleSliderPos}% 0 0)`,
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&q=80"
                  alt="Restyled 3D video"
                  className="size-full object-cover saturate-125"
                />
              </div>

              {/* Vertical Split Line */}
              <div
                className="pointer-events-none absolute inset-y-0 w-[1.5px] bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)]"
                style={{ left: `${restyleSliderPos}%` }}
              />

              {/* Bottom Gradient Fade */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#121215] to-transparent" />

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
              <span className="text-[10px] font-bold tracking-[0.14em] text-[#D9FF00] uppercase">
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
                className="mt-5 h-10 rounded-xl bg-[#D9FF00] px-6 text-xs font-bold text-black shadow-[0_8px_24px_rgba(217,255,0,0.25)] hover:bg-[#e3ff38]"
              >
                Explore styles
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════════════
          POPUP 2: TOP-RIGHT CREDIT USAGE POPOVER (Appears after closing Popup 1)
         ══════════════════════════════════════════════════════════════════════ */}
        {showCreditPopup ? (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-14 right-4 z-40 flex w-[360px] items-start gap-3.5 rounded-2xl border border-white/12 bg-[#161619]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Circular yellow coin/gauge badge */}
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#FACC15]/80 bg-[#FACC15]/10 text-[#FACC15]">
              <Coins className="size-4" />
              <span className=" -top-0.5 -right-0.5 absolute flex size-3.5 items-center justify-center rounded-full bg-[#FACC15] text-[9px] font-black text-black">
                !
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-xs font-bold text-[#FACC15]">
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
        <aside className="flex h-full w-[308px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0C0C0E]">
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
            {sidebarTab === "motion-control" ? (
              /* ══════════════════════════════════════════════════════════════════
                 MOTION CONTROL SIDEBAR CONTROLS (Screenshots 2 & 3)
                 ══════════════════════════════════════════════════════════════════ */
              <>
                {/* Motion Control Banner */}
                <div className="relative h-[92px] w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&q=80"
                    alt="Motion Control"
                    className="size-full object-cover opacity-60"
                  />
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
                    <span className="font-display text-sm font-black tracking-wide text-[#D9FF00] uppercase">
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
                      ? "border-white/15 bg-[#141417] p-2"
                      : "border-white/12 bg-[#141417]/80 hover:border-white/25 hover:bg-[#18181C]"
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
                            const dur = Math.min(
                              30,
                              Math.max(4, Math.round(e.currentTarget.duration || 10))
                            )
                            setVideoDuration(dur)
                            setTrimRange({ start: 0, end: dur })
                            const w = e.currentTarget.videoWidth
                            const h = e.currentTarget.videoHeight
                            if (w && h) {
                              setSourceVideoAspect(w >= h ? `${w}×${h} (16:9)` : `${w}×${h} (9:16)`)
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
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:bg-[#D9FF00] hover:text-black border border-white/10 backdrop-blur transition-all"
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
                            className="text-[#D9FF00] hover:underline flex items-center gap-0.5 text-[10px] font-medium cursor-pointer"
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
                              <Loader2 className="size-4 animate-spin text-[#D9FF00]" />
                            ) : (
                              <VideoIcon className="size-4" />
                            )}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-zinc-200">
                              {uploadingVideo ? "Uploading video…" : "Add motion to copy"}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              Video duration: 4–30 seconds
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
                      ? "border-white/15 bg-[#141417] p-2"
                      : "border-white/12 bg-[#141417]/80 hover:border-white/25 hover:bg-[#18181C]"
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
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:bg-[#D9FF00] hover:text-black border border-white/10 backdrop-blur transition-all"
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
                          className="text-[#D9FF00] hover:underline flex items-center gap-0.5 text-[10px] font-medium cursor-pointer"
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
                              <Loader2 className="size-4 animate-spin text-[#D9FF00]" />
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
                <div className="flex flex-col gap-1 rounded-xl border border-white/[0.07] bg-[#141417] p-2.5">
                  <span className="text-[10px] text-zinc-400">Model</span>
                  <button
                    type="button"
                    onClick={() => setIsModelModalOpen(true)}
                    className="group flex cursor-pointer items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white transition-colors group-hover:text-[#D9FF00]">
                        {selectedMotionModel.name}
                      </span>
                      <span className="text-xs">⚡</span>
                    </div>
                    <ChevronRight className="size-3.5 text-zinc-400 transition-colors group-hover:text-white" />
                  </button>
                </div>

                {/* Quality Row */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#141417] px-3 py-2.5">
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
                <div className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-[#141417] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">
                      Video Length
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#D9FF00]">
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
                              ? "border-[#D9FF00]/60 bg-[#D9FF00]/15 text-[#D9FF00]"
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
                    className="h-1 w-full accent-[#D9FF00]"
                  />
                </div>

                {/* Scene Control Mode (Screenshot 3) */}
                <div className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-[#141417] p-2.5">
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
                        sceneControlEnabled ? "bg-[#D9FF00]" : "bg-white/15"
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
                              ? "border-[#D9FF00]/50 bg-white/10 text-white"
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
                              ? "border-[#D9FF00]/50 bg-white/10 text-white"
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
                <div className="flex flex-col rounded-xl border border-white/[0.07] bg-[#141417]">
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
                        className="w-full resize-none rounded-lg border border-white/10 bg-black/50 p-2 text-xs leading-relaxed text-white placeholder:text-zinc-500 focus:border-[#D9FF00]/60 focus:outline-none"
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
                  <img
                    src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&q=80"
                    alt="Higgsfield Genjutsu"
                    className="size-full object-cover opacity-75"
                  />
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
                    <span className="font-display text-sm font-black tracking-wide text-[#D9FF00] uppercase">
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
                        ? "border-[#D9FF00]/40 bg-[#D9FF00]/[0.06]"
                        : "border-white/[0.07] bg-[#141417] hover:border-white/15"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-8 w-11 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-zinc-800">
                        <img
                          src={activeStyle.thumb}
                          alt={activeStyle.name}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">
                          {selectedStyleId === "none" ? "Style" : activeStyle.name}
                        </span>
                        <span className="rounded bg-[#D9FF00]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#D9FF00]">
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
                    <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-[#141417] p-2">
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
                                ? "border-[#D9FF00] ring-1 ring-[#D9FF00]/40"
                                : "border-white/10 hover:border-white/25"
                            )}
                          >
                            <div className="relative h-14 w-full overflow-hidden bg-zinc-900">
                              <img
                                src={preset.thumb}
                                alt={preset.name}
                                className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                              {active ? (
                                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                                  <Check className="size-2.5 stroke-[3]" />
                                </span>
                              ) : null}
                            </div>
                            <span className="truncate bg-[#18181B] px-2 py-1 text-[10px] font-medium text-zinc-200">
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
                      ? "border-white/15 bg-[#141417] p-2"
                      : "border-white/12 bg-[#141417]/80 hover:border-white/25 hover:bg-[#18181C]"
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
                            const dur = Math.min(
                              30,
                              Math.max(4, Math.round(e.currentTarget.duration || 10))
                            )
                            setVideoDuration(dur)
                            setTrimRange({ start: 0, end: dur })
                            const w = e.currentTarget.videoWidth
                            const h = e.currentTarget.videoHeight
                            if (w && h) {
                              setSourceVideoAspect(w >= h ? `${w}×${h} (16:9)` : `${w}×${h} (9:16)`)
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
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/80 text-zinc-300 hover:bg-[#D9FF00] hover:text-black border border-white/10 backdrop-blur transition-all"
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
                          <span className="font-mono text-[#D9FF00]">
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
                            className="h-1 flex-1 accent-[#D9FF00]"
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
                            className="h-1 flex-1 accent-[#D9FF00]"
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
                              <Loader2 className="size-4 animate-spin text-[#D9FF00]" />
                            ) : (
                              <VideoIcon className="size-4" />
                            )}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-zinc-200">
                              {uploadingVideo
                                ? "Uploading motion video…"
                                : sidebarTab === "edit-video"
                                  ? "Add a reference video to edit"
                                  : "Add a reference video to extract motion"}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              Video duration: 4 to 30 seconds
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
                  className="flex flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-[#141417] p-2.5"
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
                          className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/[0.03] text-zinc-400 transition-colors hover:border-[#D9FF00]/50 hover:bg-white/[0.06] hover:text-white"
                          title="Add reference image"
                        >
                          {uploadingImage ? (
                            <Loader2 className="size-4 animate-spin text-[#D9FF00]" />
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
                            <span className="pointer-events-none absolute bottom-0.5 left-0.5 rounded bg-black/85 px-1 py-0.2 font-mono text-[8px] font-semibold text-[#D9FF00]">
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
                                className="flex size-5 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white hover:bg-[#D9FF00] hover:text-black transition-colors"
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
                <div className="flex flex-col rounded-xl border border-white/[0.07] bg-[#141417] px-3 py-2.5">
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
                        promptEnabled ? "bg-[#D9FF00]" : "bg-white/15"
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
                        className="w-full resize-none rounded-lg border border-white/10 bg-black/50 p-2 text-xs leading-relaxed text-white placeholder:text-zinc-500 focus:border-[#D9FF00]/60 focus:outline-none"
                      />

                      {referenceImages.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {referenceImages.map((img, i) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => injectImageToken(i + 1)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#D9FF00]/30 bg-[#D9FF00]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#D9FF00] hover:bg-[#D9FF00]/20"
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
                <div className="flex flex-col gap-1 rounded-xl border border-white/[0.07] bg-[#141417] p-2.5">
                  <span className="text-[10px] text-zinc-400">Model</span>
                  <button
                    type="button"
                    onClick={() => setIsModelModalOpen(true)}
                    className="group flex cursor-pointer items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white transition-colors group-hover:text-[#D9FF00]">
                        {selectedMotionModel.name}
                      </span>
                      <span className="rounded bg-[#D9FF00] px-1 py-0.2 text-[9px] font-bold text-black">
                        New
                      </span>
                    </div>
                    <ChevronRight className="size-3.5 text-zinc-400 transition-colors group-hover:text-white" />
                  </button>
                </div>

                {/* 8. Quality Row */}
                <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#141417] px-3 py-2.5">
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
                <div className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-[#141417] p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200">
                      Video Length
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#D9FF00]">
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
                              ? "border-[#D9FF00]/60 bg-[#D9FF00]/15 text-[#D9FF00]"
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
                    className="h-1 w-full accent-[#D9FF00]"
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
          <div className="shrink-0 border-t border-white/[0.07] bg-[#0C0C0E] p-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#141417] px-2.5 py-1.5 text-[11px]">
              <div className="flex flex-col min-w-0">
                <span className="truncate font-semibold text-zinc-200">
                  {selectedMotionModel.name} • {resolution}
                </span>
                <span className="font-mono text-[10px] text-zinc-400">
                  ${realtimeCost.usdPerSec.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}/s × {realtimeCost.billableSeconds}s
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-mono text-xs font-bold text-[#D9FF00]">
                  {realtimeCost.credits} cr (~${realtimeCost.totalUsd.toFixed(2)})
                </span>
                <span className="text-[9px] text-zinc-500">Real-time estimate</span>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => void handleGenerate()}
              disabled={submitting || generating || uploadingVideo || uploadingImage}
              className={cn(
                "h-11 w-full rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                canSubmit
                  ? "bg-[#D9FF00] text-black shadow-[0_8px_28px_rgba(217,255,0,0.28)] hover:bg-[#e3ff38]"
                  : "bg-[#8A9A2E]/60 text-black/80 hover:bg-[#8A9A2E]/80"
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
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#09090A]">
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
                      <span className="rounded bg-[#D9FF00]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#D9FF00]">
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
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D9FF00]/30 bg-[#D9FF00]/10 px-3 py-1 text-xs font-medium text-[#D9FF00]">
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
                  <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121215] p-6 lg:flex-row lg:items-center">
                    <div className="flex max-w-[500px] flex-col gap-2.5">
                      <h1 className="font-display text-2xl font-black tracking-tight text-white uppercase sm:text-[32px] leading-tight">
                        RECREATE ANY{" "}
                        <span className="text-[#D9FF00] font-mono">
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
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
                          alt="Motion Character 1"
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="relative h-48 w-36 -ml-8 -rotate-2 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl z-10 transition-transform hover:scale-105 hover:z-20">
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
                          alt="Motion Character 2"
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="relative h-44 w-32 -ml-8 rotate-12 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl transition-transform hover:scale-105 hover:z-20">
                        <img
                          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80"
                          alt="Motion Character 3"
                          className="size-full object-cover"
                        />
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
                  {/* Hero Banner: "TURN ONE VIDEO INTO MANY" + Split Video Preview */}
                  <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] p-6 lg:flex-row lg:items-center">
                    <div className="flex max-w-[520px] flex-col gap-2.5">
                      <h1 className="font-display text-2xl font-black tracking-tight text-white uppercase sm:text-[30px]">
                        TURN ONE VIDEO INTO MANY
                      </h1>
                      <p className="text-sm leading-relaxed text-zinc-400">
                        Take the motion and recast it with your characters,
                        locations, and products, or swap specific elements while
                        keeping the rest untouched.
                      </p>
                    </div>

                    {/* Right Split-Comparison Preview Card */}
                    <div className="relative h-[168px] w-full shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-2xl sm:w-[320px]">
                      {/* Underlying output frame */}
                      <img
                        src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80"
                        alt="Genjutsu Output"
                        className="size-full object-cover"
                      />
                      {/* Left clipped original input frame */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: "inset(0 65% 0 0)" }}
                      >
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
                          alt="Original Motion"
                          className="size-full object-cover"
                        />
                      </div>
                      <div
                        className="pointer-events-none absolute inset-y-0 w-[1.5px] bg-white/90 shadow"
                        style={{ left: "35%" }}
                      />
                      <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        INPUT
                      </span>
                      <span className="absolute right-2 bottom-2 rounded bg-[#D9FF00] px-1.5 py-0.5 text-[10px] font-bold text-black">
                        GENJUTSU
                      </span>
                    </div>
                  </div>

                  {/* Centered Pill Filter Bar: Fayaa | Community trending | Community new (Higgsfield Tabs) */}
                  <div className="flex justify-center">
                    <Tabs
                      variant="segmented"
                      shape="pill"
                      value={feedFilter}
                      onValueChange={(val) => setFeedFilter(val as FeedFilter)}
                    >
                      <TabsList>
                        <TabsTrigger
                          value="fayaa"
                          start={<Sparkles className="size-3.5" />}
                        >
                          Fayaa
                        </TabsTrigger>
                        <TabsTrigger
                          value="trending"
                          start={<TrendingUp className="size-3.5" />}
                        >
                          Community trending
                        </TabsTrigger>
                        <TabsTrigger
                          value="new"
                          start={<Clock className="size-3.5" />}
                        >
                          Community new
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* 3-Column Masonry Video Grid matching Screenshot 3 using Higgsfield GenerationTile */}
                  <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                    {/* Column 1: Two stacked landscape cards */}
                    <div className="flex flex-col gap-3.5">
                      {filteredMasonry
                        .filter((_, i) => i % 3 === 0)
                        .map((item) => (
                          <MasonryVideoCard
                            key={item.id}
                            item={item}
                            onRemix={() => loadExampleIntoWorkspace(item)}
                          />
                        ))}
                    </div>

                    {/* Column 2: Landscape card + Taller stadium card */}
                    <div className="flex flex-col gap-3.5">
                      {filteredMasonry
                        .filter((_, i) => i % 3 === 1)
                        .map((item) => (
                          <MasonryVideoCard
                            key={item.id}
                            item={item}
                            tall={item.aspect === "square"}
                            onRemix={() => loadExampleIntoWorkspace(item)}
                          />
                        ))}
                    </div>

                    {/* Column 3: Full-height vertical portrait card */}
                    <div className="flex flex-col gap-3.5">
                      {filteredMasonry
                        .filter((_, i) => i % 3 === 2)
                        .map((item) => (
                          <MasonryVideoCard
                            key={item.id}
                            item={item}
                            portrait={item.aspect === "portrait"}
                            onRemix={() => loadExampleIntoWorkspace(item)}
                          />
                        ))}
                    </div>
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
                        <span className="text-[11px] font-bold tracking-widest text-[#D9FF00] uppercase">
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
                            "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-[#121215] transition-all",
                            isSelected
                              ? "border-[#D9FF00] shadow-[0_0_28px_rgba(217,255,0,0.16)]"
                              : "border-white/10 hover:border-white/25"
                          )}
                        >
                          <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                            <img
                              src={preset.thumb}
                              alt={preset.name}
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {preset.badge ? (
                              <span className="absolute top-3 left-3 rounded-md bg-[#D9FF00] px-2 py-0.5 text-[10px] font-bold text-black">
                                {preset.badge}
                              </span>
                            ) : null}
                            {isSelected ? (
                              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[#D9FF00] px-2.5 py-0.5 text-[10px] font-bold text-black">
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
                                    ? "bg-[#D9FF00] text-black hover:bg-[#e3ff38]"
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
                          className="rounded-xl bg-[#D9FF00] px-5 text-xs font-bold text-black hover:bg-[#e3ff38]"
                        >
                          Explore Motion Library
                        </Button>
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {genjutsuRuns.map((run) => {
                        const videoUrl = run.urls?.[0]
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
                            generatingLabel={`Processing Genjutsu (${String(Math.floor(elapsedSec / 60)).padStart(2, "0")}:${String(elapsedSec % 60).padStart(2, "0")})`}
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
                                  {
                                    id: "download",
                                    label: "Download MP4",
                                    icon: Download,
                                  },
                                ]
                                : undefined
                            }
                            className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#121215]"
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {/* ── TAB 4: HOW IT WORKS GUIDE ─────────────────────────────────── */}
              {stageTab === "how-it-works" ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-[#121215] p-6 md:flex-row md:items-center">
                    <div>
                      <span className="text-[11px] font-bold tracking-widest text-[#D9FF00] uppercase">
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
                    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#121215] p-5">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#D9FF00]/15 font-mono text-xs font-bold text-[#D9FF00]">
                        01
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        1. Upload Motion Video (4s–30s)
                      </h3>
                      <p className="text-xs leading-relaxed text-zinc-400">
                        Drop any MP4, MOV, or WebM clip into the first slot. Use
                        the inline frame trimmer handles to isolate the exact
                        choreography segment you want to transfer.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#121215] p-5">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#D9FF00]/15 font-mono text-xs font-bold text-[#D9FF00]">
                        02
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        2. Add Characters, Products, or Clothes
                      </h3>
                      <p className="text-xs leading-relaxed text-zinc-400">
                        Upload up to 4 reference images in Motion Transfer or
                        Objects Swap mode (or 1 in Restyle). Click any thumbnail
                        badge <code className="text-[#D9FF00]">[Ref 1]</code> to
                        inject <code className="text-[#D9FF00]">@Image1</code>{" "}
                        into your prompt.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#121215] p-5">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#D9FF00]/15 font-mono text-xs font-bold text-[#D9FF00]">
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
                        <strong className="text-[#D9FF00]">Generate</strong>.
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
        className="fixed bottom-4 right-4 z-30 flex size-7 items-center justify-center rounded-full border border-white/10 bg-[#161619] text-zinc-400 hover:text-white hover:bg-white/10 shadow-lg cursor-pointer transition-colors"
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
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#141418]">
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
                      ? "border-[#D9FF00]/40 bg-[#D9FF00]/10 text-white"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      watermarkEnabled ? "bg-[#D9FF00] shadow-[0_0_6px_#D9FF00]" : "bg-zinc-600"
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
                  <FayaaWatermark size="hero" position="bottom-right" />
                )}
              </div>
            </div>

            {/* Modal Footer: Informative Self-Explanatory Context */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-white/10 bg-[#121216] px-4 py-2.5 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-[#D9FF00]" />
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

/* ── Masonry Community Video Card (Uses Higgsfield GenerationTile) ─────────── */

function MasonryVideoCard({
  item,
  tall = false,
  portrait = false,
  onRemix,
}: {
  item: CommunityExample
  tall?: boolean
  portrait?: boolean
  onRemix: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)

  return (
    <GenerationTile
      src={item.posterUrl}
      alt={item.title}
      title={item.title}
      generation={{
        src: item.videoUrl,
        poster: item.posterUrl,
        mediaType: "video",
        prompt: item.prompt,
        model: genjutsu.label,
        settings: {
          mode: item.mode,
          author: item.author,
          views: item.views,
        },
      }}
      actions={[
        {
          id: "remix",
          label: "Remix in Sidebar",
          icon: Sparkles,
          onSelect: onRemix,
        },
        {
          id: "download",
          label: "Download MP4",
          icon: Download,
        },
      ]}
      onMouseEnter={() => {
        setHovered(true)
        void videoRef.current?.play().catch(() => { })
      }}
      onMouseLeave={() => {
        setHovered(false)
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
        }
      }}
      media={
        <>
          <img
            src={item.posterUrl}
            alt={item.title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <video
            ref={videoRef}
            src={item.videoUrl}
            poster={item.posterUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-200",
              hovered ? "opacity-100" : "opacity-0"
            )}
          />
        </>
      }
      className={cn(
        "overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141417] transition-all hover:border-white/25",
        portrait
          ? "h-[520px]"
          : tall
            ? "h-[310px]"
            : "h-[200px]"
      )}
    >
      {/* Subtle bottom-left Remix badge on hover */}
      <div className="pointer-events-none absolute top-2.5 left-2.5 z-[2] flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-medium text-zinc-200 backdrop-blur-md">
          {item.author} • {item.views}
        </span>
      </div>
    </GenerationTile>
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => {
        setHovered(true)
        void videoRef.current?.play().catch(() => { })
      }}
      onMouseLeave={() => {
        setHovered(false)
        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.currentTime = 0
        }
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all aspect-[9/16] bg-[#141417]",
        isSelected
          ? "border-[#D9FF00] ring-2 ring-[#D9FF00]/40 shadow-[0_0_24px_rgba(217,255,0,0.25)]"
          : "border-white/[0.08] hover:border-white/25 hover:shadow-xl"
      )}
    >
      <img
        src={sample.posterUrl}
        alt={sample.title}
        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <video
        ref={videoRef}
        src={sample.videoUrl}
        poster={sample.posterUrl}
        muted
        loop
        playsInline
        preload="metadata"
        className={cn(
          "absolute inset-0 size-full object-cover transition-opacity duration-200",
          hovered ? "opacity-100" : "opacity-0"
        )}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

      {isSelected ? (
        <span className="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-[#D9FF00] text-black">
          <Check className="size-3 stroke-[3]" />
        </span>
      ) : null}

      <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex flex-col gap-0.5">
        <span className="truncate text-xs font-semibold text-white">
          {sample.title}
        </span>
        <span className="truncate text-[10px] text-zinc-400">
          {sample.author}
        </span>
      </div>
    </div>
  )
}
