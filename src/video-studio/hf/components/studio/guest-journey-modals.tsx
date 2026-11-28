"use client"

import { Link, useNavigate } from "react-router"
import {
  ArrowRight,
  Clock,
  Gift,
  Lock,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react"

import { Button } from "../ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog"

/* ══════════════════════════════════════════════════════════════════════════
   1. INVITE MODAL: "Come on a journey to when you are logged in"
   ══════════════════════════════════════════════════════════════════════════ */
export function GuestJourneyInviteDialog({
  open,
  onAccept,
  onDismiss,
}: {
  open: boolean
  onAccept: () => void
  onDismiss: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss()
      }}
    >
      <DialogContent
        size="sm"
        className="w-full max-w-[440px] overflow-hidden rounded-[28px] border border-fy-accent/30 bg-fy-surface-1 p-0 text-white shadow-[0_32px_100px_rgba(0,0,0,0.92)]"
      >
        <DialogTitle className="sr-only">
          Come on a journey to when you are logged in
        </DialogTitle>
        <DialogDescription className="sr-only">
          Experience the full FAYAA Studio for the next 8 hours before creating
          an account.
        </DialogDescription>

        {/* Top Visual Preview Banner */}
        <div className="relative h-[200px] w-full overflow-hidden bg-zinc-900">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&q=80"
            alt="FAYAA Studio preview"
            className="size-full object-cover opacity-80"
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: "polygon(0 0, 52% 0, 38% 100%, 0% 100%)" }}
          >
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
              alt="Motion source input"
              className="size-full object-cover"
            />
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-[45%] w-1 -skew-x-12 bg-fy-accent shadow-[0_0_20px_rgba(255,91,31,0.95)]"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-fy-surface-1 via-fy-surface-1/70 to-transparent" />

          {/* Floating 8-Hour Pass Badge */}
          <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 rounded-full border border-fy-accent/40 bg-black/75 px-3 py-1 text-[11px] font-extrabold tracking-wider text-fy-accent uppercase backdrop-blur-md">
            <Sparkles className="size-3.5" />
            <span>8-Hour All-Access Pass</span>
          </div>

          <DialogClose
            onClick={onDismiss}
            aria-label="Dismiss journey invite"
            className="absolute top-3.5 right-3.5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-md transition-colors hover:bg-black/80"
          >
            <X className="size-4" />
          </DialogClose>
        </div>

        {/* Body Copy & Actions */}
        <div className="flex flex-col items-center px-6 pt-2 pb-6 text-center">
          <span className="text-[11px] font-extrabold tracking-[0.16em] text-fy-accent uppercase">
            UNLOCKED FOR NEXT 8 HOURS
          </span>

          <h2 className="mt-1.5 text-2xl leading-[1.1] font-black tracking-tight text-white uppercase sm:text-[26px]">
            Come on a journey to when you are logged in
          </h2>

          <p className="mt-2.5 max-w-[350px] text-xs leading-relaxed text-zinc-300 sm:text-sm">
            Step straight inside the full{" "}
            <span className="font-semibold text-white">FAYAA Studio</span>{" "}
            experience. Load motion videos, wire up{" "}
            <code className="text-fy-accent">@Image1</code> references, and
            explore every tool—no account needed until you hit{" "}
            <span className="font-semibold text-white">Generate</span>.
          </p>

          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] text-zinc-300">
            <Clock className="size-3.5 shrink-0 text-fy-accent" />
            <span>
              Available for <strong className="text-white">8 hours</strong>{" "}
              before this sneak peek disappears.
            </span>
          </div>

          <Button
            size="lg"
            onClick={onAccept}
            className="mt-5 h-11 w-full cursor-pointer rounded-xl bg-fy-accent px-6 text-sm font-extrabold text-black shadow-[0_10px_30px_rgba(255,91,31,0.28)] transition-transform hover:scale-[1.01] hover:bg-fy-accent-hover"
          >
            <span>Start my journey</span>
            <ArrowRight className="ml-1.5 size-4" />
          </Button>

          <button
            type="button"
            onClick={onDismiss}
            className="mt-3 cursor-pointer text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   2. HEADER COUNTDOWN PILL (Live 8h Timer)
   ══════════════════════════════════════════════════════════════════════════ */
export function GuestJourneyCountdownPill({
  formattedRemaining,
}: {
  formattedRemaining: string
  onForceExpire?: () => void
  compact?: boolean
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl border border-fy-accent/35 bg-fy-accent/10 px-2.5 py-1 text-[11px] font-semibold text-fy-accent">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-fy-accent opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-fy-accent" />
      </span>

      <Clock className="size-3 shrink-0" />

      <span className="whitespace-nowrap">
        <strong className="font-mono font-bold text-white">
          {formattedRemaining}
        </strong>{" "}
        left
      </span>

      <Link
        to="/signup"
        className="ml-0.5 rounded-md bg-fy-accent px-2 py-0.5 text-[10px] font-extrabold text-black transition-colors hover:bg-fy-accent-hover"
      >
        Sign up
      </Link>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   3. SIGNUP GATE MODAL ON GENERATE (When guest clicks Generate in Studio)
   ══════════════════════════════════════════════════════════════════════════ */
export function GuestSignupGateDialog({
  open,
  onOpenChange,
  formattedRemaining,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  formattedRemaining: string
}) {
  const navigate = useNavigate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="sm"
        className="w-full max-w-[420px] overflow-hidden rounded-[26px] border border-fy-accent/35 bg-fy-surface-1 p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.9)]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-fy-accent/35 bg-fy-accent/15 text-fy-accent">
            <WandSparkles className="size-6" />
          </div>

          <span className="mt-3 rounded-full border border-fy-accent/30 bg-fy-accent/10 px-3 py-0.5 text-[10px] font-bold tracking-wider text-fy-accent uppercase">
            {formattedRemaining} left in preview
          </span>

          <DialogTitle className="mt-2.5 text-xl font-black tracking-tight text-white uppercase sm:text-2xl">
            Sign up to run this generation
          </DialogTitle>

          <DialogDescription className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
            Your workspace setup is ready! Create a free FAYAA account now to
            unlock GPU rendering and generate your video.
          </DialogDescription>

          <div className="mt-5 flex w-full flex-col gap-2.5">
            <Button
              size="lg"
              onClick={() => void navigate("/signup")}
              className="h-11 w-full cursor-pointer rounded-xl bg-fy-accent text-sm font-extrabold text-black shadow-[0_8px_24px_rgba(255,91,31,0.28)] hover:bg-fy-accent-hover"
            >
              Sign up free &amp; start generating
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => void navigate("/login")}
              className="h-10 w-full cursor-pointer rounded-xl border-white/15 bg-white/[0.04] text-xs font-semibold text-white hover:bg-white/[0.1]"
            >
              Already have an account? Log in
            </Button>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-3.5 cursor-pointer text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Keep exploring the studio
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   4. EXPIRY MODAL: "Wait till your next surprise!" (After 8 hours expire)
   ══════════════════════════════════════════════════════════════════════════ */
export function GuestJourneyExpiredDialog({
  open,
  lockStudio = false,
  onDismissOnLanding,
}: {
  open: boolean
  /** When true (inside /studio), clicking outside cannot dismiss the lock */
  lockStudio?: boolean
  onDismissOnLanding?: () => void
  onRestartDemo?: () => void
}) {
  const navigate = useNavigate()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !lockStudio && onDismissOnLanding) {
          onDismissOnLanding()
        }
      }}
    >
      <DialogContent
        size="sm"
        className="w-full max-w-[430px] overflow-hidden rounded-[28px] border border-amber-400/35 bg-fy-surface-1 p-0 text-white shadow-[0_32px_100px_rgba(0,0,0,0.95)]"
      >
        <div className="relative flex flex-col items-center overflow-hidden bg-gradient-to-b from-amber-500/20 via-[#181510] to-fy-surface-1 px-6 pt-7 pb-6 text-center">
          {!lockStudio && onDismissOnLanding ? (
            <DialogClose
              onClick={onDismissOnLanding}
              aria-label="Close surprise notice"
              className="absolute top-3.5 right-3.5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white/80 transition-colors hover:bg-black/75"
            >
              <X className="size-4" />
            </DialogClose>
          ) : null}

          <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-400/15 text-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.25)]">
            <Gift className="size-7" />
          </div>

          <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-0.5 text-[10px] font-bold tracking-widest text-amber-200 uppercase">
            <Lock className="size-3" />
            <span>8-Hour Preview Ended</span>
          </div>

          <DialogTitle className="mt-2.5 text-2xl leading-tight font-black tracking-tight text-white uppercase sm:text-3xl">
            Wait till your next surprise!
          </DialogTitle>

          <DialogDescription className="mt-2.5 max-w-[340px] text-xs leading-relaxed text-zinc-300 sm:text-sm">
            Your 8-hour preview journey inside FAYAA Studio has ended. Sign up
            now to unlock the full studio permanently—or wait till your next
            surprise!
          </DialogDescription>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <Button
              size="lg"
              onClick={() => void navigate("/signup")}
              className="h-11 w-full cursor-pointer rounded-xl bg-fy-accent text-sm font-extrabold text-black shadow-[0_10px_28px_rgba(255,91,31,0.25)] hover:bg-fy-accent-hover"
            >
              Sign up to unlock Studio now
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => void navigate("/login")}
              className="h-10 w-full cursor-pointer rounded-xl border-white/15 bg-white/[0.04] text-xs font-semibold text-white hover:bg-white/[0.1]"
            >
              Log in to existing account
            </Button>

            {lockStudio ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void navigate("/")}
                className="mt-1 cursor-pointer text-xs text-zinc-400 hover:text-white"
              >
                ← Back to Home
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
