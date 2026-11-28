import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { FayaaWatermark } from "./FayaaWatermark";
import { useWatermark } from "../lib/watermark-store";
import { downloadMedia } from "../hf/lib/studio/download-media";

interface VideoBuzzerModalProps {
  videoUrl: string | null;
  onClose: () => void;
}

export function VideoBuzzerModal({ videoUrl, onClose }: VideoBuzzerModalProps) {
  const { watermarkEnabled } = useWatermark(true);
  const [downloading, setDownloading] = useState(false);
  React.useEffect(() => {
    if (!videoUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [videoUrl, onClose]);

  return (
    <AnimatePresence>
      {videoUrl && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#101015] border border-fy-accent-400/40 rounded-2xl shadow-2xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <h3 className="text-sm font-bold text-white">Your Video is Ready! (Buzzer Alert)</h3>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden min-h-[220px] max-h-[60vh] aspect-video bg-black/95 border border-white/10 flex items-center justify-center group">
              <video
                src={videoUrl}
                controls
                playsInline
                autoPlay
                className="max-h-full max-w-full object-contain"
              />
              {watermarkEnabled && (
                <FayaaWatermark size="large" position="bottom-right" avoidControls />
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={downloading}
                onClick={() => {
                  if (!videoUrl) return;
                  setDownloading(true);
                  void downloadMedia(videoUrl, "fayaa-genjutsu-motion.mp4", {
                    watermark: watermarkEnabled,
                  }).finally(() => setDownloading(false));
                }}
                className="flex-1 py-2.5 bg-fy-accent-400 hover:bg-fy-accent-300 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-fy-accent-500/20 cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4" />{" "}
                {downloading
                  ? watermarkEnabled
                    ? "Watermarking MP4..."
                    : "Downloading..."
                  : "Download Video"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
