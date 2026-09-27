"use client";

import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import EmptyState from "@/components/admin/ui/EmptyState";
import SearchField from "@/components/admin/ui/SearchField";
import SegmentedTabs from "@/components/admin/ui/SegmentedTabs";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  deleteProject,
  reorderProjects,
  toggleProjectVisibility,
} from "@/lib/actions/projects";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  FolderKanban,
  Github,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  SearchX,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  tag?: string | null;
  description: string;
  img: string;
  live?: string | null;
  code?: string | null;
  stack?: string[];
  featured: boolean;
  visible: boolean;
  order: number;
}

type Tab = "featured" | "other";

interface ProjectsClientProps {
  featured: Project[];
  other: Project[];
  activeTab: Tab;
}

export default function ProjectsClient({
  featured,
  other,
  activeTab,
}: ProjectsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>(activeTab);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [, startTransition] = useTransition();

  // Local copies so a drag shows instantly; resynced whenever the server sends new data
  const [lists, setLists] = useState({ featured, other });
  const [synced, setSynced] = useState({ featured, other });
  if (featured !== synced.featured || other !== synced.other) {
    setSynced({ featured, other });
    setLists({ featured, other });
  }

  const list = lists[tab];
  const visibleIds = useMemo(() => list.filter((p) => p.visible).map((p) => p.id), [list]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tag?.toLowerCase().includes(q) ||
        p.stack?.some((s) => s.toLowerCase().includes(q)),
    );
  }, [list, query]);

  // Both lists are already here: switch locally, keep the URL shareable.
  const changeTab = (next: Tab) => {
    setTab(next);
    window.history.replaceState(null, "", `${pathname}?tab=${next}`);
  };

  /** Run a mutation, then refresh server data; the row stays busy until the new data lands. */
  const mutate = (id: string, action: () => Promise<unknown>, failMessage: string) => {
    setBusyId(id);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch {
        toast.error(failMessage);
      } finally {
        setBusyId(null);
      }
    });
  };

  // Only visible projects are sortable; hidden ones stay grouped at the end
  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const group = tab;
    const previous = lists[group];
    const from = visibleIds.indexOf(String(active.id));
    const to = visibleIds.indexOf(String(over.id));
    if (from < 0 || to < 0) return;

    const nextIds = arrayMove(visibleIds, from, to);
    const byId = new Map(previous.map((p) => [p.id, p]));
    const next = [...nextIds.map((id) => byId.get(id)!), ...previous.filter((p) => !p.visible)];
    setLists((current) => ({ ...current, [group]: next }));

    setSavingOrder(true);
    try {
      await reorderProjects(group === "featured", nextIds);
      router.refresh();
    } catch {
      setLists((current) => ({ ...current, [group]: previous }));
      toast.error("Could not save the new order");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      toast.success(`Deleted ${deleteTarget.name}`);
      router.refresh();
    } catch {
      toast.error("Could not delete project");
    }
  };

  const searching = query.trim().length > 0;
  const canReorder = !searching && !savingOrder && !busyId;

  return (
    <>
      <AdminPageHeader
        title="Projects"
        description="Featured projects lead the home page. Drag to set the order visitors see."
        actions={
          <Link href={routes.admin.projectNew} className={buttonVariants()}>
            <Plus />
            New project
          </Link>
        }
      />

      {/* One panel: the first block after the header overlaps the band */}
      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <SegmentedTabs
            value={tab}
            onChange={changeTab}
            options={[
              { value: "featured", label: "Featured", count: lists.featured.length },
              { value: "other", label: "Other", count: lists.other.length },
            ]}
          />
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search name, tag or stack"
            className="sm:w-72"
          />
        </div>

        {filtered.length === 0 ? (
          searching ? (
            <EmptyState
              icon={SearchX}
              title={`No projects match "${query}"`}
              description="Try a different name, tag or technology."
              className="rounded-none border-0"
            />
          ) : (
            <EmptyState
              icon={FolderKanban}
              title={tab === "featured" ? "No featured projects" : "No other projects"}
              description={
                tab === "featured"
                  ? "Turn on Featured when editing a project to show it here."
                  : "Projects that are not featured are listed here."
              }
              className="rounded-none border-0"
              action={
                <Link href={routes.admin.projectNew} className={buttonVariants({ size: "sm" })}>
                  New project
                </Link>
              }
            />
          )
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
              <ul className="divide-y">
                {filtered.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    position={visibleIds.indexOf(project.id) + 1}
                    canReorder={canReorder && project.visible}
                    busy={busyId === project.id}
                    onToggleVisible={() =>
                      mutate(
                        project.id,
                        () => toggleProjectVisibility(project.id),
                        "Could not update visibility",
                      )
                    }
                    onDelete={() => setDeleteTarget(project)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {searching && filtered.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Reordering is paused while searching.
        </p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "project"}?`}
        description="It will be removed from the site straight away. This cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  );
}

function ProjectRow({
  project,
  position,
  canReorder,
  busy,
  onToggleVisible,
  onDelete,
}: {
  project: Project;
  position: number;
  canReorder: boolean;
  busy: boolean;
  onToggleVisible: () => void;
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
  } = useSortable({ id: project.id, disabled: !canReorder });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group relative flex items-center gap-2 bg-card px-3 py-3 sm:gap-3 sm:px-4",
        busy && "pointer-events-none",
        isDragging && "z-10 shadow-lg ring-1 ring-border",
      )}
      aria-busy={busy}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        disabled={!canReorder}
        aria-label={`Reorder ${project.name}, position ${position}`}
        className={cn(
          "tnum flex h-9 w-8 shrink-0 touch-none items-center justify-center rounded-md text-xs text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          canReorder
            ? "cursor-grab hover:bg-muted hover:text-foreground active:cursor-grabbing"
            : "cursor-default",
        )}
      >
        {canReorder && (
          <GripVertical className="size-4 md:hidden md:group-hover:block md:group-focus-within:block" />
        )}
        {project.visible && (
          <span
            className={cn(
              canReorder && "hidden md:block md:group-hover:hidden md:group-focus-within:hidden",
            )}
          >
            {position}
          </span>
        )}
      </button>

      <Link
        href={routes.admin.projectEdit(project.id)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4",
          !project.visible && "opacity-55",
          busy && "opacity-40",
        )}
      >
        <span className="relative aspect-[16/10] w-20 shrink-0 overflow-hidden rounded-md border bg-muted sm:w-24">
          {project.img && (
            <Image
              src={project.img}
              alt=""
              fill
              sizes="96px"
              className="object-cover transition-transform duration-500 ease-expo group-hover:scale-[1.04]"
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {project.name}
            </span>
            {project.tag && (
              <span className="hidden shrink-0 rounded-full border px-2 py-px text-[11px] text-muted-foreground sm:inline">
                {project.tag}
              </span>
            )}
          </span>
          <span className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">
            {project.description}
          </span>
          {!!project.stack?.length && (
            <span className="mt-1 hidden truncate font-mono text-[11px] text-muted-foreground/80 md:block">
              {project.stack.slice(0, 5).join(" / ")}
            </span>
          )}
        </span>
      </Link>

      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <span className="hidden lg:inline">{project.visible ? "Visible" : "Hidden"}</span>
        <Switch
          checked={project.visible}
          disabled={busy}
          onCheckedChange={onToggleVisible}
          aria-label={`Show ${project.name} on the site`}
        />
      </label>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`More actions for ${project.name}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuItem asChild>
            <Link href={routes.admin.projectEdit(project.id)}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          {project.live && (
            <DropdownMenuItem asChild>
              <a href={project.live} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Open live site
              </a>
            </DropdownMenuItem>
          )}
          {project.code && (
            <DropdownMenuItem asChild>
              <a href={project.code} target="_blank" rel="noopener noreferrer">
                <Github className="size-4" />
                Open repository
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
