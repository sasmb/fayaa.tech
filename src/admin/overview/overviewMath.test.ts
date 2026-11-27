import { describe, expect, it } from "vitest";
import { buildAdminOverview, type OverviewInput } from "./overviewMath";

const now = new Date("2026-11-27T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

function input(): OverviewInput {
  return {
    now,
    users: [
      {
        id: "u1",
        email: "a@example.com",
        username: null,
        createdAt: daysAgo(40),
        isAdmin: false,
        credits: 60,
        subscriptionPlan: "plus_monthly",
        subscriptionStatus: "active",
      },
      {
        id: "u2",
        email: "b@example.com",
        username: null,
        createdAt: daysAgo(2),
        isAdmin: false,
        credits: 30,
        subscriptionPlan: null,
        subscriptionStatus: null,
      },
    ],
    payments: [
      {
        id: "p1",
        userId: "u1",
        amountCents: 1500,
        currency: "usd",
        paidAt: daysAgo(10),
        kind: "subscription",
        planId: "plus_monthly",
      },
      {
        id: "p2",
        userId: "u1",
        amountCents: 900,
        currency: "usd",
        paidAt: daysAgo(45),
        kind: "credits",
        planId: "credits_starter",
      },
    ],
    tasks: [
      // 60 credits = $2.00 of provider cost
      {
        id: "t1",
        userId: "u1",
        provider: "HIGGSFIELD",
        model: "x",
        resolution: "720p",
        status: "COMPLETED",
        prompt: "dance",
        creditCost: 60,
        createdAt: daysAgo(1),
      },
      // failed: refunded, assumed free
      {
        id: "t2",
        userId: "u2",
        provider: "HIGGSFIELD",
        model: "x",
        resolution: "720p",
        status: "FAILED",
        prompt: null,
        creditCost: 90,
        createdAt: daysAgo(1),
      },
    ],
    longJobs: [],
  };
}

describe("buildAdminOverview", () => {
  it("totals revenue, spend and per-user net", () => {
    const o = buildAdminOverview(input());
    expect(o.totals.users).toBe(2);
    expect(o.totals.newUsers7d).toBe(1);
    expect(o.totals.revenueCents).toBe(2400);
    expect(o.totals.revenue30dCents).toBe(1500);
    expect(o.totals.spendCents).toBe(200);
    expect(o.totals.profitCents).toBe(2200);
    expect(o.totals.payingUsers).toBe(1);
    expect(o.totals.activeUsers7d).toBe(2);
    expect(o.totals.failedGenerations).toBe(1);
    expect(o.totals.creditsOutstanding).toBe(90);

    const [first, second] = o.users;
    expect(first.id).toBe("u1");
    expect(first.revenueCents).toBe(2400);
    expect(first.spendCents).toBe(200);
    expect(first.profitCents).toBe(2200);
    expect(second.spendCents).toBe(0);
    expect(second.failedGenerations).toBe(1);
  });

  it("buckets the last 30 days and sorts activity newest first", () => {
    const o = buildAdminOverview(input());
    expect(o.daily).toHaveLength(30);
    expect(o.daily.at(-1)!.date).toBe("2026-11-27");
    expect(o.daily.reduce((s, d) => s + d.revenueCents, 0)).toBe(1500);
    expect(o.daily.reduce((s, d) => s + d.signups, 0)).toBe(1);
    const times = o.activity.map((a) => a.at.getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it("charges long videos only for rendered pieces", () => {
    const base = input();
    base.longJobs = [
      {
        id: "j1",
        userId: "u2",
        variant: "light",
        resolution: "480p",
        status: "FAILED",
        prompt: null,
        segmentCount: 2,
        createdAt: daysAgo(1),
        segments: [
          { status: "COMPLETED", durationSec: 30 },
          { status: "FAILED", durationSec: 30 },
        ],
      },
    ];
    const o = buildAdminOverview(base);
    // light 480p = $0.025/s * 30s = $0.75 -> 23 credits -> $0.77
    expect(o.totals.spendCents).toBe(200 + 77);
  });
});
