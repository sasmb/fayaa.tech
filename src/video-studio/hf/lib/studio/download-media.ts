import { config } from "wasp/client"

import { isWatermarkEnabled } from "../../../lib/watermark-store"

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
}

function filenameFromUrl(url: string, contentType?: string | null): string {
  try {
    const name = new URL(url, window.location.href).pathname.split("/").pop()
    if (name && name.includes(".")) return decodeURIComponent(name)
  } catch {}

  const extension = contentType
    ? EXTENSION_BY_TYPE[contentType.split(";")[0] ?? ""]
    : undefined
  return `fayaa-generation.${extension ?? "mp4"}`
}

function clickDownload(href: string, filename: string, openInNewTab = false) {
  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = filename
  anchor.rel = "noopener"
  if (openInNewTab) anchor.target = "_blank"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export function buildDownloadUrl(
  url: string,
  watermark: boolean,
  filename?: string
): string {
  if (!watermark || !url.startsWith("https://")) {
    return url
  }
  const params = new URLSearchParams({
    url,
    watermark: "1",
  })
  if (filename) params.set("filename", filename)
  return `${config.apiUrl}/api/video/download?${params.toString()}`
}

/**
 * Download a generated image or video. When watermark is active, routes remote
 * media through FAYAA's FFmpeg download endpoint so the exported file carries
 * the burned-in watermark; otherwise downloads the clean asset directly.
 */
export async function downloadMedia(
  url: string,
  filename?: string,
  options?: { watermark?: boolean }
): Promise<void> {
  if (typeof document === "undefined" || !url) return

  const watermark = options?.watermark ?? isWatermarkEnabled(true)
  const resolvedName = filename ?? filenameFromUrl(url)
  const targetUrl = buildDownloadUrl(url, watermark, resolvedName)

  try {
    const response = await fetch(targetUrl)
    if (!response.ok) throw new Error(`Download failed with ${response.status}`)

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    clickDownload(
      objectUrl,
      filename ?? filenameFromUrl(url, blob.type)
    )
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch {
    clickDownload(targetUrl, resolvedName, true)
  }
}
