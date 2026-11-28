"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  Check,
  ChevronDown,
  Coins,
  CreditCard,
  ExternalLink,
  FolderOpen,
  Gem,
  Gift,
  Info,
  Loader2,
  Rocket,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { login, useAuth } from "wasp/client/auth"
import {
  generateCheckoutSession,
  getCustomerPortalUrl,
  useQuery,
} from "wasp/client/operations"
import { routes } from "wasp/client/router"

import { paymentProcessorClient } from "../../../../payment/paymentProcessorClient"
import { estimateSeedancePlan } from "../../../seedancePlanning"
import { creditCostForResolution } from "../../../taskSync"
import {
  PaymentPlanId,
  SubscriptionStatus,
  prettyPaymentPlanName,
} from "../../../../payment/plans"
import { getUserAvatarUrl } from "../../../../user/defaultAvatar"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"

/* ── Data Definitions Matching the 6 Pricing Screenshots ──────────────────── */

type PlanAudience = "individual" | "business"
type UltraTierKey = "3k" | "6k" | "9k"

interface UltraTierConfig {
  key: UltraTierKey
  label: string
  credits: number
  imagesApprox: number
  videosApprox: number
  yearlyMonthlyPrice: number
  yearlyStrikePrice: number
  monthlyPrice: number
  yearlySaveAmount: number
  discountPct: number
}

const ULTRA_TIERS: Record<UltraTierKey, UltraTierConfig> = {
  "3k": {
    key: "3k",
    label: "3K",
    credits: 3000,
    imagesApprox: 600,
    videosApprox: 60,
    yearlyMonthlyPrice: 109,
    yearlyStrikePrice: 129,
    monthlyPrice: 129,
    yearlySaveAmount: 240,
    discountPct: 15,
  },
  "6k": {
    key: "6k",
    label: "6K",
    credits: 6000,
    imagesApprox: 1200,
    videosApprox: 120,
    yearlyMonthlyPrice: 209,
    yearlyStrikePrice: 249,
    monthlyPrice: 249,
    yearlySaveAmount: 480,
    discountPct: 16,
  },
  "9k": {
    key: "9k",
    label: "9K",
    credits: 9000,
    imagesApprox: 1800,
    videosApprox: 180,
    yearlyMonthlyPrice: 299,
    yearlyStrikePrice: 359,
    monthlyPrice: 359,
    yearlySaveAmount: 720,
    discountPct: 17,
  },
}

interface SliderStepPack {
  label: string
  credits: number
  price: number
  strikePrice: number
  discountPct: number
  videosApprox: number
  imagesApprox: number
}

const SLIDER_STEPS: SliderStepPack[] = [
  { label: "5k", credits: 5000, price: 250, strikePrice: 425, discountPct: 41, videosApprox: 100, imagesApprox: 1000 },
  { label: "7k", credits: 7000, price: 345, strikePrice: 595, discountPct: 42, videosApprox: 140, imagesApprox: 1400 },
  { label: "9k", credits: 9000, price: 440, strikePrice: 765, discountPct: 42, videosApprox: 180, imagesApprox: 1800 },
  { label: "11k", credits: 11000, price: 530, strikePrice: 935, discountPct: 43, videosApprox: 220, imagesApprox: 2200 },
  { label: "13k", credits: 13000, price: 620, strikePrice: 1105, discountPct: 44, videosApprox: 260, imagesApprox: 2600 },
  { label: "15k", credits: 15000, price: 710, strikePrice: 1275, discountPct: 44, videosApprox: 300, imagesApprox: 3000 },
  { label: "17k", credits: 17000, price: 799, strikePrice: 1445, discountPct: 45, videosApprox: 340, imagesApprox: 3400 },
  { label: "19k", credits: 19000, price: 885, strikePrice: 1615, discountPct: 45, videosApprox: 380, imagesApprox: 3800 },
  { label: "21k", credits: 21000, price: 970, strikePrice: 1785, discountPct: 46, videosApprox: 420, imagesApprox: 4200 },
  { label: "23k", credits: 23000, price: 1050, strikePrice: 1955, discountPct: 46, videosApprox: 460, imagesApprox: 4600 },
  { label: "25k", credits: 25000, price: 1125, strikePrice: 2125, discountPct: 47, videosApprox: 500, imagesApprox: 5000 },
  { label: "100k", credits: 100000, price: 4200, strikePrice: 8500, discountPct: 51, videosApprox: 2000, imagesApprox: 20000 },
]

interface FixedCreditPack {
  id: string
  planId: PaymentPlanId
  credits: number
  discountPct: number
  videosApprox: number
  imagesApprox: number
  price: string
  strikePrice: string
  per100Rate: string
  highlighted?: boolean
}

const FIXED_CREDIT_PACKS: FixedCreditPack[] = [
  {
    id: "pack-studio",
    planId: PaymentPlanId.CreditsStudio,
    credits: 2670,
    discountPct: 25,
    videosApprox: 89,
    imagesApprox: 500,
    price: "$89",
    strikePrice: "$119",
    per100Rate: "$3.33 / 100 credits",
    highlighted: true,
  },
  {
    id: "pack-creator",
    planId: PaymentPlanId.CreditsCreator,
    credits: 1170,
    discountPct: 20,
    videosApprox: 39,
    imagesApprox: 200,
    price: "$39",
    strikePrice: "$49",
    per100Rate: "$3.33 / 100 credits",
  },
  {
    id: "pack-starter",
    planId: PaymentPlanId.CreditsStarter,
    credits: 360,
    discountPct: 15,
    videosApprox: 12,
    imagesApprox: 60,
    price: "$12",
    strikePrice: "$15",
    per100Rate: "$3.33 / 100 credits",
  },
]

const EXTRA_UNLIMITED_MODELS = [
  "FAYAA Genjutsu Light 720p",
  "FAYAA Genjutsu Light 1080p",
  "FAYAA Genjutsu Pro 720p",
  "FAYAA Genjutsu Pro 1080p Master",
]

/** Credits for a 5-second render, from the same pricing the studio charges. */
function credits5s(resolution: string, variant: "light" | "pro"): number {
  return creditCostForResolution(resolution, variant, 5)
}

/** Whole 5-second videos a monthly credit allowance covers. */
function videosPerMonth(monthlyCredits: number, costPerVideo: number): number {
  return Math.floor(monthlyCredits / Math.max(1, costPerVideo))
}

const PLAN_CREDITS = {
  plus: { monthly: 1470, annual: 1170 },
  ultra: { monthly: 3900, annual: 3270 },
}

const LIGHT_720_5S = credits5s("720p", "light")
const LIGHT_1080_5S = credits5s("1080p", "light")
const PRO_720_5S = credits5s("720p", "pro")
const PRO_1080_5S = credits5s("1080p", "pro")
const SEEDANCE_720_10S = estimateSeedancePlan({ totalDurationSec: 10, resolution: "720p" }).credits

interface FaqItem {
  q: string
  a: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "How do credits work?",
    a: `Every generation uses credits based on the model, resolution and length, and the exact cost shows before you generate. A 5-second Genjutsu Light video costs ${LIGHT_720_5S} credits at 720p, a 5-second Genjutsu Pro video costs ${PRO_720_5S} credits at 720p, and a 10-second Seedance 2.5 video costs ${SEEDANCE_720_10S} credits at 720p. Failed renders are refunded automatically. Plan credits refresh every billing cycle, and top-up credits stay on your balance.`,
  },
  {
    q: "Is my subscription automatically renewed?",
    a: "Yes. Monthly and Annual plans renew automatically at the end of each billing cycle so your generation pipeline is never interrupted. You can cancel or switch tiers anytime through your Paddle Customer Portal with one click.",
  },
  {
    q: "How many videos can I generate each month?",
    a: `On FAYAA Plus (1,470 credits/mo), that's about ${videosPerMonth(PLAN_CREDITS.plus.monthly, LIGHT_720_5S)} five-second Genjutsu Light videos or ${videosPerMonth(PLAN_CREDITS.plus.monthly, PRO_720_5S)} five-second Genjutsu Pro videos at 720p each month. On FAYAA Ultra (3,900 credits/mo), it's about ${videosPerMonth(PLAN_CREDITS.ultra.monthly, LIGHT_720_5S)} Light or ${videosPerMonth(PLAN_CREDITS.ultra.monthly, PRO_720_5S)} Pro videos, with 8 concurrent GPU slots.`,
  },
  {
    q: "Can I use Claude or an AI Agent with my credits?",
    a: "FAYAA includes an autonomous Agent CLI workflow skill today, and a hosted MCP (Model Context Protocol) server for Claude Desktop and Cursor is coming soon.",
  },
  {
    q: "How can I purchase extra credits?",
    a: "Select any instant credit pack under 'Credit top-ups' ($12 for 360 credits, $39 for 1,170 credits, or $89 for 2,670 credits). Credits are instantly credited to your account via Paddle checkout and never expire.",
  },
  {
    q: "What motion transfer models does FAYAA provide?",
    a: "FAYAA specializes in Higgsfield Genjutsu Light (ultra-fast motion transfer with high temporal stability and identity lock) and Genjutsu Pro (studio-grade cinematic dynamic recast with fine garment dynamics and complex camera moves). Both models support up to 4 subject and style reference images.",
  },
]

export interface StudioSubscriptionPanelProps {
  heroImages?: readonly [string, string, string]
  onBackToStudio?: () => void
}

export function StudioSubscriptionPanel({
  onBackToStudio,
}: StudioSubscriptionPanelProps) {
  const { data: user } = useAuth()
  const navigate = useNavigate()

  // Controls state matching Screenshots 1-6
  const [audience, setAudience] = useState<PlanAudience>("individual")
  const [annualBilling, setAnnualBilling] = useState<boolean>(true)
  const [ultraTier, setUltraTier] = useState<UltraTierKey>("3k")
  const [plusExpandedModels, setPlusExpandedModels] = useState<boolean>(false)
  const [ultraExpandedModels, setUltraExpandedModels] = useState<boolean>(false)

  // Slider state for 5k -> 100k Credit Top-up
  const [sliderIdx, setSliderIdx] = useState<number>(0)

  // Compare features table expansion
  const [showAllCompareRows, setShowAllCompareRows] = useState<boolean>(false)

  // FAQ open index
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null)

  // Checkout mode defaults to live Paddle checkout
  const [checkoutMode] = useState<"instant_test" | "paddle">(
    "paddle"
  )
  const [busyActionId, setBusyActionId] = useState<string | null>(null)
  const [feedbackBanner, setFeedbackBanner] = useState<{
    kind: "success" | "error"
    text: string
  } | null>(null)

  const isUserSubscribed =
    !!user &&
    !!user.subscriptionStatus &&
    user.subscriptionStatus !== SubscriptionStatus.Deleted

  const isPlusUser =
    user?.subscriptionPlan === PaymentPlanId.PlusMonthly ||
    user?.subscriptionPlan === PaymentPlanId.PlusAnnual ||
    user?.subscriptionPlan === PaymentPlanId.Hobby

  const isUltraUser =
    user?.subscriptionPlan === PaymentPlanId.UltraMonthly ||
    user?.subscriptionPlan === PaymentPlanId.UltraAnnual ||
    user?.subscriptionPlan === PaymentPlanId.Pro

  const isFreeUser = !isPlusUser && !isUltraUser

  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
  } = useQuery(getCustomerPortalUrl, undefined, { enabled: isUserSubscribed })

  const activeUltra = ULTRA_TIERS[ultraTier]
  const activeSliderPack = SLIDER_STEPS[sliderIdx] ?? SLIDER_STEPS[0]!

  async function handlePurchase({
    actionKey,
    planId,
    creditsDelta,
    label,
  }: {
    actionKey: string
    planId: PaymentPlanId
    creditsDelta: number
    label: string
  }) {
    if (!user) {
      navigate(routes.LoginRoute.to)
      return
    }
    setBusyActionId(actionKey)
    setFeedbackBanner(null)
    try {
      const session = await generateCheckoutSession({
        planId,
        mode: checkoutMode,
        creditsDelta,
        planName: label,
      })

      if (session.instantApplied) {
        setFeedbackBanner({
          kind: "success",
          text: `${label} applied! Added +${creditsDelta.toLocaleString("en-US")} credits to your account (New balance: ${(session.updatedCredits ?? (user.credits + creditsDelta)).toLocaleString("en-US")} credits).`,
        })
        setBusyActionId(null)
        return
      }

      if (session.paymentProcessorId !== paymentProcessorClient.id) {
        throw new Error(
          `Payment processor mismatch (${session.paymentProcessorId} vs ${paymentProcessorClient.id}).`
        )
      }

      await paymentProcessorClient.openCheckout(session)
      if (session.kind === "inPage") {
        setBusyActionId(null)
      }
    } catch (err) {
      setFeedbackBanner({
        kind: "error",
        text:
          err instanceof Error
            ? err.message
            : "Error processing checkout. Try switching to Instant Test Mode.",
      })
      setBusyActionId(null)
    }
  }

  const plusMonthlyDisplay = annualBilling
    ? audience === "business"
      ? 59
      : 39
    : audience === "business"
      ? 79
      : 49
  const plusStrikeDisplay = audience === "business" ? 79 : 49

  const ultraMonthlyDisplay = annualBilling
    ? activeUltra.yearlyMonthlyPrice
    : activeUltra.monthlyPrice

  return (
    <div className="min-h-dvh w-full bg-fy-ink text-white select-none">
      {/* ══════════════════════════════════════════════════════════════════════
          GLOBAL TOP HEADER BAR (Matches Screenshots 1–6)
         ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 flex h-[52px] w-full items-center justify-between border-b border-white/[0.07] bg-fy-ink/95 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-5 overflow-x-auto">
          <Link
            to={routes.LandingPageRoute.to}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-black transition-transform hover:scale-105"
          >
            <span className="font-display text-base font-black tracking-tighter">
              F
            </span>
          </Link>

          <nav className="flex items-center gap-5 text-xs font-medium text-zinc-400">
            <Link
              to={routes.LandingPageRoute.to}
              className="transition-colors hover:text-white"
            >
              Explore
            </Link>
            <Link
              to={routes.StudioRoute.to}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-[#D9FF00]"
            >
              <span>Video Studio</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-zinc-300">
                Genjutsu
              </span>
            </Link>
            <span className="font-bold text-[#D9FF00]">Pricing</span>
          </nav>
        </div>

        {/* Right Header Controls */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={routes.StudioRoute.to}
            aria-label="Search Studio"
            className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <Search className="size-3.5" />
          </Link>

          <a
            href="#all-plans"
            className="relative inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.07] px-3 text-xs font-semibold text-white"
          >
            <Rocket className="size-3.5 text-[#D9FF00]" />
            <span>Upgrade</span>
            <span className="-top-2 -right-1.5 absolute rounded-full bg-[#FF2E93] px-1.5 py-0.5 text-[8px] font-extrabold tracking-wider text-white uppercase shadow">
              Save 20%
            </span>
          </a>

          <span
            title="Enterprise plans coming soon"
            className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-zinc-400 lg:inline-flex"
          >
            <Sparkles className="size-3 text-zinc-500" />
            <span>Enterprise</span>
            <span className="rounded bg-white/10 px-1 py-0.2 text-[8px] font-bold tracking-wider text-zinc-400 uppercase">
              Soon
            </span>
          </span>

          <Link
            to={routes.StudioRoute.to}
            className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.09] sm:inline-flex"
          >
            <FolderOpen className="size-3.5 text-[#4ADE80]" />
            <span>Assets</span>
          </Link>

          <span className="hidden h-4 w-px bg-white/10 sm:inline" />

          {user ? (
            <>
              <div
                title="Your live credit balance"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D9FF00]/30 bg-[#D9FF00]/10 px-2.5 text-xs font-bold text-[#D9FF00]"
              >
                <Coins className="size-3.5" />
                <span>{user.credits.toLocaleString("en-US")} cr</span>
              </div>

              <button
                type="button"
                aria-label="Free generations"
                onClick={() =>
                  document
                    .getElementById("all-plans")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="hidden size-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.08] md:flex"
              >
                <Gift className="size-3.5" />
              </button>

              <Link
                to={routes.AccountRoute.to}
                aria-label="Account profile"
                title={user.email ?? "Account"}
                className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white transition-transform hover:scale-105"
              >
                <img
                  src={getUserAvatarUrl(user)}
                  alt="User avatar"
                  className="size-full object-cover"
                />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to={routes.LoginRoute.to}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-white/15 bg-white/[0.03] px-3 text-xs text-white"
                >
                  Login
                </Button>
              </Link>
              <Link to={routes.SignupRoute.to}>
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-[#D9FF00] px-3.5 text-xs font-bold text-black hover:bg-[#e3ff38]"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-12 px-4 pt-7 pb-24 sm:px-6">
        {/* User Account / Balance Bar */}
        {user ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121215] px-4 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-zinc-300">
                <span className="size-2 rounded-full bg-[#4ADE80]" />
                Logged in as <strong className="text-white">{user.email}</strong>
              </span>
              <span className="text-white/20">•</span>
              <span className="text-zinc-300">
                Plan:{" "}
                <strong className="text-[#D9FF00]">
                  {user.subscriptionStatus === SubscriptionStatus.Active &&
                  user.subscriptionPlan
                    ? prettyPaymentPlanName(
                        user.subscriptionPlan as PaymentPlanId
                      )
                    : "Free Tier"}
                </strong>
              </span>
              <span className="text-white/20">•</span>
              <span className="text-zinc-300">
                Balance:{" "}
                <strong className="text-white">
                  {user.credits.toLocaleString("en-US")} credits
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isUserSubscribed && customerPortalUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isCustomerPortalUrlLoading}
                  onClick={() => window.open(customerPortalUrl, "_blank")}
                  className="h-7 rounded-lg border-white/15 bg-white/[0.04] px-2.5 text-[11px] text-white cursor-pointer"
                >
                  <CreditCard className="size-3" />
                  Manage Subscription
                  <ExternalLink className="size-2.5" />
                </Button>
              ) : null}

              {onBackToStudio ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onBackToStudio}
                  className="h-7 rounded-lg px-2.5 text-[11px] text-white hover:bg-white/10 cursor-pointer"
                >
                  Back to Studio
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121215] px-4 py-2.5 text-xs">
            <span className="text-zinc-400">
              Sign in to subscribe to plans or buy instant credits.
            </span>
            <Link
              to="/login"
              className="font-semibold text-[#D9FF00] hover:text-[#e3ff38]"
            >
              Sign In →
            </Link>
          </div>
        )}

        {/* Status / Confirmation Toast Banner */}
        {feedbackBanner ? (
          <div
            role="status"
            className={cn(
              "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-medium",
              feedbackBanner.kind === "success"
                ? "border-[#D9FF00]/40 bg-[#D9FF00]/10 text-[#D9FF00]"
                : "border-red-500/40 bg-red-500/10 text-red-200"
            )}
          >
            <span>{feedbackBanner.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="cursor-pointer opacity-75 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        {/* ════════════════════════════════════════════════════════════════════
            1. TOP GLOWING LIME PROMO BANNER (FAYAA Genjutsu Studio)
           ════════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden rounded-[22px] border border-fy-accent/55 bg-gradient-to-r from-[#3a1405] via-[#170803] to-[#3a1405] px-7 py-8 shadow-[0_0_50px_rgba(255,91,31,0.14),inset_0_0_55px_rgba(255,91,31,0.2)] sm:px-10 sm:py-9">
          {user?.subscriptionPlan === PaymentPlanId.UltraMonthly ||
          user?.subscriptionPlan === PaymentPlanId.UltraAnnual ? (
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9FF00]/40 bg-[#D9FF00]/10 px-3 py-1 text-xs font-semibold text-[#D9FF00] mb-2">
                <Sparkles className="size-3.5" />
                <span>ACTIVE MEMBERSHIP: FAYAA ULTRA</span>
              </div>
              <h1 className="font-display text-xl leading-tight font-black tracking-tight uppercase sm:text-[28px] text-white">
                FAYAA GENJUTSU VIDEO-TO-VIDEO STUDIO
              </h1>
              <p className="mt-2 text-xs text-zinc-300 sm:text-sm">
                You have active Ultra access with 3,900 monthly credits, 8 concurrent GPU generation slots, and full Genjutsu Light &amp; Pro access.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="font-display text-xl leading-tight font-black tracking-tight uppercase sm:text-[28px]">
                <span className="block text-[#D9FF00]">
                  FAYAA GENJUTSU VIDEO-TO-VIDEO STUDIO
                </span>
                <span className="mt-0.5 block text-white">
                  SAVE UP TO 20% ON ANNUAL PLANS
                </span>
              </h1>
              <p className="mt-2.5 text-xs text-zinc-300 sm:text-sm">
                High-energy AI motion transfer, dance choreography, and video restyling powered by Genjutsu Light &amp; Pro.
              </p>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            2. "All plans" HEADER + INDIVIDUAL/BUSINESS + ANNUAL SWITCH
           ════════════════════════════════════════════════════════════════════ */}
        <section id="all-plans" className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-6 pt-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                All plans
              </h2>
              <p className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
                For individual creators &amp; Enterprises
              </p>
            </div>

            {/* Right Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <Tabs
                  variant="segmented"
                  shape="pill"
                  value={audience}
                  onValueChange={(v) => {
                    if (v === "individual") setAudience("individual")
                  }}
                >
                  <TabsList>
                    <TabsTrigger value="individual" className="text-xs">
                      Individual
                    </TabsTrigger>
                    <TabsTrigger
                      value="business"
                      disabled
                      className="text-xs opacity-60 cursor-not-allowed"
                    >
                      Business plans (Soon)
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Monthly / Annual Save 20% Toggle Pill */}
              <div className="flex h-10 items-center gap-2.5 rounded-full border border-white/10 bg-fy-surface-2 px-4 text-xs">
                <span
                  className={cn(
                    "cursor-pointer transition-colors",
                    !annualBilling ? "font-semibold text-white" : "text-zinc-400"
                  )}
                  onClick={() => setAnnualBilling(false)}
                >
                  Monthly
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={annualBilling}
                  onClick={() => setAnnualBilling((v) => !v)}
                  className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-white/15 p-0.5 transition-colors"
                >
                  <span
                    className={cn(
                      "inline-block size-4 transform rounded-full bg-white transition-transform",
                      annualBilling ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
                <span
                  className={cn(
                    "cursor-pointer transition-colors",
                    annualBilling ? "font-semibold text-white" : "text-zinc-400"
                  )}
                  onClick={() => setAnnualBilling(true)}
                >
                  Annual{" "}
                  <strong className="font-bold text-[#D9FF00]">Save ~20%</strong>
                </span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              MAIN 2-COLUMN SUBSCRIPTION CARD CONTAINER (Screenshots 6, 2, 4)
             ══════════════════════════════════════════════════════════════════ */}
          <div className="rounded-[28px] border border-white/[0.07] bg-fy-surface-1 p-6 sm:p-10">
            <div className="mx-auto grid max-w-[760px] grid-cols-1 gap-8 md:grid-cols-2">
              {/* ── LEFT COLUMN: PLUS PLAN ──────────────────────────────────── */}
              <div className="flex flex-col">
                {/* Plus Top Glass Card */}
                <div className="flex flex-col justify-between rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.1] via-white/[0.04] to-white/[0.02] p-6 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-3xl font-bold text-white">Plus</h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-zinc-200">
                      <Sparkles className="size-3" />
                      Most popular
                    </span>
                  </div>

                  <div className="mt-6 flex items-baseline gap-2">
                    {annualBilling ? (
                      <span className="text-2xl font-bold text-zinc-500 line-through">
                        ${plusStrikeDisplay}
                      </span>
                    ) : null}
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      ${plusMonthlyDisplay}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {annualBilling ? "/mo billed yearly" : "/mo billed monthly"}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={busyActionId !== null}
                    onClick={() =>
                      void handlePurchase({
                        actionKey: "plan-plus",
                        planId: annualBilling
                          ? PaymentPlanId.PlusAnnual
                          : PaymentPlanId.PlusMonthly,
                        creditsDelta: annualBilling ? 1170 : 1470,
                        label: `FAYAA Plus (${annualBilling ? "1,170" : "1,470"} credits/mo)`,
                      })
                    }
                    className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-black shadow transition-transform hover:bg-zinc-100 active:scale-[0.99] disabled:opacity-60"
                  >
                    {busyActionId === "plan-plus" ? (
                      <Loader2 className="size-4 animate-spin text-black" />
                    ) : (
                      <>
                        <span>
                          {!user
                            ? "Sign In to Subscribe"
                            : user?.subscriptionPlan === PaymentPlanId.PlusMonthly ||
                              user?.subscriptionPlan === PaymentPlanId.PlusAnnual
                            ? "Current Plan"
                            : "Subscribe to Plus"}
                        </span>
                        {annualBilling ? (
                          <span className="rounded-full bg-[#FF2E93] px-2 py-0.5 text-[10px] font-extrabold text-white">
                            -20%
                          </span>
                        ) : null}
                      </>
                    )}
                  </button>
                </div>

                {/* Plus Credits Breakdown */}
                <div className="mt-7 flex flex-col">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex size-4 items-center justify-center rounded-full bg-white text-black">
                      <Sparkles className="size-2.5 fill-current" />
                    </span>
                    <strong className="font-bold text-white">
                      {annualBilling ? "1,170 credits" : "1,470 credits"}
                    </strong>
                    <span className="text-zinc-400">/ month</span>
                  </div>
                  <div className="ml-2 flex flex-col border-l border-zinc-700 pl-4 pt-2 text-xs">
                    <div className="relative py-1">
                      <span className=" -left-4 top-1/2 absolute h-px w-3 bg-zinc-700" />
                      <strong className="text-white">
                        {annualBilling ? "Up to 195s" : "Up to 245s"}
                      </strong>{" "}
                      <span className="text-zinc-400">Genjutsu Light (6 creds/s)</span>
                    </div>
                    <div className="relative py-1">
                      <span className=" -left-4 top-1/2 absolute h-px w-3 bg-zinc-700" />
                      <strong className="text-white">
                        {annualBilling ? "Up to 97s" : "Up to 122s"}
                      </strong>{" "}
                      <span className="text-zinc-400">Genjutsu Pro (12 creds/s)</span>
                    </div>
                  </div>
                </div>

                {/* Plus: Included in plan */}
                <div className="mt-6 border-t border-white/[0.07] pt-5">
                  <span className="text-xs font-semibold text-zinc-300">
                    Included in Plus:
                  </span>
                  <ul className="mt-3.5 flex flex-col gap-3 text-xs">
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="font-medium text-white">
                        Full Genjutsu Light &amp; Pro Access
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="text-zinc-300">
                        Up to 4 Reference Images (Face &amp; Outfit Lock)
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="text-zinc-300">
                        4 Concurrent Video Generation Slots
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="text-zinc-300">
                        Priority GPU Processing Queue
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="text-zinc-300">
                        Commercial Usage Rights for all Videos
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/15 text-zinc-300">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="font-medium text-zinc-400">
                        Claude MCP &amp; Cursor Agent API{" "}
                        <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
                          Coming Soon
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ── RIGHT COLUMN: ULTRA PLAN (Hot Pink Gradient Card) ──────── */}
              <div className="flex flex-col">
                {/* Ultra Top Hot-Pink Card */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#FF2E93]/50 bg-gradient-to-br from-[#FF61A3] via-[#E81B74] to-[#740736] p-6 shadow-[0_14px_45px_rgba(232,27,116,0.28)]">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-3xl font-bold text-white">Ultra</h3>

                    {/* 3K Live / 6K & 9K Coming Soon Tier Selector Pill */}
                    <div className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/25 p-0.5 backdrop-blur-md">
                      {(Object.keys(ULTRA_TIERS) as UltraTierKey[]).map((k) => {
                        const active = k === ultraTier
                        const isComingSoon = k !== "3k"
                        return (
                          <button
                            key={k}
                            type="button"
                            disabled={isComingSoon}
                            title={
                              isComingSoon
                                ? `${ULTRA_TIERS[k].label} volume tier coming soon`
                                : "3.9K monthly credits tier"
                            }
                            onClick={() => {
                              if (!isComingSoon) setUltraTier(k)
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold transition-all",
                              active
                                ? "bg-white/25 text-white shadow cursor-pointer"
                                : "text-white/55 cursor-not-allowed"
                            )}
                          >
                            {active ? (
                              <Sparkles className="size-2.5 fill-current" />
                            ) : null}
                            {isComingSoon
                              ? `${ULTRA_TIERS[k].label} (Soon)`
                              : ULTRA_TIERS[k].label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-6 flex items-baseline gap-2">
                    {annualBilling ? (
                      <span className="text-2xl font-bold text-white/60 line-through">
                        ${activeUltra.yearlyStrikePrice}
                      </span>
                    ) : null}
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      ${ultraMonthlyDisplay}
                    </span>
                    <span className="text-xs text-white/80">
                      {annualBilling ? "/mo billed yearly" : "/mo billed monthly"}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={busyActionId !== null}
                    onClick={() =>
                      void handlePurchase({
                        actionKey: "plan-ultra",
                        planId: annualBilling
                          ? PaymentPlanId.UltraAnnual
                          : PaymentPlanId.UltraMonthly,
                        creditsDelta: annualBilling ? 3270 : 3900,
                        label: `FAYAA Ultra (${annualBilling ? "3,270" : "3,900"} credits/mo)`,
                      })
                    }
                    className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-black shadow transition-transform hover:bg-zinc-100 active:scale-[0.99] disabled:opacity-60"
                  >
                    {busyActionId === "plan-ultra" ? (
                      <Loader2 className="size-4 animate-spin text-black" />
                    ) : (
                      <>
                        <span>
                          {!user
                            ? "Sign In to Upgrade"
                            : user?.subscriptionPlan === PaymentPlanId.UltraMonthly ||
                              user?.subscriptionPlan === PaymentPlanId.UltraAnnual
                            ? "Current Plan"
                            : "Upgrade to Ultra"}
                        </span>
                        {annualBilling ? (
                          <span className="rounded-full bg-[#FF2E93] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                            -16% | Save $240/yr
                          </span>
                        ) : null}
                      </>
                    )}
                  </button>
                </div>

                {/* Ultra Credits Breakdown */}
                <div className="mt-7 flex flex-col">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex size-4 items-center justify-center rounded-full bg-[#FF2E93] text-white">
                      <Sparkles className="size-2.5 fill-current" />
                    </span>
                    <strong className="font-bold text-[#FF2E93]">
                      {(annualBilling ? 3270 : 3900).toLocaleString("en-US")} credits
                    </strong>
                    <span className="text-zinc-400">/ month</span>
                  </div>
                  <div className="ml-2 flex flex-col border-l border-[#FF2E93]/50 pl-4 pt-2 text-xs">
                    <div className="relative py-1">
                      <span className=" -left-4 top-1/2 absolute h-px w-3 bg-[#FF2E93]/50" />
                      <strong className="text-white">
                        {annualBilling ? "Up to 545s" : "Up to 650s"}
                      </strong>{" "}
                      <span className="text-zinc-400">Genjutsu Light (6 creds/s)</span>
                    </div>
                    <div className="relative py-1">
                      <span className=" -left-4 top-1/2 absolute h-px w-3 bg-[#FF2E93]/50" />
                      <strong className="text-white">
                        {annualBilling ? "Up to 272s" : "Up to 325s"}
                      </strong>{" "}
                      <span className="text-zinc-400">Genjutsu Pro (12 creds/s)</span>
                    </div>
                  </div>
                </div>

                {/* Ultra: Included in plan */}
                <div className="mt-6 border-t border-white/[0.07] pt-5">
                  <span className="text-xs font-semibold text-zinc-300">
                    Included in Ultra:
                  </span>
                  <ul className="mt-3.5 flex flex-col gap-3 text-xs">
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#FF2E93] text-white">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="font-semibold text-[#FF2E93]">
                        Lowest Cost Per Credit Across Platform
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="font-medium text-white">
                        8 Concurrent Video Generation Slots
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="text-zinc-300">
                        Ultra-Priority GPU Scheduling (Instant Dispatch)
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="text-zinc-300">
                        Full Genjutsu Light &amp; Pro Master Recast
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="text-zinc-300">
                        Up to 4 Reference Images (Face &amp; Garment Lock)
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/15 text-zinc-300">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="font-medium text-zinc-400">
                        Claude MCP, Cursor Agent &amp; API Access{" "}
                        <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-zinc-300 uppercase">
                          Coming Soon
                        </span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-black">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                      <span className="text-zinc-300">
                        Full Commercial Monetization Rights
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Fine Print below Plan Cards */}
          <div className="mx-auto flex max-w-[760px] flex-col items-center gap-3 pt-1 text-center text-[11px] leading-relaxed text-zinc-500">
            <p>
              FAYAA credits are valid across the Genjutsu Web Studio and Agent CLI workflows (hosted Claude MCP server coming soon). Prices exclude VAT and local taxes, calculated at Paddle checkout.{" "}
              <a
                href="#faq-section"
                className="underline transition-colors hover:text-zinc-300"
              >
                Learn more
              </a>
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            3. "Credit top-ups" SECTION
           ════════════════════════════════════════════════════════════════════ */}
        <section id="credit-topups" className="flex flex-col gap-5 pt-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Credit top-ups
              </h2>
              <p className="mt-1.5 text-xs text-zinc-400">
                One-time packs, added to your balance right away
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <Info className="size-3.5" />
              <span>Extra credits are valid for 90 days</span>
            </div>
          </div>

          {/* 3 Instant Credit Top-Up Cards (Live in Paddle) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {FIXED_CREDIT_PACKS.map((pack) => {
              const isBusy = busyActionId === pack.id
              return (
                <div
                  key={pack.id}
                  className={cn(
                    "flex min-h-[158px] flex-col justify-between rounded-2xl border p-6 transition-all",
                    pack.highlighted
                      ? "border-[#84CC16]/60 bg-gradient-to-br from-[#3F6212]/55 via-[#1A2E05]/45 to-fy-surface-2 shadow-[0_0_35px_rgba(132,204,22,0.18)]"
                      : "border-white/[0.08] bg-[#141416] hover:border-white/15"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">
                        {pack.credits.toLocaleString("en-US")} credits
                      </span>
                      <span className="rounded-full bg-[#D9FF00] px-2 py-0.5 text-[10px] font-extrabold text-black">
                        -{pack.discountPct}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      Up to ~{pack.videosApprox} Genjutsu 5s clips
                    </p>
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-extrabold text-white">
                          {pack.price}
                        </span>
                        <span className="text-sm font-semibold text-zinc-500 line-through">
                          {pack.strikePrice}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        {pack.per100Rate}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={busyActionId !== null}
                      onClick={() =>
                        void handlePurchase({
                          actionKey: pack.id,
                          planId: pack.planId,
                          creditsDelta: pack.credits,
                          label: `${pack.credits.toLocaleString("en-US")} Credit Pack (${pack.price})`,
                        })
                      }
                      className={cn(
                        "h-9 cursor-pointer rounded-full border px-5 text-xs font-semibold text-white transition-colors disabled:opacity-60",
                        pack.highlighted
                          ? "border-white/25 bg-white/15 hover:bg-white/25"
                          : "border-white/12 bg-white/[0.07] hover:bg-white/[0.15]"
                      )}
                    >
                      {isBusy ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : !user ? (
                        "Sign In to Buy"
                      ) : (
                        "Purchase"
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Custom Bulk Credit Slider (5,000 -> 100,000 credits) — Coming Soon */}
          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-white/[0.08] bg-[#161618]/75 p-6 opacity-90">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-bold text-white sm:text-2xl">
                    {activeSliderPack.credits.toLocaleString("en-US")} credits
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-zinc-200 uppercase">
                    Bulk Volume • Coming Soon
                  </span>
                  <span className="rounded-full bg-[#D9FF00]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#D9FF00]">
                    -{activeSliderPack.discountPct}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Up to ~{activeSliderPack.videosApprox.toLocaleString("en-US")} Genjutsu video clips (Enterprise &amp; Studio bulk packs launching soon)
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-2">
                  <span className="text-lg font-bold text-zinc-500 line-through">
                    ${activeSliderPack.strikePrice.toLocaleString("en-US")}
                  </span>
                  <span className="text-2xl font-extrabold text-white">
                    ${activeSliderPack.price.toLocaleString("en-US")}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  $1 ={" "}
                  {Math.round(
                    activeSliderPack.credits / activeSliderPack.price
                  )}{" "}
                  credits
                </span>
              </div>
            </div>

            {/* Interactive Stepped Slider Preview + Coming Soon Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-2">
                <div className="grid grid-cols-12 text-center text-[11px] font-medium text-zinc-500">
                  {SLIDER_STEPS.map((step, idx) => (
                    <button
                      key={step.label}
                      type="button"
                      onClick={() => setSliderIdx(idx)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        idx === sliderIdx
                          ? "font-bold text-white"
                          : "hover:text-zinc-300"
                      )}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>

                <div className="relative flex h-8 items-center rounded-full bg-[#0E0E10] px-3">
                  <div
                    className="pointer-events-none absolute top-1/2 left-3 h-1.5 -translate-y-1/2 rounded-full bg-[#D9FF00]/60 transition-all"
                    style={{
                      width: `calc(${(sliderIdx / (SLIDER_STEPS.length - 1)) * 100}% - 1.5rem)`,
                    }}
                  />
                  <div className="relative z-10 grid w-full grid-cols-12 items-center">
                    {SLIDER_STEPS.map((step, idx) => {
                      const active = idx === sliderIdx
                      return (
                        <button
                          key={step.label}
                          type="button"
                          aria-label={`Preview ${step.credits} credits`}
                          onClick={() => setSliderIdx(idx)}
                          className="flex cursor-pointer items-center justify-center py-1"
                        >
                          {active ? (
                            <span className="flex size-6 items-center justify-center rounded-full bg-white text-[10px] font-black text-black shadow-lg">
                              &lt;&gt;
                            </span>
                          ) : (
                            <span className="size-1.5 rounded-full bg-zinc-600 transition-colors hover:bg-zinc-400" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-5 text-xs font-semibold text-zinc-400">
                Coming Soon
              </span>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            4. "Compare features" MATRIX TABLE
           ════════════════════════════════════════════════════════════════════ */}
        <section id="compare-features" className="flex flex-col gap-5 pt-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Compare features
            </h2>
            <p className="mt-1.5 text-xs text-zinc-400">
              See in details what plan suits you best
            </p>
          </div>

          <div className="overflow-x-auto rounded-[24px] border border-white/[0.08] bg-fy-surface-1 p-6 sm:p-8">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {/* Col 1: Annual Save 20% toggle */}
                  <th className="w-[28%] pb-6 align-bottom">
                    <div className="inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-fy-surface-3 px-3 py-2 text-xs">
                      <span className="font-semibold text-white">
                        Annual{" "}
                        <span className="text-[#D9FF00]">Save 20%</span>
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={annualBilling}
                        onClick={() => setAnnualBilling((v) => !v)}
                        className={cn(
                          "relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors",
                          annualBilling ? "bg-[#22C55E]" : "bg-white/20"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block size-4 transform rounded-full bg-white transition-transform",
                            annualBilling ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  </th>

                  {/* Col 2: Free */}
                  <th className="w-[24%] pr-4 pb-6 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-xl font-bold text-white">Free</span>
                      <span className="mt-2 text-xs font-semibold text-zinc-300">
                        Free
                      </span>
                      <span className="text-[11px] font-normal text-zinc-500">
                        3 Welcome Credits • Limited use
                      </span>
                      {!user ? (
                        <Link
                          to={routes.SignupRoute.to}
                          className="mt-3 flex h-9 w-full items-center justify-center rounded-xl bg-white/[0.08] px-3 text-xs font-semibold text-white transition-colors hover:bg-white/[0.15]"
                        >
                          Get Started Free
                        </Link>
                      ) : isFreeUser ? (
                        <div className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-zinc-400">
                          <Check className="size-3.5 text-[#D9FF00]" />
                          <span>Current Plan</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (customerPortalUrl) {
                              window.open(customerPortalUrl, "_blank")
                            } else {
                              navigate(routes.AccountRoute.to)
                            }
                          }}
                          className="mt-3 h-9 w-full cursor-pointer rounded-xl bg-white/[0.06] px-3 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.12] hover:text-white"
                        >
                          Downgrade to Free
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Col 3: Plus */}
                  <th className="w-[24%] pr-4 pb-6 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white">Plus</span>
                        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                          Popular
                        </span>
                      </div>
                      <span className="mt-2 text-xs font-semibold text-zinc-200">
                        ${plusMonthlyDisplay}/month
                      </span>
                      <span className="text-[11px] font-normal text-zinc-500">
                        {annualBilling ? "Billed annually" : "Billed monthly"}
                      </span>
                      {isPlusUser ? (
                        <div className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-bold text-white">
                          <Check className="size-3.5 text-[#D9FF00]" />
                          <span>Current Plan</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={busyActionId !== null}
                          onClick={() =>
                            void handlePurchase({
                              actionKey: "compare-plus",
                              planId: annualBilling
                                ? PaymentPlanId.PlusAnnual
                                : PaymentPlanId.PlusMonthly,
                              creditsDelta: annualBilling ? 1170 : 1470,
                              label: `FAYAA Plus (${annualBilling ? "1,170" : "1,470"} credits/mo)`,
                            })
                          }
                          className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-black shadow transition-all hover:bg-zinc-100 disabled:opacity-60"
                        >
                          {busyActionId === "compare-plus" ? (
                            <Loader2 className="size-3.5 animate-spin text-black" />
                          ) : !user ? (
                            "Sign In to Subscribe"
                          ) : isUltraUser ? (
                            "Downgrade to Plus"
                          ) : (
                            "Subscribe to Plus"
                          )}
                        </button>
                      )}
                    </div>
                  </th>

                  {/* Col 4: Ultra BEST VALUE */}
                  <th className="w-[24%] pb-6 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white">
                          Ultra
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-[#2563EB] px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-white uppercase">
                          <Gem className="size-2.5" />
                          BEST VALUE
                        </span>
                      </div>
                      <span className="mt-2 text-xs font-semibold text-zinc-200">
                        ${ultraMonthlyDisplay}/month
                      </span>
                      <span className="text-[11px] font-normal text-zinc-500">
                        {annualBilling ? "Billed annually" : "Billed monthly"}
                      </span>
                      {isUltraUser ? (
                        <div className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[#D9FF00]/40 bg-[#D9FF00]/15 px-3 text-xs font-bold text-[#D9FF00]">
                          <Check className="size-3.5" />
                          <span>Current Plan</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={busyActionId !== null}
                          onClick={() =>
                            void handlePurchase({
                              actionKey: "compare-ultra",
                              planId: annualBilling
                                ? PaymentPlanId.UltraAnnual
                                : PaymentPlanId.UltraMonthly,
                              creditsDelta: annualBilling ? 3270 : 3900,
                              label: `FAYAA Ultra (${annualBilling ? "3,270" : "3,900"} credits/mo)`,
                            })
                          }
                          className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#D9FF00] px-3 text-xs font-bold text-black shadow transition-all hover:bg-[#e3ff38] disabled:opacity-60"
                        >
                          {busyActionId === "compare-ultra" ? (
                            <Loader2 className="size-3.5 animate-spin text-black" />
                          ) : !user ? (
                            "Sign In to Upgrade"
                          ) : (
                            "Upgrade to Ultra"
                          )}
                        </button>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06] text-xs">
                <tr>
                  <td
                    colSpan={4}
                    className="pt-6 pb-3 text-base font-bold text-white"
                  >
                    Video Motion Transfer &amp; Rendering
                  </td>
                </tr>

                <tr>
                  <td className="py-4 font-medium text-zinc-300">
                    Concurrent Generation Slots
                  </td>
                  <td className="py-4 text-zinc-400">1 concurrent slot</td>
                  <td className="py-4 text-zinc-300">4 concurrent slots</td>
                  <td className="py-4 font-semibold text-[#D9FF00]">
                    8 concurrent slots
                  </td>
                </tr>

                <tr>
                  <td className="py-4 font-medium text-zinc-300">
                    Monthly Creation Credits
                  </td>
                  <td className="py-4 text-zinc-400">3 welcome credits</td>
                  <td className="py-4 text-zinc-200">
                    {annualBilling ? "1,170 credits" : "1,470 credits"} / mo
                  </td>
                  <td className="py-4 font-semibold text-[#D9FF00]">
                    {annualBilling ? "3,270 credits" : "3,900 credits"} / mo
                  </td>
                </tr>

                <tr>
                  <td className="py-4">
                    <span className="border-b border-dotted border-zinc-500 font-medium text-zinc-200">
                      FAYAA Genjutsu Light 720p
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">
                      {LIGHT_720_5S} credits per 5s video
                    </span>
                  </td>
                  <td className="py-4 text-zinc-500">Trial runs only</td>
                  <td className="py-4 text-zinc-200">
                    Up to {videosPerMonth(annualBilling ? PLAN_CREDITS.plus.annual : PLAN_CREDITS.plus.monthly, LIGHT_720_5S)} videos / mo
                  </td>
                  <td className="py-4 font-semibold text-[#D9FF00]">
                    Up to {videosPerMonth(annualBilling ? PLAN_CREDITS.ultra.annual : PLAN_CREDITS.ultra.monthly, LIGHT_720_5S)} videos / mo
                  </td>
                </tr>

                <tr>
                  <td className="py-4">
                    <span className="border-b border-dotted border-zinc-500 font-medium text-zinc-200">
                      FAYAA Genjutsu Light 1080p
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">
                      {LIGHT_1080_5S} credits per 5s video
                    </span>
                  </td>
                  <td className="py-4 text-zinc-500">Trial runs only</td>
                  <td className="py-4 text-zinc-200">
                    Up to {videosPerMonth(annualBilling ? PLAN_CREDITS.plus.annual : PLAN_CREDITS.plus.monthly, LIGHT_1080_5S)} videos / mo
                  </td>
                  <td className="py-4 font-semibold text-[#D9FF00]">
                    Up to {videosPerMonth(annualBilling ? PLAN_CREDITS.ultra.annual : PLAN_CREDITS.ultra.monthly, LIGHT_1080_5S)} videos / mo
                  </td>
                </tr>

                <tr>
                  <td className="py-4">
                    <span className="border-b border-dotted border-zinc-500 font-medium text-zinc-200">
                      FAYAA Genjutsu Pro 1080p Master
                    </span>
                    <span className="mt-0.5 block text-[11px] text-zinc-500">
                      {PRO_1080_5S} credits per 5s video
                    </span>
                  </td>
                  <td className="py-4 text-zinc-500">Trial runs only</td>
                  <td className="py-4 text-zinc-200">
                    Up to {videosPerMonth(annualBilling ? PLAN_CREDITS.plus.annual : PLAN_CREDITS.plus.monthly, PRO_1080_5S)} videos / mo
                  </td>
                  <td className="py-4 font-semibold text-[#D9FF00]">
                    Up to {videosPerMonth(annualBilling ? PLAN_CREDITS.ultra.annual : PLAN_CREDITS.ultra.monthly, PRO_1080_5S)} videos / mo
                  </td>
                </tr>

                {showAllCompareRows ? (
                  <>
                    <tr>
                      <td
                        colSpan={4}
                        className="pt-6 pb-3 text-base font-bold text-white"
                      >
                        Platform Features &amp; Integrations
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 font-medium text-zinc-300">
                        Reference Images (Face &amp; Garment Lock)
                      </td>
                      <td className="py-4 text-zinc-500">1 reference image</td>
                      <td className="py-4 text-zinc-200">Up to 4 reference images</td>
                      <td className="py-4 font-semibold text-[#D9FF00]">
                        Up to 4 reference images
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 font-medium text-zinc-300">
                        GPU Processing Queue
                      </td>
                      <td className="py-4 text-zinc-500">Standard queue</td>
                      <td className="py-4 text-zinc-200">Priority GPU queue</td>
                      <td className="py-4 font-semibold text-[#D9FF00]">
                        Ultra-Priority Instant Dispatch
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 font-medium text-zinc-300">
                        Commercial Usage Rights
                      </td>
                      <td className="py-4 text-zinc-500">Personal use only</td>
                      <td className="py-4 text-zinc-200">Full commercial license</td>
                      <td className="py-4 font-semibold text-[#D9FF00]">
                        Full commercial &amp; monetization
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 font-medium text-zinc-300">
                        Claude MCP &amp; Cursor Agent API
                      </td>
                      <td className="py-4 text-zinc-600">
                        <X className="size-4" />
                      </td>
                      <td className="py-4 text-zinc-400">
                        Coming Soon
                      </td>
                      <td className="py-4 text-zinc-400">
                        Coming Soon
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 font-medium text-zinc-300">
                        Watermark-Free HD Exports
                      </td>
                      <td className="py-4 text-zinc-600">
                        <X className="size-4" />
                      </td>
                      <td className="py-4 text-zinc-200">
                        <Check className="inline size-4 text-[#D9FF00]" /> 100% Watermark-free
                      </td>
                      <td className="py-4 font-semibold text-[#D9FF00]">
                        <Check className="inline size-4 text-[#D9FF00]" /> 100% Watermark-free
                      </td>
                    </tr>
                  </>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllCompareRows((v) => !v)}
              className="h-10 cursor-pointer rounded-xl border border-white/15 bg-fy-surface-2 px-6 text-xs font-semibold text-white transition-colors hover:bg-white/[0.08]"
            >
              {showAllCompareRows ? "Show Less Features" : "Compare All Features"}
            </button>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            5. "Frequently Asked Questions" ACCORDION (Screenshot 5)
           ════════════════════════════════════════════════════════════════════ */}
        <section
          id="faq-section"
          className="mx-auto flex w-full max-w-[680px] flex-col items-center gap-6 pt-8"
        >
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h2>

          <div className="flex w-full flex-col gap-2.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-xl border border-white/[0.07] bg-fy-surface-2"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white transition-colors hover:bg-white/[0.03]"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-zinc-400 transition-transform duration-200",
                        isOpen && "rotate-180 text-white"
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-white/[0.06] px-5 py-4 text-xs leading-relaxed text-zinc-400">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            6. LEGAL COMPLIANCE FOOTER (Paddle Domain Review Verified)
           ════════════════════════════════════════════════════════════════════ */}
        <footer className="mt-16 border-t border-white/[0.08] pt-8 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} FAYAA (operated by nexusbizz). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/refunds" className="hover:text-white transition-colors">
              Refund Policy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
