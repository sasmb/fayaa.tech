import { type ApexOptions } from "apexcharts";
import {
  Activity,
  CreditCard,
  DollarSign,
  Film,
  RefreshCw,
  Search,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { type AuthUser } from "wasp/auth";
import {
  getAdminOverview,
  syncStripePayments,
  useQuery,
} from "wasp/client/operations";
import { Button } from "../../../client/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../client/components/ui/card";
import { cn } from "../../../client/utils";
import { DefaultLayout } from "../../layout/DefaultLayout";
import { formatMoney } from "../../overview/format";
import {
  type AdminOverview,
  type OverviewActivity,
  type OverviewUserRow,
} from "../../overview/overviewMath";

const REFRESH_MS = 30_000;
const USERS_PAGE = 25;

export function OwnerOverviewPage({ user }: { user: AuthUser }) {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery(getAdminOverview, undefined, {
    refetchInterval: REFRESH_MS,
  });
  const [syncState, setSyncState] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const onSync = async () => {
    setSyncing(true);
    setSyncState(null);
    try {
      const res = await syncStripePayments();
      setSyncState(
        `Synced ${res.imported} paid invoices from Stripe${
          res.skipped ? ` (${res.skipped} with no charge skipped)` : ""
        }.`,
      );
      await refetch();
    } catch (err: unknown) {
      setSyncState(err instanceof Error ? err.message : "Stripe sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DefaultLayout user={user}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-foreground text-2xl font-bold">
              Owner overview
            </h1>
            <p className="text-muted-foreground text-sm">
              Everyone on FAYAA, what they're rendering, what they've paid and
              what it costs us.{" "}
              {data && (
                <span>
                  Updated {formatTime(data.generatedAt)}, refreshes every 30s.
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn(isFetching && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" onClick={onSync} disabled={syncing}>
              <CreditCard />
              {syncing ? "Syncing…" : "Sync payments from Stripe"}
            </Button>
          </div>
        </div>

        {syncState && (
          <div className="bg-muted text-foreground rounded-md px-4 py-2 text-sm">
            {syncState}
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="py-6">
              <p className="text-destructive font-semibold">
                Couldn't load the overview
              </p>
              <p className="text-muted-foreground text-sm">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {isLoading && !data && (
          <p className="text-muted-foreground text-sm">Loading overview…</p>
        )}

        {data && <OverviewBody data={data} />}
      </div>
    </DefaultLayout>
  );
}

function OverviewBody({ data }: { data: AdminOverview }) {
  const { totals } = data;
  const money = (cents: number) => formatMoney(cents, totals.currency);
  const margin =
    totals.revenueCents > 0
      ? Math.round((totals.profitCents / totals.revenueCents) * 100)
      : null;

  return (
    <>
      {totals.mixedCurrencies && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm">
          Payments exist in more than one currency. Totals only include{" "}
          {totals.currency.toUpperCase()}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users />}
          label="Total users"
          value={totals.users.toLocaleString()}
          sub={`+${totals.newUsers7d} this week · +${totals.newUsers30d} in 30 days`}
        />
        <StatCard
          icon={<Activity />}
          label="Active users (7 days)"
          value={totals.activeUsers7d.toLocaleString()}
          sub={`${totals.payingUsers} have paid at least once`}
        />
        <StatCard
          icon={<DollarSign />}
          label="Total revenue"
          value={money(totals.revenueCents)}
          sub={`${money(totals.revenue30dCents)} in the last 30 days`}
        />
        <StatCard
          icon={<Wallet />}
          label="Provider spend (est.)"
          value={formatMoney(totals.spendCents, "usd")}
          sub={`${formatMoney(totals.spend30dCents, "usd")} in the last 30 days`}
        />
        <StatCard
          icon={<TrendingUp />}
          label="Net (revenue − spend)"
          value={money(totals.profitCents)}
          sub={margin === null ? "No revenue yet" : `${margin}% margin`}
          tone={totals.profitCents >= 0 ? "good" : "bad"}
        />
        <StatCard
          icon={<Film />}
          label="Generations"
          value={totals.generations.toLocaleString()}
          sub={`${totals.completedGenerations} done · ${totals.failedGenerations} failed · ${totals.inProgressGenerations} running`}
        />
        <StatCard
          icon={<Zap />}
          label="Unspent credits"
          value={totals.creditsOutstanding.toLocaleString()}
          sub={`≈ ${formatMoney(Math.round((totals.creditsOutstanding / 30) * 100), "usd")} of renders owed`}
        />
        <StatCard
          icon={<UserPlus />}
          label="Revenue per paying user"
          value={
            totals.payingUsers > 0
              ? money(Math.round(totals.revenueCents / totals.payingUsers))
              : "—"
          }
          sub={
            totals.users > 0
              ? `${money(Math.round(totals.revenueCents / totals.users))} across all users`
              : "No users yet"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue vs spend, last 30 days</CardTitle>
            <CardDescription>Daily, UTC</CardDescription>
          </CardHeader>
          <CardContent>
            <MoneyChart data={data} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Signups and generations</CardTitle>
            <CardDescription>Daily, last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <VolumeChart data={data} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
        <div className="2xl:col-span-2">
          <UsersCard rows={data.users} currency={totals.currency} />
        </div>
        <ActivityCard items={data.activity} />
      </div>

      <p className="text-muted-foreground text-xs">
        Revenue is every paid Stripe invoice recorded in the database (use
        "Sync payments from Stripe" to backfill older ones; refunds made in
        Stripe aren't subtracted). Spend is estimated from each render's credit
        price (30 credits per $1 of provider cost, times the 1.5x markup), counting finished and
        running renders; failed renders are refunded and assumed free.
      </p>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad";
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 py-5">
        <div className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-full [&_svg]:size-5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p
            className={cn("text-foreground truncate text-2xl font-bold", {
              "text-success": tone === "good",
              "text-destructive": tone === "bad",
            })}
          >
            {value}
          </p>
          {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const baseChart: ApexOptions = {
  chart: {
    fontFamily: "system-ui, sans-serif",
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  legend: { position: "top", horizontalAlign: "left" },
  grid: { strokeDashArray: 4 },
  tooltip: { theme: "dark" },
};

function shortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function MoneyChart({ data }: { data: AdminOverview }) {
  const { options, series } = useMemo(() => {
    const categories = data.daily.map((d) => shortDate(d.date));
    return {
      options: {
        ...baseChart,
        colors: ["#3C50E0", "#F0950C"],
        stroke: { width: 2, curve: "smooth" },
        fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0 } },
        xaxis: { categories, tickAmount: 6, labels: { rotate: 0 } },
        yaxis: {
          min: 0,
          labels: { formatter: (v: number) => `$${v.toFixed(0)}` },
        },
        tooltip: {
          theme: "dark",
          y: { formatter: (v: number) => `$${v.toFixed(2)}` },
        },
      } satisfies ApexOptions,
      series: [
        { name: "Revenue", data: data.daily.map((d) => d.revenueCents / 100) },
        { name: "Spend (est.)", data: data.daily.map((d) => d.spendCents / 100) },
      ],
    };
  }, [data]);
  return <ReactApexChart options={options} series={series} type="area" height={300} />;
}

function VolumeChart({ data }: { data: AdminOverview }) {
  const { options, series } = useMemo(() => {
    const categories = data.daily.map((d) => shortDate(d.date));
    return {
      options: {
        ...baseChart,
        colors: ["#10B981", "#80CAEE"],
        plotOptions: { bar: { columnWidth: "70%", borderRadius: 2 } },
        xaxis: { categories, tickAmount: 4, labels: { rotate: 0 } },
        yaxis: { min: 0, forceNiceScale: true },
      } satisfies ApexOptions,
      series: [
        { name: "Signups", data: data.daily.map((d) => d.signups) },
        { name: "Generations", data: data.daily.map((d) => d.generations) },
      ],
    };
  }, [data]);
  return <ReactApexChart options={options} series={series} type="bar" height={300} />;
}

function UsersCard({
  rows,
  currency,
}: {
  rows: OverviewUserRow[];
  currency: string;
}) {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(USERS_PAGE);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email?.toLowerCase().includes(q) ||
        r.username?.toLowerCase().includes(q) ||
        r.id.toLowerCase().startsWith(q),
    );
  }, [rows, search]);
  const visible = filtered.slice(0, limit);
  const money = (c: number) => formatMoney(c, currency);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Clients</CardTitle>
          <CardDescription>
            Sorted by what they've paid. {filtered.length} of {rows.length}{" "}
            shown.
          </CardDescription>
        </div>
        <label className="border-input bg-background flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
          <Search className="text-muted-foreground size-4" />
          <input
            className="w-48 bg-transparent outline-none"
            placeholder="Search email or username"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(USERS_PAGE);
            }}
          />
        </label>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground border-b text-xs uppercase">
              <tr>
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">Plan</th>
                <th className="py-2 pr-3 text-right font-medium">Paid</th>
                <th className="py-2 pr-3 text-right font-medium">Spend</th>
                <th className="py-2 pr-3 text-right font-medium">Net</th>
                <th className="py-2 pr-3 text-right font-medium">Renders</th>
                <th className="py-2 pr-3 text-right font-medium">Credits</th>
                <th className="py-2 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    <div className="text-foreground max-w-[220px] truncate font-medium">
                      {r.email ?? r.username ?? r.id}
                      {r.isAdmin && (
                        <span className="bg-muted ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase">
                          admin
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Joined {formatDate(r.createdAt)}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    {r.plan ? (
                      <span>
                        {r.plan}
                        {r.subscriptionStatus && (
                          <span className="text-muted-foreground text-xs">
                            {" "}
                            ({r.subscriptionStatus})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Free</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {r.revenueCents ? money(r.revenueCents) : "—"}
                    {r.payments > 1 && (
                      <div className="text-muted-foreground text-xs">
                        {r.payments} payments
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {r.spendCents ? formatMoney(r.spendCents, "usd") : "—"}
                  </td>
                  <td
                    className={cn("py-2 pr-3 text-right tabular-nums", {
                      "text-success": r.profitCents > 0,
                      "text-destructive": r.profitCents < 0,
                    })}
                  >
                    {r.profitCents ? money(r.profitCents) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {r.generations}
                    {r.failedGenerations > 0 && (
                      <div className="text-muted-foreground text-xs">
                        {r.failedGenerations} failed
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {r.credits.toLocaleString()}
                  </td>
                  <td className="text-muted-foreground py-2 text-xs">
                    {r.lastActiveAt ? timeAgo(r.lastActiveAt) : "Never"}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-muted-foreground py-6 text-center">
                    No users match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > limit && (
          <div className="mt-3 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLimit((l) => l + USERS_PAGE)}
            >
              Show more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-red-500/15 text-red-600 dark:text-red-400",
};

function ActivityCard({ items }: { items: OverviewActivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live activity</CardTitle>
        <CardDescription>Latest signups, payments and renders</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex max-h-[640px] flex-col gap-3 overflow-y-auto pr-1">
          {items.map((a) => (
            <li key={a.id} className="flex gap-3">
              <div className="bg-muted mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4">
                {a.type === "signup" ? (
                  <UserPlus />
                ) : a.type === "payment" ? (
                  <DollarSign />
                ) : (
                  <Film />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-foreground truncate text-sm font-medium">
                    {a.title}
                  </p>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {timeAgo(a.at)}
                  </span>
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  {a.userLabel}
                </p>
                {a.detail && (
                  <p className="text-muted-foreground line-clamp-2 text-xs italic">
                    {a.detail}
                  </p>
                )}
                {a.status && (
                  <span
                    className={cn(
                      "mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                      STATUS_STYLES[a.status] ?? "bg-sky-500/15 text-sky-600 dark:text-sky-400",
                    )}
                  >
                    {a.status.replaceAll("_", " ").toLowerCase()}
                  </span>
                )}
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-muted-foreground text-sm">No activity yet.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}
