"use client"

import type { KeyboardEvent, ReactNode } from "react"
import {
  BatteryFull,
  Calendar,
  House,
  WandSparkles,
  type LucideIcon,
} from "lucide-react"

import { Button } from "../ui/button"
import type { MediaItem } from "../../generation/catalog"
import { cn } from "../../lib/utils"
import { studioClip } from "../../../studioClips"
import { MediaThumb } from "./media-thumb"

/**
 * Templates — the "what you can make" examples. A `TemplateItem` seeds the
 * prompt dock (prompt text + optional model/settings/media) when its Try action fires.
 * `TemplateCard` and `ExamplePresets` render them; the Explore tab on Home uses
 * `ExamplePresets`.
 */

export interface TemplateItem {
  id: string
  title: string
  subtitle: string
  /** Free-form filter category used by the picker tabs. */
  category: string
  kind: "image" | "video"
  images: [string, string, string]
  icon: LucideIcon
  /** What the Try action puts in the dock. */
  prompt: string
  /** Catalog model id to switch to, when the template needs a specific one. */
  modelId?: string
  settings?: Record<string, unknown>
  media?: MediaItem[]
}

export const TEMPLATES: TemplateItem[] = [
  {
    id: "genjutsu-dance",
    title: "Viral dance transfer",
    subtitle: "Same moves, your character, identity locked",
    category: "dance",
    kind: "video",
    images: [studioClip("trend-dance"), studioClip("ember-dance"), studioClip("gym-spin")],
    icon: WandSparkles,
    modelId: "genjutsu",
    settings: { resolution: "720p" },
    media: [
      {
        id: "sample-motion-genjutsu-dance",
        url: studioClip("trend-dance"),
        role: "source",
        kind: "video",
        name: "Viral_dance_transfer.mp4",
      },
    ],
    prompt: "Recast the dancer into @Image1 with the exact same choreography, crisp limbs and the same camera move.",
  },
  {
    id: "genjutsu-product",
    title: "Product swap hook",
    subtitle: "Drop your product into a scroll-stopping shot",
    category: "product",
    kind: "video",
    images: [studioClip("sneaker-hook"), studioClip("perfume-spin"), studioClip("sneaker-unbox")],
    icon: Calendar,
    modelId: "genjutsu",
    settings: { resolution: "1080p" },
    media: [
      {
        id: "sample-motion-genjutsu-product",
        url: studioClip("sneaker-hook"),
        role: "source",
        kind: "video",
        name: "Product_swap_hook.mp4",
      },
    ],
    prompt: "Swap the product for @Image1, keeping the slam, the bounce and the lighting.",
  },
  {
    id: "genjutsu-transition",
    title: "Snap outfit transition",
    subtitle: "Hoodie to evening look on the beat",
    category: "fashion",
    kind: "video",
    images: [studioClip("snap-transition"), studioClip("grwm-anime"), studioClip("street-interview")],
    icon: House,
    modelId: "genjutsu",
    settings: { resolution: "720p" },
    media: [
      {
        id: "sample-motion-genjutsu-transition",
        url: studioClip("snap-transition"),
        role: "source",
        kind: "video",
        name: "Snap_outfit_transition.mp4",
      },
    ],
    prompt: "Recast the person into @Image1 and keep the snap transition into the evening look.",
  },
  {
    id: "genjutsu-action",
    title: "Action moment",
    subtitle: "Jumps, spins and freezes with real weight",
    category: "action",
    kind: "video",
    images: [studioClip("gym-spin"), studioClip("cliff-freeze"), studioClip("ember-sprint")],
    icon: BatteryFull,
    modelId: "genjutsu",
    settings: { resolution: "1080p" },
    media: [
      {
        id: "sample-motion-genjutsu-action",
        url: studioClip("gym-spin"),
        role: "source",
        kind: "video",
        name: "Action_moment.mp4",
      },
    ],
    prompt: "Recast the athlete into @Image1 with the same jump, spin and slow-motion landing.",
  },
]

function gradientFromSeed(seed: string): string {
  let hash = 0
  for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  const start = hash % 360
  const end = (start + 36 + ((hash >>> 8) % 72)) % 360
  return `linear-gradient(135deg, hsl(${start} 62% 52%) 0%, hsl(${end} 76% 27%) 100%)`
}

function GradientBadge({ as: Glyph, seed }: { as: LucideIcon; seed: string }) {
  return (
    <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-white/25 text-white shadow-[0_5px_3px_rgba(0,0,0,0.08),inset_0_3px_5px_rgba(255,255,255,0.24)]">
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundImage: gradientFromSeed(seed) }}
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 mix-blend-overlay"
      />
      <Glyph className="relative size-5" />
    </span>
  )
}

const TRIPTYCH = [
  "rounded-l-2xl rounded-r-sm",
  "rounded-sm",
  "rounded-r-2xl rounded-l-sm",
] as const

export interface TemplateCardProps {
  template: TemplateItem
  variant?: "single" | "triptych"
  onTry: (template: TemplateItem) => void
  tryLabel?: ReactNode
}

export function TemplateCard({
  template,
  variant = "single",
  onTry,
  tryLabel = "Try",
}: TemplateCardProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onTry(template)
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Use template: ${template.title}`}
      className="relative flex cursor-pointer flex-col gap-2 rounded-[20px] bg-white/5 p-2 shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition-[transform,background-color] duration-200 hover:z-[1] hover:-translate-y-0.5 hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:hover:translate-y-0"
      onClick={() => onTry(template)}
      onKeyDown={onKeyDown}
    >
      <div className="flex h-60 items-stretch gap-1.5">
        {variant === "triptych" ? (
          template.images.map((src, i) => (
            <div
              key={i}
              className={cn(
                "min-w-0 flex-1 overflow-hidden border border-white/10",
                TRIPTYCH[i]
              )}
            >
              <MediaThumb src={src} alt={`${template.title}, shot ${i + 1}`} mode="hover" />
            </div>
          ))
        ) : (
          <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10">
            <MediaThumb src={template.images[0]} alt={template.title} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 px-2 py-1">
        <GradientBadge as={template.icon} seed={template.id} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {template.title}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {template.subtitle}
          </span>
        </div>
        <Button
          size="sm"
          className="rounded-full font-semibold"
          onClick={(event) => {
            event.stopPropagation()
            onTry(template)
          }}
        >
          {tryLabel}
        </Button>
      </div>
    </div>
  )
}

export interface ExamplePresetsProps {
  items: TemplateItem[]
  onUse: (template: TemplateItem) => void
  tryLabel?: ReactNode
  className?: string
}

/** The Explore grid: two columns of `TemplateCard`s. */
export function ExamplePresets({
  items,
  onUse,
  tryLabel = "Try",
  className = "w-full max-w-[900px]",
}: ExamplePresetsProps) {
  return (
    <div
      className={cn("grid w-full grid-cols-1 gap-5 sm:grid-cols-2", className)}
    >
      {items.map((t) => (
        <TemplateCard
          key={t.id}
          template={t}
          onTry={onUse}
          tryLabel={tryLabel}
        />
      ))}
    </div>
  )
}
