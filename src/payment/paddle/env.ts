import * as z from "zod";
import { paymentPlansSchema } from "../env";

export const paddleEnvSchema = paymentPlansSchema.extend({
  PADDLE_API_KEY: z.string().default("unused"),
  PADDLE_WEBHOOK_SECRET: z.string().default("whsec_unused"),
  PADDLE_SANDBOX_MODE: z.string().default("true"),
});

export const paddleClientEnvSchema = z.object({
  REACT_APP_PADDLE_CLIENT_TOKEN: z.string().default(""),
  REACT_APP_PADDLE_SANDBOX_MODE: z.string().default("true"),
});
