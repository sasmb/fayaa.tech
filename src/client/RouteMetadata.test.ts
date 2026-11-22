import { describe, expect, it } from "vitest";
import { resolveRouteMetadata } from "./RouteMetadata";

describe("route metadata resolution", () => {
  it("uses the canonical fayaa.tech host and normalized paths", () => {
    const metadata = resolveRouteMetadata("/pricing/?utm_source=campaign");
    expect(metadata?.path).toBe("/pricing");
    expect(metadata?.robots).toBe("index,follow");
  });

  it("canonicalizes Studio tab variants to the Studio path", () => {
    expect(resolveRouteMetadata("/studio?tab=history")?.path).toBe("/studio");
    expect(resolveRouteMetadata("/studio?tab=history")?.robots).toBe(
      "noindex,follow",
    );
  });

  it("marks auth flows noindex and protected account routes nofollow", () => {
    for (const path of [
      "/login",
      "/signup",
      "/password-reset",
      "/request-password-reset",
      "/email-verification",
    ]) {
      expect(resolveRouteMetadata(path)?.robots).toBe("noindex,follow");
    }
    for (const path of ["/account", "/checkout", "/admin", "/admin/users"]) {
      expect(resolveRouteMetadata(path)?.robots).toBe("noindex,nofollow");
    }
  });

  it("does not emit a canonical for personalized private routes", () => {
    expect(resolveRouteMetadata("/account")?.canonical).toBe(false);
    expect(resolveRouteMetadata("/checkout")?.canonical).toBe(false);
  });
});
