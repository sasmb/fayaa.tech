// The inline boot script must assign exactly what src/marketing/experiments.ts assigns.
import assert from "node:assert/strict";
import { test } from "node:test";

import { EXPERIMENTS, resolveAssignments } from "../../src/marketing/experiments.ts";
import { fyBoot } from "../src/lib/experimentBoot.js";

function runBoot(visitorId, search = "") {
  const attrs = {};
  const store = new Map([["fy_vid", visitorId]]);
  const session = new Map();
  const storage = (m) => ({ getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) });
  globalThis.document = { documentElement: { setAttribute: (k, v) => (attrs[k] = v) } };
  globalThis.window = { localStorage: storage(store), sessionStorage: storage(session), location: { search } };
  const defs = EXPERIMENTS.map((e) => ({ id: e.id, status: e.status, winner: e.winner, variants: e.variants }));
  return { assignments: fyBoot(defs), attrs };
}

test("boot script matches resolveAssignments for many visitors", () => {
  for (let i = 0; i < 500; i += 1) {
    const id = `visitor-${i}-${(i * 2654435761) % 1000003}`;
    assert.deepEqual(runBoot(id).assignments, resolveAssignments(id));
  }
});

test("?fy_exp previews win and set data-x attributes", () => {
  const { assignments, attrs } = runBoot("abc", "?fy_exp=hero-copy:creator");
  assert.equal(assignments["hero-copy"], "creator");
  assert.equal(attrs["data-x-hero-copy"], "creator");
});

test("unknown preview variants are ignored", () => {
  const { assignments } = runBoot("abc", "?fy_exp=hero-copy:nope");
  assert.deepEqual(assignments, resolveAssignments("abc"));
});
