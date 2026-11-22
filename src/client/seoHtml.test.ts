import { describe, expect, it } from "vitest";
import { removeWaspFallbackTitle } from "./seoHtml";

describe("production HTML title cleanup", () => {
  it("removes only Wasp's shell title and preserves the route title", () => {
    const html =
      "<head><title>FAYAA shell</title><title>Pricing | FAYAA</title></head>";
    expect(removeWaspFallbackTitle(html, "FAYAA shell")).toBe(
      "<head><title>Pricing | FAYAA</title></head>",
    );
  });
});
