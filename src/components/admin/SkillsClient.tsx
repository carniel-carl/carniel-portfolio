"use client";

import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import EmptyState from "@/components/admin/ui/EmptyState";
import SearchField from "@/components/admin/ui/SearchField";
import SkillIcon from "@/components/general/SkillIcon";
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
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Label } from "@/components/ui/label";
import { createSkill, deleteSkill, reorderSkills, updateSkill } from "@/lib/actions/skills";
import { getIcon, iconNames } from "@/lib/icon-map";
import { iconifyPreviewUrl, searchIconify } from "@/lib/iconify";
import { cn } from "@/lib/utils";
import { GripVertical, Loader2, Plus, SearchX, Trash2, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const MAX_VISIBLE_ICONS = 60;

interface Skill {
  id: string;
  title: string;
  iconName: string;
  iconLib: string;
  iconSvg?: string | null;
  order: number;
}

type IconSource = "iconify" | "lucide";

const emptyForm = { title: "", iconName: "", iconLib: "iconify", order: 0 };

// Monochrome preview that takes the text colour, without fetching the markup
function IconifyGlyph({ id, className }: { id: string; className?: string }) {
  const mask = `url(${iconifyPreviewUrl(id)}) center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block bg-current", className)}
      style={{ mask, WebkitMask: mask }}
    />
  );
}

export default function SkillsClient({ skills }: { skills: Skill[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [iconSearch, setIconSearch] = useState("");
  const [iconSource, setIconSource] = useState<IconSource>("iconify");
  const [remote, setRemote] = useState<{ query: string; icons: string[]; error?: boolean }>({
    query: "",
    icons: [],
  });
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Local copy so a drag shows instantly; resynced whenever the server sends new data
  const [items, setItems] = useState(skills);
  const [syncedSkills, setSyncedSkills] = useState(skills);
  if (skills !== syncedSkills) {
    setSyncedSkills(skills);
    setItems(skills);
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Press-and-hold on touch, so swiping still scrolls the page
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const previous = items;
    const from = items.findIndex((s) => s.id === active.id);
    const to = items.findIndex((s) => s.id === over.id);
    const next = arrayMove(items, from, to).map((s, order) => ({ ...s, order }));
    setItems(next);

    try {
      await reorderSkills(next.map((s) => s.id));
      router.refresh();
    } catch {
      setItems(previous);
      toast.error("Could not save the new order");
    }
  };

  const openCreate = () => {
    setEditingSkill(null);
    setForm({ ...emptyForm, order: skills.length });
    setIconSearch("");
    setIconSource("iconify");
    setDialogOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setForm({
      title: skill.title,
      iconName: skill.iconName,
      iconLib: skill.iconLib,
      order: skill.order,
    });
    setIconSearch("");
    setIconSource(skill.iconLib === "iconify" ? "iconify" : "lucide");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.iconName) {
      toast.error("Add a name and pick an icon");
      return;
    }

    setSaving(true);
    try {
      if (editingSkill) {
        await updateSkill(editingSkill.id, form);
        toast.success("Skill updated");
      } else {
        await createSkill(form);
        toast.success("Skill added");
      }
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not save the skill");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSkill(deleteTarget.id);
      toast.success("Skill deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete the skill");
    }
  };

  const iconQuery = iconSearch.toLowerCase().trim();

  const filteredIcons = useMemo(() => {
    const matches = iconQuery
      ? iconNames.filter((name) => name.toLowerCase().includes(iconQuery))
      : iconNames;
    return matches.slice(0, MAX_VISIBLE_ICONS);
  }, [iconQuery]);

  // Debounced Iconify search; results are keyed by query so stale ones are ignored
  useEffect(() => {
    if (iconSource !== "iconify" || !iconQuery) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchIconify(iconQuery, controller.signal)
        .then((icons) => setRemote({ query: iconQuery, icons }))
        .catch(() => {
          if (!controller.signal.aborted) setRemote({ query: iconQuery, icons: [], error: true });
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [iconQuery, iconSource]);

  const remoteReady = remote.query === iconQuery;
  const remoteIcons = remoteReady ? remote.icons : [];

  const searching = query.trim() !== "";
  const filteredSkills = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? items.filter((s) => s.title.toLowerCase().includes(q)) : items;
  }, [items, query]);


  return (
    <div>
      <AdminPageHeader
        title="Skills"
        description="The tools listed in the skills section, in display order. Drag to reorder."
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add skill
          </Button>
        }
      />

      {skills.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No skills yet"
          description="Add the languages, frameworks and tools you work with."
          action={
            <Button size="sm" onClick={openCreate}>
              Add skill
            </Button>
          }
        />
      ) : (
        /* One panel: the first block after the header overlaps the band */
        <div className="surface overflow-hidden">
          <div className="border-b p-3 sm:px-4">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search skills"
              className="sm:w-72"
            />
          </div>
          {filteredSkills.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={`No skills match "${query}"`}
              className="rounded-none border-0"
            />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredSkills.map((s) => s.id)} strategy={rectSortingStrategy}>
                <ul className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:p-4 md:grid-cols-4 xl:grid-cols-6">
                  {filteredSkills.map((skill) => (
                    <SortableSkill
                      key={skill.id}
                      skill={skill}
                      disabled={searching}
                      onEdit={() => openEdit(skill)}
                      onDelete={() => setDeleteTarget(skill)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
          {searching && filteredSkills.length > 0 && (
            <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
              Reordering is paused while searching.
            </p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
        <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">
              {editingSkill ? "Edit skill" : "Add skill"}
            </DialogTitle>
            <DialogDescription>
              Lower order numbers show first on the site.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="skill-title">Name</Label>
                <Input
                  id="skill-title"
                  className="h-10"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="TypeScript"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill-order">Order</Label>
                <Input
                  id="skill-order"
                  type="number"
                  min={0}
                  className="tnum h-10"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="skill-icon-search">Icon</Label>
                {form.iconName && (
                  <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    {form.iconLib === "iconify" ? (
                      <IconifyGlyph id={form.iconName} className="size-3.5 shrink-0 text-foreground" />
                    ) : (
                      <SkillIcon icon={form} className="size-3.5 shrink-0 text-foreground" />
                    )}
                    <span className="truncate">{form.iconName}</span>
                  </span>
                )}
              </div>
              <div
                role="tablist"
                aria-label="Icon source"
                className="inline-flex rounded-md bg-muted p-0.5 text-xs font-medium"
              >
                {(
                  [
                    ["iconify", "Logos"],
                    ["lucide", "Built-in"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={iconSource === value}
                    onClick={() => setIconSource(value)}
                    className={cn(
                      "rounded px-3 py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      iconSource === value && "bg-card text-foreground shadow-sm",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <SearchField
                value={iconSearch}
                onChange={setIconSearch}
                placeholder={
                  iconSource === "iconify"
                    ? "Search logos, e.g. TanStack, Express, Docker"
                    : "Search icons, e.g. Database, Globe"
                }
              />
              <div
                role="radiogroup"
                aria-label="Icon"
                className="grid max-h-52 grid-cols-6 gap-1.5 overflow-y-auto rounded-lg border bg-muted/40 p-2 sm:grid-cols-8"
              >
                {iconSource === "iconify"
                  ? remoteIcons.map((id) => (
                      <IconOption
                        key={id}
                        label={id}
                        selected={form.iconLib === "iconify" && form.iconName === id}
                        onSelect={() => setForm({ ...form, iconName: id, iconLib: "iconify" })}
                      >
                        <IconifyGlyph id={id} className="size-5" />
                      </IconOption>
                    ))
                  : filteredIcons.map((name) => {
                      const Icon = getIcon(name);
                      if (!Icon) return null;
                      return (
                        <IconOption
                          key={name}
                          label={name}
                          selected={form.iconLib !== "iconify" && form.iconName === name}
                          onSelect={() => setForm({ ...form, iconName: name, iconLib: "lucide" })}
                        >
                          <Icon className="size-5" />
                        </IconOption>
                      );
                    })}
                {iconSource === "iconify" && remoteIcons.length === 0 && (
                  <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                    {!iconQuery
                      ? "Type a technology name to search 3,000+ brand logos."
                      : !remoteReady
                        ? "Searching…"
                        : remote.error
                          ? "Icon search is unavailable. Check your connection."
                          : "No logos match. Try the Built-in tab."}
                  </p>
                )}
                {iconSource === "lucide" && filteredIcons.length === 0 && (
                  <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                    No icons match. Try a broader word.
                  </p>
                )}
              </div>
              {iconSource === "lucide" && filteredIcons.length === MAX_VISIBLE_ICONS && (
                <p className="text-xs text-muted-foreground">
                  Showing the first {MAX_VISIBLE_ICONS}. Keep typing to narrow it down.
                </p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="hover:bg-muted"
                disabled={saving}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                {editingSkill ? "Save changes" : "Add skill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.title ?? "skill"}?`}
        description="It disappears from the skills section on the site."
        onConfirm={handleDelete}
      />
    </div>
  );
}

function SortableSkill({
  skill,
  disabled,
  onEdit,
  onDelete,
}: {
  skill: Skill;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skill.id, disabled });

  return (
    // Mouse and touch drag from anywhere on the card; the keyboard uses the grip
    <li
      ref={setNodeRef}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group relative touch-manipulation",
        !disabled && "cursor-grab active:cursor-grabbing",
        isDragging && "z-10 rounded-lg shadow-lg ring-2 ring-accent-ink",
      )}
    >
      <button
        type="button"
        onClick={onEdit}
        className={cn(
          "flex w-full flex-col items-center gap-3 rounded-lg bg-muted/50 px-3 pb-4 pt-6 text-center transition-[background-color,transform] duration-300 ease-expo hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !disabled && "cursor-grab active:cursor-grabbing",
          isDragging && "bg-muted",
        )}
        aria-label={`Edit ${skill.title}`}
      >
        <span className="grid size-11 place-items-center rounded-lg bg-card text-foreground/80 shadow-sm transition-colors group-hover:text-accent-ink">
          <SkillIcon icon={skill} className="size-6" />
        </span>
        <span className="line-clamp-1 text-sm font-medium">{skill.title}</span>
      </button>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        disabled={disabled}
        aria-label={`Reorder ${skill.title}, position ${skill.order}`}
        className="tnum absolute left-1.5 top-1.5 flex h-7 items-center gap-0.5 rounded-md px-1 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:hover:bg-transparent"
      >
        <GripVertical
          className={cn(
            "size-3.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
            disabled && "hidden",
          )}
        />
        {skill.order}
      </button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label={`Delete ${skill.title}`}
        className="absolute right-1.5 top-1.5 size-7 text-muted-foreground opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 [&_svg]:size-3.5"
      >
        <Trash2 />
      </Button>
    </li>
  );
}

function IconOption({
  label,
  selected,
  onSelect,
  children,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "grid aspect-square place-items-center rounded-md text-foreground/80 transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "bg-card text-accent-ink ring-2 ring-accent-ink",
      )}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
