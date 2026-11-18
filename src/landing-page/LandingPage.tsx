import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "wasp/client/auth";
import { getPublicHomepageShowcase, useQuery } from "wasp/client/operations";
import {
  BarChart3,
  Coins,
  FolderOpen,
  Gem,
  Rocket,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { getUserAvatarUrl } from "../user/defaultAvatar";
import { SchemaMarkup } from "./components/SchemaMarkup";
import { FayaaWaveGlyph } from "./components/FayaaWaveGlyph";
import { HeroShowcaseSection } from "./components/sections/HeroShowcaseSection";
import { ToolsBentoSection } from "./components/sections/ToolsBentoSection";
import { FilmFestivalSection } from "./components/sections/FilmFestivalSection";
import { CommunityShowcaseSection } from "./components/sections/CommunityShowcaseSection";
import { WorkflowTemplatesSection } from "./components/sections/WorkflowTemplatesSection";
import {
  BENTO_TOOLS,
  HERO_SHOWCASE_CARDS,
  HOMEPAGE_ANNOUNCEMENT,
  HOMEPAGE_LAYOUT,
  COMMUNITY_GENJUTSU_SHOTS,
  getActiveHomepageSections,
  mergeCommunityShowcaseShots,
  resolveHeroShowcaseCards,
  type CommunityShotConfig,
  type HomepageSectionId,
} from "./homepageConfig";
import type { TemplateItem } from "../video-studio/hf/components/studio/template-picker";
import { useGenjutsuWorkspace } from "../video-studio/hf/generation/stores/genjutsu-workspace";

export function LandingPage() {
  const { data: user } = useAuth();
  const navigate = useNavigate();
  const hydrateFromRemix = useGenjutsuWorkspace((s) => s.hydrateFromRemix);
  const { data: showcaseData } = useQuery(getPublicHomepageShowcase);

  const publicR2BaseUrl = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined;

  // Force dark theme tokens on the marketing root to match the #09090A void surface
  useEffect(() => {
    const html = document.documentElement;
    const prevTheme = html.getAttribute("data-theme");
    const hadDark = html.classList.contains("dark");
    html.setAttribute("data-theme", "default-dark");
    html.classList.add("dark");
    return () => {
      if (prevTheme) html.setAttribute("data-theme", prevTheme);
      else html.removeAttribute("data-theme");
      if (!hadDark) html.classList.remove("dark");
    };
  }, []);

  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const isLoggedIn = Boolean(user);

  const heroCards = useMemo(
    () =>
      resolveHeroShowcaseCards(
        HERO_SHOWCASE_CARDS,
        showcaseData?.heroFeatured ?? [],
        showcaseData?.resolvedStorageUrls,
        publicR2BaseUrl
      ),
    [showcaseData?.heroFeatured, showcaseData?.resolvedStorageUrls, publicR2BaseUrl]
  );

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

  const handleLaunchTemplateInStudio = (tpl: TemplateItem) => {
    const srcVid = tpl.media?.find((m) => m.role === "source")?.url;
    const refImgs =
      tpl.media?.filter((m) => m.role === "reference").map((m) => m.url) ?? [];
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

  const handleLaunchCommunityShot = (shot: CommunityShotConfig) => {
    hydrateFromRemix({
      sourceVideoUrl: shot.sourceVideoUrl,
      ...(shot.referenceImageUrl ? { referenceImageUrls: [shot.referenceImageUrl] } : {}),
      prompt: shot.prompt,
      resolution: "720p",
    });
    void navigate("/studio");
  };

  const activeSections = getActiveHomepageSections(HOMEPAGE_LAYOUT);

  const renderSectionById: Record<HomepageSectionId, (ariaLabel: string) => ReactNode> = {
    "hero-showcase": (ariaLabel) => (
      <HeroShowcaseSection
        cards={heroCards}
        isLoggedIn={isLoggedIn}
        onNavigateStudio={() => void navigate("/studio")}
        ariaLabel={ariaLabel}
      />
    ),
    "tools-bento": (ariaLabel) => (
      <ToolsBentoSection
        tools={BENTO_TOOLS}
        isLoggedIn={isLoggedIn}
        onNavigate={(path) => void navigate(path)}
        ariaLabel={ariaLabel}
      />
    ),
    "film-festival": (ariaLabel) => <FilmFestivalSection ariaLabel={ariaLabel} />,
    "community-showcase": (ariaLabel) => (
      <CommunityShowcaseSection
        shots={communityShots}
        onNavigateStudio={() => void navigate("/studio")}
        onRemixShot={handleLaunchCommunityShot}
        ariaLabel={ariaLabel}
      />
    ),
    "workflow-templates": (ariaLabel) => (
      <WorkflowTemplatesSection
        onUseTemplate={handleLaunchTemplateInStudio}
        ariaLabel={ariaLabel}
      />
    ),
  };

  return (
    <div className="min-h-screen bg-[#09090A] text-white selection:bg-[#C8FF00] selection:text-black">
      <SchemaMarkup />

      {/* =====================================================================
          LOGGED-IN TOP ACID-LIME ANNOUNCEMENT BAR
         ===================================================================== */}
      {isLoggedIn && showPromoBanner ? (
        <div className="relative z-40 flex w-full items-center justify-between gap-3 bg-[#C8FF00] px-4 py-2 text-black sm:px-6">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3B44F6] px-3 py-1 text-xs font-bold text-white shadow-xs">
              <BarChart3 className="size-3.5" />
              {HOMEPAGE_ANNOUNCEMENT.badgeLabel}
            </span>
            <span>{HOMEPAGE_ANNOUNCEMENT.message}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={HOMEPAGE_ANNOUNCEMENT.ctaHref}
              className="inline-flex items-center rounded-full bg-[#0F0F11] px-4 py-1.5 text-xs font-bold text-white transition-transform hover:scale-[1.02]"
            >
              {HOMEPAGE_ANNOUNCEMENT.ctaLabel}
            </Link>
            <button
              type="button"
              aria-label="Dismiss announcement"
              onClick={() => setShowPromoBanner(false)}
              className="inline-flex size-7 items-center justify-center rounded-full text-black/75 transition-colors hover:bg-black/10 hover:text-black"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* =====================================================================
          STICKY GLOBAL HEADER (Visitor vs Logged-In)
         ===================================================================== */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#09090A]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: Logo + Navigation Rail */}
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2.5 focus-visible:outline-none"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-white text-black shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                <FayaaWaveGlyph className="size-5" />
              </span>
              <span className="text-base font-black tracking-tight text-white">
                FAYAA
              </span>
            </Link>

            <nav
              aria-label="Primary"
              className="hidden items-center gap-6 text-sm font-medium text-zinc-400 md:flex"
            >
              <Link
                to="/"
                className="font-semibold text-[#C8FF00] transition-colors"
              >
                Explore
              </Link>
              <Link
                to="/studio"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-[#C8FF00]"
              >
                <span>Video Studio</span>
                <span className="rounded-md bg-[#C8FF00]/15 border border-[#C8FF00]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#C8FF00]">
                  Genjutsu
                </span>
              </Link>
              <Link
                to="/pricing"
                className="transition-colors hover:text-white"
              >
                Pricing
              </Link>
            </nav>
          </div>

          {/* Right: Visitor Controls vs Logged-In Controls */}
          <div className="flex shrink-0 items-center gap-2.5">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/pricing"
                  className="relative inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/15 bg-[#161619] px-3.5 text-xs font-semibold text-white transition-colors hover:border-white/30 hover:bg-[#1E1E22]"
                >
                  <Gem className="size-3.5 text-zinc-300" />
                  <span>Pricing</span>
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#FF1F8F] px-2 py-0.2 text-[9px] font-extrabold tracking-wide whitespace-nowrap text-white uppercase shadow-md">
                    SAVE 20%
                  </span>
                </Link>

                <span
                  title="Enterprise plans coming soon"
                  className="hidden h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#161619]/70 px-3.5 text-xs font-semibold text-zinc-400 md:inline-flex"
                >
                  <Sparkles className="size-3.5 text-zinc-500" />
                  <span>Enterprise</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                    Soon
                  </span>
                </span>

                <span
                  className="hidden h-5 w-px bg-white/12 sm:inline-block"
                  aria-hidden="true"
                />

                <Link
                  to="/login"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#C8FF00]/25 bg-[#1B2210] px-4 text-xs font-bold text-[#C8FF00] transition-colors hover:border-[#C8FF00]/50 hover:bg-[#242E15]"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#C8FF00] px-4 text-xs font-extrabold text-black transition-colors hover:bg-[#b5e600]"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/studio"
                  aria-label="Search studio"
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-white/15 bg-[#161619] text-zinc-300 transition-colors hover:text-white"
                >
                  <Search className="size-4" />
                </Link>

                <Link
                  to="/pricing"
                  className="relative inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/15 bg-[#161619] px-3.5 text-xs font-semibold text-white transition-colors hover:border-white/30 hover:bg-[#1E1E22]"
                >
                  <Rocket className="size-3.5 text-zinc-300" />
                  <span>Upgrade</span>
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#FF1F8F] px-2 py-0.2 text-[9px] font-extrabold tracking-wide whitespace-nowrap text-white uppercase shadow-md">
                    SAVE 20%
                  </span>
                </Link>

                <span
                  title="Enterprise plans coming soon"
                  className="hidden h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#161619]/70 px-3.5 text-xs font-semibold text-zinc-400 md:inline-flex"
                >
                  <Sparkles className="size-3.5 text-zinc-500" />
                  <span>Enterprise</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                    Soon
                  </span>
                </span>

                <Link
                  to="/studio"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-[#161619] px-3.5 text-xs font-semibold text-white transition-colors hover:border-[#C8FF00]/50"
                >
                  <FolderOpen className="size-3.5 text-emerald-400" />
                  <span>Assets</span>
                </Link>

                <Link
                  to="/studio"
                  className="hidden h-10 items-center gap-1.5 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 text-xs font-bold text-[#C8FF00] transition-colors hover:bg-[#C8FF00]/20 sm:inline-flex"
                >
                  <Coins className="size-3.5" />
                  <span>{(user?.credits ?? 0).toLocaleString("en-US")}</span>
                </Link>

                <Link
                  to="/account"
                  aria-label="Account profile"
                  title={user?.email ?? "FAYAA Creator"}
                  className="relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-white transition-transform hover:scale-105"
                >
                  <img
                    src={getUserAvatarUrl(user)}
                    alt="User avatar"
                    className="size-full object-cover"
                  />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          DECLARATIVE MODULAR MAIN CONTENT SECTIONS
         ===================================================================== */}
      <main className="mx-auto flex max-w-[1600px] flex-col gap-10 px-4 pt-5 pb-20 sm:px-6">
        {activeSections.map((section) => (
          <div key={section.id}>{renderSectionById[section.id](section.ariaLabel)}</div>
        ))}
      </main>

      {/* =====================================================================
          MINIMAL DARK FOOTER
         ===================================================================== */}
      <footer className="border-t border-white/10 bg-[#09090A] py-10 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-white text-black">
              <FayaaWaveGlyph className="size-4" />
            </span>
            <span className="font-bold text-white">FAYAA AI</span>
            <span>• Powered by Higgsfield Genjutsu Motion Transfer V1.0</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/studio" className="hover:text-white">
              Genjutsu Studio
            </Link>
            <Link to="/pricing" className="hover:text-white">
              Pricing &amp; Credits
            </Link>
            <Link to="/login" className="hover:text-white">
              Login
            </Link>
            <Link to="/signup" className="hover:text-white">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
