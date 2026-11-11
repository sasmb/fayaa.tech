import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "wasp/client/auth";
import {
  ArrowRight,
  Award,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Coins,
  Cpu,
  Download,
  FolderOpen,
  Gem,
  Gift,
  Globe,
  Play,
  Rocket,
  Search,
  Sparkles,
  Wand2,
  WandSparkles,
  X,
} from "lucide-react";

import { getUserAvatarUrl } from "../user/defaultAvatar";
import { SchemaMarkup } from "./components/SchemaMarkup";
import { Button } from "../video-studio/hf/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../video-studio/hf/components/ui/tabs";
import { IconTile } from "../video-studio/hf/components/studio/icon-tile";
import { HeroComposition } from "../video-studio/hf/components/studio/hero-composition";
import { GenerationTile } from "../video-studio/hf/components/studio/generation-card";
import {
  ExamplePresets,
  TEMPLATES,
  type TemplateItem,
} from "../video-studio/hf/components/studio/template-picker";
import {
  GuestJourneyCountdownPill,
  GuestJourneyExpiredDialog,
  GuestJourneyInviteDialog,
} from "../video-studio/hf/components/studio/guest-journey-modals";
import { useGenjutsuWorkspace } from "../video-studio/hf/generation/stores/genjutsu-workspace";
import { useGuestJourneyClock } from "../video-studio/hf/generation/stores/guest-journey";
import { cn } from "../video-studio/hf/lib/utils";

interface ShowcaseCard {
  id: string;
  title: string;
  subtitle: string;
  highlightTitle?: boolean;
  kind: "genjutsu" | "playable" | "factory";
  videoUrl: string;
  inputImage: string;
  outputImage: string;
  loggedInInputImage: string;
  loggedInOutputImage: string;
  badgeText?: string;
  comingSoon?: boolean;
}

const HERO_SHOWCASE_CARDS: ShowcaseCard[] = [
  {
    id: "fayaa-genjutsu",
    title: "FAYAA GENJUTSU",
    subtitle: "Motion transfer, object swap & video restyle — live in Studio.",
    highlightTitle: true,
    kind: "genjutsu",
    badgeText: "LIVE NOW",
    comingSoon: false,
    videoUrl:
      "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4",
    inputImage:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
    outputImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    loggedInInputImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    loggedInOutputImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
  },
  {
    id: "fayaa-playable",
    title: "FAYAA PLAYABLE",
    subtitle: "Interactive motion worlds from a single prompt — coming soon.",
    kind: "playable",
    badgeText: "COMING SOON",
    comingSoon: true,
    videoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    inputImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&q=80",
    outputImage:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&q=80",
    loggedInInputImage:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&q=80",
    loggedInOutputImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&q=80",
  },
  {
    id: "content-factory",
    title: "CONTENT FACTORY",
    subtitle: "Automated multi-episode social series pipelines — coming soon.",
    kind: "factory",
    badgeText: "COMING SOON",
    comingSoon: true,
    videoUrl:
      "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4",
    inputImage:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    outputImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    loggedInInputImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    loggedInOutputImage:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
  },
];

interface CommunityShot {
  id: string;
  title: string;
  creator: string;
  aspect: "portrait" | "landscape";
  src: string;
  videoUrl?: string;
  sourceVideoUrl: string;
  referenceImageUrl: string;
  prompt: string;
  category: "all" | "dance" | "fashion" | "action" | "ugc";
}

const COMMUNITY_GENJUTSU_SHOTS: CommunityShot[] = [
  {
    id: "comm-1",
    title: "Tactical Locker Room Swap",
    creator: "@kuro_vfx",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80",
    videoUrl:
      "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    prompt:
      "Recast the subject into @Image1 inside a cinematic locker room with crisp prop tracking and dramatic rim light.",
    category: "action",
  },
  {
    id: "comm-2",
    title: "Viral Cash Flex Reel",
    creator: "@neoviral.ai",
    aspect: "portrait",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&q=80",
    videoUrl:
      "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80",
    prompt:
      "Transform the performer into @Image1 with locked facial identity, luxury penthouse lighting, ultra-sharp hand motion.",
    category: "ugc",
  },
  {
    id: "comm-3",
    title: "Stadium Pitch Sideline Sprint",
    creator: "@stadium_gen",
    aspect: "portrait",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
    prompt:
      "Recast the athlete on the pitch into @Image1 preserving full-body stride physics and crowd stadium atmosphere.",
    category: "action",
  },
  {
    id: "comm-4",
    title: "Contemporary Studio Dance",
    creator: "@mira.motion",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&q=80",
    videoUrl:
      "https://d3u0tzju9qaucj.cloudfront.net/4f337d0a-8b91-49a0-a8a1-b1231e0187fe/01a193ff-30aa-7895-a568-97ee1d417087/1a93cb6a-1214-48db-b8ec-e903f2efccc3.mp4",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
    prompt:
      "Recast the dancer into @Image1 executing fluid contemporary choreography against emerald studio backdrop.",
    category: "dance",
  },
  {
    id: "comm-5",
    title: "Midnight Portrait Motion Transfer",
    creator: "@aria.synth",
    aspect: "portrait",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
    prompt:
      "Recast speaker into @Image1 with expressive hand wave, natural eye contact, and soft studio key light.",
    category: "fashion",
  },
  {
    id: "comm-6",
    title: "Freestyle Groove Transfer",
    creator: "@dex.frames",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
    prompt:
      "Recast dancer into @Image1 with sharp shoulder isolation and natural fabric physics.",
    category: "dance",
  },
  {
    id: "comm-7",
    title: "Scale Model Object Swap",
    creator: "@prop_alchemist",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
    prompt:
      "Swap the handheld object with @Image1 while keeping hand articulation and window daylight untouched.",
    category: "ugc",
  },
  {
    id: "comm-8",
    title: "Championship Crowd Celebration",
    creator: "@cinema.pulse",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    prompt:
      "Recast the central figure into @Image1 celebrating in front of a roaring stadium crowd, anamorphic lens flare.",
    category: "action",
  },
  {
    id: "comm-9",
    title: "Streetwear Ensemble Musical",
    creator: "@tokyo.recast",
    aspect: "landscape",
    src: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=700&q=80",
    sourceVideoUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    referenceImageUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
    prompt:
      "Recast lead performer into @Image1 leading a synchronized street-dance formation, vibrant daylight grading.",
    category: "fashion",
  },
];

function FayaaWaveGlyph({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4.5 9.5C4.5 6.5 7.5 5 10 6.5C12.5 8 11.5 16 14 17.5C16.5 19 19.5 17.5 19.5 14.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M4.5 15.5C4.5 12.5 7.5 11 10 12.5C12.5 14 11.5 6 14 7.5C16.5 9 19.5 7.5 19.5 5.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LandingPage() {
  const { data: user } = useAuth();
  const navigate = useNavigate();
  const hydrateFromRemix = useGenjutsuWorkspace((s) => s.hydrateFromRemix);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Force dark theme tokens on the marketing root to match Higgsfield's #09090A void surface
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
  const [communityFilter, setCommunityFilter] = useState<
    "all" | "dance" | "fashion" | "action" | "ugc"
  >("all");
  const [inviteReady, setInviteReady] = useState(false);

  const guestJourney = useGuestJourneyClock(Boolean(user));

  // Delay the invite pop-up slightly on first unauthenticated visit so the landing page paints first
  useEffect(() => {
    if (Boolean(user) || guestJourney.status !== "unstarted" || guestJourney.inviteDismissed) {
      setInviteReady(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setInviteReady(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [user, guestJourney.status, guestJourney.inviteDismissed]);

  // UI state is strictly determined by real authentication (8-hour sneak peek stopped)
  const isLoggedIn = Boolean(user);

  const handleAcceptJourneyInvite = () => {
    guestJourney.startJourney();
    setInviteReady(false);
    void navigate("/studio");
  };

  const scrollCarousel = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "right" ? 460 : -460,
      behavior: "smooth",
    });
  };

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

  const handleLaunchCommunityShot = (shot: CommunityShot) => {
    hydrateFromRemix({
      sourceVideoUrl: shot.sourceVideoUrl,
      referenceImageUrls: [shot.referenceImageUrl],
      prompt: shot.prompt,
      resolution: "720p",
    });
    void navigate("/studio");
  };

  const filteredShots =
    communityFilter === "all"
      ? COMMUNITY_GENJUTSU_SHOTS
      : COMMUNITY_GENJUTSU_SHOTS.filter((s) => s.category === communityFilter);

  const bentoTools = [
    {
      id: "genjutsu",
      title: "FAYAA Genjutsu",
      badge: "LIVE",
      available: true,
      description: "Motion transfer, object swap & video restyle (Light & Pro)",
      icon: WandSparkles,
      gradient: "teal" as const,
      href: "/studio",
    },
    {
      id: "seedance",
      title: "Seedance 2.5",
      badge: "COMING SOON",
      available: false,
      description: "Next-gen text & image-to-video synthesis model",
      icon: BarChart3,
      gradient: "blue" as const,
      href: "#tools-bento",
    },
    {
      id: "supercomputer",
      title: "Supercomputer",
      badge: "COMING SOON",
      available: false,
      description: "Autonomous multi-shot agent powered by Genjutsu Director",
      icon: Cpu,
      gradient: "purple" as const,
      href: "#tools-bento",
    },
    {
      id: "cinema-studio",
      title: "Cinema Studio 4.0",
      badge: "COMING SOON",
      available: false,
      description: "Direct multi-angle cinematic scenes and camera moves",
      icon: Clapperboard,
      gradient: "orange" as const,
      href: "#tools-bento",
    },
    {
      id: "mcp",
      title: "FAYAA MCP for Creators",
      badge: "COMING SOON",
      available: false,
      description: "Generate motion transfers directly from Claude & Cursor",
      icon: Wand2,
      gradient: "pink" as const,
      href: "#tools-bento",
    },
    {
      id: "influencer",
      title: "AI Influencer",
      badge: "COMING SOON",
      available: false,
      description: "Persistent virtual persona & wardrobe studio",
      icon: Sparkles,
      gradient: "green" as const,
      href: "#tools-bento",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090A] text-white selection:bg-[#C8FF00] selection:text-black">
      <SchemaMarkup />

      {/* 8-Hour Guest Journey Invite & Expiry Modals stopped */}

      {/* =====================================================================
          LOGGED-IN TOP ACID-LIME ANNOUNCEMENT BAR
         ===================================================================== */}
      {isLoggedIn && showPromoBanner ? (
        <div className="relative z-40 flex w-full items-center justify-between gap-3 bg-[#C8FF00] px-4 py-2 text-black sm:px-6">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold sm:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3B44F6] px-3 py-1 text-xs font-bold text-white shadow-xs">
              <BarChart3 className="size-3.5" />
              Live in Studio
            </span>
            <span>
              FAYAA Genjutsu Light &amp; Pro — Motion Transfer, Object Swap &amp; Video Restyle up to 1080p. Save 20% on Annual Plans.
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/pricing"
              className="inline-flex items-center rounded-full bg-[#0F0F11] px-4 py-1.5 text-xs font-bold text-white transition-transform hover:scale-[1.02]"
            >
              View Plans &amp; Credits
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
          HIGGSFIELD-STYLE STICKY GLOBAL HEADER (Visitor vs Logged-In)
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
              /* VISITOR RIGHT BAR */
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
              /* LOGGED-IN RIGHT BAR */
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
          MAIN CONTENT CONTAINER
         ===================================================================== */}
      <main className="mx-auto flex max-w-[1600px] flex-col gap-10 px-4 pt-5 pb-20 sm:px-6">
        {/* -------------------------------------------------------------------
            ROW 1: 3-CARD HERO SHOWCASE STRIP (Visitor & Logged-In Variants)
           ------------------------------------------------------------------- */}
        <section aria-label="Featured Studio Workflows" className="relative">
          <div
            ref={carouselRef}
            className="grid grid-cols-1 gap-5 overflow-x-auto no-scrollbar md:grid-cols-3"
          >
            {HERO_SHOWCASE_CARDS.map((card) => (
              <div
                key={card.id}
                onClick={() => {
                  if (!card.comingSoon) void navigate("/studio");
                }}
                role={card.comingSoon ? undefined : "button"}
                tabIndex={card.comingSoon ? -1 : 0}
                onKeyDown={(e) => {
                  if (card.comingSoon) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void navigate("/studio");
                  }
                }}
                className={cn(
                  "group flex flex-col gap-3 focus-visible:outline-none",
                  card.comingSoon ? "cursor-default" : "cursor-pointer"
                )}
              >
                {/* Card Media Stage */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#141417]">
                  {card.badgeText ? (
                    <span
                      className={cn(
                        "absolute top-3 left-3 z-30 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider uppercase shadow-md backdrop-blur-md",
                        card.comingSoon
                          ? "border border-white/20 bg-black/75 text-zinc-200"
                          : "bg-[#C8FF00] text-black"
                      )}
                    >
                      {card.badgeText}
                    </span>
                  ) : null}
                  {card.kind === "genjutsu" ? (
                    !isLoggedIn ? (
                      /* Visitor Split INPUT / OUTPUT Diagonal Card */
                      <div className="relative size-full overflow-hidden">
                        <img
                          src={card.outputImage}
                          alt="Genjutsu Output"
                          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            clipPath: "polygon(0 0, 54% 0, 38% 100%, 0% 100%)",
                          }}
                        >
                          <img
                            src={card.inputImage}
                            alt="Genjutsu Input"
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-indigo-950/20" />
                        </div>
                        {/* Diagonal Divider Line */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 left-[46%] w-1 -skew-x-12 bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.9)]"
                        />
                        <span className="absolute bottom-3 left-4 rounded-md bg-black/65 px-2.5 py-1 text-sm font-black tracking-wider text-white uppercase backdrop-blur-xs">
                          INPUT
                        </span>
                        <span className="absolute top-3 right-4 rounded-md bg-black/65 px-2.5 py-1 text-sm font-black tracking-wider text-white uppercase backdrop-blur-xs">
                          OUTPUT
                        </span>
                      </div>
                    ) : (
                      /* Logged-In MOTION / RECAST Dual Polaroid Card */
                      <div className="relative flex size-full items-center justify-between overflow-hidden bg-[#EDE8E2] p-4 text-black">
                        <div className="relative z-10 flex h-full w-[48%] -rotate-2 flex-col justify-between overflow-hidden rounded-xl border-2 border-black/15 bg-zinc-900 shadow-xl">
                          <img
                            src={card.loggedInInputImage}
                            alt="Input reference"
                            className="size-full object-cover"
                          />
                          <span className="absolute bottom-2 left-2 rounded bg-black/75 px-2 py-0.5 text-[11px] font-black text-white uppercase">
                            INPUT
                          </span>
                        </div>
                        <div className="relative z-10 flex h-full w-[48%] rotate-2 flex-col justify-between overflow-hidden rounded-xl border-2 border-black/15 bg-zinc-900 shadow-xl">
                          <img
                            src={card.loggedInOutputImage}
                            alt="Output motion"
                            className="size-full object-cover"
                          />
                          <span className="absolute top-2 right-2 rounded bg-black/75 px-2 py-0.5 text-[11px] font-black text-white uppercase">
                            OUTPUT
                          </span>
                        </div>
                        <span className="pointer-events-none absolute top-2.5 right-4 z-20 font-black tracking-tighter text-black uppercase sm:text-2xl">
                          RECAST
                        </span>
                        <span className="pointer-events-none absolute bottom-2 left-4 z-20 font-black tracking-tighter text-black uppercase sm:text-2xl">
                          MOTION ⚡
                        </span>
                      </div>
                    )
                  ) : card.kind === "playable" ? (
                    /* Middle Card: Playable 3D Motion Stage (Coming Soon) */
                    <div className="relative size-full overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-900">
                      <img
                        src={card.outputImage}
                        alt={card.title}
                        className="size-full object-cover opacity-70 mix-blend-luminosity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-indigo-950/35 to-transparent" />
                      <div className="absolute inset-x-6 bottom-4 flex flex-col items-center gap-1.5">
                        <div className="h-2 w-48 overflow-hidden rounded-full bg-black/60 p-0.5">
                          <div className="h-full w-1/3 rounded-full bg-zinc-400" />
                        </div>
                        <span className="font-black tracking-tight text-white italic drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] sm:text-3xl">
                          FAYAA Playable
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Right Card: Content Factory Vertical Reels Preview (Coming Soon) */
                    <div className="relative flex size-full items-center justify-center overflow-hidden bg-zinc-900">
                      <img
                        src={card.inputImage}
                        alt={card.title}
                        className="absolute inset-0 size-full object-cover opacity-40 blur-[2px]"
                      />
                      <div className="relative z-10 flex h-[88%] w-[44%] flex-col justify-between overflow-hidden rounded-2xl border border-white/25 bg-black p-2.5 shadow-2xl">
                        <img
                          src={card.outputImage}
                          alt="Reels frame"
                          className="absolute inset-0 size-full object-cover opacity-75"
                        />
                        <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-white">
                          <span>Series</span>
                          <span className="rounded-full bg-black/70 px-2 py-0.5">
                            Coming Soon
                          </span>
                        </div>
                        <div className="relative z-10 flex flex-col gap-0.5">
                          <span className="w-fit rounded bg-[#C8FF00] px-1.5 py-0.5 text-[9px] font-black text-black uppercase">
                            @fayaa.studio
                          </span>
                          <span className="truncate text-[10px] font-medium text-white">
                            Multi-Clip Pipeline
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Caption */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <h2
                      className={cn(
                        "text-base font-black tracking-tight uppercase sm:text-lg",
                        card.highlightTitle && !isLoggedIn
                          ? "text-[#C8FF00]"
                          : "text-white"
                      )}
                    >
                      {card.title}
                    </h2>
                    {card.comingSoon ? (
                      <span className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
                        Coming Soon
                      </span>
                    ) : (
                      <span className="rounded-md bg-[#C8FF00]/15 border border-[#C8FF00]/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#C8FF00] uppercase">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 sm:text-sm">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Carousel Next Arrow */}
          <button
            type="button"
            aria-label="Scroll showcase right"
            onClick={() => scrollCarousel("right")}
            className="absolute top-[38%] right-2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md transition-colors hover:border-[#C8FF00] hover:text-[#C8FF00] md:inline-flex"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll showcase left"
            onClick={() => scrollCarousel("left")}
            className="absolute top-[38%] left-2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md transition-colors hover:border-[#C8FF00] hover:text-[#C8FF00] md:inline-flex"
          >
            <ChevronLeft className="size-5" />
          </button>
        </section>

        {/* -------------------------------------------------------------------
            ROW 2: ASYMMETRIC PROMO BANNER + 2x3 HIGGSFIELD BENTO TOOL GRID
           ------------------------------------------------------------------- */}
        <section
          id="tools-bento"
          aria-label="Promotions and AI Models"
          className="grid grid-cols-1 gap-5 lg:grid-cols-12"
        >
          {/* Left Promo Banner: Accurate to FAYAA Genjutsu Light & Pro */}
          <div className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1B1D17] via-[#2B2922] to-[#5E5748] p-7 lg:col-span-5">
            {/* Subtle glowing silhouette backdrop */}
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full object-cover object-right opacity-25 mix-blend-luminosity"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0F100D]/95 via-[#181A14]/80 to-transparent"
            />

            {!isLoggedIn ? (
              /* VISITOR PROMO CARD */
              <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <h2 className="text-3xl leading-[1.05] font-black tracking-tight uppercase sm:text-4xl">
                    <span className="block text-white">
                      CREATE WITH FAYAA
                    </span>
                    <span className="block text-[#C8FF00]">GENJUTSU V1.0</span>
                  </h2>

                  <ul className="flex flex-col gap-2 text-xs text-zinc-300 sm:text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#C8FF00]" />
                      <span>
                        Genjutsu Light &amp; Pro motion transfer, object swap, and
                        video restyle presets up to 1080p
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#C8FF00]" />
                      <span>
                        Multi-image character &amp; product reference lock — save
                        20% on annual plans or top up credits anytime
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => void navigate("/signup")}
                    className="h-12 rounded-xl bg-[#C8FF00] px-6 text-sm font-extrabold text-black hover:bg-[#b5e600]"
                  >
                    Sign up &amp; start creating
                  </Button>
                </div>
              </div>
            ) : (
              /* LOGGED-IN PROMO CARD */
              <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                <div className="flex flex-col gap-3">
                  <h2 className="text-3xl leading-[1.05] font-black tracking-tight uppercase sm:text-4xl">
                    <span className="block text-[#C8FF00]">
                      GENJUTSU LIGHT &amp; PRO
                    </span>
                    <span className="block text-zinc-200">
                      SAVE 20% ON ANNUAL PLANS
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-300 sm:text-sm">
                    Transfer motion from any 4s–30s video, swap characters or
                    objects, and apply Restyle presets starting from 8 credits
                    per 5s clip.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => void navigate("/studio")}
                    className="h-12 rounded-xl bg-[#C8FF00] px-6 text-sm font-extrabold text-black hover:bg-[#b5e600]"
                  >
                    Open Genjutsu Studio
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => void navigate("/pricing")}
                    className="h-12 rounded-xl border-white/20 bg-black/40 px-5 text-sm font-bold text-white hover:bg-black/60"
                  >
                    Plans &amp; Credits
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right 2x3 Feature Bento Grid using Higgsfield IconTile */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 lg:col-span-7">
            {bentoTools.map((tool) =>
              tool.available ? (
                <Link
                  key={tool.id}
                  to={tool.href}
                  className="group flex flex-col justify-between rounded-2xl border border-[#C8FF00]/35 bg-[#141417] p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#C8FF00] hover:bg-[#19191D]"
                >
                  <div className="flex items-center justify-between">
                    <IconTile as={tool.icon} gradient={tool.gradient} />
                    <ArrowRight className="size-4 text-[#C8FF00] transition-transform group-hover:translate-x-0.5" />
                  </div>

                  <div className="mt-6 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-bold text-white">
                        {tool.title}
                      </span>
                      <span className="shrink-0 rounded-md bg-[#C8FF00] px-2 py-0.5 text-[10px] font-black text-black uppercase">
                        {tool.badge}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-zinc-300">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              ) : (
                <div
                  key={tool.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#141417]/75 p-5 opacity-85"
                >
                  <div className="flex items-center justify-between">
                    <IconTile as={tool.icon} gradient={tool.gradient} />
                    <span className="rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
                      {tool.badge}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-bold text-zinc-200">
                        {tool.title}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-zinc-400">
                      {tool.description}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* -------------------------------------------------------------------
            ROW 3: GLOBAL FILM FESTIVAL BANNER (COMING SOON)
           ------------------------------------------------------------------- */}
        <section
          aria-label="FAYAA Global Film Festival"
          className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-r from-[#1A140B] via-[#3A2D15] to-[#1D160B] p-8 sm:p-12"
        >
          {/* Architectural Gold Monolith Visuals on the right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] items-end justify-center gap-6 pr-10 lg:flex"
          >
            {/* Silver Monolith */}
            <div className="flex h-[68%] w-40 -rotate-6 items-center justify-center rounded-t-2xl border border-white/25 bg-gradient-to-b from-zinc-300/35 via-zinc-500/25 to-black/80 shadow-2xl backdrop-blur-xs">
              <FayaaWaveGlyph className="size-20 text-black/75" />
            </div>
            {/* Center Gold Monolith */}
            <div className="z-10 flex h-[88%] w-52 rotate-2 items-center justify-center rounded-t-2xl border border-amber-300/50 bg-gradient-to-b from-amber-200/55 via-amber-500/35 to-black/85 shadow-[0_0_60px_rgba(245,158,11,0.3)] backdrop-blur-xs">
              <FayaaWaveGlyph className="size-28 text-black/85" />
            </div>
            {/* Bronze Monolith */}
            <div className="flex h-[64%] w-40 rotate-6 items-center justify-center rounded-t-2xl border border-amber-700/40 bg-gradient-to-b from-amber-600/35 via-amber-900/30 to-black/85 shadow-2xl backdrop-blur-xs">
              <FayaaWaveGlyph className="size-20 text-black/75" />
            </div>
          </div>

          <div className="relative z-10 flex max-w-lg flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-400/10 px-3.5 py-1 text-xs font-bold tracking-widest text-amber-200 uppercase">
              <Award className="size-4 text-amber-300" />
              <span>FAYAA Global Film Festival • Coming Soon</span>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
              SUBMISSIONS OPENING SOON
            </h2>

            <p className="mt-2.5 text-sm leading-relaxed text-amber-100/80 sm:text-base">
              Create motion-transfer, object-swap, and restyled short films with
              FAYAA Genjutsu to participate in our upcoming community showcase.
            </p>

            <a
              href="#community-showcase"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-xl border border-amber-200/40 bg-amber-300/25 px-7 text-sm font-bold text-amber-50 backdrop-blur-xs transition-colors hover:bg-amber-300/35"
            >
              Explore community creations
            </a>
          </div>
        </section>

        {/* -------------------------------------------------------------------
            ROW 4: FAYAA GENJUTSU BY COMMUNITY (Screenshot 2)
           ------------------------------------------------------------------- */}
        <section
          id="community-showcase"
          aria-label="FAYAA Genjutsu by Community"
          className="flex flex-col gap-5 pt-2"
        >
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl font-black tracking-tight text-[#C8FF00] uppercase sm:text-3xl">
                FAYAA GENJUTSU BY COMMUNITY
              </h2>
              <p className="max-w-3xl text-sm text-zinc-400 sm:text-base">
                Take the motion and recast it with your characters, locations,
                and products, or swap specific elements while keeping the rest
                untouched.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() => void navigate("/studio")}
                className="h-11 rounded-xl bg-[#C8FF00] px-6 text-sm font-extrabold text-black hover:bg-[#b5e600]"
              >
                Start generating
              </Button>
              <a
                href="#workflow-templates"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-extrabold text-black transition-colors hover:bg-zinc-200"
              >
                Learn more
              </a>
            </div>
          </div>

          {/* Category Filter Tabs using Higgsfield Tabs */}
          <div className="flex items-center justify-between gap-4">
            <Tabs
              value={communityFilter}
              onValueChange={(v) =>
                setCommunityFilter(
                  v as "all" | "dance" | "fashion" | "action" | "ugc"
                )
              }
            >
              <TabsList className="bg-[#141417]">
                <TabsTrigger value="all">All Creations</TabsTrigger>
                <TabsTrigger value="dance">Choreography</TabsTrigger>
                <TabsTrigger value="fashion">Fashion & Style</TabsTrigger>
                <TabsTrigger value="action">Action & Sports</TabsTrigger>
                <TabsTrigger value="ugc">Object Swap & UGC</TabsTrigger>
              </TabsList>
            </Tabs>

            <Link
              to="/studio"
              className="hidden items-center gap-1.5 text-xs font-semibold text-[#C8FF00] hover:underline sm:inline-flex"
            >
              <span>Open Genjutsu Workbench</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* 6-Column Community Masonry Grid using Higgsfield GenerationTile */}
          <div className="columns-1 gap-3.5 space-y-3.5 sm:columns-2 md:columns-3 lg:columns-6">
            {filteredShots.map((shot) => (
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
                    src: shot.videoUrl ?? shot.src,
                    mediaType: shot.videoUrl ? "video" : "image",
                    poster: shot.src,
                    prompt: shot.prompt,
                    model: "Higgsfield Genjutsu V1.0",
                    aspectRatio: shot.aspect === "portrait" ? 9 / 16 : 16 / 9,
                  }}
                  actions={[
                    {
                      id: "remix",
                      label: "Remix in Studio",
                      icon: WandSparkles,
                      onSelect: () => handleLaunchCommunityShot(shot),
                    },
                    {
                      id: "download",
                      label: "Download",
                      icon: Download,
                    },
                  ]}
                  className={cn(
                    "w-full",
                    shot.aspect === "portrait"
                      ? "aspect-[9/14]"
                      : "aspect-[16/10]"
                  )}
                >
                  <div className="pointer-events-none absolute top-2.5 left-2.5 z-[2] flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-[#C8FF00] backdrop-blur-xs">
                      <Play className="size-2.5 fill-current" />
                      Genjutsu
                    </span>
                  </div>
                </GenerationTile>
              </div>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------------------
            ROW 5: 1-CLICK GENJUTSU WORKFLOW PRESETS (Higgsfield ExamplePresets)
           ------------------------------------------------------------------- */}
        <section
          id="workflow-templates"
          aria-label="1-Click Genjutsu Templates"
          className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0F0F11] p-6 sm:p-10"
        >
          <HeroComposition
            images={[
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
              "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
            ]}
            alt="FAYAA Genjutsu presets"
          />

          <div className="flex max-w-2xl flex-col items-center gap-2 text-center">
            <span className="rounded-full border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-0.5 text-xs font-bold tracking-wider text-[#C8FF00] uppercase">
              Ready-to-Run Workflows
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase sm:text-3xl">
              Launch a Genjutsu Template in One Click
            </h2>
            <p className="text-sm text-zinc-400">
              Every preset pre-loads a motion source video,{" "}
              <code className="text-[#C8FF00]">@Image1</code> identity anchors,
              and camera-locked prompt directly into the FAYAA Studio Workbench.
            </p>
          </div>

          <ExamplePresets
            items={TEMPLATES}
            onUse={handleLaunchTemplateInStudio}
            tryLabel="Launch in Studio"
            className="w-full max-w-5xl"
          />
        </section>
      </main>

      {/* =====================================================================
          MINIMAL HIGGSFIELD-STYLE DARK FOOTER
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
              Pricing & Credits
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
