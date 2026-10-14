"use client";

import { ToggleRow } from "@/components/admin/form/FormSection";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import EmptyState from "@/components/admin/ui/EmptyState";
import Pagination from "@/components/admin/ui/Pagination";
import RelativeTime from "@/components/admin/ui/RelativeTime";
import SearchField from "@/components/admin/ui/SearchField";
import { useUrlSearch } from "@/components/admin/ui/useUrlSearch";
import { useActionToast } from "@/components/admin/useActionToast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createSeries } from "@/lib/actions/series";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import { ChevronRight, Layers, Loader2, Plus, Rocket, SearchX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface SeriesRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  completed: boolean;
  forKids: boolean;
  updatedAt: string;
  live: number;
  drafts: number;
}

const listUrl = (query: string, page = 1) => {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${routes.admin.blogSeries}?${qs}` : routes.admin.blogSeries;
};

/** One page of series; search and paging happen on the server via the URL. */
export default function SeriesClient({
  series,
  query,
  page,
  pageSize,
  total,
}: {
  series: SeriesRow[];
  query: string;
  page: number;
  pageSize: number;
  /** Series matching the search */
  total: number;
}) {
  const search = useUrlSearch(query, (q) => listUrl(q));
  const runAction = useActionToast(series);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [forKids, setForKids] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setTitle("");
    setDescription("");
    setForKids(false);
    setOpen(true);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const created = await runAction(() => createSeries({ title, slug: "", description, forKids }), {
      loading: "Creating series…",
      success: "Series created",
      error: (error) => (error instanceof Error ? error.message : "Could not create the series"),
      navigateTo: ({ id }) => routes.admin.blogSeriesEdit(id),
    });
    setSaving(false);
    if (created) setOpen(false);
  };

  return (
    <div>
      <AdminPageHeader
        title="Series"
        description="Courses of posts read in order, from beginner to advanced. A series goes public with its first published episode."
        backHref={routes.admin.blog}
        backLabel="Blog"
        actions={
          <Button onClick={openCreate}>
            <Plus />
            New series
          </Button>
        }
      />

      {total === 0 && !query ? (
        <EmptyState
          icon={Layers}
          title="No series yet"
          description="Group a tutorial's episodes into a series so readers can follow them in order."
          action={
            <Button size="sm" onClick={openCreate}>
              New series
            </Button>
          }
        />
      ) : (
        // One panel: the first block after the header overlaps the band
        <div className="surface overflow-hidden">
          <div className="border-b p-3 sm:px-4">
            <SearchField
              value={search.input}
              onChange={search.setInput}
              placeholder="Search series"
              className="sm:w-72"
            />
          </div>
          <div className={cn("transition-opacity", search.pending && "opacity-60")} aria-busy={search.pending}>
            {series.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={`No series match "${query}"`}
                description="Check the spelling, or search part of the title."
                className="rounded-none border-0"
              />
            ) : (
              <ul className="divide-y">
                {series.map((s) => {
                  const total = s.live + s.drafts;
                  return (
                    <li key={s.id} className="group relative flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Layers className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={routes.admin.blogSeriesEdit(s.id)}
                          className="block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                        >
                          {s.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          <span className="tnum">
                            {total} {total === 1 ? "episode" : "episodes"}
                          </span>
                          {total > 0 && (
                            <span className="tnum">
                              {" "}· {s.live} live, {s.drafts} {s.drafts === 1 ? "draft" : "drafts"}
                            </span>
                          )}
                          <span className="font-mono"> · /blog/series/{s.slug}</span>
                        </p>
                      </div>
                      {s.forKids && (
                        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
                          <Rocket className="size-3" aria-hidden="true" />
                          For kids
                        </span>
                      )}
                      <span
                        className={
                          s.live === 0
                            ? "hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex"
                            : "hidden shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-accent-ink sm:inline-flex"
                        }
                      >
                        {s.live === 0 ? "Not public" : s.completed ? "Complete" : "Ongoing"}
                      </span>
                      <RelativeTime date={s.updatedAt} className="hidden shrink-0 text-xs text-muted-foreground md:block" />
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        href={(p) => listUrl(query, p)}
        noun="series"
        className="mt-4"
      />

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">New series</DialogTitle>
            <DialogDescription>
              Add episodes next. Nothing is public until an episode is published.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="series-title">Title</Label>
              <Input
                id="series-title"
                autoFocus
                className="h-10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Next.js from zero"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-description">Description</Label>
              <Textarea
                id="series-description"
                rows={3}
                className="resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What a reader will be able to do by the last episode."
              />
            </div>
            <ToggleRow
              title="Made for kids"
              description="Readers pick kid or grown-up first, and kids mode closes the portfolio and author links."
              control={<Switch checked={forKids} onCheckedChange={setForKids} aria-label="Made for kids" />}
            />
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="hover:bg-muted"
                disabled={saving}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !title.trim()}>
                {saving && <Loader2 className="animate-spin" />}
                Create series
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
