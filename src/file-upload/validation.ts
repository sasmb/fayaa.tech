// Set this to the max file size you want to allow (50MB for media/video support).
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "text/*",
  "video/quicktime",
  "video/mp4",
] as const;
