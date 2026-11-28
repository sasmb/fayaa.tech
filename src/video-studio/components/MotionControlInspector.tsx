import React, { useState } from "react";
import {
  Film,
  Video,
  Image as ImageIcon,
  ChevronDown,
  X,
  RefreshCw,
} from "lucide-react";
import {
  MotionModel,
  SceneControlMode,
  VideoQuality,
  StudioSubTab,
  MotionSubMode,
} from "../types";

interface MotionControlInspectorProps {
  // Tabs & Modes
  activeSubTab: StudioSubTab;
  onSubTabChange: (tab: StudioSubTab) => void;
  motionSubMode: MotionSubMode;
  onMotionSubModeChange: (mode: MotionSubMode) => void;

  // Assets
  characterImageUrl: string;
  onCharacterImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCharacterImage: () => void;
  isUploadingImage: boolean;

  referenceVideoUrl: string;
  referenceVideoTitle: string;
  onReferenceVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearReferenceVideo: () => void;
  onOpenLibrary: () => void;
  isUploadingVideo: boolean;

  // Model & Settings
  selectedModel: MotionModel;
  onOpenModelModal: () => void;
  quality: VideoQuality;
  onQualityChange: (q: VideoQuality) => void;

  sceneControlEnabled: boolean;
  onToggleSceneControl: () => void;
  sceneControlMode: SceneControlMode;
  onSceneControlModeChange: (mode: SceneControlMode) => void;

  prompt: string;
  onPromptChange: (p: string) => void;

  // Generation
  calculatedCredits: number;
  submitting: boolean;
  isRendering: boolean;
  onGenerate: () => void;
}

export function MotionControlInspector({
  activeSubTab,
  onSubTabChange,
  motionSubMode,
  onMotionSubModeChange,
  characterImageUrl,
  onCharacterImageUpload,
  onClearCharacterImage,
  isUploadingImage,
  referenceVideoUrl,
  referenceVideoTitle,
  onReferenceVideoUpload,
  onClearReferenceVideo,
  onOpenLibrary,
  isUploadingVideo,
  selectedModel,
  onOpenModelModal,
  quality,
  onQualityChange,
  sceneControlEnabled,
  onToggleSceneControl,
  sceneControlMode,
  onSceneControlModeChange,
  prompt,
  onPromptChange,
  calculatedCredits,
  submitting,
  isRendering,
  onGenerate,
}: MotionControlInspectorProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <aside className="w-[360px] lg:w-[400px] border-r border-white/10 bg-[#0e0e13] flex flex-col justify-between overflow-y-auto shrink-0 p-4 space-y-4">
      <div className="space-y-4">
        {/* Studio Mode Selector (Create Video / Edit Video / Motion Control) */}
        <div className="flex items-center gap-4 text-xs font-semibold border-b border-white/10 pb-2">
          <button
            onClick={() => onSubTabChange("create")}
            className={`transition-colors pb-1 ${
              activeSubTab === "create"
                ? "text-white border-b-2 border-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Create Video
          </button>
          <button
            onClick={() => onSubTabChange("edit")}
            className={`transition-colors pb-1 ${
              activeSubTab === "edit"
                ? "text-white border-b-2 border-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Edit Video
          </button>
          <button
            onClick={() => onSubTabChange("motion")}
            className={`transition-colors pb-1 relative ${
              activeSubTab === "motion"
                ? "text-white border-b-2 border-fy-accent-400 font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Motion Control
            <span className="w-1.5 h-1.5 rounded-full bg-fy-accent-400 inline-block ml-1"></span>
          </button>
        </div>

        {/* Sub-Pills: Motion Transfer vs Objects Swap */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5 text-xs">
          <button
            onClick={() => onMotionSubModeChange("transfer")}
            className={`flex-1 py-1.5 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
              motionSubMode === "transfer"
                ? "bg-white/10 text-white shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <span>🌀 Motion transfer</span>
          </button>
          <button
            onClick={() => onMotionSubModeChange("swap")}
            className={`flex-1 py-1.5 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
              motionSubMode === "swap"
                ? "bg-white/10 text-white shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <span>📦 Objects swap</span>
          </button>
        </div>

        {/* 1. CHARACTER IMAGE DROPZONE / PREVIEW */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
            <span>Character Image</span>
            {characterImageUrl && (
              <button
                onClick={onClearCharacterImage}
                className="text-[11px] text-rose-400 hover:underline flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </label>

          {characterImageUrl ? (
            <div className="relative group rounded-xl overflow-hidden border border-fy-accent-500/40 bg-black/95 aspect-[4/3] flex items-center justify-center">
              <img
                src={characterImageUrl}
                alt="Target Character"
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute top-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30 backdrop-blur pointer-events-none">
                FULL FRAME
              </span>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer backdrop-blur font-medium">
                  Replace Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onCharacterImageUpload}
                    disabled={isUploadingImage}
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-white/15 hover:border-fy-accent-400/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04] group">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-6 h-6 text-neutral-400 group-hover:text-fy-accent-400 transition-colors" />
              </div>
              <span className="text-xs font-semibold text-neutral-200">
                {isUploadingImage ? "Uploading to Cloud..." : "Add your character or photo"}
              </span>
              <span className="text-[11px] text-neutral-500 mt-0.5">
                Portrait, face, or full-body pose (PNG / JPG)
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onCharacterImageUpload}
                disabled={isUploadingImage}
              />
            </label>
          )}
        </div>

        {/* 2. REFERENCE MOTION VIDEO DROPZONE / SELECTION */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
            <span>Driving Motion Video</span>
            {referenceVideoUrl && (
              <button
                onClick={onClearReferenceVideo}
                className="text-[11px] text-rose-400 hover:underline flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </label>

          {referenceVideoUrl ? (
            <div className="relative group rounded-xl overflow-hidden border border-fy-accent-500/40 bg-black/60 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-fy-accent-400/20 text-fy-accent-400 flex items-center justify-center font-bold">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white truncate max-w-[180px]">
                    {referenceVideoTitle || "Selected Motion Video"}
                  </div>
                  <div className="text-[11px] text-fy-accent-400 font-mono">
                    Ready to extract motion
                  </div>
                </div>
              </div>
              <button
                onClick={onOpenLibrary}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-md transition-colors"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="border-2 border-dashed border-white/15 hover:border-fy-accent-400/50 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04] group">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Video className="w-5 h-5 text-neutral-400 group-hover:text-fy-accent-400 transition-colors" />
                </div>
                <span className="text-xs font-semibold text-neutral-200">
                  {isUploadingVideo ? "Uploading Video..." : "Upload reference motion video"}
                </span>
                <span className="text-[10px] text-neutral-500">Video duration: 4 to 30 seconds</span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={onReferenceVideoUpload}
                  disabled={isUploadingVideo}
                />
              </label>

              <button
                onClick={onOpenLibrary}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-fy-accent-400 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>⚡ Pick from Motion Library (Templates)</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. MODEL SELECTOR DROPDOWN */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300">Model</label>
          <button
            type="button"
            onClick={onOpenModelModal}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-left transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚡</span>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{selectedModel.name}</span>
                  {selectedModel.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${selectedModel.badgeColor}`}
                    >
                      {selectedModel.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {selectedModel.resolution} • {selectedModel.durationRange}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* 4. QUALITY SELECTOR */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300">Quality</label>
          <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5 text-xs">
            <button
              type="button"
              onClick={() => onQualityChange("720p")}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                quality === "720p"
                  ? "bg-white/15 text-white font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              720p HD
            </button>
            <button
              type="button"
              onClick={() => onQualityChange("1080p")}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                quality === "1080p"
                  ? "bg-white/15 text-white font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              1080p Full HD
            </button>
          </div>
        </div>

        {/* 5. SCENE CONTROL MODE (VIDEO VS IMAGE BACKGROUND) */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-200">Scene control mode</span>
            <button
              type="button"
              onClick={onToggleSceneControl}
              className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                sceneControlEnabled ? "bg-fy-accent-400" : "bg-neutral-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-black transition-transform ${
                  sceneControlEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {sceneControlEnabled && (
            <div className="space-y-1.5 pt-1">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onSceneControlModeChange("video")}
                  className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 border transition-all ${
                    sceneControlMode === "video"
                      ? "bg-fy-accent-400/20 border-fy-accent-400 text-fy-accent-300 font-bold"
                      : "border-white/10 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSceneControlModeChange("image")}
                  className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 border transition-all ${
                    sceneControlMode === "image"
                      ? "bg-fy-accent-400/20 border-fy-accent-400 text-fy-accent-300 font-bold"
                      : "border-white/10 text-neutral-400 hover:text-white"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image</span>
                </button>
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">
                Choose where the background should come from: the character image or the motion video.
              </p>
            </div>
          )}
        </div>

        {/* 6. ADVANCED SETTINGS ACCORDION */}
        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white"
          >
            <span>Advanced settings</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isAdvancedOpen && (
            <div className="p-3 pt-0 space-y-2 border-t border-white/5">
              <label className="text-[11px] text-neutral-400">Prompt / Styling tweaks</label>
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder="Optional: adjust outfit, lighting, or motion realism..."
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-fy-accent-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: GENERATE ACTION BUTTON */}
      <div className="pt-2">
        <button
          onClick={onGenerate}
          disabled={submitting || isRendering}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            submitting || isRendering
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              : "bg-fy-accent-400 hover:bg-fy-accent-300 text-black shadow-fy-accent-500/20 hover:scale-[1.01]"
          }`}
        >
          {submitting || isRendering ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-neutral-400" />
              <span>Buzzer Waiting (Rendering in Cloud)...</span>
            </>
          ) : (
            <>
              <span>Generate</span>
              <span className="flex items-center gap-0.5 text-xs bg-black/15 px-2 py-0.5 rounded-full">
                ✦ {calculatedCredits}
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
