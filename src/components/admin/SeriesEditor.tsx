"use client";

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
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
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
  available,
}: {
  series: SeriesDetails;
  episodes: EpisodeRow[];
  /** Posts not in any series, for "Add existing post" */
  available: { id: string; title: string; published: boolean }[];
}) {
  const router = useRouter();
  const [episodes, setEpisodes] = useState(initialEpisodes);
  // Server data wins after every refresh
  useEffect(() => setEpisodes(initialEpisodes), [initialEpisodes]);

  const initialForm = {
    title: series.title,
    slug: series.slug,
    description: series.description ?? "",
    coverImage: series.coverImage ?? "",
    completed: series.completed,
  };
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<EpisodeRow | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const liveCount = episodes.filter((e) => e.published).length;
  // Readers only see published episodes, numbered among themselves
  let publicNumber = 0;
  const publicNumbers = episodes.map((e) => (e.published ? ++publicNumber : null));

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("The series needs a title");
      return;
    }
    setSaving(true);
    try {
      await updateSeries(series.id, form);
      setSaved(form);
      toast.success("Series saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the series");
    } finally {
      setSaving(false);
    }
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

  const addExisting = async (postId: string) => {
    try {
      await addPostToSeries(series.id, postId);
      toast.success("Added as the last episode");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the post");
    }
  };

  const removeEpisode = async () => {
    if (!removeTarget) return;
    try {
      await removePostFromSeries(removeTarget.id);
      toast.success("Removed from the series. The post itself is unchanged.");
      router.refresh();
    } catch {
      toast.error("Could not remove the episode");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSeries(series.id);
      toast.success("Series deleted");
      router.push(routes.admin.blogSeries);
      router.refresh();
    } catch {
      toast.error("Could not delete the series");
    }
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
            {available.length > 0 && (
              <Select value="" onValueChange={addExisting}>
                <SelectTrigger className="h-9 w-auto gap-2" aria-label="Add an existing post">
                  <SelectValue placeholder="Add existing post" />
                </SelectTrigger>
                <SelectContent className="max-w-[min(28rem,90vw)]">
                  {available.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="truncate">{p.title}</span>
                      {!p.published && <span className="ml-2 text-xs text-muted-foreground">Draft</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    onLevel={(value) => changeLevel(episode, value)}
                    onRemove={() => setRemoveTarget(episode)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
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
  onLevel,
  onRemove,
}: {
  episode: EpisodeRow;
  position: number;
  publicNumber: number | null;
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
          href={routes.admin.blogEdit(episode.id)}
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
