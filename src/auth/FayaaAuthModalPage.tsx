import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { login, signup, googleSignInUrl } from "wasp/client/auth";
import {
  Check,
  Cloud,
  Gem,
  Loader2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import { LandingPage } from "../landing-page/LandingPage";
import { useRedirectIfLoggedIn } from "./hooks/useRedirectIfLoggedIn";

interface ShowcaseSlide {
  id: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  image: string;
  badges: { icon: "gem" | "wand" | "check"; label: string }[];
}

const AUTH_SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: "genjutsu-pro",
    tabLabel: "Genjutsu Pro",
    title: "GENJUTSU PRO 1080P",
    subtitle:
      "Studio-grade master motion recast with fine garment dynamics and camera tracking",
    image:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000&q=85",
    badges: [
      { icon: "gem", label: "1080p HD" },
      { icon: "wand", label: "Live in Studio" },
    ],
  },
  {
    id: "genjutsu-light",
    tabLabel: "Genjutsu Light",
    title: "GENJUTSU LIGHT",
    subtitle:
      "Ultra-fast motion transfer with temporal stability and multi-image identity lock",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&q=85",
    badges: [
      { icon: "gem", label: "4s–15s Clips" },
      { icon: "wand", label: "Live in Studio" },
    ],
  },
  {
    id: "restyle-swap",
    tabLabel: "Restyle & Swap",
    title: "RESTYLE & SWAP",
    subtitle:
      "Redraw videos in Anime, Claymation, or 3D styles, or swap subjects with @Image1",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&q=85",
    badges: [
      { icon: "gem", label: "Style Presets" },
      { icon: "wand", label: "Object Swap" },
    ],
  },
  {
    id: "cinema-roadmap",
    tabLabel: "Cinema (Soon)",
    title: "CINEMA & SEEDANCE",
    subtitle:
      "Next-generation text-to-video, AI Influencer & Cinema Studio 4.0 workflows",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&q=85",
    badges: [
      { icon: "check", label: "Coming Soon" },
      { icon: "check", label: "FAYAA Roadmap" },
    ],
  },
];

function FayaaMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4.5 9.5C7 5.5 11.5 5.5 12.5 9.5C13.5 13.5 17 13.5 19.5 9.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M4.5 15.5C7 11.5 11.5 11.5 12.5 15.5C13.5 19.5 17 19.5 19.5 15.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.8H12z"
      />
      <path
        fill="#34A853"
        d="M3.2 7.3l3.2 2.4C7.3 7.4 9.5 5.8 12 5.8c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 8.1 2 4.8 4.2 3.2 7.3z"
      />
      <path
        fill="#FBBC05"
        d="M12 22c2.6 0 4.9-.9 6.5-2.4l-3-2.5c-.8.6-1.9 1-3.5 1-2.7 0-5-1.8-5.8-4.3l-3.2 2.5C4.6 19.7 8 22 12 22z"
      />
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.2-.2-1.8H12v3.9h5.5c-.3 1.3-1.1 2.4-2 3.1l3 2.5c1.8-1.6 3.1-4.1 3.1-7.7z"
      />
    </svg>
  );
}

export function FayaaAuthModalPage({
  initialMode,
}: {
  initialMode: "login" | "signup";
}) {
  useRedirectIfLoggedIn("/studio");
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [slideIndex, setSlideIndex] = useState<number>(2); // Default to FAYAA SOUL like Screenshot 2
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(initialMode === "login");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    if (initialMode === "login") setAgreedToTerms(true);
  }, [initialMode]);

  // Auto-advance the left showcase carousel every 4.5 seconds
  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % AUTH_SHOWCASE_SLIDES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const currentSlide =
    AUTH_SHOWCASE_SLIDES[slideIndex] ?? AUTH_SHOWCASE_SLIDES[0]!;

  const canProceedEmail =
    email.trim().includes("@") && (mode === "login" || agreedToTerms);

  const handleClose = () => {
    void navigate("/");
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (mode === "signup" && !agreedToTerms) {
      setErrorMessage(
        "Please agree to the Terms of Use and Privacy Policy to continue."
      );
      return;
    }

    // First click on "Continue" reveals the password input cleanly
    if (!showPasswordStep) {
      setShowPasswordStep(true);
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ email: email.trim(), password });
        void navigate("/studio");
      } else {
        const cleanEmail = email.trim();
        await signup({
          email: cleanEmail,
          password,
          username: cleanEmail,
          isAdmin: false,
        });
        try {
          await login({ email: cleanEmail, password });
          void navigate("/studio");
        } catch {
          // If email verification is required before login
          setVerificationSent(true);
        }
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please check your credentials and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#09090A] text-white select-none">
      {/* Underlying Landing Page Background (Dimmed + Pointer-Events Disabled) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden opacity-45"
      >
        <LandingPage />
      </div>

      {/* Frosted Dark Backdrop */}
      <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-[2px] sm:p-6">
        {/* Responsive Modal Card:
            - Below lg (<1024px): Single-column centered modal (Screenshot 1)
            - lg and up (>=1024px): Split 2-column modal with Left Showcase Story & Right Auth Pane (Screenshots 2 & 3) */}
        <div className="relative z-50 my-auto flex w-full max-w-[500px] overflow-hidden rounded-[28px] border border-white/10 bg-[#121215] p-3 shadow-[0_32px_120px_rgba(0,0,0,0.92)] lg:max-w-[980px] lg:grid lg:grid-cols-[430px_1fr] lg:gap-3">
          {/* ════════════════════════════════════════════════════════════════
              LEFT SHOWCASE STORY PANEL (Visible on lg+ screens — Screenshots 2 & 3)
             ════════════════════════════════════════════════════════════════ */}
          <div className="relative hidden min-h-[620px] w-full flex-col justify-end overflow-hidden rounded-[20px] bg-zinc-900 lg:flex">
            <img
              key={currentSlide.id}
              src={currentSlide.image}
              alt={currentSlide.title}
              className="absolute inset-0 size-full object-cover transition-opacity duration-500"
            />

            {/* Multi-stop cinematic dark bottom vignette */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />

            {/* Bottom Content Overlay */}
            <div className="relative z-10 flex flex-col gap-3 p-6">
              {/* Feature Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {currentSlide.badges.map((badge) => (
                  <span
                    key={badge.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-md"
                  >
                    {badge.icon === "gem" ? (
                      <Gem className="size-3.5 text-zinc-200" />
                    ) : badge.icon === "wand" ? (
                      <Wand2 className="size-3.5 text-zinc-200" />
                    ) : (
                      <Check className="size-3.5 text-zinc-200" />
                    )}
                    <span>{badge.label}</span>
                  </span>
                ))}
              </div>

              {/* Bold Condensed Display Title */}
              <h2 className="font-display text-4xl leading-none font-black tracking-tight text-white uppercase">
                {currentSlide.title}
              </h2>

              {/* Subtitle */}
              <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                {currentSlide.subtitle}
              </p>

              {/* 4-Segment Story Progress Bar + Tab Labels */}
              <div className="mt-2 grid grid-cols-4 gap-2 pt-1">
                {AUTH_SHOWCASE_SLIDES.map((slide, idx) => {
                  const isCompletedOrActive = idx <= slideIndex;
                  const isActive = idx === slideIndex;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setSlideIndex(idx)}
                      className="group flex cursor-pointer flex-col gap-1.5 text-left focus:outline-none"
                    >
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                        <div
                          className={
                            isCompletedOrActive
                              ? "h-full w-full rounded-full bg-white transition-all duration-300"
                              : "h-full w-0 rounded-full bg-white/40 transition-all duration-300"
                          }
                        />
                      </div>
                      <span
                        className={
                          isActive
                            ? "truncate text-[11px] font-semibold text-white"
                            : "truncate text-[11px] font-medium text-zinc-400 transition-colors group-hover:text-zinc-200"
                        }
                      >
                        {slide.tabLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              RIGHT AUTH FORM PANE (Centered on all screen sizes)
             ════════════════════════════════════════════════════════════════ */}
          <div className="relative flex flex-col items-center justify-center px-5 py-8 sm:px-10 sm:py-10">
            {/* Top-Right Close Button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close authentication modal"
              className="absolute top-3 right-3 flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/[0.08] text-zinc-300 transition-colors hover:bg-white/[0.16] hover:text-white"
            >
              <X className="size-4" />
            </button>

            <div className="flex w-full max-w-[360px] flex-col items-center">
              {/* Neon Lime Brand Badge */}
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#C8FF00] text-black shadow-[0_0_24px_rgba(200,255,0,0.3)]">
                <FayaaMark className="size-6" />
              </div>

              {/* Headline & Subtitle */}
              <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-white sm:text-[28px]">
                Welcome to FAYAA
              </h1>
              <p className="mt-1.5 text-center text-xs text-zinc-400 sm:text-sm">
                {mode === "signup"
                  ? "Sign up and generate for free"
                  : "Log in and generate for free"}
              </p>

              {verificationSent ? (
                <div className="mt-6 flex w-full flex-col items-center gap-3 rounded-2xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 p-5 text-center">
                  <Sparkles className="size-6 text-[#C8FF00]" />
                  <h2 className="text-base font-bold text-white">
                    Check your inbox
                  </h2>
                  <p className="text-xs leading-relaxed text-zinc-300">
                    We sent a verification link to{" "}
                    <strong className="text-white">{email}</strong>. Verify your
                    email or proceed directly to the studio.
                  </p>
                  <button
                    type="button"
                    onClick={() => void navigate("/studio")}
                    className="mt-1 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl bg-[#C8FF00] px-4 text-xs font-extrabold text-black hover:bg-[#d8ff3e]"
                  >
                    Continue to FAYAA Studio
                  </button>
                </div>
              ) : (
                <>
                  {/* Social Auth Stack */}
                  <div className="mt-6 flex w-full flex-col gap-2.5">
                    <a
                      href={googleSignInUrl}
                      className="flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-white/12 bg-[#17171A] px-4 text-xs font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/[0.06] sm:text-sm no-underline"
                    >
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </a>
                  </div>

                  {/* OR Divider */}
                  <div className="my-4 flex w-full items-center justify-center">
                    <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                      OR
                    </span>
                  </div>

                  {/* Email (+ Password Step) Form */}
                  <form
                    onSubmit={(e) => void handleFormSubmit(e)}
                    className="flex w-full flex-col gap-3"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="fayaa-auth-email"
                        className="text-xs font-medium text-zinc-400"
                      >
                        Email
                      </label>
                      <input
                        id="fayaa-auth-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMessage(null);
                        }}
                        placeholder="you@example.com"
                        className="h-12 w-full rounded-xl border border-white/12 bg-[#17171A] px-4 text-sm text-white placeholder:text-zinc-500 focus:border-[#C8FF00]/60 focus:outline-none"
                      />
                    </div>

                    {showPasswordStep ? (
                      <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="fayaa-auth-password"
                            className="text-xs font-medium text-zinc-400"
                          >
                            Password
                          </label>
                          {mode === "login" ? (
                            <Link
                              to="/request-password-reset"
                              className="text-[11px] text-zinc-400 underline hover:text-white"
                            >
                              Forgot password?
                            </Link>
                          ) : null}
                        </div>
                        <input
                          id="fayaa-auth-password"
                          type="password"
                          required
                          minLength={8}
                          autoFocus
                          autoComplete={
                            mode === "login"
                              ? "current-password"
                              : "new-password"
                          }
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrorMessage(null);
                          }}
                          placeholder="Enter password (min. 8 characters)"
                          className="h-12 w-full rounded-xl border border-white/12 bg-[#17171A] px-4 text-sm text-white placeholder:text-zinc-500 focus:border-[#C8FF00]/60 focus:outline-none"
                        />
                      </div>
                    ) : null}

                    {errorMessage ? (
                      <p
                        role="alert"
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
                      >
                        {errorMessage}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={submitting}
                      className={
                        canProceedEmail
                          ? "mt-0.5 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[#C8FF00] text-sm font-bold text-black transition-colors hover:bg-[#d8ff3e] disabled:opacity-50"
                          : "mt-0.5 flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-[#27272B] text-sm font-semibold text-zinc-400 transition-colors hover:bg-[#303036] hover:text-zinc-200 disabled:opacity-50"
                      }
                    >
                      {submitting ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          <span>Please wait…</span>
                        </span>
                      ) : showPasswordStep ? (
                        mode === "signup" ? (
                          "Create account"
                        ) : (
                          "Log in"
                        )
                      ) : (
                        "Continue"
                      )}
                    </button>

                    {/* Terms & Age Checkbox (matching Screenshots 1, 2, 3) */}
                    <label className="mt-1 flex cursor-pointer items-start gap-2.5 text-left text-[11px] leading-snug text-zinc-300">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-white/20 bg-[#17171A] accent-[#C8FF00]"
                      />
                      <span>
                        I agree to the{" "}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-white"
                        >
                          Terms of Use
                        </a>
                        , acknowledge the{" "}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-white"
                        >
                          Privacy Policy
                        </a>
                        , and confirm I&apos;m at least 18 years old.
                      </span>
                    </label>
                  </form>

                  {/* Switch between Signup and Login */}
                  <div className="mt-4 flex flex-col items-center gap-2 text-center text-xs text-zinc-400">
                    {mode === "signup" ? (
                      <div>
                        Already have an account?{" "}
                        <Link
                          to="/login"
                          className="font-semibold text-white underline hover:text-[#C8FF00]"
                        >
                          Log in
                        </Link>
                      </div>
                    ) : (
                      <div>
                        Don&apos;t have an account yet?{" "}
                        <Link
                          to="/signup"
                          className="font-semibold text-white underline hover:text-[#C8FF00]"
                        >
                          Sign up
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Bottom Divider + SSO Enterprise Notice */}
                  <div className="mt-5 w-full border-t border-white/10 pt-4 text-center">
                    <p className="inline-flex items-center justify-center gap-1.5 text-xs text-zinc-400">
                      <Cloud className="size-3.5 text-zinc-500" />
                      <span>
                        Scale &amp; Enterprise SSO plans —{" "}
                        <span className="font-semibold text-zinc-300">
                          Coming Soon
                        </span>
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

