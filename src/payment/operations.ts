import { HttpError } from "wasp/server";
import type {
  GenerateCheckoutSession,
  GetCustomerPortalUrl,
} from "wasp/server/operations";
import * as z from "zod";
import { PaymentPlanId, SubscriptionStatus, paymentPlans } from "../payment/plans";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import {
  type CheckoutSession,
  paymentProcessor,
  type PaymentProcessorId,
} from "./paymentProcessor";

export type GeneratedCheckoutSession = CheckoutSession & {
  paymentProcessorId: PaymentProcessorId;
  instantApplied?: boolean;
  updatedCredits?: number;
  updatedPlan?: string | null;
};

const generateCheckoutSessionSchema = z.union([
  z.nativeEnum(PaymentPlanId),
  z.object({
    planId: z.nativeEnum(PaymentPlanId),
    mode: z.enum(["paddle", "instant_test"]).optional(),
    creditsDelta: z.number().int().min(1).max(200000).optional(),
    planName: z.string().optional(),
  }),
]);

export type GenerateCheckoutSessionInput = z.infer<
  typeof generateCheckoutSessionSchema
>;

export const generateCheckoutSession: GenerateCheckoutSession<
  GenerateCheckoutSessionInput,
  GeneratedCheckoutSession
> = async (rawInput, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }

  const parsed = ensureArgsSchemaOrThrowHttpError(
    generateCheckoutSessionSchema,
    rawInput,
  );

  const paymentPlanId = typeof parsed === "string" ? parsed : parsed.planId;
  const mode = typeof parsed === "string" ? "paddle" : (parsed.mode ?? "paddle");
  const customCreditsDelta =
    typeof parsed === "string" ? undefined : parsed.creditsDelta;

  const userId = context.user.id;
  const userEmail = context.user.email;
  if (!userEmail) {
    throw new HttpError(403, "User needs an email to make a payment.");
  }

  const paymentPlan = paymentPlans[paymentPlanId];

  // Instant Test / Sandbox Account Mode: directly provision plan & credits in PostgreSQL
  if (mode === "instant_test") {
    const defaultCredits =
      paymentPlan.effect.kind === "credits"
        ? paymentPlan.effect.amount
        : "monthlyCredits" in paymentPlan
        ? (paymentPlan as any).monthlyCredits ?? 1000
        : 1000;
    const creditsToAdd = customCreditsDelta ?? defaultCredits;
    const isSubscription = paymentPlan.effect.kind === "subscription";

    const updatedUser = await context.entities.User.update({
      where: { id: userId },
      data: {
        credits: { increment: creditsToAdd },
        ...(isSubscription
          ? {
              subscriptionPlan: paymentPlanId,
              subscriptionStatus: SubscriptionStatus.Active,
              datePaid: new Date(),
            }
          : {}),
      },
    });

    return {
      id: `instant_${Date.now()}`,
      kind: "inPage",
      paymentProcessorId: paymentProcessor.id,
      instantApplied: true,
      updatedCredits: updatedUser.credits,
      updatedPlan: updatedUser.subscriptionPlan,
    };
  }

  try {
    const { session } = await paymentProcessor.createCheckoutSession({
      userId,
      userEmail,
      paymentPlan,
      prismaUserDelegate: context.entities.User,
    });

    return { ...session, paymentProcessorId: paymentProcessor.id };
  } catch (error: any) {
    const errorMsg = error?.message || String(error);

    // If Paddle returns "Checkouts aren't enabled for this account" due to pending KYC/onboarding verification
    if (
      error?.code === "transaction_checkout_not_enabled" ||
      errorMsg.includes("Checkouts aren't enabled") ||
      errorMsg.includes("onboarding")
    ) {
      // In local development, seamlessly fall back to local provisioning so testing is never blocked
      if (process.env.NODE_ENV !== "production" || !process.env.FLY_APP_NAME) {
        console.warn(
          "[Paddle Dev Fallback] Live checkouts are pending Paddle onboarding verification. Provisioning plan locally for development."
        );

        const defaultCredits =
          paymentPlan.effect.kind === "credits"
            ? paymentPlan.effect.amount
            : "monthlyCredits" in paymentPlan
            ? (paymentPlan as any).monthlyCredits ?? 1000
            : 1000;
        const creditsToAdd = customCreditsDelta ?? defaultCredits;
        const isSubscription = paymentPlan.effect.kind === "subscription";

        const updatedUser = await context.entities.User.update({
          where: { id: userId },
          data: {
            credits: { increment: creditsToAdd },
            ...(isSubscription
              ? {
                  subscriptionPlan: paymentPlanId,
                  subscriptionStatus: SubscriptionStatus.Active,
                  datePaid: new Date(),
                }
              : {}),
          },
        });

        return {
          id: `instant_${Date.now()}`,
          kind: "inPage",
          paymentProcessorId: paymentProcessor.id,
          instantApplied: true,
          updatedCredits: updatedUser.credits,
          updatedPlan: updatedUser.subscriptionPlan,
        };
      }

      throw new HttpError(
        400,
        "Checkouts are temporarily disabled on Paddle while your live account verification is being reviewed. Please complete the verification steps at vendors.paddle.com."
      );
    }

    throw new HttpError(500, errorMsg);
  }
};

export const getCustomerPortalUrl: GetCustomerPortalUrl<
  void,
  string | null
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }

  return paymentProcessor.fetchCustomerPortalUrl({
    userId: context.user.id,
    prismaUserDelegate: context.entities.User,
  });
};
