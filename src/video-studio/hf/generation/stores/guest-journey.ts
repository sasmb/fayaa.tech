import { useEffect, useState } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { browserStorage } from "./browser-storage"

/** 8 hours in milliseconds */
export const GUEST_JOURNEY_DURATION_MS = 8 * 60 * 60 * 1000

export type GuestJourneyStatus =
  | "authenticated"
  | "unstarted"
  | "active"
  | "expired"

type PersistedGuestJourney = {
  startedAt: number | null
  expiresAt: number | null
  inviteDismissed: boolean
  surpriseAckedOnLanding: boolean
}

export type GuestJourneyState = PersistedGuestJourney & {
  startJourney: () => void
  dismissInvite: () => void
  forceExpireNow: () => void
  resetJourney: () => void
  ackSurpriseOnLanding: () => void
}

export const useGuestJourney = create<GuestJourneyState>()(
  persist(
    (set) => ({
      startedAt: null,
      expiresAt: null,
      inviteDismissed: false,
      surpriseAckedOnLanding: false,

      startJourney: () => {
        const now = Date.now()
        set({
          startedAt: now,
          expiresAt: now + GUEST_JOURNEY_DURATION_MS,
          inviteDismissed: true,
          surpriseAckedOnLanding: false,
        })
      },

      dismissInvite: () => set({ inviteDismissed: true }),

      forceExpireNow: () => {
        const now = Date.now()
        set({
          startedAt: now - GUEST_JOURNEY_DURATION_MS,
          expiresAt: now - 1000,
          inviteDismissed: true,
          surpriseAckedOnLanding: false,
        })
      },

      resetJourney: () =>
        set({
          startedAt: null,
          expiresAt: null,
          inviteDismissed: false,
          surpriseAckedOnLanding: false,
        }),

      ackSurpriseOnLanding: () => set({ surpriseAckedOnLanding: true }),
    }),
    {
      name: "fayaa.guest-journey.v1",
      storage: browserStorage<PersistedGuestJourney>(),
      partialize: (state) => ({
        startedAt: state.startedAt,
        expiresAt: state.expiresAt,
        inviteDismissed: state.inviteDismissed,
        surpriseAckedOnLanding: state.surpriseAckedOnLanding,
      }),
    }
  )
)

export function formatCountdownHhMmSs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":")
}

/** Feature flag: 8-hour guest sneak peek disabled */
export const SNEAK_PEEK_ENABLED = false

export function useGuestJourneyClock(isAuthenticated: boolean) {
  const startedAt = useGuestJourney((s) => s.startedAt)
  const expiresAt = useGuestJourney((s) => s.expiresAt)
  const inviteDismissed = useGuestJourney((s) => s.inviteDismissed)
  const surpriseAckedOnLanding = useGuestJourney(
    (s) => s.surpriseAckedOnLanding
  )
  const startJourney = useGuestJourney((s) => s.startJourney)
  const dismissInvite = useGuestJourney((s) => s.dismissInvite)
  const forceExpireNow = useGuestJourney((s) => s.forceExpireNow)
  const resetJourney = useGuestJourney((s) => s.resetJourney)
  const ackSurpriseOnLanding = useGuestJourney((s) => s.ackSurpriseOnLanding)

  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    if (!SNEAK_PEEK_ENABLED || isAuthenticated || expiresAt === null) return
    setNow(Date.now())
    const id = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [isAuthenticated, expiresAt])

  const status: GuestJourneyStatus = !SNEAK_PEEK_ENABLED
    ? isAuthenticated
      ? "authenticated"
      : "unstarted"
    : isAuthenticated
      ? "authenticated"
      : expiresAt === null
        ? "unstarted"
        : now < expiresAt
          ? "active"
          : "expired"

  const remainingMs =
    SNEAK_PEEK_ENABLED && status === "active" && expiresAt !== null
      ? Math.max(0, expiresAt - now)
      : 0

  return {
    status,
    startedAt,
    expiresAt,
    remainingMs,
    formattedRemaining: formatCountdownHhMmSs(remainingMs),
    inviteDismissed,
    surpriseAckedOnLanding,
    isGuestActive: SNEAK_PEEK_ENABLED && status === "active",
    isGuestExpired: SNEAK_PEEK_ENABLED && status === "expired",
    startJourney: () => {
      if (SNEAK_PEEK_ENABLED) startJourney()
    },
    dismissInvite,
    forceExpireNow,
    resetJourney,
    ackSurpriseOnLanding,
  }
}

