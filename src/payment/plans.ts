export enum SubscriptionStatus {
  PastDue = "past_due",
  CancelAtPeriodEnd = "cancel_at_period_end",
  Active = "active",
  Deleted = "deleted",
}

export enum PaymentPlanId {
  Hobby = "hobby",
  Pro = "pro",
  Credits10 = "credits10",
  PlusMonthly = "plus_monthly",
  PlusAnnual = "plus_annual",
  UltraMonthly = "ultra_monthly",
  UltraAnnual = "ultra_annual",
  CreditsStarter = "credits_starter",
  CreditsCreator = "credits_creator",
  CreditsStudio = "credits_studio",
}

export interface PaymentPlan {
  id: PaymentPlanId;
  effect: PaymentPlanEffect;
  monthlyCredits?: number;
}

export type PaymentPlanEffect =
  | { kind: "subscription" }
  | { kind: "credits"; amount: number };

export const paymentPlans = {
  // Legacy / Default Aliases
  [PaymentPlanId.Hobby]: {
    id: PaymentPlanId.Hobby,
    effect: { kind: "subscription" },
    monthlyCredits: 1000,
  },
  [PaymentPlanId.Pro]: {
    id: PaymentPlanId.Pro,
    effect: { kind: "subscription" },
    monthlyCredits: 3000,
  },
  [PaymentPlanId.Credits10]: {
    id: PaymentPlanId.Credits10,
    effect: { kind: "credits", amount: 250 },
  },

  // Exact Subscriptions
  [PaymentPlanId.PlusMonthly]: {
    id: PaymentPlanId.PlusMonthly,
    effect: { kind: "subscription" },
    monthlyCredits: 1470,
  },
  [PaymentPlanId.PlusAnnual]: {
    id: PaymentPlanId.PlusAnnual,
    effect: { kind: "subscription" },
    monthlyCredits: 1170,
  },
  [PaymentPlanId.UltraMonthly]: {
    id: PaymentPlanId.UltraMonthly,
    effect: { kind: "subscription" },
    monthlyCredits: 3900,
  },
  [PaymentPlanId.UltraAnnual]: {
    id: PaymentPlanId.UltraAnnual,
    effect: { kind: "subscription" },
    monthlyCredits: 3270,
  },

  // Exact One-Time Credit Top-Ups
  [PaymentPlanId.CreditsStarter]: {
    id: PaymentPlanId.CreditsStarter,
    effect: { kind: "credits", amount: 360 },
  },
  [PaymentPlanId.CreditsCreator]: {
    id: PaymentPlanId.CreditsCreator,
    effect: { kind: "credits", amount: 1170 },
  },
  [PaymentPlanId.CreditsStudio]: {
    id: PaymentPlanId.CreditsStudio,
    effect: { kind: "credits", amount: 2670 },
  },
} as const satisfies Record<PaymentPlanId, PaymentPlan>;

export function prettyPaymentPlanName(planId: PaymentPlanId): string {
  const planToName: Record<PaymentPlanId, string> = {
    [PaymentPlanId.Hobby]: "FAYAA Plus",
    [PaymentPlanId.Pro]: "FAYAA Ultra",
    [PaymentPlanId.Credits10]: "Starter Pack (360 Credits)",
    [PaymentPlanId.PlusMonthly]: "FAYAA Plus (Monthly)",
    [PaymentPlanId.PlusAnnual]: "FAYAA Plus (Annual)",
    [PaymentPlanId.UltraMonthly]: "FAYAA Ultra (Monthly)",
    [PaymentPlanId.UltraAnnual]: "FAYAA Ultra (Annual)",
    [PaymentPlanId.CreditsStarter]: "Starter Pack (360 Credits)",
    [PaymentPlanId.CreditsCreator]: "Creator Pack (1,170 Credits)",
    [PaymentPlanId.CreditsStudio]: "Studio Pack (2,670 Credits)",
  };
  return planToName[planId] ?? "FAYAA Plan";
}

export function parsePaymentPlanId(planId: string): PaymentPlanId {
  if ((Object.values(PaymentPlanId) as string[]).includes(planId)) {
    return planId as PaymentPlanId;
  } else {
    throw new Error(`Invalid PaymentPlanId: ${planId}`);
  }
}

export function getSubscriptionPaymentPlanIds(): PaymentPlanId[] {
  return Object.values(PaymentPlanId).filter(
    (planId) => paymentPlans[planId].effect.kind === "subscription",
  );
}
