import { ExternalLink, FlaskConical } from "lucide-react";
import { type AuthUser } from "wasp/auth";

import { Pill } from "../../../client/design";
import { Card, CardContent, CardHeader, CardTitle } from "../../../client/components/ui/card";
import { CAMPAIGNS, getActiveCampaign } from "../../../marketing/landingContent";
import { EXPERIMENTS, type ExperimentStatus } from "../../../marketing/experiments";
import { Breadcrumb } from "../../layout/Breadcrumb";
import { DefaultLayout } from "../../layout/DefaultLayout";

const STATUS_TONE: Record<ExperimentStatus, "success" | "warning" | "neutral"> = {
  running: "success",
  paused: "warning",
  concluded: "neutral",
};

/**
 * Read-only view of the homepage experiments and campaigns defined in
 * src/marketing. Each variant has a preview link that forces it for this
 * browser session (?fy_exp=reset clears it). Results live in Plausible/GA:
 * filter any goal by the exp_* property.
 */
export function ExperimentsPage({ user }: { user: AuthUser }) {
  const activeCampaign = getActiveCampaign(new Date());
  const totalWeight = (weights: number[]) => weights.reduce((a, b) => a + b, 0) || 1;

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName="Marketing experiments" />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Running experiments</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-3xl font-bold">
            {EXPERIMENTS.filter((e) => e.status === "running").length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Live campaign</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {activeCampaign ? activeCampaign.id : "None"}
            <p className="mt-1 text-xs font-normal text-muted-foreground">
              {CAMPAIGNS.length} scheduled in landingContent.ts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Where results live</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Every marketing event carries <code className="text-fy-accent-300">exp_*</code> properties. Split any goal
            (e.g. "Signup CTA Click") by them in Plausible or GA.
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {EXPERIMENTS.map((experiment) => {
          const total = totalWeight(experiment.variants.map((v) => v.weight));
          return (
            <Card key={experiment.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-fy-line bg-white/5">
                    <FlaskConical className="size-4.5 text-fy-accent-300" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <CardTitle className="font-mono text-base">{experiment.id}</CardTitle>
                    <p className="max-w-2xl text-sm text-muted-foreground">{experiment.hypothesis}</p>
                    <p className="text-xs text-fy-subtle">Decided by: {experiment.primaryMetric}</p>
                  </div>
                </div>
                <Pill tone={STATUS_TONE[experiment.status]}>
                  {experiment.status}
                  {experiment.winner ? ` · ${experiment.winner}` : ""}
                </Pill>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border">
                {experiment.variants.map((variant) => (
                  <div key={variant.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 flex-col">
                      <span className="font-mono text-sm font-semibold">{variant.id}</span>
                      <span className="text-sm text-muted-foreground">{variant.description}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex w-40 items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-fy-accent"
                            style={{ width: `${(variant.weight / total) * 100}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                          {Math.round((variant.weight / total) * 100)}%
                        </span>
                      </div>
                      <a
                        href={`/?fy_exp=${experiment.id}:${variant.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-fy-line px-3 text-xs font-medium text-fy-text hover:border-fy-line-strong hover:bg-white/5"
                      >
                        Preview
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DefaultLayout>
  );
}
