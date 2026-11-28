import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { APP_PATHS, APP_PREFIXES } from "../src/lib/appPaths.mjs";

const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const cf = readFileSync(new URL("../public/_redirects", import.meta.url), "utf8");

test("vercel.json redirects every app path", () => {
  const sources = new Set(vercel.redirects.map((r) => r.source));
  for (const p of APP_PATHS) assert.ok(sources.has(p), `missing ${p}`);
  for (const p of APP_PREFIXES) assert.ok(sources.has(`${p}/:path*`), `missing ${p}/:path*`);
});

test("Cloudflare _redirects matches", () => {
  for (const p of APP_PATHS) assert.match(cf, new RegExp(`^${p} https://app\\.fayaa\\.tech${p} 301$`, "m"));
  for (const p of APP_PREFIXES) assert.match(cf, new RegExp(`^${p}/\\* `, "m"));
});
