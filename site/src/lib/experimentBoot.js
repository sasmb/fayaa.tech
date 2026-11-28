/**
 * Runs inline in <head>, before first paint, so A/B variants never flicker.
 * It mirrors assignVariant()/resolveAssignments() in
 * src/marketing/experiments.ts (same hash, buckets, storage keys and
 * ?fy_exp= previews), which tests/experiments.check.mjs checks.
 *
 * Keep this function self-contained: Base.astro inlines its source text.
 * @param {{id: string, status: string, winner?: string, variants: {id: string, weight: number}[]}[]} defs
 */
export function fyBoot(defs) {
  var root = document.documentElement;
  var local = null;
  var session = null;
  try { local = window.localStorage; } catch (e) { local = null; }
  try { session = window.sessionStorage; } catch (e) { session = null; }

  function hash(input) {
    var h = 0x811c9dc5;
    for (var i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function assign(exp, visitorId) {
    if (exp.status !== "running") return exp.winner || "control";
    var variants = exp.variants.filter(function (v) { return v.weight > 0; });
    var total = variants.reduce(function (sum, v) { return sum + v.weight; }, 0);
    if (!variants.length || total <= 0) return "control";
    var bucket = (hash(exp.id + ":" + visitorId) / 0x100000000) * total;
    var cumulative = 0;
    for (var i = 0; i < variants.length; i += 1) {
      cumulative += variants[i].weight;
      if (bucket < cumulative) return variants[i].id;
    }
    return variants[variants.length - 1].id;
  }

  var visitorId = null;
  try { visitorId = local && local.getItem("fy_vid"); } catch (e) { visitorId = null; }
  if (!visitorId) {
    visitorId = window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    try { if (local) local.setItem("fy_vid", visitorId); } catch (e) { /* private mode */ }
  }

  var overrides = {};
  try {
    var raw = new URLSearchParams(window.location.search).get("fy_exp");
    if (raw !== null && raw.trim() === "reset") {
      if (session) session.removeItem("fy_exp_preview");
    } else {
      overrides = JSON.parse((session && session.getItem("fy_exp_preview")) || "{}");
      if (raw) {
        raw.split(",").forEach(function (pair) {
          var parts = pair.split(":");
          var id = (parts[0] || "").trim();
          var variant = (parts[1] || "").trim();
          if (id && variant) overrides[id] = variant;
        });
        if (session) session.setItem("fy_exp_preview", JSON.stringify(overrides));
      }
    }
  } catch (e) {
    overrides = {};
  }

  var assignments = {};
  defs.forEach(function (exp) {
    var override = overrides[exp.id];
    var known = override && exp.variants.some(function (v) { return v.id === override; });
    var variant = known ? override : assign(exp, visitorId);
    assignments[exp.id] = variant;
    root.setAttribute("data-x-" + exp.id, variant);
  });
  window.__fyExp = assignments;
  return assignments;
}
