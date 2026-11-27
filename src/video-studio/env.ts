import * as z from "zod";

export const videoStudioEnvSchema = z.object({
  HF_CREDENTIALS: z
    .string()
    .min(1, "HF_CREDENTIALS is required for video studio")
    .optional(),
  MUAPI_API_KEY: z
    .string()
    .min(1, "MUAPI_API_KEY is required for video studio")
    .optional(),
  MUAPI_LOW_BALANCE_USD: z.string().optional(),
});
