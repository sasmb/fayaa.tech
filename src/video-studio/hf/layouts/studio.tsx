"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ComponentProps } from "react"
import { useSearchParams } from "react-router"
import { login, useAuth } from "wasp/client/auth"

import {
  PaymentPlanId,
  SubscriptionStatus,
  prettyPaymentPlanName,
} from "../../../payment/plans"
import { estimateLongVideoPlan, segmentCredits } from "../../longVideoPlanning"
import {
  estimateSeedancePlan,
  normalizeSeedanceAspectRatio,
  SEEDANCE_MODEL_ID,
} from "../../seedancePlanning"
import { creditCostForResolution } from "../../taskSync"
import { GenjutsuWorkbench } from "../components/studio/genjutsu-workbench"
import { SeedanceStudioStrip } from "../components/studio/seedance-studio-strip"
import {
  GuestJourneyExpiredDialog,
  GuestSignupGateDialog,
} from "../components/studio/guest-journey-modals"
import type { MyProjectsProject } from "../components/studio/my-projects"
import { StudioSidebar, type StudioView } from "../components/studio/sidebar"
import { StudioPromptBox } from "../components/studio/studio-prompt-box"
import { StudioSubscriptionPanel } from "../components/studio/subscription-panel"
import { UserGenerations } from "../components/studio/user-generations"
import type { GalleryItem } from "../components/studio/gallery/gallery-types"
import { MODELS, getModel, parseSettings } from "../generation/catalog"
import type {
  GenerationPlane,
  MediaItem,
  MediaRole,
  Surface,
} from "../generation/catalog"
import {
  changeImageRole,
  groupMedia,
  inferInputMode,
  inputRoles,
  mergeMedia,
  mergeReferences,
} from "../generation/catalog/media-inputs"
import { toPlatform } from "../generation/to-platform"
import { useActive } from "../generation/stores/active"
import { useGuestJourneyClock } from "../generation/stores/guest-journey"
import { useSettings } from "../generation/stores/settings"
import {
  runToGalleryItems,
  runToLibraryItems,
} from "../lib/studio/gallery-items"
import { useProjects } from "../lib/studio/projects"
import {
  uploadAsset,
  useUploads,
  type AssetSelection,
} from "../lib/studio/uploads"
import { studioClip } from "../../studioClips"
import { useRuns } from "../lib/studio/use-runs"

const HERO_FALLBACKS = [
  studioClip("trend-dance"),
  studioClip("grwm-anime"),
  studioClip("sneaker-hook"),
] as const

type DockProps = Omit<
  ComponentProps<typeof StudioPromptBox>,
  "className" | "skin"
>

function heroImages(items: GalleryItem[]): readonly [string, string, string] {
  const ready = items
    .filter((i) => i.status === "ready" && i.src !== "")
    .slice(0, 3)
    .map((i) => i.src)
  return [
    ready[0] ?? HERO_FALLBACKS[0],
    ready[1] ?? HERO_FALLBACKS[1],
    ready[2] ?? HERO_FALLBACKS[2],
  ]
}

function FeedState({
  items,
  previewItems,
  title,
  dock,
  onDelete,
}: {
  items: GalleryItem[]
  previewItems: GalleryItem[]
  title: string
  dock: DockProps
  onDelete: (item: GalleryItem) => void
}) {
  const images = useMemo(() => heroImages(previewItems), [previewItems])
  const dockRef = useRef<HTMLDivElement>(null)
  const [dockHeight, setDockHeight] = useState(180)
  useEffect(() => {
    const node = dockRef.current
    if (!node) return
    const observer = new ResizeObserver(() =>
      setDockHeight(node.getBoundingClientRect().height)
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="flex min-h-0 flex-1 flex-col px-4 pt-4"
        style={{ paddingBottom: dockHeight + 24 }}
      >
        <UserGenerations
          items={items}
          title={title}
          onDelete={onDelete}
          emptyState={{
            images,
            title:
              title === "All Generations"
                ? "No generations yet"
                : `No generations in ${title}`,
            description:
              "Upload a motion source video and reference images to generate your first Genjutsu video.",
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pt-24 pb-4"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
        }}
      >
        <div ref={dockRef} className="w-full max-w-[900px]">
          <StudioPromptBox
            {...dock}
            skin="glass"
            className="pointer-events-auto w-full"
          />
        </div>
      </div>
    </div>
  )
}

export interface StudioTemplateProps {
  /** Product name in the sidebar header. */
  title?: string
  /** Hero headline above the dock. */
  headline?: string
}

export function StudioTemplate({
  title = "FAYAA Studio",
}: StudioTemplateProps) {
  useEffect(() => {
    const html = document.documentElement
    const prevTheme = html.getAttribute("data-theme")
    const hadDark = html.classList.contains("dark")
    html.setAttribute("data-theme", "default-dark")
    html.classList.add("dark")
    return () => {
      if (prevTheme) html.setAttribute("data-theme", prevTheme)
      else html.removeAttribute("data-theme")
      if (!hadDark) html.classList.remove("dark")
    }
  }, [])

  const { data: user, isLoading: isAuthLoading } = useAuth()
  const autoLoginAttemptedRef = useRef(false)
  const guestJourney = useGuestJourneyClock(Boolean(user))
  const [showGuestSignupGate, setShowGuestSignupGate] = useState(false)
  const [view, setView] = useState<StudioView>({ kind: "home" })
  const [collapsed, setCollapsed] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [media, setMedia] = useState<MediaItem[]>([])
  const [canceling, setCanceling] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Clean unauthenticated handling (no 8h sneak peek or test login)
  useEffect(() => {
    // 8h sneak peek and automatic test logins are stopped
  }, [])

  const surface = useActive((s) => s.surface)
  const modelId = useActive((s) => s.model)
  const setActiveModel = useActive((s) => s.setModel)
  const settingsByModel = useSettings((s) => s.byModel)
  const setSetting = useSettings((s) => s.set)
  const projectsStore = useProjects()
  const allUploads = useUploads((s) => s.items)
  const setUploadsUserId = useUploads((s) => s.setActiveUserId)
  const currentUserId = user?.id ?? null
  const runs = useRuns(currentUserId)

  useEffect(() => {
    setUploadsUserId(currentUserId)
    projectsStore.setActiveUserId(currentUserId)
    setMedia([])
    setPrompt("")
  }, [currentUserId, projectsStore.setActiveUserId, setUploadsUserId])

  // /studio?model=seedance[&prompt=...] (Seedance launch links) opens the
  // Seedance prompt dock with the prompt filled in. Declared after the reset
  // above so the prompt survives the user loading in.
  const [searchParams, setSearchParams] = useSearchParams()
  const [seedancePrompt, setSeedancePrompt] = useState<string | null>(null)
  useEffect(() => {
    if (searchParams.get("model") !== SEEDANCE_MODEL_ID) return
    setActiveModel(SEEDANCE_MODEL_ID)
    setView({ kind: "all" })
    setSeedancePrompt((searchParams.get("prompt") ?? "").slice(0, 2000))
    const next = new URLSearchParams(searchParams)
    next.delete("model")
    next.delete("prompt")
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, setActiveModel])
  useEffect(() => {
    if (seedancePrompt) setPrompt(seedancePrompt)
  }, [seedancePrompt, currentUserId])

  const uploads = useMemo(
    () =>
      currentUserId
        ? allUploads.filter((item) => item.userId === currentUserId)
        : [],
    [allUploads, currentUserId]
  )
  const userProjects = useMemo(
    () =>
      currentUserId
        ? projectsStore.projects.filter((p) => p.userId === currentUserId)
        : [],
    [currentUserId, projectsStore.projects]
  )

  const surfaces = useMemo(
    () =>
      (["video", "image"] as Surface[]).filter((s) =>
        MODELS.some((m) => m.surface === s)
      ),
    []
  )
  const models = useMemo(
    () => MODELS.filter((m) => m.surface === surface),
    [surface]
  )
  const model = useMemo(() => {
    try {
      return getModel(modelId)
    } catch {
      return models[0] ?? MODELS[0]!
    }
  }, [modelId, models])
  const settings = useMemo(
    () => settingsByModel[model.id] ?? {},
    [settingsByModel, model.id]
  )
  const inputMode = inferInputMode(model, media)
  const prepared = useMemo(() => {
    try {
      const plane: GenerationPlane = {
        model: model.id,
        inputMode,
        prompt: { text: prompt.trim() },
        media: groupMedia(media),
        settings: parseSettings(model, settings),
      }
      toPlatform(plane)
      return { plane, error: null }
    } catch (caught) {
      return {
        plane: null,
        error: caught instanceof Error ? caught.message : String(caught),
      }
    }
  }, [inputMode, media, model, prompt, settings])

  const galleryItems = useMemo(
    () => runs.records.flatMap(runToGalleryItems),
    [runs.records]
  )
  const libraryItems = useMemo(
    () => [...uploads, ...runs.records.flatMap(runToLibraryItems)],
    [runs.records, uploads]
  )
  const byProject = useMemo(() => {
    const map = new Map<string, GalleryItem[]>()
    for (const item of galleryItems) {
      if (!item.projectId) continue
      map.set(item.projectId, [...(map.get(item.projectId) ?? []), item])
    }
    return map
  }, [galleryItems])
  const projects = useMemo<MyProjectsProject[]>(
    () =>
      userProjects.map((p) => {
        const items = byProject.get(p.id) ?? []
        const cover = items.find(
          (i) => i.status === "ready" && i.src !== ""
        )?.src
        return {
          id: p.id,
          name: p.name,
          generationCount: new Set(items.map((i) => i.runId)).size,
          updatedAt: p.updatedAt,
          ...(cover ? { cover } : {}),
        }
      }),
    [byProject, userProjects]
  )
  const selectedProject =
    view.kind === "project"
      ? projects.find((p) => p.id === view.projectId)
      : undefined
  const visibleItems =
    view.kind === "project"
      ? (byProject.get(view.projectId) ?? [])
      : galleryItems

  const generating = runs.running.length > 0
  const canGenerate =
    prepared.plane !== null && (prompt.trim().length > 0 || media.length > 0)
  const missingRequiredInput =
    model.requiredRoles?.some(
      (role) => !media.some((item) => item.role === role)
    ) ||
    (model.requirePrompt && !prompt.trim())

  const requiredCredits =
    model.id === SEEDANCE_MODEL_ID
      ? estimateSeedancePlan({
          totalDurationSec: Number(settings.duration ?? 10),
          resolution: settings.resolution,
        }).credits
      : creditCostForResolution(
          typeof settings.resolution === "string" ? settings.resolution : "480p",
          settings.variant === "pro" ? "pro" : "light",
          Number(settings.duration ?? 5)
        )

  const planBadge =
    user?.subscriptionStatus === SubscriptionStatus.Active &&
    user?.subscriptionPlan
      ? prettyPaymentPlanName(user.subscriptionPlan as PaymentPlanId).replace(
          /^FAYAA\s+/i,
          ""
        )
      : "Top up"

  const handleSubmitPlane = useCallback(
    (plane: GenerationPlane) => {
      if (generating) return
      setLocalError(null)
      if (!user) {
        setShowGuestSignupGate(true)
        return
      }
      const projectId = view.kind === "project" ? view.projectId : undefined
      if (plane.model === SEEDANCE_MODEL_ID) {
        const seedancePlan = estimateSeedancePlan({
          totalDurationSec: Number(plane.settings.duration ?? 10),
          resolution: plane.settings.resolution,
        })
        if (user.credits < seedancePlan.credits && !user.isAdmin) {
          setLocalError(
            `Insufficient credits (${user.credits} available, ${seedancePlan.credits} needed). Subscribe or top up to continue.`
          )
          setView({ kind: "subscription" })
          return
        }
        void runs
          .submitSeedance(
            {
              prompt: plane.prompt.text,
              totalDurationSec: seedancePlan.totalDurationSec,
              resolution: seedancePlan.resolution,
              aspectRatio: normalizeSeedanceAspectRatio(plane.settings.aspect_ratio),
            },
            projectId
          )
          .then((record) => {
            if (record && projectId) projectsStore.touch(projectId)
          })
        return
      }
      const res = (plane.settings.resolution === "1080p" || plane.settings.resolution === "720p"
        ? plane.settings.resolution
        : "480p") as "480p" | "720p" | "1080p"
      const variant = plane.settings.variant === "pro" ? "pro" : "light"
      const durationSec = Number(plane.settings.duration ?? 5)
      const trimStartSec = Number(plane.settings.trimStartSec ?? 0)
      const isLongForm = Boolean(plane.settings.longForm)
      const previewFirst = isLongForm && Boolean(plane.settings.previewFirst)
      const longPlan = isLongForm
        ? estimateLongVideoPlan({
            totalDurationSec: durationSec,
            trimStartSec,
            resolution: res,
            variant,
          })
        : null
      // Preview-first only charges piece 1 up front.
      const cost = longPlan
        ? previewFirst && longPlan.segmentCount > 1
          ? segmentCredits(longPlan.segments[0]!.durationSec, res, variant)
          : longPlan.credits
        : creditCostForResolution(res, variant, durationSec)
      if (user.credits < cost && !user.isAdmin) {
        setLocalError(
          `Insufficient credits (${user.credits} available, ${cost} needed). Subscribe or top up to continue.`
        )
        setView({ kind: "subscription" })
        return
      }
      if (isLongForm) {
        const sourceVideoUrl =
          plane.media.source?.[0]?.url ?? plane.media.video?.[0]?.url ?? ""
        const referenceImageUrls = [
          ...(plane.media.reference ?? []).map((m) => m.url),
          ...(plane.media.start ?? []).map((m) => m.url),
        ]
        void runs
          .submitLong(
            {
              sourceVideoUrl,
              referenceImageUrls,
              prompt: plane.prompt.text,
              resolution: res,
              variant,
              trimStartSec,
              totalDurationSec: durationSec,
              ...(previewFirst ? { previewFirst: true } : {}),
            },
            projectId
          )
          .then((record) => {
            if (record && projectId) projectsStore.touch(projectId)
          })
        return
      }
      void runs.submit(plane, projectId).then((record) => {
        if (record && projectId) projectsStore.touch(projectId)
      })
    },
    [generating, projectsStore, runs, user, view]
  )

  const handleGenerate = useCallback(() => {
    if (!canGenerate || generating || !prepared.plane) return
    handleSubmitPlane(prepared.plane)
  }, [canGenerate, generating, handleSubmitPlane, prepared.plane])

  const handleCancel = useCallback(() => {
    if (!generating || canceling) return
    setCanceling(true)
    void Promise.all(runs.running.map((r) => runs.cancel(r.id))).finally(() =>
      setCanceling(false)
    )
  }, [canceling, generating, runs])

  const changeSurface = (next: Surface) => {
    const first = MODELS.find((m) => m.surface === next)
    if (first) setActiveModel(first.id)
  }

  const dock: DockProps = {
    surfaces,
    surface,
    onSurfaceChange: changeSurface,
    models,
    model,
    onModelChange: (id) => {
      setLocalError(null)
      setActiveModel(id)
    },
    settings,
    onSettingChange: (key, value) => setSetting(model.id, { [key]: value }),
    inputMode,
    media,
    onMediaAdd: (role: MediaRole | "auto", selection: AssetSelection[]) => {
      const selected = selection.map((item) => ({
        id: item.id,
        url: item.src,
        kind: item.kind,
        name: item.name,
      }))
      const roles = inputRoles(model, inputMode)
      const next =
        role === "auto"
          ? mergeReferences(media, selected, roles)
          : mergeMedia(
              media,
              role,
              selected.map((item) => ({ ...item, role })),
              roles[role] ?? 0
            )
      setLocalError(null)
      setMedia(next)
    },
    onMediaRemove: (id) => {
      setLocalError(null)
      setMedia((current) => current.filter((item) => item.id !== id))
    },
    onMediaRoleChange: (id, role) => {
      try {
        setMedia(changeImageRole(model, media, id, role))
        setLocalError(null)
      } catch (caught) {
        setLocalError(
          caught instanceof Error
            ? caught.message
            : "Could not change the image role."
        )
      }
    },
    library: { items: libraryItems, onUpload: uploadAsset },
    prompt,
    onPromptChange: setPrompt,
    cost: `${requiredCredits} cr`,
    onGenerate: handleGenerate,
    onCancel: handleCancel,
    generating,
    canceling,
    generateDisabled: !canGenerate,
    disabledReason: prepared.error ?? undefined,
    error:
      localError ??
      runs.error ??
      (!missingRequiredInput && media.length > 0 ? prepared.error : null) ??
      undefined,
  }

  const isStudioLockedForExpiredGuest = false

  return (
    <div className="relative flex h-dvh overflow-hidden bg-fy-ink">
      {/* 8h sneak peek modals stopped */}

      <div
        className={
          isStudioLockedForExpiredGuest
            ? "pointer-events-none flex min-w-0 flex-1 overflow-hidden opacity-20 blur-xl transition-all duration-500 select-none"
            : "flex min-w-0 flex-1 overflow-hidden"
        }
      >
        {view.kind !== "home" ? (
          <StudioSidebar
            title={title}
            view={view}
            onViewChange={setView}
            projects={projects}
            onCreateProject={(name) =>
              setView({
                kind: "project",
                projectId: projectsStore.create(name).id,
              })
            }
            onRenameProject={(id, name) => projectsStore.rename(id, name)}
            onDeleteProject={(id) => {
              projectsStore.remove(id)
              if (view.kind === "project" && view.projectId === id)
                setView({ kind: "all" })
            }}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            credits={user?.credits ?? 0}
            planName={planBadge}
          />
        ) : null}
        <main className="relative flex min-w-0 flex-1 flex-col">
          {view.kind === "subscription" ? (
            <StudioSubscriptionPanel
              heroImages={heroImages(galleryItems)}
              onBackToStudio={() => setView({ kind: "home" })}
            />
          ) : view.kind === "home" ? (
            <>
            <SeedanceStudioStrip
              onOpen={() => {
                setLocalError(null)
                setActiveModel(SEEDANCE_MODEL_ID)
                setView({ kind: "all" })
              }}
            />
            <GenjutsuWorkbench
              libraryItems={libraryItems}
              runs={runs.records}
              runningRuns={runs.running}
              generating={generating}
              canceling={canceling}
              userCredits={user?.credits ?? 0}
              isGuestPreview={!user}
              guestRemainingFormatted={guestJourney.formattedRemaining}
              onForceExpireGuest={guestJourney.forceExpireNow}
              onRequireGuestSignup={() => setShowGuestSignupGate(true)}
              errorMessage={localError ?? runs.error ?? undefined}
              onSubmitPlane={handleSubmitPlane}
              onCancelGenerating={handleCancel}
              onApprovePreview={(id) => void runs.approvePreview(id)}
              onKeepPreview={(id) => void runs.keepPreview(id)}
              onOpenSubscriptions={() => setView({ kind: "subscription" })}
              onOpenAllGenerations={() => setView({ kind: "all" })}
            />
            </>
          ) : (
            <FeedState
              items={visibleItems}
              previewItems={galleryItems}
              title={selectedProject?.name ?? "All Generations"}
              dock={dock}
              onDelete={(item) => runs.remove(item.runId)}
            />
          )}
        </main>
      </div>
    </div>
  )
}
