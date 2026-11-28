import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

import { useReducedMotion } from "./useReducedMotion";

export const FY_EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  /** Seconds to wait before animating; use with index * 0.06 for staggers. */
  delay?: number;
  /** Starting vertical offset in px. */
  y?: number;
  /** Play again every time it scrolls into view instead of once. */
  repeat?: boolean;
}

/**
 * Fades and lifts content into place the first time it scrolls into view.
 * Renders statically when the viewer prefers reduced motion.
 */
export function Reveal({ children, delay = 0, y = 28, repeat = false, ...rest }: RevealProps) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <motion.div {...rest}>{children}</motion.div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: !repeat, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: FY_EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
