import { useState } from "react"

const WATERMARK_STORAGE_KEY = "fayaa_watermark_enabled"

/**
 * Hook to manage FAYAA marketing watermark state.
 * Supports toggling between watermarked exports and clean exports for both
 * testing workflows and paying subscribers.
 */
export function useWatermark(initialDefault = true) {
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return initialDefault
    try {
      const stored = localStorage.getItem(WATERMARK_STORAGE_KEY)
      return stored !== null ? stored === "true" : initialDefault
    } catch {
      return initialDefault
    }
  })

  const toggleWatermark = () => {
    setWatermarkEnabled((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(WATERMARK_STORAGE_KEY, String(next))
        } catch {
          // localStorage disabled / private mode fallback
        }
      }
      return next
    })
  }

  const setWatermark = (enabled: boolean) => {
    setWatermarkEnabled(enabled)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(WATERMARK_STORAGE_KEY, String(enabled))
      } catch {}
    }
  }

  return {
    watermarkEnabled,
    toggleWatermark,
    setWatermark,
  }
}
