export const DEFAULT_USER_AVATAR = "/default-bunny-avatar.png";

export function getUserAvatarUrl(
  user?: { avatarUrl?: string | null } | null,
): string {
  const explicitUrl = user?.avatarUrl?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  if (typeof window !== "undefined") {
    try {
      const storedAvatar = window.localStorage
        .getItem("fayaa_user_avatar")
        ?.trim();
      if (storedAvatar) {
        return storedAvatar;
      }
    } catch {
      // Ignore storage access errors
    }
  }

  return DEFAULT_USER_AVATAR;
}

