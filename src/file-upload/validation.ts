// Allow up to 250MB for multi-minute direct-to-storage source video uploads.
export const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "text/*",
  "video/quicktime",
  "video/mp4",
] as const;
