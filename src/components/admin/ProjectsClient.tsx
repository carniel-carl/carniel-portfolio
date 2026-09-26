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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  deleteProject,
  reorderProject,
  toggleProjectVisibility,
} from "@/lib/actions/projects";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  FolderKanban,
  Github,
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
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<Tab>(activeTab);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const list = tab === "featured" ? featured : other;

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

  const move = (project: Project, direction: -1 | 1) => {
    const index = list.findIndex((p) => p.id === project.id);
    const target = list[index + direction];
    if (!target) return;
    mutate(project.id, () => reorderProject(project.id, target.order), "Could not reorder");
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

  return (
    <TooltipProvider delayDuration={300}>
      <AdminPageHeader
        title="Projects"
        description="Featured projects lead the home page. The order here is the order visitors see."
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
              { value: "featured", label: "Featured", count: featured.length },
              { value: "other", label: "Other", count: other.length },
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
          <ul className="divide-y">
            <AnimatePresence initial={false}>
              {filtered.map((project) => {
                const index = list.findIndex((p) => p.id === project.id);
                const next = list[index + 1];
                const busy = busyId === project.id;
                const canMoveUp = !searching && index > 0 && project.visible && !busyId;
                const canMoveDown =
                  !searching && !!next && project.visible && next.visible && !busyId;

                return (
                  <motion.li
                    key={project.id}
                    layout={reduceMotion ? false : "position"}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 36 }}
                    className={cn(
                      "group flex items-center gap-3 bg-card px-3 py-3 sm:gap-4 sm:px-4",
                      busy && "pointer-events-none",
                    )}
                    aria-busy={busy}
                  >
                    <span className="tnum hidden w-5 text-center text-xs text-muted-foreground sm:block">
                      {project.visible ? index + 1 : ""}
                    </span>

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
                        onCheckedChange={() =>
                          mutate(
                            project.id,
                            () => toggleProjectVisibility(project.id),
                            "Could not update visibility",
                          )
                        }
                        aria-label={`Show ${project.name} on the site`}
                      />
                    </label>

                    <div className="hidden shrink-0 items-center rounded-full border p-0.5 sm:flex">
                      <IconAction
                        label="Move up"
                        disabled={!canMoveUp}
                        onClick={() => move(project, -1)}
                      >
                        <ArrowUp />
                      </IconAction>
                      <IconAction
                        label="Move down"
                        disabled={!canMoveDown}
                        onClick={() => move(project, 1)}
                      >
                        <ArrowDown />
                      </IconAction>
                    </div>

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
                        <div className="sm:hidden">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled={!canMoveUp} onSelect={() => move(project, -1)}>
                            <ArrowUp className="size-4" />
                            Move up
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!canMoveDown} onSelect={() => move(project, 1)}>
                            <ArrowDown className="size-4" />
                            Move down
                          </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setDeleteTarget(project)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
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
    </TooltipProvider>
  );
}

function IconAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
          className="size-7 text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
