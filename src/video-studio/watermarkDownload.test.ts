import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"

import {
  burnWatermarkToFile,
  downloadWatermarkedMedia,
} from "./watermarkDownload"

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

function mockResponse() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
    setHeader() {
      return this
    },
    send(payload: unknown) {
      this.body = payload
      return this
    },
  }
  return res
}

describe("watermarkDownload", () => {
  it("rejects missing, non-https, and private-IP URLs before fetching", async () => {
    for (const url of [
      "",
      "http://example.com/video.mp4",
      "https://127.0.0.1/video.mp4",
      "https://169.254.169.254/latest/meta-data",
      "https://localhost/video.mp4",
    ]) {
      const req: any = { query: url ? { url } : {} }
      const res = mockResponse()
      await downloadWatermarkedMedia(req, res)
      expect(res.statusCode).toBe(400)
    }
  })

  it("burns watermark onto MP4 video and PNG image outputs via bundled FFmpeg", async () => {
    const { path: ffmpegPath } = require("@ffmpeg-installer/ffmpeg") as {
      path: string
    }
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fayaa-wm-test-"))
    try {
      const inMp4 = path.join(tmpDir, "in.mp4")
      const outMp4 = path.join(tmpDir, "out.mp4")
      const inPng = path.join(tmpDir, "in.png")
      const outPng = path.join(tmpDir, "out.png")

      await execFileAsync(ffmpegPath, [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=0x1e293b:s=640x360:d=0.5",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        inMp4,
      ])
      await burnWatermarkToFile(inMp4, outMp4, "video")

      const outMp4Stat = await fs.stat(outMp4)
      expect(outMp4Stat.size).toBeGreaterThan(1000)

      await execFileAsync(ffmpegPath, [
        "-y",
        "-i",
        inMp4,
        "-vframes",
        "1",
        inPng,
      ])
      await burnWatermarkToFile(inPng, outPng, "image")

      const [inPngBuf, outPngBuf] = await Promise.all([
        fs.readFile(inPng),
        fs.readFile(outPng),
      ])
      expect(outPngBuf.length).toBeGreaterThan(1000)
      expect(Buffer.compare(inPngBuf, outPngBuf)).not.toBe(0)
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true })
    }
  }, 30_000)
})
