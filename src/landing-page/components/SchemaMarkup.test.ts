import { describe, expect, it } from "vitest";
import { homepageSchema } from "./SchemaMarkup";

describe("homepage structured data", () => {
  it("does not advertise paid plans or credit packs as free", () => {
    const app = homepageSchema["@graph"].find(
      (item) => item["@type"] === "SoftwareApplication",
    );
    expect(app).toBeDefined();
    expect(app).not.toHaveProperty("offers");
  });
});
