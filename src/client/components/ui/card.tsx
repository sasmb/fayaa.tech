import { cva, VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../utils";

const cardVariants = cva(
  "rounded-2xl border shadow-[0_1px_0_0_rgb(255_255_255/0.04)_inset,0_20px_50px_-24px_rgb(0_0_0/0.6)] transition-all duration-300 hover:border-foreground/15",
  {
    variants: {
      variant: {
        default: "bg-card bg-[linear-gradient(180deg,rgb(255_255_255/0.03),transparent_60%)] text-card-foreground",
        accent: "bg-card-accent text-card-accent-foreground hover:scale-[1.02]",
        faded: "text-card-faded-foreground scale-95 opacity-50",
        bento:
          "bg-card-subtle text-card-subtle-foreground hover:scale-[1.02] border-none shadow-none",
      },
    },
  },
);

function Card({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
