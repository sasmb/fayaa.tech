import { defineEnvValidationSchema } from "wasp/env";

import * as z from "zod";
import { googleAnalyticsEnvSchema, plausibleEnvSchema } from "./analytics/env";
import { authEnvSchema } from "./auth/env";
import { fileUploadEnvSchema } from "./file-upload/env";
import { lemonSqueezyEnvSchema } from "./payment/lemonSqueezy/env";
import { paddleClientEnvSchema, paddleEnvSchema } from "./payment/paddle/env";
import { polarEnvSchema } from "./payment/polar/env";
import { stripeEnvSchema } from "./payment/stripe/env";
import { videoStudioEnvSchema } from "./video-studio/env";

// Wasp merges this schema with its built-in env var validations and uses it
// to validate `process.env` at server startup. Access the validated env vars
// with `import { env } from 'wasp/server'` instead of using `process.env` directly.
// https://wasp.sh/docs/project/env-vars#custom-env-var-validations
//
// Active payment processor is Paddle (`paddleEnvSchema`); inactive payment,
// analytics, and demo schemas are marked `.partial()` so production deployment
// only requires the active service credentials.
export const serverEnvValidationSchema = defineEnvValidationSchema(
  z.object({
    ...authEnvSchema.shape,
    ...stripeEnvSchema.shape,
    ...lemonSqueezyEnvSchema.shape,
    ...polarEnvSchema.shape,
    ...paddleEnvSchema.shape,
    ...fileUploadEnvSchema.shape,
    ...plausibleEnvSchema.shape,
    ...googleAnalyticsEnvSchema.shape,
    ...videoStudioEnvSchema.shape,
  }),
);

// Same as above, but for the client-side env vars (prefixed with `REACT_APP_`).
// Access the validated env vars with `import { env } from 'wasp/client'`.
export const clientEnvValidationSchema = defineEnvValidationSchema(
  z.object({
    ...paddleClientEnvSchema.shape,
  }),
);
