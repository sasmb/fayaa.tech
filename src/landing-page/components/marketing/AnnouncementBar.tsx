import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, X } from "lucide-react";

import type { LandingContent } from "../../../marketing/landingContent";
import { trackMarketingEvent } from "../../../marketing/analytics";

export function AnnouncementBar({ content }: { content: LandingContent["announcement"] }) {
  const [open, setOpen] = useState(true);
  if (!content.enabled || !open) return null;
  return (
    <div className="relative z-50 border-b border-fy-line bg-fy-surface-1">
      <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-3 px-10 py-2 text-xs sm:text-sm">
        <span className="fy-heat-bg hidden rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-fy-on-accent uppercase sm:inline">
          {content.badge}
        </span>
        <span className="truncate text-fy-muted">{content.message}</span>
        <Link
          to={content.cta.href}
          onClick={() => trackMarketingEvent(content.cta.event ?? "Announcement Click")}
          className="group inline-flex shrink-0 items-center gap-1 font-semibold text-fy-text hover:text-fy-accent-300"
        >
          {content.cta.label}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => setOpen(false)}
        className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-fy-subtle hover:bg-white/10 hover:text-fy-text"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
