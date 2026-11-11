import {
  EventName,
  type SubscriptionNotification,
  type TransactionNotification,
} from "@paddle/paddle-node-sdk";
import express from "express";
import {
  env,
  HttpError,
  type MiddlewareConfigFn,
  type PrismaClient,
} from "wasp/server";
import type { PaymentsWebhook } from "wasp/server/api";
import { assertUnreachable } from "../../shared/utils";
import { UnhandledWebhookEventError } from "../errors";
import { getPaymentPlanIdByPaymentProcessorPlanId } from "../paymentProcessorPlans";
import {
  SubscriptionStatus as OpenSaasSubscriptionStatus,
  PaymentPlanId,
  paymentPlans,
} from "../plans";
import { processWebhookEventOnce } from "../processedWebhookEvent";
import { updateUserCredits, updateUserSubscription } from "../user";
import { paddleApi } from "./paddleApi";

type PaddleWebhookEvent = Awaited<
  ReturnType<typeof paddleApi.webhooks.unmarshal>
>;

let cachedPaddleIps: { cidrs: string[]; expiresAt: number } | null = null;

async function getPaddleAllowedCidrs(): Promise<string[]> {
  const now = Date.now();
  if (cachedPaddleIps && cachedPaddleIps.expiresAt > now) {
    return cachedPaddleIps.cidrs;
  }
  try {
    const res = await fetch("https://api.paddle.com/ips");
    if (!res.ok) {
      throw new Error(`Failed to fetch Paddle IPs: ${res.status}`);
    }
    const data = (await res.json()) as { data?: { ipv4_cidrs?: string[] } };
    const cidrs = data?.data?.ipv4_cidrs ?? [];
    if (cidrs.length > 0) {
      cachedPaddleIps = { cidrs, expiresAt: now + 6 * 60 * 60 * 1000 };
      return cidrs;
    }
  } catch (err) {
    console.error("[Paddle Webhook] Error fetching live IP allowlist:", err);
  }
  return cachedPaddleIps?.cidrs ?? [];
}

function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bits = "32"] = cidr.split("/");
    const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
    const ipInt = ip.split(".").reduce((acc, oct) => ((acc << 8) + parseInt(oct, 10)) >>> 0, 0);
    const rangeInt = range.split(".").reduce((acc, oct) => ((acc << 8) + parseInt(oct, 10)) >>> 0, 0);
    return (ipInt & mask) === (rangeInt & mask);
  } catch {
    return false;
  }
}

/**
 * Paddle requires the raw request body to verify the webhook signature.
 */
export const paddleMiddlewareConfigFn: MiddlewareConfigFn = (
  middlewareConfig,
) => {
  middlewareConfig.delete("express.json");
  middlewareConfig.set(
    "express.raw",
    express.raw({ type: "application/json" }),
  );

  return middlewareConfig;
};

export const paddleWebhook: PaymentsWebhook = async (
  request,
  response,
  context,
) => {
  const prismaUserDelegate = context.entities.User;
  try {
    // Dynamic IP Allowlisting against https://api.paddle.com/ips (Production verification)
    if (process.env.NODE_ENV === "production" && process.env.FLY_APP_NAME) {
      const forwarded = request.get("x-forwarded-for");
      const clientIp = forwarded
        ? forwarded.split(",")[0].trim()
        : request.socket.remoteAddress?.replace(/^.*:/, "");
      if (clientIp && clientIp !== "127.0.0.1" && clientIp !== "::1") {
        const allowedCidrs = await getPaddleAllowedCidrs();
        if (allowedCidrs.length > 0 && !allowedCidrs.some((cidr) => isIpInCidr(clientIp, cidr))) {
          console.warn(`[Paddle Webhook] Blocked request from non-Paddle IP: ${clientIp}`);
          throw new HttpError(403, "Untrusted IP address");
        }
      }
    }

    const signature = request.get("paddle-signature");
    if (!signature) {
      throw new HttpError(400, "Missing Paddle-Signature header");
    }

    const event = await paddleApi.webhooks.unmarshal(
      request.body.toString(),
      env.PADDLE_WEBHOOK_SECRET,
      signature,
    );

    await processWebhookEventOnce(
      { paymentProcessorEventId: event.eventId, eventType: event.eventType },
      context.entities.ProcessedWebhookEvent,
      () => handlePaddleEvent(event, prismaUserDelegate),
    );
    return response.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof UnhandledWebhookEventError) {
      // In development, it is likely that we will receive events that we are not handling.
      if (process.env.NODE_ENV === "development") {
        console.info("Unhandled Paddle webhook event in development: ", error);
      } else if (process.env.NODE_ENV === "production") {
        console.error("Unhandled Paddle webhook event in production: ", error);
      }

      // We must return a 2XX status code, otherwise Paddle will keep retrying the event.
      return response.status(200).json({ error: error.message });
    }

    console.error("Paddle webhook error: ", error);
    if (error instanceof HttpError) {
      return response.status(error.statusCode).json({ error: error.message });
    } else if (error instanceof Error) {
      return response.status(400).json({ error: error.message });
    } else {
      return response
        .status(500)
        .json({ error: "Error processing Paddle webhook event" });
    }
  }
};

async function handlePaddleEvent(
  event: PaddleWebhookEvent,
  userDelegate: PrismaClient["user"],
): Promise<void> {
  switch (event.eventType) {
    case EventName.TransactionCompleted:
      await handleTransactionCompleted(event.data, userDelegate);
      break;
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionCanceled:
      await handleSubscriptionChange(event.data, userDelegate);
      break;
    default:
      throw new UnhandledWebhookEventError(event.eventType);
  }
}

async function handleTransactionCompleted(
  transaction: TransactionNotification,
  userDelegate: PrismaClient["user"],
): Promise<void> {
  // Updating a payment method creates a zero-value transaction, which isn't a payment.
  if (transaction.origin === "subscription_payment_method_change") {
    return;
  }

  if (!transaction.customerId) {
    throw new Error(`Paddle transaction ${transaction.id} has no customer ID`);
  }

  const paymentPlanId = getPaymentPlanIdByPaymentProcessorPlanId(
    getPriceId(transaction.items),
  );

  const datePaid = new Date(transaction.billedAt ?? transaction.createdAt);

  switch (paymentPlanId) {
    case PaymentPlanId.Credits10:
    case PaymentPlanId.CreditsStarter:
    case PaymentPlanId.CreditsCreator:
    case PaymentPlanId.CreditsStudio: {
      const plan = paymentPlans[paymentPlanId];
      const creditsAmount =
        plan.effect.kind === "credits" ? plan.effect.amount : 250;
      await updateUserCredits(
        {
          paymentProcessorUserId: transaction.customerId,
          numOfCreditsPurchased: creditsAmount,
          datePaid,
        },
        userDelegate,
      );
      break;
    }
    case PaymentPlanId.Hobby:
    case PaymentPlanId.Pro:
    case PaymentPlanId.PlusMonthly:
    case PaymentPlanId.PlusAnnual:
    case PaymentPlanId.UltraMonthly:
    case PaymentPlanId.UltraAnnual:
      await updateUserSubscription(
        {
          paymentProcessorUserId: transaction.customerId,
          paymentPlanId,
          subscriptionStatus: OpenSaasSubscriptionStatus.Active,
          datePaid,
        },
        userDelegate,
      );
      break;
    default:
      assertUnreachable(paymentPlanId);
  }
}

async function handleSubscriptionChange(
  subscription: SubscriptionNotification,
  userDelegate: PrismaClient["user"],
): Promise<void> {
  const subscriptionStatus = getOpenSaasSubscriptionStatus(subscription);
  const paymentPlanId = getPaymentPlanIdByPaymentProcessorPlanId(
    getPriceId(subscription.items),
  );

  await updateUserSubscription(
    {
      paymentProcessorUserId: subscription.customerId,
      subscriptionStatus,
      paymentPlanId,
    },
    userDelegate,
  );
}

function getPriceId(items: { price: { id: string } | null }[]): string {
  // We only expect one item.
  // If your workflow expects more, you should change this function to handle them.
  if (items.length !== 1) {
    throw new Error(
      "There should be exactly one item in Paddle transaction or subscription",
    );
  }

  const priceId = items[0].price?.id;
  if (!priceId) {
    throw new Error("Unable to extract price id from items");
  }

  return priceId;
}

function getOpenSaasSubscriptionStatus(
  subscription: SubscriptionNotification,
): OpenSaasSubscriptionStatus {
  if (
    subscription.status === "active" &&
    subscription.scheduledChange?.action === "cancel"
  ) {
    return OpenSaasSubscriptionStatus.CancelAtPeriodEnd;
  }

  switch (subscription.status) {
    case "active":
    case "trialing":
      return OpenSaasSubscriptionStatus.Active;
    case "past_due":
    case "paused":
      return OpenSaasSubscriptionStatus.PastDue;
    case "canceled":
      return OpenSaasSubscriptionStatus.Deleted;
    default:
      assertUnreachable(subscription.status);
  }
}
