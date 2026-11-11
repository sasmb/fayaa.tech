import * as z from "zod";

export const paymentPlansSchema = z.object({
  PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID: z.string({
    error: "PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID is required",
  }),
  PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID: z.string({
    error: "PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID is required",
  }),
  PAYMENTS_CREDITS_10_PLAN_ID: z.string({
    error: "PAYMENTS_CREDITS_10_PLAN_ID is required",
  }),
  PAYMENTS_PLUS_MONTHLY_PLAN_ID: z.string().optional(),
  PAYMENTS_PLUS_ANNUAL_PLAN_ID: z.string().optional(),
  PAYMENTS_ULTRA_MONTHLY_PLAN_ID: z.string().optional(),
  PAYMENTS_ULTRA_ANNUAL_PLAN_ID: z.string().optional(),
  PAYMENTS_CREDITS_STARTER_PLAN_ID: z.string().optional(),
  PAYMENTS_CREDITS_CREATOR_PLAN_ID: z.string().optional(),
  PAYMENTS_CREDITS_STUDIO_PLAN_ID: z.string().optional(),
});
