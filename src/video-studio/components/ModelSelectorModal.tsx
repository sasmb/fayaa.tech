import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check, Volume2 } from "lucide-react";
import { MotionModel } from "../types";

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: MotionModel[];
  selectedModel: MotionModel;
  onSelectModel: (model: MotionModel) => void;
}

export function ModelSelectorModal({
  isOpen,
  onClose,
  models,
  selectedModel,
  onSelectModel,
}: ModelSelectorModalProps) {
  const [search, setSearch] = useState("");

  const filtered = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] bg-[#16171B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
          >
            {/* Search Header */}
            <div className="p-3.5 border-b border-white/10">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-[#1F2025] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D9FF00]"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="p-2.5 overflow-y-auto space-y-1 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 px-2 py-1">
                <span>✦</span>
                <span>Featured models</span>
              </div>

              {filtered.map((model) => {
                const isSelected = selectedModel.id === model.id;
                const isSound = model.id.includes("wan") || model.badge === "SOUND";

                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.08] border-[#D9FF00]/40 text-white"
                        : "border-transparent hover:bg-white/[0.04] text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Provider Icon Square */}
                      <div className="w-9 h-9 rounded-xl bg-[#23242A] border border-white/10 flex items-center justify-center shrink-0">
                        {model.id.includes("genjutsu-light") ? (
                          <span className="text-xs font-black text-[#D9FF00]">⚡</span>
                        ) : (
                          <span className="text-xs font-black text-amber-400">👑</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {model.name}
                          </span>
                          {model.badge && (
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                                model.badgeColor || "bg-[#D9FF00] text-black"
                              }`}
                            >
                              {model.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>💎 {model.resolution}</span>
                          <span>• ⏱ {model.durationRange}</span>
                          {model.usdPerSecByRes && (
                            <span className="text-[#D9FF00]">
                              • from ${model.usdPerSecByRes["480p"].toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}/s ({model.creditsPer5s} cr / 5s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#D9FF00] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
