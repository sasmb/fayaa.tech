import { execFile } from "node:child_process";
import dns from "node:dns/promises";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { Request, Response } from "express";

import { getWatermarkPngBuffer } from "./watermarkAsset";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

const MAX_MEDIA_BYTES = 150 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 45_000;
const FFMPEG_TIMEOUT_MS = 120_000;

let cachedWatermarkPath: string | null = null;

function resolveFfmpegPath(): string {
  const installer = require("@ffmpeg-installer/ffmpeg") as { path?: string };
  if (!installer?.path) {
    throw new Error("FFmpeg binary is not available");
  }
  return installer.path;
}

async function ensureWatermarkPngFile(): Promise<string> {
  if (cachedWatermarkPath) {
    try {
      await fs.access(cachedWatermarkPath);
      return cachedWatermarkPath;
    } catch {
      cachedWatermarkPath = null;
    }
  }
  const targetPath = path.join(os.tmpdir(), "fayaa-ai-watermark-v1.png");
  await fs.writeFile(targetPath, getWatermarkPngBuffer());
  cachedWatermarkPath = targetPath;
  return targetPath;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const norm = ip.toLowerCase();
    if (norm === "::1" || norm === "::") return true;
    if (norm.startsWith("fe80:") || norm.startsWith("fc") || norm.startsWith("fd")) {
      return true;
    }
    if (norm.startsWith("::ffff:")) {
      return isPrivateIp(norm.slice("::ffff:".length));
    }
    return false;
  }
  return true;
}

async function validateExternalMediaUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid media URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Only https media URLs are supported");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Disallowed media host");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Disallowed private IP");
  } else {
    const records = await dns.lookup(host, { all: true });
    if (records.length === 0 || records.some((r) => isPrivateIp(r.address))) {
      throw new Error("Disallowed resolved address");
    }
  }
  return parsed;
}

function sanitizeFilename(raw: unknown, fallbackExt: string): string {
  const base =
    typeof raw === "string" && raw.trim()
      ? path.basename(raw.trim()).replace(/[^a-zA-Z0-9._-]/g, "_")
      : `fayaa-generation.${fallbackExt}`;
  return base.includes(".") ? base : `${base}.${fallbackExt}`;
}

function inferMediaKind(
  contentType: string,
  urlPathname: string
): { kind: "video" | "image"; ext: string } {
  const mime = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  const urlExt = path.extname(urlPathname).toLowerCase().replace(".", "");

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(urlExt)) {
    const ext = mime === "image/png" || urlExt === "png" ? "png" : "jpg";
    return { kind: "image", ext };
  }
  return { kind: "video", ext: "mp4" };
}

/**
 * Burns the FAYAA AI watermark overlay onto a local video or image file via FFmpeg.
 */
export async function burnWatermarkToFile(
  inputPath: string,
  outputPath: string,
  kind: "video" | "image"
): Promise<void> {
  const ffmpegPath = resolveFfmpegPath();
  const watermarkPath = await ensureWatermarkPngFile();

  // Scale watermark proportionally (larger on both portrait 9:16 and landscape 16:9)
  // while leaving a clean margin in the bottom-right corner.
  const baseFilter =
    "[1:v][0:v]scale2ref=w='min(620\\,max(260\\,if(gte(main_w\\,main_h)\\,main_w*0.32\\,main_w*0.48)))':h='ow/mdar'[wm][base];";
  const args =
    kind === "video"
      ? [
          "-y",
          "-i",
          inputPath,
          "-i",
          watermarkPath,
          "-filter_complex",
          `${baseFilter}[base]scale=trunc(iw/2)*2:trunc(ih/2)*2[base_even];[base_even][wm]overlay='W-w-max(16\\,W*0.025)':'H-h-max(16\\,H*0.025)':format=auto`,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "22",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "copy",
          "-movflags",
          "+faststart",
          outputPath,
        ]
      : [
          "-y",
          "-i",
          inputPath,
          "-i",
          watermarkPath,
          "-filter_complex",
          `${baseFilter}[base][wm]overlay='W-w-max(16\\,W*0.025)':'H-h-max(16\\,H*0.025)':format=auto`,
          "-frames:v",
          "1",
          outputPath,
        ];

  await execFileAsync(ffmpegPath, args, {
    timeout: FFMPEG_TIMEOUT_MS,
    maxBuffer: 4 * 1024 * 1024,
  });
}

async function fetchExternalMedia(initialUrl: URL): Promise<globalThis.Response> {
  let currentUrl = initialUrl;
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(currentUrl.toString(), {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect missing location");
      currentUrl = await validateExternalMediaUrl(new URL(loc, currentUrl).toString());
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}

export const downloadWatermarkedMedia = async (
  request: Request,
  response: Response,
  _context?: unknown
): Promise<void> => {
  const rawUrl = typeof request.query.url === "string" ? request.query.url : "";
  if (!rawUrl) {
    response.status(400).json({ error: "Missing url query parameter" });
    return;
  }

  let validatedUrl: URL;
  try {
    validatedUrl = await validateExternalMediaUrl(rawUrl);
  } catch (err) {
    response.status(400).json({
      error: err instanceof Error ? err.message : "Invalid media URL",
    });
    return;
  }

  const wmParam =
    typeof request.query.watermark === "string"
      ? request.query.watermark.toLowerCase()
      : "1";
  const shouldWatermark = wmParam !== "0" && wmParam !== "false";

  let upstream: globalThis.Response;
  try {
    upstream = await fetchExternalMedia(validatedUrl);
  } catch {
    response.status(502).json({ error: "Failed to fetch upstream media" });
    return;
  }

  if (!upstream.ok) {
    response.status(502).json({ error: `Upstream returned ${upstream.status}` });
    return;
  }

  const contentLength = Number(upstream.headers.get("content-length") || "0");
  if (contentLength > MAX_MEDIA_BYTES) {
    response.status(413).json({ error: "Media file exceeds size limit" });
    return;
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const mime = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (
    mime &&
    !mime.startsWith("video/") &&
    !mime.startsWith("image/") &&
    mime !== "application/octet-stream"
  ) {
    response.status(415).json({ error: `Unsupported media content-type: ${mime}` });
    return;
  }
  const { kind, ext } = inferMediaKind(contentType, validatedUrl.pathname);
  const inputBuffer = Buffer.from(await upstream.arrayBuffer());
  if (inputBuffer.length === 0 || inputBuffer.length > MAX_MEDIA_BYTES) {
    response.status(413).json({ error: "Invalid media payload size" });
    return;
  }

  const downloadName = sanitizeFilename(request.query.filename, ext);

  if (!shouldWatermark) {
    response.setHeader("Content-Type", contentType || (kind === "video" ? "video/mp4" : "image/png"));
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadName}"`
    );
    response.send(inputBuffer);
    return;
  }

  let workDir: string | null = null;
  try {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), "fayaa-wm-"));
    const inputExt = path.extname(validatedUrl.pathname).replace(".", "") || ext;
    const inputPath = path.join(workDir, `input.${inputExt}`);
    const outputExt = kind === "video" ? "mp4" : ext;
    const outputPath = path.join(workDir, `output.${outputExt}`);

    await fs.writeFile(inputPath, inputBuffer);
    await burnWatermarkToFile(inputPath, outputPath, kind);

    const outBuffer = await fs.readFile(outputPath);
    const finalName = downloadName.replace(/\.[^.]+$/, `.${outputExt}`);
    response.setHeader(
      "Content-Type",
      kind === "video" ? "video/mp4" : outputExt === "png" ? "image/png" : "image/jpeg"
    );
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${finalName}"`
    );
    response.send(outBuffer);
  } catch (err) {
    console.error("[fayaa] watermark download failed:", err);
    response.status(500).json({ error: "Failed to render watermarked download" });
  } finally {
    if (workDir) {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
};
