import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";

import { Reveal, SectionHeading } from "../../../client/design";
import { cn } from "../../../client/utils";
import type { LandingContent } from "../../../marketing/landingContent";
import { trackMarketingEvent } from "../../../marketing/analytics";
import { getYouTubeId, inferPlatform, siteMediaToClip, type SiteMediaItem } from "../../../marketing/siteMedia";

/**
 * "What people are making with AI": other creators' work, always credited
 * and linked to the original. YouTube plays in the official no-cookie embed
 * (loaded only on click); everything else opens the original post.
 */
export function AroundTheWebSection({
  content,
  items,
  ariaLabel,
}: {
  content: LandingContent["aroundTheWeb"];
  items: SiteMediaItem[];
  ariaLabel: string;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label={ariaLabel} className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <SectionHeading eyebrow={content.eyebrow} title={content.title} description={content.description} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.id} delay={Math.min(index, 6) * 0.05}>
            <WebCard item={item} />
          </Reveal>
        ))}
      </div>
      <p className="text-xs text-fy-subtle">{content.disclaimer}</p>
    </section>
  );
}

function WebCard({ item }: { item: SiteMediaItem }) {
  const [playing, setPlaying] = useState(false);
  const youTubeId = getYouTubeId(item.sourceUrl);
  const platform = inferPlatform(item);
  const poster = siteMediaToClip(item).poster;

  return (
    <figure className="group flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-fy-lg bg-fy-surface-2 ring-1 ring-fy-line">
        {playing && youTubeId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=1&rel=0`}
            title={item.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              trackMarketingEvent("Around The Web Click", { platform });
              if (youTubeId) setPlaying(true);
              else if (item.sourceUrl) window.open(item.sourceUrl, "_blank", "noopener,noreferrer");
            }}
            className="absolute inset-0 size-full"
            aria-label={`Watch ${item.title} by ${item.creditName ?? "the creator"} on ${platform}`}
          >
            {poster ? (
              <img
                src={poster}
                alt=""
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 ease-fy-out group-hover:scale-105"
              />
            ) : null}
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black transition-transform duration-300 group-hover:scale-110">
              <Play className="ml-0.5 size-5 fill-current" />
            </span>
            <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
              {platform}
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fy-text">{item.title}</p>
          <p className="truncate text-xs text-fy-muted">by {item.creditName}</p>
        </div>
        {item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-medium text-fy-muted hover:text-fy-text")}
          >
            Original
            <ArrowUpRight className="size-3.5" />
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}
