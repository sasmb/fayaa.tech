/**
 * Paths that belong to the app and now live on app.fayaa.tech. Old links,
 * bookmarks, emails and search results for fayaa.tech/<path> are redirected
 * there with the query string kept. nginx.conf must list the same paths;
 * tests/redirects.check.mjs checks.
 */
export const APP_PATHS = [
  "/studio",
  "/login",
  "/signup",
  "/account",
  "/checkout",
  "/request-password-reset",
  "/password-reset",
  "/email-verification",
  "/file-upload",
  "/admin",
  "/terms",
  "/privacy",
  "/refunds",
];

/** Prefix paths: everything under them redirects too. */
export const APP_PREFIXES = ["/admin", "/api", "/auth", "/operations"];
