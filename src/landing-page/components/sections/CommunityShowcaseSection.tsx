import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Download, Loader2, Play, WandSparkles } from "lucide-react";

import type { CommunityShotConfig } from "../../homepageConfig";
import {
  DEFAULT_SHOWCASE_VIDEO_URL,
  HOMEPAGE_COMMUNITY_CONFIG,
} from "../../homepageConfig";
import { FayaaWatermark } from "../../../video-studio/components/FayaaWatermark";
import { useWatermark } from "../../../video-studio/lib/watermark-store";
import { downloadMedia } from "../../../video-studio/hf/lib/studio/download-media";
import type { ShowcaseCategory } from "../../../video-studio/showcaseService";
import { Button } from "../../../video-studio/hf/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../../../video-studio/hf/components/ui/tabs";
import { GenerationTile } from "../../../video-studio/hf/components/studio/generation-card";
import { cn } from "../../../video-studio/hf/lib/utils";

interface CommunityShowcaseSectionProps {
  shots: CommunityShotConfig[];
  onNavigateStudio: () => void;
  onRemixShot: (shot: CommunityShotConfig) => void;
  watermarkEnabled?: boolean;
  onToggleWatermark?: () => void;
  ariaLabel?: string;
}

/**
 * Row 4 filterable community masonry showcase combining public user R2/VideoTask videos
 * with curated fallback showcase shots while preserving Remix & Download marketing hooks.
 */
export function CommunityShowcaseSection({
  shots,
  onNavigateStudio,
  onRemixShot,
  watermarkEnabled: controlledWatermarkEnabled,
  onToggleWatermark,
  ariaLabel = "FAYAA Genjutsu by Community",
}: CommunityShowcaseSectionProps) {
  const [communityFilter, setCommunityFilter] =
    useState<ShowcaseCategory>("all");
  const [downloadingSample, setDownloadingSample] = useState(false);
  const localWatermark = useWatermark(true);
  const watermarkEnabled =
    controlledWatermarkEnabled ?? localWatermark.watermarkEnabled;
  const toggleWatermark = onToggleWatermark ?? localWatermark.toggleWatermark;

  const filteredShots =
    communityFilter === "all"
      ? shots
      : shots.filter((s) => s.category === communityFilter);

  const handleSampleWatermarkDownload = () => {
    setDownloadingSample(true);
    void downloadMedia(
      DEFAULT_SHOWCASE_VIDEO_URL,
      watermarkEnabled ? "fayaa-watermark-sample.mp4" : "fayaa-clean-sample.mp4",
      { watermark: watermarkEnabled }
    ).finally(() => setDownloadingSample(false));
  };

  return (
    <section
      id="community-showcase"
      aria-label={ariaLabel}
      className="flex flex-col gap-5 pt-2"
    >
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-black tracking-tight text-[#C8FF00] uppercase sm:text-3xl">
            {HOMEPAGE_COMMUNITY_CONFIG.heading}
          </h2>
          <p className="max-w-3xl text-sm text-zinc-400 sm:text-base">
            {HOMEPAGE_COMMUNITY_CONFIG.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            onClick={onNavigateStudio}
            className="h-11 rounded-xl bg-[#C8FF00] px-6 text-sm font-extrabold text-black hover:bg-[#b5e600]"
          >
            {HOMEPAGE_COMMUNITY_CONFIG.primaryCtaLabel}
          </Button>
          <a
            href="#workflow-templates"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-extrabold text-black transition-colors hover:bg-zinc-200"
          >
            {HOMEPAGE_COMMUNITY_CONFIG.secondaryCtaLabel}
          </a>
        </div>
      </div>

      {/* Category Filter Tabs & Watermark Tester */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={communityFilter}
          onValueChange={(v) => setCommunityFilter(v as ShowcaseCategory)}
        >
          <TabsList className="bg-[#141417]">
            <TabsTrigger value="all">All Creations</TabsTrigger>
            <TabsTrigger value="dance">Choreography</TabsTrigger>
            <TabsTrigger value="fashion">Fashion &amp; Style</TabsTrigger>
            <TabsTrigger value="action">Action &amp; Sports</TabsTrigger>
            <TabsTrigger value="ugc">Object Swap &amp; UGC</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={toggleWatermark}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors",
              watermarkEnabled
                ? "border-[#C8FF00]/50 bg-[#C8FF00]/15 text-white hover:bg-[#C8FF00]/25"
                : "border-white/15 bg-[#141417] text-zinc-300 hover:border-white/30"
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                watermarkEnabled
                  ? "bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]"
                  : "bg-zinc-600"
              )}
            />
            <span>Watermark: {watermarkEnabled ? "ON" : "OFF"}</span>
          </button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={downloadingSample}
            onClick={handleSampleWatermarkDownload}
            className="h-9 rounded-xl border-white/20 bg-[#141417] px-3.5 text-xs font-bold text-white hover:border-[#C8FF00]/60 hover:bg-[#1C1C22]"
          >
            {downloadingSample ? (
              <Loader2 className="size-3.5 animate-spin text-[#C8FF00]" />
            ) : (
              <Download className="size-3.5 text-[#C8FF00]" />
            )}
            <span>
              {downloadingSample
                ? watermarkEnabled
                  ? "Stamping Watermark MP4…"
                  : "Downloading MP4…"
                : watermarkEnabled
                  ? "Test Watermarked MP4"
                  : "Download Clean Sample MP4"}
            </span>
          </Button>

          <Link
            to="/studio"
            className="hidden items-center gap-1.5 text-xs font-semibold text-[#C8FF00] hover:underline sm:inline-flex"
          >
            <span>{HOMEPAGE_COMMUNITY_CONFIG.workbenchLinkLabel}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* 6-Column Community Masonry Grid */}
      <div className="columns-1 gap-3.5 space-y-3.5 sm:columns-2 md:columns-3 lg:columns-6">
        {filteredShots.map((shot) => {
          const mediaDownloadUrl = shot.videoUrl ?? shot.src;
          return (
            <div
              key={shot.id}
              className="break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-[#141417]"
            >
              <GenerationTile
                state="ready"
                src={shot.src}
                alt={shot.title}
                title={`${shot.title} • ${shot.creator}`}
                generation={{
                  src: mediaDownloadUrl,
                  mediaType: shot.videoUrl ? "video" : "image",
                  poster: shot.src || undefined,
                  prompt: shot.prompt,
                  model: "Higgsfield Genjutsu V1.0",
                  aspectRatio: shot.aspect === "portrait" ? 9 / 16 : 16 / 9,
                }}
                actions={[
                  {
                    id: "remix",
                    label: "Remix in Studio",
                    icon: WandSparkles,
                    onSelect: () => onRemixShot(shot),
                  },
                  {
                    id: "download",
                    label: watermarkEnabled
                      ? "Download with Watermark"
                      : "Download Clean",
                    icon: Download,
                    onSelect: () => {
                      void downloadMedia(
                        mediaDownloadUrl,
                        `fayaa-${shot.id}.${shot.videoUrl ? "mp4" : "jpg"}`,
                        { watermark: watermarkEnabled }
                      );
                    },
                  },
                ]}
                className={cn(
                  "w-full",
                  shot.aspect === "portrait" ? "aspect-[9/14]" : "aspect-[16/10]"
                )}
              >
                <div className="pointer-events-none absolute top-2.5 left-2.5 z-[2] flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-[#C8FF00] backdrop-blur-xs">
                    <Play className="size-2.5 fill-current" />
                    {shot.isFromStorage ? "Community" : "Genjutsu"}
                  </span>
                </div>
                {watermarkEnabled ? (
                  <FayaaWatermark size="default" position="bottom-right" />
                ) : null}
              </GenerationTile>
            </div>
          );
        })}
      </div>
    </section>
  );
}
