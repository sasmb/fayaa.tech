import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "wasp/client/auth";
import { getPublicHomepageShowcase, getPublicSiteMedia, useQuery } from "wasp/client/operations";

import { useDarkSurface } from "../client/design";
import { useExperiments } from "../marketing/useExperiments";
import { resolveLandingContent } from "../marketing/landingContent";
import { applySiteMedia } from "../marketing/siteMedia";
import type { TemplateItem } from "../video-studio/hf/components/studio/template-picker";
import { useGenjutsuWorkspace } from "../video-studio/hf/generation/stores/genjutsu-workspace";
import { SchemaMarkup } from "./components/SchemaMarkup";
import { AnnouncementBar } from "./components/marketing/AnnouncementBar";
import { AroundTheWebSection } from "./components/marketing/AroundTheWebSection";
import { CapabilitiesStorySection } from "./components/marketing/CapabilitiesStorySection";
import { CommunityShowcaseSection } from "./components/marketing/CommunityShowcaseSection";
import { FilmFestivalSection } from "./components/marketing/FilmFestivalSection";
import { FinalCtaSection } from "./components/marketing/FinalCtaSection";
import { HeroSection } from "./components/marketing/HeroSection";
import { MarketingFooter } from "./components/marketing/MarketingFooter";
import { MarketingHeader } from "./components/marketing/MarketingHeader";
import { ReelMarqueeSection } from "./components/marketing/ReelMarqueeSection";
import { SeedanceLaunchSection } from "./components/marketing/SeedanceLaunchSection";
import { ToolsBentoSection } from "./components/marketing/ToolsBentoSection";
import { WorkflowTemplatesSection } from "./components/marketing/WorkflowTemplatesSection";
import {
  BENTO_TOOLS,
  COMMUNITY_GENJUTSU_SHOTS,
  HOMEPAGE_LAYOUT,
  MEDIA_CLIPS,
  mergeCommunityShowcaseShots,
  resolveMediaClip,
  type CommunityShotConfig,
  type HomepageSectionId,
  type MediaClip,
} from "./homepageConfig";

/**
 * The homepage is assembled from data:
 * - copy, clips and section order: src/marketing/landingContent.ts
 * - A/B experiments: src/marketing/experiments.ts
 * - default media library and section on/off switches: ./homepageConfig.ts
 * - live media overrides managed by the owner at /admin/site-media
 * This file only wires data to section components.
 */
export function LandingPage() {
  const { data: user } = useAuth();
  const navigate = useNavigate();
  const hydrateFromRemix = useGenjutsuWorkspace((s) => s.hydrateFromRemix);
  const { data: showcaseData } = useQuery(getPublicHomepageShowcase);
  const { data: siteMedia } = useQuery(getPublicSiteMedia);
  const assignments = useExperiments();
  const baseContent = useMemo(() => resolveLandingContent(assignments), [assignments]);
  const isLoggedIn = Boolean(user);
  useDarkSurface();

  const publicR2BaseUrl = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined;

  const defaultClips = useMemo(() => {
    const map: Record<string, MediaClip> = {};
    for (const clip of MEDIA_CLIPS) {
      map[clip.id] = resolveMediaClip(clip, showcaseData?.resolvedStorageUrls, publicR2BaseUrl);
    }
    // A render an admin features from the studio takes over the default hero.
    const featured = showcaseData?.heroFeatured?.[0];
    const heroId = baseContent.hero.backgroundClipId;
    if (featured && map[heroId]) {
      map[heroId] = {
        ...map[heroId],
        videoUrl: featured.videoUrl,
        ...(featured.posterUrl ? { poster: featured.posterUrl } : {}),
      };
    }
    return map;
  }, [showcaseData?.resolvedStorageUrls, showcaseData?.heroFeatured, publicR2BaseUrl, baseContent.hero.backgroundClipId]);

  // Clips managed at /admin/site-media replace the coded defaults per section.
  const { content, clipsById, toolsClipId, web } = useMemo(
    () => applySiteMedia(baseContent, defaultClips, siteMedia ?? []),
    [baseContent, defaultClips, siteMedia]
  );

  const pick = (ids: string[]) => ids.map((id) => clipsById[id]).filter((c): c is MediaClip => Boolean(c));

  const communityShots = useMemo(
    () =>
      mergeCommunityShowcaseShots(
        showcaseData?.communityVideos ?? [],
        COMMUNITY_GENJUTSU_SHOTS,
        showcaseData?.resolvedStorageUrls,
        publicR2BaseUrl
      ),
    [showcaseData?.communityVideos, showcaseData?.resolvedStorageUrls, publicR2BaseUrl]
  );

  const openStudioWithPrompt = (prompt: string) => {
    hydrateFromRemix({ prompt, resolution: "720p" });
    void navigate("/studio");
  };

  const handleLaunchTemplate = (tpl: TemplateItem) => {
    const srcVid = tpl.media?.find((m) => m.role === "source")?.url;
    const refImgs = tpl.media?.filter((m) => m.role === "reference").map((m) => m.url) ?? [];
    hydrateFromRemix({
      ...(srcVid ? { sourceVideoUrl: srcVid } : {}),
      ...(refImgs.length ? { referenceImageUrls: refImgs } : {}),
      prompt: tpl.prompt,
      resolution:
        tpl.settings?.resolution === "480p" ||
        tpl.settings?.resolution === "720p" ||
        tpl.settings?.resolution === "1080p"
          ? tpl.settings.resolution
          : "720p",
    });
    void navigate("/studio");
  };

  const handleRemixShot = (shot: CommunityShotConfig) => {
    hydrateFromRemix({
      sourceVideoUrl: shot.sourceVideoUrl,
      ...(shot.referenceImageUrl ? { referenceImageUrls: [shot.referenceImageUrl] } : {}),
      prompt: shot.prompt,
      resolution: "720p",
    });
    void navigate("/studio");
  };

  const heroBackground = clipsById[content.hero.backgroundClipId] ?? MEDIA_CLIPS[0]!;

  const sections: Record<HomepageSectionId, (ariaLabel: string) => ReactNode> = {
    "hero-showcase": (ariaLabel) => (
      <HeroSection
        content={content.hero}
        background={heroBackground}
        floating={pick(content.hero.floatingClipIds)}
        isLoggedIn={isLoggedIn}
        onSubmitPrompt={openStudioWithPrompt}
        ariaLabel={ariaLabel}
      />
    ),
    "reel-marquee": (ariaLabel) => (
      <ReelMarqueeSection content={content.reel} rows={content.reel.rows.map(pick)} ariaLabel={ariaLabel} />
    ),
    "capabilities-story": (ariaLabel) => (
      <CapabilitiesStorySection content={content.capabilities} clipsById={clipsById} ariaLabel={ariaLabel} />
    ),
    "community-showcase": (ariaLabel) => (
      <CommunityShowcaseSection
        content={content.community}
        shots={communityShots}
        onRemixShot={handleRemixShot}
        ariaLabel={ariaLabel}
      />
    ),
    "tools-bento": (ariaLabel) => (
      <ToolsBentoSection
        content={content.tools}
        tools={BENTO_TOOLS}
        featureClip={clipsById[toolsClipId]}
        ariaLabel={ariaLabel}
      />
    ),
    "workflow-templates": (ariaLabel) => (
      <WorkflowTemplatesSection content={content.templates} onUseTemplate={handleLaunchTemplate} ariaLabel={ariaLabel} />
    ),
    "film-festival": (ariaLabel) => (
      <FilmFestivalSection content={content.festival} clip={clipsById[content.festival.clipId]} ariaLabel={ariaLabel} />
    ),
    "around-the-web": (ariaLabel) => (
      <AroundTheWebSection content={content.aroundTheWeb} items={web} ariaLabel={ariaLabel} />
    ),
    "final-cta": (ariaLabel) => (
      <FinalCtaSection
        content={content.finalCta}
        clip={clipsById[content.finalCta.clipId]}
        isLoggedIn={isLoggedIn}
        ariaLabel={ariaLabel}
      />
    ),
  };

  const enabled = new Map(HOMEPAGE_LAYOUT.map((s) => [s.id, s]));
  const ordered = content.layout
    .map((id) => enabled.get(id))
    .filter((s): s is (typeof HOMEPAGE_LAYOUT)[number] => Boolean(s?.enabled));

  return (
    <div className="min-h-screen bg-fy-ink text-fy-text antialiased selection:bg-fy-accent selection:text-fy-on-accent">
      <SchemaMarkup />
      <AnnouncementBar content={content.announcement} />
      <MarketingHeader />
      <main className="flex flex-col">
        {ordered.map((section) => (
          <div key={section.id}>
            {sections[section.id](section.ariaLabel)}
            {/* Seedance Week sits right under the hero; it hides itself after the launch. */}
            {section.id === "hero-showcase" ? (
              <SeedanceLaunchSection clip={clipsById[content.festival.clipId] ?? heroBackground} />
            ) : null}
          </div>
        ))}
      </main>
      <MarketingFooter />
    </div>
  );
}
