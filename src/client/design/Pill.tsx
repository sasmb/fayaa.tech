import type { ReactNode } from "react";

import { cn } from "../utils";

type PillTone = "accent" | "neutral" | "live" | "soon" | "success" | "warning" | "danger";

const TONES: Record<PillTone, string> = {
  accent: "border-fy-accent/30 bg-fy-accent/10 text-fy-accent-300",
  neutral: "border-fy-line-strong bg-white/5 text-fy-muted",
  live: "border-fy-accent/40 bg-fy-accent text-fy-on-accent",
  soon: "border-fy-line-strong bg-black/60 text-fy-text backdrop-blur-md",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  danger: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

export function Pill({
  tone = "neutral",
  pulse = false,
  className,
  children,
}: {
  tone?: PillTone;
  /** Adds a breathing dot, for "live" states. */
  pulse?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-[0.14em] whitespace-nowrap uppercase",
        TONES[tone],
        className
      )}
    >
      {pulse ? (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}
