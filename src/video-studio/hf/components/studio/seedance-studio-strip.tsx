import { ArrowRight, Sparkles } from "lucide-react"

import { SEEDANCE_LAUNCH } from "../../../../marketing/seedanceLaunch"
import { useSeedanceLaunch } from "../../../../marketing/useSeedanceLaunch"

/**
 * One-line Seedance entry point on the studio home, where the Genjutsu
 * workbench would otherwise hide it. Loud during Seedance Week, quiet after.
 */
export function SeedanceStudioStrip({ onOpen }: { onOpen: () => void }) {
  const { phase } = useSeedanceLaunch()
  const live = phase === "live"

  return (
    <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-fy-md border border-fy-accent/30 bg-fy-accent/10 px-4 py-2.5 text-sm sm:mx-6">
      <div className="flex min-w-0 items-center gap-2">
        <Sparkles className="size-4 shrink-0 text-fy-accent-300" />
        <span className="truncate text-fy-text">
          <span className="font-semibold">New: Seedance 2.5.</span>{" "}
          <span className="text-fy-muted">
            {live
              ? `Text to video, up to 2 minutes. ${SEEDANCE_LAUNCH.name}: +${SEEDANCE_LAUNCH.bonusPercent}% bonus credits on every purchase.`
              : phase === "upcoming"
                ? "Early access before the Dec 1 launch. Type an idea and get a full video, no clip needed."
                : "Type an idea and get a full video, no clip needed."}
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="group inline-flex shrink-0 items-center gap-1 font-semibold text-fy-text hover:text-fy-accent-300"
      >
        Try Seedance
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}
