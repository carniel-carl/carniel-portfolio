"use client";

import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import EmptyState from "@/components/admin/ui/EmptyState";
import RelativeTime from "@/components/admin/ui/RelativeTime";
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
import { Textarea } from "@/components/ui/textarea";
import { createSeries } from "@/lib/actions/series";
import routes from "@/lib/routes";
import { ChevronRight, Layers, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export interface SeriesRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  completed: boolean;
  updatedAt: string;
  live: number;
  drafts: number;
}

export default function SeriesClient({ series }: { series: SeriesRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setTitle("");
    setDescription("");
    setOpen(true);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { id } = await createSeries({ title, slug: "", description });
      toast.success("Series created");
      setOpen(false);
      router.push(routes.admin.blogSeriesEdit(id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the series");
    } finally {
      setSaving(false);
    }
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

      {series.length === 0 ? (
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
        <ul className="surface divide-y overflow-hidden">
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
