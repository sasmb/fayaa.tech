import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "../utils";
import { useReducedMotion } from "./useReducedMotion";

export type AutoplayMode = "visible" | "hover" | "always";

export interface AutoplayVideoProps {
  src?: string;
  poster?: string;
  alt?: string;
  /**
   * visible: plays while on screen, pauses when scrolled away (default).
   * hover: shows the poster and plays while hovered or focused.
   * always: starts as soon as it can (use for the hero only).
   */
  mode?: AutoplayMode;
  className?: string;
  videoClassName?: string;
  style?: CSSProperties;
  /** Seconds to start from; handy for skipping a slow intro in a clip. */
  startAt?: number;
  /** Rendered above the media (labels, gradients, CTAs). */
  children?: ReactNode;
  /** Load priority. The hero should be eager; everything else lazy. */
  priority?: boolean;
  /** Slow push-in on the poster when there is no video to play. */
  kenBurns?: boolean;
}

function prefersDataSaving(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || /(^|-)2g$/.test(connection.effectiveType ?? "");
}

/**
 * The one video element every FAYAA surface uses.
 *
 * Muted, looping and inline so browsers allow autoplay. It only downloads
 * when it is near the viewport, pauses when scrolled away (pages can hold
 * dozens of clips without melting a phone), fades in over its poster, and
 * falls back to the poster for reduced-motion, data-saver or broken sources.
 */
export function AutoplayVideo({
  src,
  poster,
  alt = "",
  mode = "visible",
  className,
  videoClassName,
  style,
  startAt,
  children,
  priority = false,
  kenBurns = true,
}: AutoplayVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const [near, setNear] = useState(priority);
  const [visible, setVisible] = useState(priority && mode !== "hover");
  const [hovered, setHovered] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saveData] = useState(prefersDataSaving);

  const canPlay = Boolean(src) && !failed && !reducedMotion && !saveData;

  // Lazy-load when within ~one screen, and track real visibility for play/pause.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !canPlay || typeof IntersectionObserver === "undefined") return;
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setNear(true);
      },
      { rootMargin: "600px 0px" }
    );
    const visibleObserver = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.25 }
    );
    nearObserver.observe(el);
    visibleObserver.observe(el);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
    };
  }, [canPlay]);

  const shouldPlay =
    canPlay &&
    near &&
    (mode === "always" || (mode === "visible" && visible) || (mode === "hover" && hovered));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (shouldPlay) {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {
          /* Autoplay can be refused (low-power mode); the poster stays up. */
        });
      }
    } else if (!video.paused) {
      video.pause();
    }
  }, [shouldPlay, near]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-fy-surface-2", className)}
      style={style}
      onMouseEnter={mode === "hover" ? () => setHovered(true) : undefined}
      onMouseLeave={mode === "hover" ? () => setHovered(false) : undefined}
      onFocus={mode === "hover" ? () => setHovered(true) : undefined}
      onBlur={mode === "hover" ? () => setHovered(false) : undefined}
    >
      {poster ? (
        <img
          src={poster}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-fy-out",
            ready && canPlay && (mode !== "hover" || hovered) ? "opacity-0" : "opacity-100",
            kenBurns && !src && !reducedMotion && "animate-fy-kenburns",
            videoClassName
          )}
        />
      ) : null}
      {!poster && !ready ? <div aria-hidden="true" className="fy-skeleton absolute inset-0" /> : null}

      {canPlay && near ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          autoPlay={mode === "always"}
          preload={priority ? "auto" : "metadata"}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
          onLoadedMetadata={(e) => {
            if (startAt && startAt > 0) e.currentTarget.currentTime = startAt;
          }}
          onCanPlay={() => setReady(true)}
          onError={() => setFailed(true)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-fy-out",
            ready && (mode !== "hover" || hovered || !poster) ? "opacity-100" : "opacity-0",
            videoClassName
          )}
        />
      ) : null}

      {children}
    </div>
  );
}
