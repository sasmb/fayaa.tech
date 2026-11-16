import { useCallback, useEffect, useState } from "react"

const WATERMARK_STORAGE_KEY = "fayaa_watermark_enabled"
const WATERMARK_EVENT = "fayaa-watermark-change"

function readStoredWatermark(fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback
  try {
    const stored = localStorage.getItem(WATERMARK_STORAGE_KEY)
    return stored !== null ? stored === "true" : fallback
  } catch {
    return fallback
  }
}

/** Read current watermark preference synchronously (defaults to true). */
export function isWatermarkEnabled(fallback = true): boolean {
  return readStoredWatermark(fallback)
}

/**
 * Hook to manage FAYAA marketing watermark state, synchronized across all
 * mounted components in the same tab and persisted in localStorage.
 */
export function useWatermark(initialDefault = true) {
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(() =>
    readStoredWatermark(initialDefault)
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const sync = () => {
      setWatermarkEnabled(readStoredWatermark(initialDefault))
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === WATERMARK_STORAGE_KEY) sync()
    }
    window.addEventListener(WATERMARK_EVENT, sync)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(WATERMARK_EVENT, sync)
      window.removeEventListener("storage", onStorage)
    }
  }, [initialDefault])

  const setWatermark = useCallback((enabled: boolean) => {
    setWatermarkEnabled(enabled)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(WATERMARK_STORAGE_KEY, String(enabled))
      } catch {
        // localStorage disabled / private mode fallback
      }
      window.dispatchEvent(new Event(WATERMARK_EVENT))
    }
  }, [])

  const toggleWatermark = useCallback(() => {
    const next = !readStoredWatermark(initialDefault)
    setWatermark(next)
  }, [initialDefault, setWatermark])

  return {
    watermarkEnabled,
    toggleWatermark,
    setWatermark,
  }
}
