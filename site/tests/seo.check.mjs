// Checks the built site (run `npm run build` first): every page is crawlable and complete.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const dist = new URL("../dist/", import.meta.url).pathname;

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === "_astro" ? [] : htmlFiles(full);
    return name.endsWith(".html") ? [full] : [];
  });
}

const pages = existsSync(dist) ? htmlFiles(dist).filter((f) => !f.endsWith("404.html")) : [];

test("site was built", () => assert.ok(pages.length >= 10, "run npm run build first"));

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const name = file.slice(dist.length);
  test(`${name}: SEO basics`, () => {
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    assert.ok(title.length >= 15 && title.length <= 90, `title length ${title.length}: ${title}`);
    const desc = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? "";
    assert.ok(desc.length >= 70 && desc.length <= 175, `description length ${desc.length}`);
    assert.match(html, /<link rel="canonical" href="https:\/\/fayaa\.tech[^"]*">/);
    assert.match(html, /<meta property="og:image" content="https:\/\//);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, "exactly one h1");
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(ld, "has JSON-LD");
    const graph = JSON.parse(ld)["@graph"];
    assert.ok(graph.some((n) => n["@type"] === "Organization"));
  });
}

test("sitemap lists every page", () => {
  const sitemap = readFileSync(join(dist, "sitemap-0.xml"), "utf8");
  for (const file of pages) {
    const path = file.slice(dist.length).replace(/(index)?\.html$/, "");
    assert.ok(sitemap.includes(`<loc>https://fayaa.tech/${path}</loc>`), `sitemap missing /${path}`);
  }
});
