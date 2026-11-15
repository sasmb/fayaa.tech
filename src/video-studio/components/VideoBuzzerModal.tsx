import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { FayaaWatermark } from "./FayaaWatermark";
import { useWatermark } from "../lib/watermark-store";

interface VideoBuzzerModalProps {
  videoUrl: string | null;
  onClose: () => void;
}

export function VideoBuzzerModal({ videoUrl, onClose }: VideoBuzzerModalProps) {
  const { watermarkEnabled } = useWatermark(true);
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
            className="w-full max-w-md bg-[#101015] border border-lime-400/40 rounded-2xl shadow-2xl p-4 space-y-4"
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
                <FayaaWatermark size="large" position="bottom-right" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={videoUrl}
                download="genjutsu-motion.mp4"
                className="flex-1 py-2.5 bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-lime-500/20"
              >
                <Download className="w-4 h-4" /> Download Video
              </a>
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
