import { cva, type VariantProps } from "class-variance-authority";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "../utils";

export const fyButtonVariants = cva(
  "group/fy-btn relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-fy-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fy-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-fy-ink active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** The one action we want most on a screen. */
        primary:
          "bg-fy-accent text-fy-on-accent hover:bg-fy-accent-hover hover:shadow-[0_10px_40px_-10px_rgb(255_91_31/0.8)]",
        /** Heat gradient for hero moments. Use sparingly. */
        heat: "fy-heat-bg text-fy-on-accent hover:shadow-[0_10px_40px_-8px_rgb(255_91_31/0.9)] hover:brightness-110",
        /** White, high-contrast secondary action. */
        light: "bg-fy-text text-fy-ink hover:bg-white",
        /** Frosted glass for actions that sit on top of video. */
        glass: "fy-glass text-fy-text hover:border-fy-line-strong hover:bg-white/10",
        /** Low-emphasis outline. */
        outline: "border border-fy-line-strong bg-transparent text-fy-text hover:border-white/30 hover:bg-white/5",
        ghost: "bg-transparent text-fy-muted hover:bg-white/5 hover:text-fy-text",
        danger: "border border-fy-danger/30 bg-fy-danger/10 text-rose-200 hover:bg-fy-danger/20 hover:text-white",
      },
      size: {
        sm: "h-8 rounded-fy-sm px-3 text-xs",
        md: "h-10 rounded-fy-md px-4 text-sm",
        lg: "h-12 rounded-fy-md px-6 text-sm",
        xl: "h-14 rounded-fy-lg px-8 text-base",
        icon: "size-10 rounded-fy-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type FyButtonStyleProps = VariantProps<typeof fyButtonVariants> & {
  className?: string;
  children?: ReactNode;
};

export function FyButton({
  variant,
  size,
  className,
  children,
  ...rest
}: FyButtonStyleProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn(fyButtonVariants({ variant, size }), className)} {...rest}>
      {children}
    </button>
  );
}

/**
 * Link styled as a button. Internal paths use the router; hashes and
 * absolute URLs render a plain anchor.
 */
export function FyLinkButton({
  to,
  variant,
  size,
  className,
  children,
  ...rest
}: FyButtonStyleProps & { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const classes = cn(fyButtonVariants({ variant, size }), className);
  if (to.startsWith("/") && !to.startsWith("//")) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={to} className={classes} {...rest}>
      {children}
    </a>
  );
}
