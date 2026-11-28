import { ArrowRight, Gift } from "lucide-react";
import { Link } from "react-router";

import { Pill } from "../client/design";
import { cn } from "../client/utils";
import { trackMarketingEvent } from "./analytics";
import { SEEDANCE_LAUNCH, SEEDANCE_LAUNCH_COPY } from "./seedanceLaunch";
import { useSeedanceLaunch } from "./useSeedanceLaunch";

/** Compact Seedance Week strip for pricing and checkout surfaces. Hidden outside the launch. */
export function SeedanceLaunchBanner({ className }: { className?: string }) {
  const { phase } = useSeedanceLaunch();
  if (phase !== "upcoming" && phase !== "live") return null;
  const live = phase === "live";

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-fy-lg border border-fy-accent/30 bg-fy-accent/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Gift className="mt-0.5 size-5 shrink-0 text-fy-accent-300" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={live ? "live" : "accent"} pulse={live}>
              {live ? SEEDANCE_LAUNCH_COPY.badge.live : SEEDANCE_LAUNCH_COPY.badge.upcoming}
            </Pill>
            <span className="text-sm font-semibold text-fy-text">{SEEDANCE_LAUNCH.name}</span>
          </div>
          <p className="mt-1 text-sm text-fy-muted">
            {live
              ? `Every pack and new plan bought now gets +${SEEDANCE_LAUNCH.bonusPercent}% bonus credits, added automatically.`
              : `Seedance 2.5 launches Dec 1. Buy during launch week for +${SEEDANCE_LAUNCH.bonusPercent}% bonus credits.`}
          </p>
        </div>
      </div>
      <Link
        to={SEEDANCE_LAUNCH.path}
        onClick={() => trackMarketingEvent("Seedance Banner Click")}
        className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-fy-text hover:text-fy-accent-300"
      >
        About Seedance
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
