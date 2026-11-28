import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { type AuthUser } from "wasp/auth";
import {
  deleteSiteMedia,
  getAllSiteMedia,
  moveSiteMedia,
  upsertSiteMedia,
  useQuery,
} from "wasp/client/operations";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";

import { AutoplayVideo, Pill } from "../../../client/design";
import { Button } from "../../../client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../client/components/ui/card";
import { Input } from "../../../client/components/ui/input";
import { Label } from "../../../client/components/ui/label";
import { cn } from "../../../client/utils";
import {
  SITE_MEDIA_SLOTS,
  inferPlatform,
  siteMediaInputSchema,
  siteMediaToClip,
  type SiteMediaItem,
  type SiteMediaSlot,
} from "../../../marketing/siteMedia";
import { Breadcrumb } from "../../layout/Breadcrumb";
import { DefaultLayout } from "../../layout/DefaultLayout";

type Draft = {
  id?: string;
  slot: SiteMediaSlot;
  title: string;
  tag: string;
  videoUrl: string;
  posterUrl: string;
  aspect: "portrait" | "landscape" | "square";
  enabled: boolean;
  creditName: string;
  sourceUrl: string;
  platform: string;
};

const emptyDraft = (slot: SiteMediaSlot): Draft => ({
  slot,
  title: "",
  tag: "",
  videoUrl: "",
  posterUrl: "",
  aspect: "landscape",
  enabled: true,
  creditName: "",
  sourceUrl: "",
  platform: "",
});

function toDraft(item: SiteMediaItem): Draft {
  return {
    id: item.id,
    slot: item.slot as SiteMediaSlot,
    title: item.title,
    tag: item.tag,
    videoUrl: item.videoUrl ?? "",
    posterUrl: item.posterUrl ?? "",
    aspect: (item.aspect as Draft["aspect"]) ?? "landscape",
    enabled: item.enabled,
    creditName: item.creditName ?? "",
    sourceUrl: item.sourceUrl ?? "",
    platform: item.platform ?? "",
  };
}

const selectClass =
  "h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

/**
 * Owner page for every video and image on the marketing site. Changes go
 * live on the next page load; no code change or deploy needed. Empty slots
 * fall back to the defaults in src/landing-page/homepageConfig.ts.
 */
export function SiteMediaPage({ user }: { user: AuthUser }) {
  const { data: items = [], isLoading, error } = useQuery(getAllSiteMedia);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, SiteMediaItem[]>();
    for (const slot of SITE_MEDIA_SLOTS) map.set(slot.id, []);
    for (const item of items) map.get(item.slot)?.push(item);
    return map;
  }, [items]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setFormError(null);
    const parsed = siteMediaInputSchema.safeParse(draft);
    if (!parsed.success) {
      setFormError(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }
    await run(async () => {
      await upsertSiteMedia(draft);
      setDraft(null);
    });
  };

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName="Site media" />

      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">
        Every clip on the homepage, by section. Paste an https link to an MP4 (FAYAA renders, R2 or any CDN) and an
        optional poster image. Changes are live on the next page load. Sections with no clips here use the built-in
        defaults.
      </p>

      {draft ? (
        <Card className="mb-6 border-fy-accent/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{draft.id ? "Edit clip" : "Add clip"}</CardTitle>
            <button type="button" aria-label="Close" onClick={() => setDraft(null)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sm-slot">Section</Label>
                <select
                  id="sm-slot"
                  className={selectClass}
                  value={draft.slot}
                  onChange={(e) => setDraft({ ...draft, slot: e.target.value as SiteMediaSlot })}
                >
                  {SITE_MEDIA_SLOTS.map((slot) => (
                    <option key={slot.id} value={slot.id} className="bg-fy-surface-2">
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sm-title">Title</Label>
                <Input id="sm-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sm-video">Video link (MP4)</Label>
                <Input id="sm-video" placeholder="https://…/clip.mp4" value={draft.videoUrl} onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sm-poster">Poster image (optional)</Label>
                <Input id="sm-poster" placeholder="https://…/poster.jpg" value={draft.posterUrl} onChange={(e) => setDraft({ ...draft, posterUrl: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sm-tag">Label on tile</Label>
                <Input id="sm-tag" placeholder="Motion transfer" value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sm-aspect">Shape</Label>
                <select
                  id="sm-aspect"
                  className={selectClass}
                  value={draft.aspect}
                  onChange={(e) => setDraft({ ...draft, aspect: e.target.value as Draft["aspect"] })}
                >
                  <option value="landscape" className="bg-fy-surface-2">Landscape (16:9)</option>
                  <option value="portrait" className="bg-fy-surface-2">Portrait (9:16)</option>
                  <option value="square" className="bg-fy-surface-2">Square</option>
                </select>
              </div>

              {draft.slot === "web" ? (
                <div className="grid gap-4 rounded-xl border border-fy-line bg-white/[0.02] p-4 md:col-span-2 md:grid-cols-3">
                  <p className="text-xs text-muted-foreground md:col-span-3">
                    Someone else's work: it is shown with their name and a link to the original. A YouTube link plays
                    in an official embed; other links open the original post.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sm-credit">Creator</Label>
                    <Input id="sm-credit" placeholder="@creator" value={draft.creditName} onChange={(e) => setDraft({ ...draft, creditName: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sm-source">Original post</Label>
                    <Input id="sm-source" placeholder="https://youtube.com/…" value={draft.sourceUrl} onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sm-platform">Platform (optional)</Label>
                    <Input id="sm-platform" placeholder="YouTube" value={draft.platform} onChange={(e) => setDraft({ ...draft, platform: e.target.value })} />
                  </div>
                </div>
              ) : null}

              {formError ? <p className="text-sm text-rose-300 md:col-span-2">{formError}</p> : null}
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={busy}>
                  {draft.id ? "Save changes" : "Add to site"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="mb-4 text-sm text-rose-300">Couldn't load site media: {error.message}</p> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}

      <div className="flex flex-col gap-4">
        {SITE_MEDIA_SLOTS.map((slot) => {
          const rows = grouped.get(slot.id) ?? [];
          return (
            <Card key={slot.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2">
                    {slot.label}
                    <Pill tone={rows.some((r) => r.enabled) ? "success" : "neutral"}>
                      {rows.some((r) => r.enabled) ? `${rows.filter((r) => r.enabled).length} live` : "Using defaults"}
                    </Pill>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{slot.help}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setDraft(emptyDraft(slot.id))}>
                  <Plus className="size-4" />
                  Add
                </Button>
              </CardHeader>
              {rows.length > 0 ? (
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {rows.map((item, index) => {
                      const clip = siteMediaToClip(item);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "overflow-hidden rounded-xl border border-fy-line bg-fy-surface-2 transition-opacity",
                            !item.enabled && "opacity-50"
                          )}
                        >
                          <AutoplayVideo src={clip.videoUrl} poster={clip.poster || undefined} mode="hover" className="aspect-video" />
                          <div className="flex flex-col gap-2 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{item.title}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {slot.id === "web"
                                    ? `${item.creditName ?? ""} · ${inferPlatform(item)}`
                                    : item.tag || item.aspect}
                                </p>
                              </div>
                              <span className="text-xs text-fy-subtle tabular-nums">#{index + 1}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <IconButton label="Move up" disabled={busy || index === 0} onClick={() => run(() => moveSiteMedia({ id: item.id, direction: "up" }))}>
                                <ArrowUp className="size-3.5" />
                              </IconButton>
                              <IconButton label="Move down" disabled={busy || index === rows.length - 1} onClick={() => run(() => moveSiteMedia({ id: item.id, direction: "down" }))}>
                                <ArrowDown className="size-3.5" />
                              </IconButton>
                              <IconButton
                                label={item.enabled ? "Hide from site" : "Show on site"}
                                disabled={busy}
                                onClick={() => run(() => upsertSiteMedia({ ...toDraft(item), enabled: !item.enabled }))}
                              >
                                {item.enabled ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                              </IconButton>
                              <IconButton label="Edit" disabled={busy} onClick={() => setDraft(toDraft(item))}>
                                <Pencil className="size-3.5" />
                              </IconButton>
                              {item.sourceUrl || item.videoUrl ? (
                                <a
                                  href={item.sourceUrl ?? item.videoUrl ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label="Open link"
                                  className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>
                              ) : null}
                              <IconButton
                                label="Delete"
                                disabled={busy}
                                className="ml-auto hover:text-rose-300"
                                onClick={() => {
                                  if (window.confirm(`Remove "${item.title}" from the site?`)) {
                                    void run(() => deleteSiteMedia({ id: item.id }));
                                  }
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </IconButton>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              ) : null}
            </Card>
          );
        })}
      </div>
    </DefaultLayout>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}
