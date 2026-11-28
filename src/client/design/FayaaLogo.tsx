import { Link } from "react-router";

import { cn } from "../utils";

/** The FAYAA flame-wave mark. */
export function FayaaMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4.5 9.5C4.5 6.5 7.5 5 10 6.5C12.5 8 11.5 16 14 17.5C16.5 19 19.5 17.5 19.5 14.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M4.5 15.5C4.5 12.5 7.5 11 10 12.5C12.5 14 11.5 6 14 7.5C16.5 9 19.5 7.5 19.5 5.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Mark + wordmark. Links home unless `to` is null. */
export function FayaaLogo({
  to = "/",
  className,
  compact = false,
}: {
  to?: string | null;
  className?: string;
  compact?: boolean;
}) {
  const content = (
    <span className={cn("group/logo flex items-center gap-2.5", className)}>
      <span className="fy-heat-bg relative flex size-9 items-center justify-center rounded-fy-md text-fy-on-accent shadow-[0_8px_24px_-8px_rgb(255_91_31/0.8)] transition-transform duration-500 ease-fy-out group-hover/logo:rotate-[-8deg] group-hover/logo:scale-105">
        <FayaaMark className="size-5" />
      </span>
      {compact ? null : (
        <span className="font-display text-lg font-bold tracking-[-0.04em] text-fy-text">FAYAA</span>
      )}
    </span>
  );
  if (to === null) return content;
  return (
    <Link to={to} aria-label="FAYAA home" className="shrink-0 rounded-fy-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fy-accent/70">
      {content}
    </Link>
  );
}
