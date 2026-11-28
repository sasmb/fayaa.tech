import type { ReactNode } from "react";

import { cn } from "../utils";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Actions on the right (desktop) or under the text (mobile). */
  actions?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/** Consistent section header: mono eyebrow, display title, muted copy. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  align = "left",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-6",
        centered ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className={cn("flex max-w-3xl flex-col gap-3", centered && "items-center")}>
        {eyebrow ? <span className="fy-eyebrow">{eyebrow}</span> : null}
        <h2 className="fy-display text-4xl text-fy-text sm:text-5xl lg:text-6xl">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-base text-fy-muted sm:text-lg">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </Reveal>
  );
}
