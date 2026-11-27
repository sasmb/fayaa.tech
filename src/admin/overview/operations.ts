import { env, HttpError } from "wasp/server";
import {
  type GetAdminOverview,
  type SyncStripePayments,
} from "wasp/server/operations";
import {
  stripeInvoiceToPaymentRecord,
  upsertStripePayment,
} from "../../payment/stripe/paymentRecord";
import { stripeApi } from "../../payment/stripe/stripeApi";
import { type AdminOverview, buildAdminOverview } from "./overviewMath";

function assertAdmin(user: { isAdmin?: boolean } | undefined | null) {
  if (!user) {
    throw new HttpError(401, "Please sign in.");
  }
  if (!user.isAdmin) {
    throw new HttpError(403, "Only admins can view the owner overview.");
  }
}

export const getAdminOverview: GetAdminOverview<void, AdminOverview> = async (
  _args,
  context,
) => {
  assertAdmin(context.user);

  const [users, payments, tasks, longJobs] = await Promise.all([
    context.entities.User.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        isAdmin: true,
        credits: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    }),
    context.entities.Payment.findMany({
      select: {
        id: true,
        userId: true,
        amountCents: true,
        currency: true,
        paidAt: true,
        kind: true,
        planId: true,
      },
    }),
    context.entities.VideoTask.findMany({
      select: {
        id: true,
        userId: true,
        provider: true,
        model: true,
        resolution: true,
        status: true,
        prompt: true,
        creditCost: true,
        createdAt: true,
      },
    }),
    context.entities.LongVideoJob.findMany({
      select: {
        id: true,
        userId: true,
        variant: true,
        resolution: true,
        status: true,
        prompt: true,
        segmentCount: true,
        createdAt: true,
        segments: { select: { status: true, durationSec: true } },
      },
    }),
  ]);

  return buildAdminOverview({
    users,
    payments,
    tasks,
    longJobs,
    now: new Date(),
  });
};

type SyncStripePaymentsResult = { imported: number; skipped: number };

/**
 * Backfills `Payment` from Stripe's paid invoices, so revenue from before the
 * webhook started recording payments shows up. Safe to run repeatedly.
 */
export const syncStripePayments: SyncStripePayments<
  void,
  SyncStripePaymentsResult
> = async (_args, context) => {
  assertAdmin(context.user);
  if (!env.STRIPE_API_KEY) {
    throw new HttpError(400, "STRIPE_API_KEY is not set on the server.");
  }

  let imported = 0;
  let skipped = 0;
  try {
    for await (const invoice of stripeApi.invoices.list({
      status: "paid",
      limit: 100,
    })) {
      const record = stripeInvoiceToPaymentRecord(invoice);
      if (!record) {
        skipped++;
        continue;
      }
      await upsertStripePayment(
        record,
        context.entities.Payment,
        context.entities.User,
      );
      imported++;
      if (imported + skipped >= 10_000) break;
    }
  } catch (err: unknown) {
    throw new HttpError(
      502,
      `Stripe sync stopped after ${imported} invoices: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  return { imported, skipped };
};
