"use client";

import AddExistingPostDialog from "@/components/admin/AddExistingPostDialog";
import { useActionToast } from "@/components/admin/useActionToast";
import FileDrop from "@/components/admin/form/FileDrop";
import FormSection, { ToggleRow } from "@/components/admin/form/FormSection";
import { useFormShortcuts } from "@/components/admin/form/useFormShortcuts";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import EmptyState from "@/components/admin/ui/EmptyState";
import StatusPill from "@/components/admin/ui/StatusPill";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  addPostToSeries,
  deleteSeries,
  publishEpisodes,
  removePostFromSeries,
  reorderSeriesEpisodes,
  setEpisodeLevel,
  updateSeries,
} from "@/lib/actions/series";
import { adminZ } from "@/lib/admin-z";
import { LEVEL_LABELS, LEVELS } from "@/lib/blog/levels";
import { toSlug } from "@/lib/projects/slug";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ExternalLink,
  Eye,
  GripVertical,
  Layers,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
  Unlink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SeriesDetails = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  completed: boolean;
  forKids: boolean;
};

export type EpisodeRow = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  level: string | null;
};

const NO_LEVEL = "none";

export default function SeriesEditor({
  series,
  episodes: initialEpisodes,
  hasStandalonePosts,
}: {
  series: SeriesDetails;
  episodes: EpisodeRow[];
  /** Whether any post is outside a series, to offer "Add existing post" */
  hasStandalonePosts: boolean;
}) {
  const router = useRouter();
  const runAction = useActionToast(initialEpisodes);
  const [episodes, setEpisodes] = useState(initialEpisodes);
  // Server data wins after every refresh
  useEffect(() => setEpisodes(initialEpisodes), [initialEpisodes]);

  const initialForm = {
    title: series.title,
    slug: series.slug,
    description: series.description ?? "",
    coverImage: series.coverImage ?? "",
    completed: series.completed,
    forKids: series.forKids,
  };
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<EpisodeRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const liveCount = episodes.filter((e) => e.published).length;
  const drafts = episodes.filter((e) => !e.published);
  // Ids of episodes published since they were ticked drop out here
  const selectedDrafts = drafts.filter((e) => selected.has(e.id));
  const allDraftsSelected = drafts.length > 0 && selectedDrafts.length === drafts.length;
  const toggleSelected = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  // Readers only see published episodes, numbered among themselves
  let publicNumber = 0;
  const publicNumbers = episodes.map((e) => (e.published ? ++publicNumber : null));

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("The series needs a title");
      return;
    }
    setSaving(true);
    const values = form;
    await runAction(
      async () => {
        await updateSeries(series.id, values);
        setSaved(values);
      },
      {
        loading: "Saving series…",
        success: "Series saved",
        error: (error) => (error instanceof Error ? error.message : "Could not save the series"),
      },
    );
    setSaving(false);
  };
  useFormShortcuts({ onSave: save, dirty: dirty && !saving });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Press-and-hold on touch, so swiping still scrolls the page
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const previous = episodes;
    const from = episodes.findIndex((e) => e.id === active.id);
    const to = episodes.findIndex((e) => e.id === over.id);
    const next = arrayMove(episodes, from, to);
    setEpisodes(next);
    try {
      await reorderSeriesEpisodes(series.id, next.map((e) => e.id));
      router.refresh();
    } catch (error) {
      setEpisodes(previous);
      toast.error(error instanceof Error ? error.message : "Could not reorder");
    }
  };

  const changeLevel = async (episode: EpisodeRow, value: string) => {
    const level = value === NO_LEVEL ? null : value;
    setEpisodes((list) => list.map((e) => (e.id === episode.id ? { ...e, level } : e)));
    try {
      await setEpisodeLevel(episode.id, level);
      router.refresh();
    } catch {
      toast.error("Could not change the level");
      router.refresh();
    }
  };

  const addExisting = (postId: string) =>
    runAction(() => addPostToSeries(series.id, postId), {
      loading: "Adding episode…",
      success: "Added as the last episode",
      error: (error) => (error instanceof Error ? error.message : "Could not add the post"),
    });

  const publishSelected = async () => {
    const count = selectedDrafts.length;
    const published = await runAction(() => publishEpisodes(series.id, selectedDrafts.map((e) => e.id)), {
      loading: `Publishing ${count} ${count === 1 ? "episode" : "episodes"}…`,
      success: (n) => `${n} ${n === 1 ? "episode" : "episodes"} published`,
      error: (error) => (error instanceof Error ? error.message : "Could not publish the episodes"),
    });
    if (published) setSelected(new Set());
  };

  const removeEpisode = async () => {
    if (!removeTarget) return;
    await runAction(() => removePostFromSeries(removeTarget.id), {
      loading: "Removing episode…",
      success: "Removed from the series. The post itself is unchanged.",
      error: "Could not remove the episode",
    });
  };

  const handleDelete = async () => {
    await runAction(() => deleteSeries(series.id), {
      loading: "Deleting series…",
      success: "Series deleted",
      error: "Could not delete the series",
      navigateTo: routes.admin.blogSeries,
    });
  };

  return (
    <div className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_320px] lg:pb-0">
      {/* Episodes */}
      <section className="surface min-w-0 overflow-hidden">
        <header className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Episodes</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Drag to set the reading order. Readers see published episodes only, numbered in this order.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hasStandalonePosts && (
              <Button variant="outline" size="sm" className="hover:bg-muted" onClick={() => setAddOpen(true)}>
                <Link2 />
                Add existing post
              </Button>
            )}
            <Link href={routes.admin.blogNewInSeries(series.id)} className={buttonVariants({ size: "sm" })}>
              <Plus />
              New episode
            </Link>
          </div>
        </header>

        {episodes.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No episodes yet"
            description="Write the first episode, or add a post you have already written."
            className="rounded-none border-0"
          />
        ) : (
          <>
            {drafts.length > 0 && (
              <div className="flex min-h-12 items-center gap-3 border-b bg-muted/40 px-3 py-2 sm:px-4">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 cursor-pointer accent-primary"
                    checked={allDraftsSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedDrafts.length > 0 && !allDraftsSelected;
                    }}
                    onChange={() => setSelected(new Set(allDraftsSelected ? [] : drafts.map((e) => e.id)))}
                  />
                  <span className="truncate">
                    {selectedDrafts.length
                      ? `${selectedDrafts.length} of ${drafts.length} ${drafts.length === 1 ? "draft" : "drafts"} selected`
                      : `Select all ${drafts.length} ${drafts.length === 1 ? "draft" : "drafts"}`}
                  </span>
                </label>
                {selectedDrafts.length > 0 && (
                  <Button size="sm" onClick={() => setConfirmPublish(true)}>
                    <Send />
                    Publish {selectedDrafts.length}
                  </Button>
                )}
              </div>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={episodes.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                <ol className="divide-y">
                  {episodes.map((episode, i) => (
                    <SortableEpisode
                      key={episode.id}
                      episode={episode}
                      position={i + 1}
                      publicNumber={publicNumbers[i]}
                      selected={selected.has(episode.id)}
                      onSelect={episode.published ? undefined : () => toggleSelected(episode.id)}
                      onLevel={(value) => changeLevel(episode, value)}
                      onRemove={() => setRemoveTarget(episode)}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          </>
        )}
      </section>

      {/* Details */}
      <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <FormSection title="Details">
          <div className="space-y-2">
            <Label htmlFor="series-title">Title</Label>
            <Input
              id="series-title"
              className="h-10"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="series-slug">URL</Label>
            <div className="flex h-10 items-center rounded-md border border-input bg-card font-mono text-xs focus-within:ring-2 focus-within:ring-ring">
              <span className="pl-3 text-muted-foreground">/blog/series/</span>
              <input
                id="series-slug"
                value={form.slug}
                onChange={(e) => set("slug", toSlug(e.target.value))}
                className="h-full min-w-0 flex-1 bg-transparent pr-3 outline-none"
              />
            </div>
            {liveCount > 0 && form.slug !== saved.slug && (
              <p className="text-xs text-destructive">Changing the URL breaks existing links to this series.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="series-description">Description</Label>
            <Textarea
              id="series-description"
              rows={4}
              className="resize-none"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What a reader will be able to do by the last episode."
            />
          </div>
          <ToggleRow
            title={form.completed ? "Complete" : "Ongoing"}
            description={form.completed ? "Readers see the series as finished." : "Readers see “more episodes coming”."}
            control={
              <Switch
                checked={form.completed}
                onCheckedChange={(v) => set("completed", v)}
                aria-label="Series complete"
              />
            }
          />
          <ToggleRow
            title="Made for kids"
            description={
              form.forKids
                ? "Readers pick kid or grown-up first. Kids can't open the portfolio, contact, resume or author links, and no ads show."
                : "A regular series for all readers."
            }
            control={
              <Switch
                checked={form.forKids}
                onCheckedChange={(v) => set("forKids", v)}
                aria-label="Made for kids"
              />
            }
          />
          <div className="hidden space-y-3 lg:block">
            <Button className="w-full" onClick={save} disabled={saving || !dirty}>
              {saving && <Loader2 className="animate-spin" />}
              Save series
            </Button>
            {liveCount > 0 && (
              <a
                href={routes.public.series(saved.slug)}
                target="_blank"
                rel="noopener"
                className={cn(buttonVariants({ variant: "outline" }), "w-full hover:bg-muted")}
              >
                <ExternalLink />
                View on site
              </a>
            )}
          </div>
        </FormSection>

        <FormSection title="Cover image">
          <FileDrop
            endpoint="imageUploader"
            value={form.coverImage}
            onChange={(url) => set("coverImage", url)}
            aspectClass="aspect-[1200/630]"
            hint="Optional. 1200 x 630 works best."
          />
        </FormSection>

        <FormSection title="Danger zone">
          <Button
            variant="outline"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 />
            Delete series
          </Button>
        </FormSection>
      </aside>

      {/* Mobile action bar */}
      <div
        className={cn(
          "admin-mobile-bar fixed inset-x-0 bottom-0 flex items-center gap-2 border-t bg-card/95 px-4 py-3 backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
          adminZ.mobileBar,
        )}
      >
        <span className="flex-1 text-xs text-muted-foreground">{dirty ? "Unsaved changes" : "Saved"}</span>
        <Button onClick={save} disabled={saving || !dirty}>
          {saving && <Loader2 className="animate-spin" />}
          Save series
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete ${series.title}?`}
        description={
          episodes.length
            ? `Its ${episodes.length} ${episodes.length === 1 ? "episode stays" : "episodes stay"} on the blog as standalone posts.`
            : "It has no episodes, so nothing else changes."
        }
        onConfirm={handleDelete}
      />
      <AddExistingPostDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addExisting} />
      <ConfirmDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        title={`Publish ${selectedDrafts.length} ${selectedDrafts.length === 1 ? "episode" : "episodes"}?`}
        description={
          <>
            They go live on the blog and in the series right away:
            <span className="mt-2 block space-y-1">
              {selectedDrafts.map((e) => (
                <span key={e.id} className="block truncate font-medium text-foreground">
                  {e.title}
                </span>
              ))}
            </span>
          </>
        }
        confirmLabel="Publish"
        confirmVariant="default"
        onConfirm={publishSelected}
      />
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Remove from series?"
        description={
          <>
            <span className="font-medium text-foreground">{removeTarget?.title}</span> stays on the blog
            as a standalone post. Later episodes move up one place.
          </>
        }
        confirmLabel="Remove"
        onConfirm={removeEpisode}
      />
    </div>
  );
}

function SortableEpisode({
  episode,
  position,
  publicNumber,
  selected,
  onSelect,
  onLevel,
  onRemove,
}: {
  episode: EpisodeRow;
  position: number;
  publicNumber: number | null;
  selected: boolean;
  /** Only drafts can be selected, for publishing together */
  onSelect?: () => void;
  onLevel: (value: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: episode.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group relative flex items-center gap-3 bg-card px-3 py-3 sm:px-4",
        isDragging && "z-10 shadow-lg ring-2 ring-accent-ink",
      )}
    >
      {onSelect ? (
        <input
          type="checkbox"
          className="size-4 shrink-0 cursor-pointer accent-primary"
          checked={selected}
          onChange={onSelect}
          aria-label={`Select ${episode.title}`}
        />
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}

      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${episode.title}, position ${position}`}
        className="flex h-9 shrink-0 cursor-grab touch-none items-center gap-1 rounded-md px-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
        <span className="tnum w-5 text-right font-mono text-xs">{position}</span>
      </button>

      <div className="min-w-0 flex-1">
        <Link
          href={routes.admin.blogPreview(episode.id)}
          className="block truncate text-sm font-medium hover:underline"
        >
          {episode.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {publicNumber ? `Episode ${publicNumber} on the site` : "Hidden until published"}
        </p>
      </div>

      <Select value={episode.level ?? NO_LEVEL} onValueChange={onLevel}>
        <SelectTrigger className="hidden h-8 w-[8.5rem] text-xs sm:flex" aria-label={`Level of ${episode.title}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_LEVEL}>No level</SelectItem>
          {LEVELS.map((l) => (
            <SelectItem key={l} value={l}>
              {LEVEL_LABELS[l]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <StatusPill published={episode.published} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`More actions for ${episode.title}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl">
          <DropdownMenuItem asChild>
            <Link href={routes.admin.blogEdit(episode.id)}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={routes.admin.blogPreview(episode.id)}>
              <Eye className="size-4" />
              Preview
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onRemove}>
            <Unlink className="size-4" />
            Remove from series
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
