import {
  creditsToProviderCents,
  usdToCredits,
} from "../../video-studio/pricing";
import {
  estimateSeedancePlan,
  SEEDANCE_VARIANT,
} from "../../video-studio/seedancePlanning";
import { creditCostForResolution } from "../../video-studio/taskSync";
import { formatMoney } from "./format";

export { CREDITS_PER_USD, PRICE_MARKUP } from "../../video-studio/pricing";

const DAY_MS = 24 * 60 * 60 * 1000;

export type OverviewUserInput = {
  id: string;
  email: string | null;
  username: string | null;
  createdAt: Date;
  isAdmin: boolean;
  credits: number;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
}

export type OverviewPaymentInput = {
  id: string;
  userId: string | null;
  amountCents: number;
  currency: string;
  paidAt: Date;
  kind: string;
  planId: string | null;
}

export type OverviewTaskInput = {
  id: string;
  userId: string;
  provider: string;
  model: string;
  resolution: string;
  status: string;
  prompt: string | null;
  creditCost: number | null;
  createdAt: Date;
}

export type OverviewLongJobInput = {
  id: string;
  userId: string;
  variant: string;
  resolution: string;
  status: string;
  prompt: string | null;
  segmentCount: number;
  createdAt: Date;
  segments: { status: string; durationSec: number }[];
}

export type OverviewInput = {
  users: OverviewUserInput[];
  payments: OverviewPaymentInput[];
  tasks: OverviewTaskInput[];
  longJobs: OverviewLongJobInput[];
  now: Date;
}

export type OverviewTotals = {
  users: number;
  newUsers7d: number;
  newUsers30d: number;
  payingUsers: number;
  activeUsers7d: number;
  revenueCents: number;
  revenue30dCents: number;
  spendCents: number;
  spend30dCents: number;
  profitCents: number;
  generations: number;
  completedGenerations: number;
  failedGenerations: number;
  inProgressGenerations: number;
  creditsOutstanding: number;
  currency: string;
  mixedCurrencies: boolean;
}

export type OverviewDay = {
  date: string; // YYYY-MM-DD (UTC)
  revenueCents: number;
  spendCents: number;
  signups: number;
  generations: number;
}

export type OverviewUserRow = {
  id: string;
  email: string | null;
  username: string | null;
  createdAt: Date;
  isAdmin: boolean;
  credits: number;
  plan: string | null;
  subscriptionStatus: string | null;
  revenueCents: number;
  payments: number;
  generations: number;
  failedGenerations: number;
  spendCents: number;
  profitCents: number;
  lastActiveAt: Date | null;
}

export type OverviewActivityType =
  | "signup"
  | "payment"
  | "generation"
  | "long_video";

export type OverviewActivity = {
  id: string;
  type: OverviewActivityType;
  at: Date;
  userId: string | null;
  userLabel: string;
  title: string;
  detail: string | null;
  status: string | null;
}

export type AdminOverview = {
  generatedAt: Date;
  totals: OverviewTotals;
  daily: OverviewDay[];
  users: OverviewUserRow[];
  activity: OverviewActivity[];
}

/** Statuses where the provider has (or will have) billed us for the render. */
function isBillable(status: string): boolean {
  return status === "COMPLETED" || status === "PROCESSING";
}

export function taskCostCredits(task: OverviewTaskInput): number {
  return task.creditCost ?? creditCostForResolution(task.resolution, task.model);
}

export function longJobCostCredits(job: OverviewLongJobInput): number {
  if (job.variant === SEEDANCE_VARIANT) {
    // Seedance pieces are priced as text-to-video first, then extends (see seedancePlanning).
    const plan = estimateSeedancePlan({
      totalDurationSec: job.segments.reduce((sum, s) => sum + s.durationSec, 0),
      resolution: job.resolution,
    });
    return job.segments.reduce(
      (sum, s, i) =>
        isBillable(s.status) && plan.pieces[i] ? sum + usdToCredits(plan.pieces[i]!.usd) : sum,
      0,
    );
  }
  return job.segments
    .filter((s) => isBillable(s.status))
    .reduce(
      (sum, s) =>
        sum + creditCostForResolution(job.resolution, job.variant, s.durationSec),
      0,
    );
}

/** Provider cost behind a credit price: credits / (30 per $1 x markup). */
export function creditsToCents(credits: number): number {
  return creditsToProviderCents(credits);
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shorten(text: string | null, max = 90): string | null {
  if (!text) return null;
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function modelLabel(model: string): string {
  if (model.includes("genjutsu-light")) return "Motion transfer (light)";
  if (model.includes("genjutsu/motion-transfer")) return "Motion transfer (pro)";
  if (model.includes("seedance")) return "Seedance";
  const last = model.split("/").filter(Boolean).slice(-2).join(" ");
  return last || model;
}

export function buildAdminOverview(
  input: OverviewInput,
  opts: { days?: number; activityLimit?: number } = {},
): AdminOverview {
  const days = opts.days ?? 30;
  const activityLimit = opts.activityLimit ?? 40;
  const nowMs = input.now.getTime();
  const since7 = nowMs - 7 * DAY_MS;
  const since30 = nowMs - 30 * DAY_MS;

  // Currency: we report in the most common currency and flag mixed data.
  const currencyCounts = new Map<string, number>();
  for (const p of input.payments) {
    currencyCounts.set(p.currency, (currencyCounts.get(p.currency) ?? 0) + 1);
  }
  const currency =
    [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "usd";
  const mixedCurrencies = currencyCounts.size > 1;

  // Daily buckets, oldest first.
  const daily: OverviewDay[] = [];
  const dailyIndex = new Map<string, OverviewDay>();
  const todayStart = Date.UTC(
    input.now.getUTCFullYear(),
    input.now.getUTCMonth(),
    input.now.getUTCDate(),
  );
  for (let i = days - 1; i >= 0; i--) {
    const d: OverviewDay = {
      date: dayKey(new Date(todayStart - i * DAY_MS)),
      revenueCents: 0,
      spendCents: 0,
      signups: 0,
      generations: 0,
    };
    daily.push(d);
    dailyIndex.set(d.date, d);
  }

  const rows = new Map<string, OverviewUserRow>();
  for (const u of input.users) {
    rows.set(u.id, {
      id: u.id,
      email: u.email,
      username: u.username,
      createdAt: u.createdAt,
      isAdmin: u.isAdmin,
      credits: u.credits,
      plan: u.subscriptionPlan,
      subscriptionStatus: u.subscriptionStatus,
      revenueCents: 0,
      payments: 0,
      generations: 0,
      failedGenerations: 0,
      spendCents: 0,
      profitCents: 0,
      lastActiveAt: null,
    });
  }
  const touch = (row: OverviewUserRow | undefined, at: Date) => {
    if (row && (!row.lastActiveAt || row.lastActiveAt < at)) {
      row.lastActiveAt = at;
    }
  };

  const totals: OverviewTotals = {
    users: input.users.length,
    newUsers7d: 0,
    newUsers30d: 0,
    payingUsers: 0,
    activeUsers7d: 0,
    revenueCents: 0,
    revenue30dCents: 0,
    spendCents: 0,
    spend30dCents: 0,
    profitCents: 0,
    generations: 0,
    completedGenerations: 0,
    failedGenerations: 0,
    inProgressGenerations: 0,
    creditsOutstanding: 0,
    currency,
    mixedCurrencies,
  };

  for (const u of input.users) {
    const t = u.createdAt.getTime();
    if (t >= since7) totals.newUsers7d++;
    if (t >= since30) totals.newUsers30d++;
    totals.creditsOutstanding += Math.max(0, u.credits);
    const day = dailyIndex.get(dayKey(u.createdAt));
    if (day) day.signups++;
  }

  for (const p of input.payments) {
    if (p.currency !== currency) continue;
    totals.revenueCents += p.amountCents;
    if (p.paidAt.getTime() >= since30) totals.revenue30dCents += p.amountCents;
    const day = dailyIndex.get(dayKey(p.paidAt));
    if (day) day.revenueCents += p.amountCents;
    const row = p.userId ? rows.get(p.userId) : undefined;
    if (row) {
      row.revenueCents += p.amountCents;
      row.payments++;
      touch(row, p.paidAt);
    }
  }

  const activeIds = new Set<string>();
  const countGeneration = (
    userId: string,
    status: string,
    createdAt: Date,
    costCents: number,
  ) => {
    totals.generations++;
    if (status === "COMPLETED") totals.completedGenerations++;
    else if (status === "FAILED") totals.failedGenerations++;
    else totals.inProgressGenerations++;
    totals.spendCents += costCents;
    if (createdAt.getTime() >= since30) totals.spend30dCents += costCents;
    if (createdAt.getTime() >= since7) activeIds.add(userId);
    const day = dailyIndex.get(dayKey(createdAt));
    if (day) {
      day.generations++;
      day.spendCents += costCents;
    }
    const row = rows.get(userId);
    if (row) {
      row.generations++;
      if (status === "FAILED") row.failedGenerations++;
      row.spendCents += costCents;
      touch(row, createdAt);
    }
  };

  for (const t of input.tasks) {
    const cost = isBillable(t.status) ? creditsToCents(taskCostCredits(t)) : 0;
    countGeneration(t.userId, t.status, t.createdAt, cost);
  }
  for (const j of input.longJobs) {
    countGeneration(
      j.userId,
      j.status,
      j.createdAt,
      creditsToCents(longJobCostCredits(j)),
    );
  }

  totals.activeUsers7d = activeIds.size;
  totals.profitCents = totals.revenueCents - totals.spendCents;

  const userRows = [...rows.values()];
  for (const r of userRows) {
    r.profitCents = r.revenueCents - r.spendCents;
    if (r.revenueCents > 0) totals.payingUsers++;
  }
  userRows.sort(
    (a, b) =>
      b.revenueCents - a.revenueCents ||
      b.spendCents - a.spendCents ||
      (b.lastActiveAt?.getTime() ?? 0) - (a.lastActiveAt?.getTime() ?? 0) ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );

  // Activity feed: newest events across signups, payments and renders.
  const labelFor = (userId: string | null) => {
    const row = userId ? rows.get(userId) : undefined;
    return row?.email ?? row?.username ?? (userId ? "Unknown user" : "Unlinked customer");
  };
  const activity: OverviewActivity[] = [];
  for (const u of input.users) {
    activity.push({
      id: `signup:${u.id}`,
      type: "signup",
      at: u.createdAt,
      userId: u.id,
      userLabel: labelFor(u.id),
      title: "Signed up",
      detail: null,
      status: null,
    });
  }
  for (const p of input.payments) {
    activity.push({
      id: `payment:${p.id}`,
      type: "payment",
      at: p.paidAt,
      userId: p.userId,
      userLabel: labelFor(p.userId),
      title: p.kind === "credits" ? "Bought credits" : "Paid subscription",
      detail: [formatMoney(p.amountCents, p.currency), p.planId]
        .filter(Boolean)
        .join(" · "),
      status: null,
    });
  }
  for (const t of input.tasks) {
    activity.push({
      id: `task:${t.id}`,
      type: "generation",
      at: t.createdAt,
      userId: t.userId,
      userLabel: labelFor(t.userId),
      title: `${modelLabel(t.model)} · ${t.resolution}`,
      detail: shorten(t.prompt),
      status: t.status,
    });
  }
  for (const j of input.longJobs) {
    activity.push({
      id: `long:${j.id}`,
      type: "long_video",
      at: j.createdAt,
      userId: j.userId,
      userLabel: labelFor(j.userId),
      title: `Long video (${j.segmentCount} pieces, ${j.variant}) · ${j.resolution}`,
      detail: shorten(j.prompt),
      status: j.status,
    });
  }
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    generatedAt: input.now,
    totals,
    daily,
    users: userRows,
    activity: activity.slice(0, activityLimit),
  };
}
