import React, { useState } from "react";
import { Check, Volume2, VolumeX, Plus, Sparkles } from "lucide-react";
import { MotionTemplate } from "../types";

interface MotionLibraryGridProps {
  templates: MotionTemplate[];
  selectedVideoUrl: string;
  onSelectTemplate: (template: MotionTemplate) => void;
  onAddCustomTemplate?: (template: MotionTemplate) => void;
}

export function MotionLibraryGrid({
  templates,
  selectedVideoUrl,
  onSelectTemplate,
  onAddCustomTemplate,
}: MotionLibraryGridProps) {
  const [activeMutedMap, setActiveMutedMap] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newTag, setNewTag] = useState("VIRAL MOTION");
  const [newDuration, setNewDuration] = useState("10s");

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newVideoUrl.trim()) return;

    const customTpl: MotionTemplate = {
      id: `custom-tpl-${Date.now()}`,
      title: newTitle.trim(),
      tag: newTag.trim().toUpperCase(),
      duration: newDuration.trim(),
      category: "custom",
      videoUrl: newVideoUrl.trim(),
      posterUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80",
    };

    if (onAddCustomTemplate) {
      onAddCustomTemplate(customTpl);
    }
    onSelectTemplate(customTpl);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewVideoUrl("");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Curated Motion Templates</span>
            <span className="text-[10px] bg-lime-400/20 text-lime-400 font-mono px-2 py-0.5 rounded-full">
              {templates.length} TEMPLATES
            </span>
          </h2>
          <p className="text-xs text-neutral-400">
            Click any viral dance, model walk, or athletic clip to instantly use it as your driving motion.
          </p>
        </div>

        {/* Button to add template from Higgsfield or custom URL */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="text-xs bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-lime-400" />
          <span>Add Motion Template</span>
        </button>
      </div>

      {/* Grid of Vertical 9:16 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {templates.map((template) => {
          const isSelected = selectedVideoUrl === template.videoUrl;
          const isMuted = activeMutedMap[template.id] ?? true;

          return (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={`group relative rounded-xl overflow-hidden aspect-[9/16] bg-neutral-900 border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between p-3 ${
                isSelected
                  ? "border-lime-400 ring-2 ring-lime-400/30 shadow-lg shadow-lime-500/20"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              {/* Video Preview Loop */}
              <video
                src={template.videoUrl}
                poster={template.posterUrl}
                muted={isMuted}
                loop
                playsInline
                autoPlay
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

              {/* Top Badges */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded-full border border-white/10">
                  {template.duration}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-bold bg-lime-400 text-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Check className="w-3 h-3" /> Selected
                  </span>
                )}
              </div>

              {/* Bottom Info & Audio Toggle */}
              <div className="relative z-10 flex items-end justify-between">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-lime-400 uppercase tracking-wider block">
                    {template.tag}
                  </span>
                  <h3 className="text-xs font-bold text-white line-clamp-1">
                    {template.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMutedMap((prev) => ({
                      ...prev,
                      [template.id]: !isMuted,
                    }));
                  }}
                  className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur border border-white/20 flex items-center justify-center text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Template Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#121217] border border-white/15 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime-400" />
              <span>Add Higgsfield Motion Template</span>
            </h3>
            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 font-medium">Template Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Shuffled Dance"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-lime-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 font-medium">Video MP4 URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://.../motion.mp4"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-400 font-medium">Tag / Category</label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 font-medium">Duration</label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs rounded-lg transition-colors"
                >
                  Save & Select
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 bg-white/10 text-white text-xs rounded-lg hover:bg-white/15"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
