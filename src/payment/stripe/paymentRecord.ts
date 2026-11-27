import { type PrismaClient } from "@prisma/client";
import type { Stripe } from "stripe";
import { getPaymentPlanIdByPaymentProcessorPlanId } from "../paymentProcessorPlans";
import { type PaymentPlanId, paymentPlans } from "../plans";

export interface StripePaymentRecord {
  externalId: string;
  paymentProcessorUserId: string | null;
  planId: PaymentPlanId | null;
  kind: "subscription" | "credits" | "unknown";
  amountCents: number;
  currency: string;
  creditsGranted: number | null;
  paidAt: Date;
}

/**
 * Turns a paid Stripe invoice into the row we keep in `Payment`.
 * Returns null for invoices that moved no money (e.g. $0 trial invoices) or
 * that are not paid yet.
 */
export function stripeInvoiceToPaymentRecord(
  invoice: Stripe.Invoice,
): StripePaymentRecord | null {
  if (!invoice.id) return null;
  const paidAtUnix = invoice.status_transitions?.paid_at;
  if (!paidAtUnix) return null;
  const amountCents = invoice.amount_paid ?? 0;
  if (amountCents <= 0) return null;

  const customer = invoice.customer;
  const paymentProcessorUserId =
    typeof customer === "string" ? customer : (customer?.id ?? null);

  const planId = resolvePlanId(invoice);
  const plan = planId ? paymentPlans[planId] : null;
  const effect = plan?.effect;
  const kind = effect ? effect.kind : "unknown";
  let creditsGranted: number | null = null;
  if (effect?.kind === "credits") {
    creditsGranted = effect.amount;
  } else if (plan && "monthlyCredits" in plan) {
    creditsGranted = plan.monthlyCredits ?? null;
  }

  return {
    externalId: invoice.id,
    paymentProcessorUserId,
    planId,
    kind,
    amountCents,
    currency: (invoice.currency || "usd").toLowerCase(),
    creditsGranted,
    paidAt: new Date(paidAtUnix * 1000),
  };
}

function resolvePlanId(invoice: Stripe.Invoice): PaymentPlanId | null {
  const lineItem = invoice.lines?.data?.[0] as
    | (Stripe.InvoiceLineItem & { price?: { id?: string } | string })
    | undefined;
  if (!lineItem) return null;
  const priceId =
    lineItem.pricing?.price_details?.price ??
    (typeof lineItem.price === "string" ? lineItem.price : lineItem.price?.id);
  if (!priceId) return null;
  try {
    return getPaymentPlanIdByPaymentProcessorPlanId(priceId);
  } catch {
    return null;
  }
}

/**
 * Idempotently stores a payment, linking it to the user that owns the Stripe
 * customer when we know them. Safe to call from webhooks and backfills.
 */
export async function upsertStripePayment(
  record: StripePaymentRecord,
  paymentDelegate: PrismaClient["payment"],
  userDelegate: PrismaClient["user"],
): Promise<void> {
  const user = record.paymentProcessorUserId
    ? await userDelegate.findUnique({
        where: { paymentProcessorUserId: record.paymentProcessorUserId },
        select: { id: true },
      })
    : null;

  const data = {
    provider: "stripe",
    paymentProcessorUserId: record.paymentProcessorUserId,
    planId: record.planId,
    kind: record.kind,
    amountCents: record.amountCents,
    currency: record.currency,
    creditsGranted: record.creditsGranted,
    paidAt: record.paidAt,
    userId: user?.id ?? null,
  };

  await paymentDelegate.upsert({
    where: { externalId: record.externalId },
    create: { externalId: record.externalId, ...data },
    update: data,
  });
}
