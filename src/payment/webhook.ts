import type { PaymentsWebhook } from "wasp/server/api";
import { paddleWebhook } from "./paddle/webhook";
import { paymentProcessor } from "./paymentProcessor";
import { stripeWebhook } from "./stripe/webhook";

export const paymentsWebhook: PaymentsWebhook = async (
  request,
  response,
  context,
) => {
  if (request.headers["stripe-signature"]) {
    return stripeWebhook(request, response, context);
  }
  if (request.headers["paddle-signature"]) {
    return paddleWebhook(request, response, context);
  }
  return paymentProcessor.webhook(request, response, context);
};

export const paymentsMiddlewareConfigFn =
  paymentProcessor.webhookMiddlewareConfigFn;
