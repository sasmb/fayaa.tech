import { env } from "wasp/server";

/**
 * Asks the marketing site host to rebuild, so homepage media changed at
 * /admin/site-media shows up on fayaa.tech within a minute or two.
 * Fire-and-forget: a failed hook never fails the admin action.
 */
export function triggerMarketingRebuild(reason: string): void {
  const url = env.MARKETING_DEPLOY_HOOK_URL;
  if (!url) return;
  void fetch(url, { method: "POST", signal: AbortSignal.timeout(5000) })
    .then((res) => {
      if (!res.ok) console.warn(`[marketing] deploy hook returned ${res.status} (${reason})`);
    })
    .catch((err: unknown) => {
      console.warn(`[marketing] deploy hook failed (${reason}):`, err instanceof Error ? err.message : err);
    });
}
