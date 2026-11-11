import { env } from "wasp/server";
import { type PaymentPlan, PaymentPlanId } from "./plans";

/**
 * The ID under which this payment plan is identified on the active payment processor (Stripe),
 * with Paddle fallback mappings preserved below.
 */
export const paymentProcessorPlanIds: Record<PaymentPlanId, string> = {
  // Legacy / Default Aliases
  [PaymentPlanId.Hobby]:
    env.PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID || "price_1UZoAGRwvANxOdCyEzSLAdMD",
  [PaymentPlanId.Pro]:
    env.PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID || "price_1UZoAGRwvANxOdCy8662hDdv",
  [PaymentPlanId.Credits10]:
    env.PAYMENTS_CREDITS_10_PLAN_ID || "price_1UZoAHRwvANxOdCyJde6SfgY",

  // Verified Subscriptions
  [PaymentPlanId.PlusMonthly]:
    process.env.PAYMENTS_PLUS_MONTHLY_PLAN_ID || "price_1UZoAGRwvANxOdCyEzSLAdMD",
  [PaymentPlanId.PlusAnnual]:
    process.env.PAYMENTS_PLUS_ANNUAL_PLAN_ID || "price_1UZoAGRwvANxOdCy5EM8Enjs",
  [PaymentPlanId.UltraMonthly]:
    process.env.PAYMENTS_ULTRA_MONTHLY_PLAN_ID || "price_1UZoAGRwvANxOdCy8662hDdv",
  [PaymentPlanId.UltraAnnual]:
    process.env.PAYMENTS_ULTRA_ANNUAL_PLAN_ID || "price_1UZoAHRwvANxOdCyRxFSSlgR",

  // Verified One-Time Top-Ups
  [PaymentPlanId.CreditsStarter]:
    process.env.PAYMENTS_CREDITS_STARTER_PLAN_ID || "price_1UZoAHRwvANxOdCyJde6SfgY",
  [PaymentPlanId.CreditsCreator]:
    process.env.PAYMENTS_CREDITS_CREATOR_PLAN_ID || "price_1UZoAHRwvANxOdCympYtlKE4",
  [PaymentPlanId.CreditsStudio]:
    process.env.PAYMENTS_CREDITS_STUDIO_PLAN_ID || "price_1UZoAHRwvANxOdCywkaDrWqH",
};

const preservedPriceIdFallbacks: Record<string, PaymentPlanId> = {
  // Stripe Price IDs
  price_1UZoAGRwvANxOdCyEzSLAdMD: PaymentPlanId.PlusMonthly,
  price_1UZoAGRwvANxOdCy5EM8Enjs: PaymentPlanId.PlusAnnual,
  price_1UZoAGRwvANxOdCy8662hDdv: PaymentPlanId.UltraMonthly,
  price_1UZoAHRwvANxOdCyRxFSSlgR: PaymentPlanId.UltraAnnual,
  price_1UZoAHRwvANxOdCyJde6SfgY: PaymentPlanId.CreditsStarter,
  price_1UZoAHRwvANxOdCympYtlKE4: PaymentPlanId.CreditsCreator,
  price_1UZoAHRwvANxOdCywkaDrWqH: PaymentPlanId.CreditsStudio,
  // Preserved Paddle Price IDs
  pri_01m6rj2vwqtjkv8nwxe8nsw647: PaymentPlanId.PlusMonthly,
  pri_01m6rj2w53s8z0494174csh87d: PaymentPlanId.PlusAnnual,
  pri_01m6rj2wcy728th5ekh0d7tg19: PaymentPlanId.UltraMonthly,
  pri_01m6rj2wm80y1aphvb7bn9krva: PaymentPlanId.UltraAnnual,
  pri_01m6rj2wvnw665js6g5b50v8qq: PaymentPlanId.CreditsStarter,
  pri_01m6rj2x2zzwpm76at7xe2fa7k: PaymentPlanId.CreditsCreator,
  pri_01m6rj2xchaasn621df8s05zwv: PaymentPlanId.CreditsStudio,
  pri_01m5vxzyfqstsppyqq0fw91w10: PaymentPlanId.PlusMonthly,
  pri_01m5vy82gfd3ncv3797ysrpm1t: PaymentPlanId.UltraMonthly,
  pri_01m5vye6hys6vmc9k1sksy42na: PaymentPlanId.CreditsStarter,
};

/**
 * Returns your payment processor plan ID for a given Open SaaS `PaymentPlan`.
 */
export function getPaymentProcessorPlanId(paymentPlan: PaymentPlan): string {
  return paymentProcessorPlanIds[paymentPlan.id];
}

/**
 * Returns Open SaaS `PaymentPlanId` for some payment provider's plan ID.
 */
export function getPaymentPlanIdByPaymentProcessorPlanId(
  paymentProcessorPlanId: string,
): PaymentPlanId {
  for (const [planId, processorPlanId] of Object.entries(
    paymentProcessorPlanIds,
  )) {
    if (processorPlanId === paymentProcessorPlanId) {
      return planId as PaymentPlanId;
    }
  }

  const fallbackPlanId = preservedPriceIdFallbacks[paymentProcessorPlanId];
  if (fallbackPlanId) {
    return fallbackPlanId;
  }

  throw new Error(
    `Unknown payment processor plan ID: ${paymentProcessorPlanId}`,
  );
}
