import React from "react"

export interface FayaaWatermarkProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  size?: "default" | "large" | "hero"
  /** Lift bottom anchors above native HTML5 <video controls> bars. */
  avoidControls?: boolean
  className?: string
}

/**
 * FAYAA AI Marketing Watermark Component
 * Prominent branding stamp for video generations and preview modals.
 */
export function FayaaWatermark({
  position = "bottom-right",
  size = "large",
  avoidControls = false,
  className = "",
}: FayaaWatermarkProps) {
  const bottomOffset = avoidControls ? "bottom-12 sm:bottom-14" : "bottom-3 sm:bottom-4"

  const positionClasses = {
    "bottom-right": `${bottomOffset} right-3 sm:right-4`,
    "bottom-left": `${bottomOffset} left-3 sm:left-4`,
    "top-right": "top-3 right-3 sm:top-4 sm:right-4",
    "top-left": "top-3 left-3 sm:top-4 sm:left-4",
  }[position]

  const sizeClasses = {
    default: "px-2.5 py-1 text-xs gap-1.5",
    large: "px-3.5 py-1.5 text-sm gap-2",
    hero: "px-4 py-2 text-base gap-2.5",
  }[size]

  return (
    <div
      aria-label="Created with FAYAA AI watermark"
      className={`absolute ${positionClasses} pointer-events-none select-none z-30 transition-all ${className}`}
    >
      <div
        className={`flex items-center rounded-xl bg-black/85 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.85)] ${sizeClasses}`}
      >
        <span className="flex size-2 sm:size-2.5 rounded-full bg-fy-accent shadow-[0_0_10px_#ff5b1f] animate-pulse shrink-0" />
        <div className="flex items-center gap-1.5 font-mono leading-none">
          <span className="text-[11px] sm:text-xs text-zinc-300 font-medium">Created with</span>
          <span className="text-xs sm:text-sm font-black tracking-wider text-white">
            FAYAA<span className="text-fy-accent">.AI</span>
          </span>
          <span className="hidden sm:inline text-zinc-500">•</span>
          <span className="hidden sm:inline text-[11px] font-semibold text-fy-accent/90">
            fayaa.tech
          </span>
        </div>
      </div>
    </div>
  )
}
