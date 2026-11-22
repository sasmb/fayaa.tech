import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const headersFile = readFileSync("public/_headers", "utf8");

describe("static-host first-response robots headers", () => {
  it("configures noindex headers for each Studio, auth, and private route", () => {
    const expected: Record<string, string> = {
      "/studio": "noindex, follow",
      "/login": "noindex, follow",
      "/signup": "noindex, follow",
      "/request-password-reset": "noindex, follow",
      "/password-reset": "noindex, follow",
      "/email-verification": "noindex, follow",
      "/account": "noindex, nofollow",
      "/checkout": "noindex, nofollow",
      "/admin": "noindex, nofollow",
      "/admin/*": "noindex, nofollow",
    };
    for (const [path, policy] of Object.entries(expected)) {
      expect(headersFile).toContain(`${path}\n  X-Robots-Tag: ${policy}`);
    }
  });
});
