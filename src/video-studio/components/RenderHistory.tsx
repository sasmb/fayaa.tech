import React, { useState } from "react";
import { useAuth } from "wasp/client/auth";
import { toggleVideoPublicVisibility } from "wasp/client/operations";
import { VideoTask } from "wasp/entities";
import { RefreshCw, Film, AlertCircle, Download, Globe, Lock } from "lucide-react";
import { FayaaWatermark } from "./FayaaWatermark";
import { useWatermark } from "../lib/watermark-store";
import { downloadMedia } from "../hf/lib/studio/download-media";

interface RenderHistoryProps {
  tasks: VideoTask[];
  onRefresh: () => void;
}

export function RenderHistory({ tasks, onRefresh }: RenderHistoryProps) {
  const { data: authUser } = useAuth();
  const canPublishPublic = Boolean(authUser?.canPublishPublic || authUser?.isAdmin);
  const { watermarkEnabled } = useWatermark(true);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleTogglePublic = async (task: VideoTask) => {
    if (!canPublishPublic || togglingTaskId === task.id) return;
    setTogglingTaskId(task.id);
    try {
      await toggleVideoPublicVisibility({
        taskId: task.id,
        isPublic: !task.isPublic,
        publicCategory: "ugc",
      });
      onRefresh();
    } finally {
      setTogglingTaskId(null);
    }
  };
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Your Render History</h2>
          <p className="text-xs text-neutral-400">
            All completed and in-progress Genjutsu motion transfers.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task: VideoTask) => (
            <div
              key={task.id}
              className="bg-[#0e0e14] border border-white/10 rounded-xl overflow-hidden p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate max-w-[180px]">
                  {task.model}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.status === "COMPLETED"
                      ? "bg-emerald-400/20 text-emerald-300"
                      : task.status === "FAILED"
                      ? "bg-rose-400/20 text-rose-300"
                      : "bg-amber-400/20 text-amber-300"
                  }`}
                >
                  {task.status}
                </span>
              </div>

              {task.outputVideoUrl ? (
                <div className="relative rounded-lg overflow-hidden min-h-[220px] max-h-[360px] aspect-video bg-black/95 flex items-center justify-center border border-white/10 group">
                  <video
                    src={task.outputVideoUrl}
                    controls
                    playsInline
                    className="max-h-full max-w-full object-contain"
                  />
                  {watermarkEnabled && (
                    <FayaaWatermark size="large" position="bottom-right" avoidControls />
                  )}
                </div>
              ) : (
                <div className="aspect-[9/16] rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center p-4">
                  {task.status === "PROCESSING" ? (
                    <>
                      <RefreshCw className="w-6 h-6 text-lime-400 animate-spin mb-2" />
                      <span className="text-xs text-neutral-300">Rendering video...</span>
                      <span className="text-[10px] text-neutral-500 mt-1">Buzzer will notify you</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-6 h-6 text-rose-400 mb-2" />
                      <span className="text-xs text-rose-300">Processing Failed</span>
                      <span className="text-[10px] text-neutral-500 mt-1">{task.error}</span>
                    </>
                  )}
                </div>
              )}

              <div className="text-[11px] text-neutral-500 flex items-center justify-between gap-2">
                <span>{new Date(task.createdAt).toLocaleTimeString()}</span>
                <div className="flex items-center gap-2.5">
                  {canPublishPublic && task.status === "COMPLETED" && (
                    <button
                      type="button"
                      disabled={togglingTaskId === task.id}
                      onClick={() => void handleTogglePublic(task)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition-colors ${
                        task.isPublic
                          ? "border-[#C8FF00]/40 bg-[#C8FF00]/15 text-[#C8FF00] hover:bg-[#C8FF00]/25"
                          : "border-white/15 bg-white/5 text-neutral-300 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {task.isPublic ? (
                        <>
                          <Globe className="w-3 h-3" /> Public
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" /> Make Public
                        </>
                      )}
                    </button>
                  )}
                  {task.outputVideoUrl && (
                    <button
                      type="button"
                      disabled={downloadingId === task.id}
                      onClick={() => {
                        if (!task.outputVideoUrl) return;
                        setDownloadingId(task.id);
                        void downloadMedia(
                          task.outputVideoUrl,
                          `fayaa-${task.id}.mp4`,
                          { watermark: watermarkEnabled }
                        ).finally(() => setDownloadingId(null));
                      }}
                      className="text-lime-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-60"
                    >
                      <Download className="w-3 h-3" />{" "}
                      {downloadingId === task.id
                        ? watermarkEnabled
                          ? "Watermarking..."
                          : "Downloading..."
                        : "Download MP4"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Film className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-300">No videos rendered yet</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Select a motion template on the left and hit Generate!
          </p>
        </div>
      )}
    </div>
  );
}
