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
    title: "Viral Choreography Transfer",
    subtitle: "Full-body dance sync with locked character identity",
    category: "dance",
    kind: "video",
    images: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    ],
    icon: WandSparkles,
    modelId: "genjutsu",
    settings: { resolution: "720p" },
    media: [
      {
        id: "sample-motion-dance",
        url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        role: "source",
        kind: "video",
        name: "Dance_Choreography_Reference.mp4",
      },
      {
        id: "sample-ref-1",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
        role: "reference",
        kind: "image",
        name: "Hero_Performer.jpg",
      },
      {
        id: "sample-ref-2",
        url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
        role: "reference",
        kind: "image",
        name: "Neon_Stage_Scene.jpg",
      },
    ],
    prompt:
      "Recast the performer into @Image1 executing the exact choreography inside the neon stage atmosphere of @Image2, crisp limb articulation, studio rim lighting.",
  },
  {
    id: "genjutsu-runway",
    title: "Editorial Runway Walk",
    subtitle: "Catwalk stride with natural fabric dynamics",
    category: "fashion",
    kind: "video",
    images: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    ],
    icon: Calendar,
    modelId: "genjutsu",
    settings: { resolution: "1080p" },
    media: [
      {
        id: "sample-motion-runway",
        url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        role: "source",
        kind: "video",
        name: "Runway_Walk_Motion.mp4",
      },
      {
        id: "sample-ref-runway-1",
        url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
        role: "reference",
        kind: "image",
        name: "Runway_Model.jpg",
      },
    ],
    prompt:
      "Transform the subject into @Image1 with high-fashion editorial styling, natural fabric motion, sharp silhouette.",
  },
  {
    id: "genjutsu-creator",
    title: "Creator Hook Gestures",
    subtitle: "Expressive talking-head motion for viral reels",
    category: "ugc",
    kind: "video",
    images: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
    ],
    icon: House,
    modelId: "genjutsu",
    settings: { resolution: "720p" },
    media: [
      {
        id: "sample-motion-creator",
        url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        role: "source",
        kind: "video",
        name: "Creator_Hook_Motion.mp4",
      },
      {
        id: "sample-ref-creator-1",
        url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
        role: "reference",
        kind: "image",
        name: "Creator_Subject.jpg",
      },
    ],
    prompt:
      "Recast the speaker into @Image1 with expressive creator hand gestures and natural head movement, warm key light, shallow depth of field.",
  },
  {
    id: "genjutsu-action",
    title: "Dynamic Action Sequence",
    subtitle: "High-velocity martial arts & athletic motion",
    category: "action",
    kind: "video",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80",
    ],
    icon: BatteryFull,
    modelId: "genjutsu",
    settings: { resolution: "1080p" },
    media: [
      {
        id: "sample-motion-action",
        url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        role: "source",
        kind: "video",
        name: "Action_Combo_Motion.mp4",
      },
      {
        id: "sample-ref-action-1",
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
        role: "reference",
        kind: "image",
        name: "Action_Hero.jpg",
      },
    ],
    prompt:
      "Recast the fighter into @Image1 executing a crisp martial arts combo with grounded footwork, cinematic camera follow, dramatic contrast.",
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
              <img
                src={src}
                alt={`${template.title} — shot ${i + 1}`}
                className="size-full object-cover"
              />
            </div>
          ))
        ) : (
          <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10">
            <img
              src={template.images[0]}
              alt={template.title}
              className="size-full object-cover"
            />
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
