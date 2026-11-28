import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { APP_PATHS, APP_PREFIXES } from "../src/lib/appPaths.mjs";

const nginx = readFileSync(new URL("../nginx.conf", import.meta.url), "utf8");

test("nginx redirects every app path to app.fayaa.tech", () => {
  for (const p of APP_PATHS) {
    assert.ok(nginx.includes(`location = ${p} { return 301 https://app.fayaa.tech$request_uri; }`), `missing ${p}`);
  }
  for (const p of APP_PREFIXES) {
    assert.ok(nginx.includes(`location ^~ ${p}/ { return 301 https://app.fayaa.tech$request_uri; }`), `missing ${p}/`);
  }
});
