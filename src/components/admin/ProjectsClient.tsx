"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteProject,
  reorderProject,
  toggleProjectVisibility,
} from "@/lib/actions/projects";
import { Card } from "../ui/card";

interface Project {
  id: string;
  name: string;
  tag?: string | null;
  description: string;
  img: string;
  featured: boolean;
  visible: boolean;
  order: number;
}

interface ProjectsClientProps {
  featured: Project[];
  other: Project[];
  activeTab: "featured" | "other";
}

export default function ProjectsClient({
  featured,
  other,
  activeTab,
}: ProjectsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);

  const handleTabChange = (value: string) => {
    router.push(`${pathname}?tab=${value}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProject(deleteId);
      toast.success("Project deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete project");
    }
    setDeleteId(null);
    router.refresh();
  };

  const handleMoveUp = async (project: Project, index: number) => {
    if (index === 0) return;
    const projects = project.featured ? featured : other;
    setReordering(project.id);
    try {
      const targetOrder = projects[index - 1].order;
      await reorderProject(project.id, targetOrder);
      router.refresh();
    } catch {
      toast.error("Failed to reorder");
    }
    setReordering(null);
    router.refresh();
  };

  const handleMoveDown = async (project: Project, index: number) => {
    const projects = project.featured ? featured : other;
    if (index === projects.length - 1) return;
    setReordering(project.id);
    try {
      const targetOrder = projects[index + 1].order;
      await reorderProject(project.id, targetOrder);
      router.refresh();
    } catch {
      toast.error("Failed to reorder");
    }
    setReordering(null);
    router.refresh();
  };

  const handleToggleVisibility = async (id: string) => {
    try {
      await toggleProjectVisibility(id);
      router.refresh();
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  const createColumns = (projects: Project[]): ColumnDef<Project>[] => [
    {
      accessorKey: "img",
      header: "Image",
      cell: ({ row }) => (
        <div className="relative w-12 h-8 rounded overflow-hidden">
          <Image
            src={row.getValue("img")}
            alt={row.original.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "tag",
      header: "Tag",
      cell: ({ row }) => {
        const tag = row.getValue("tag") as string | null;
        return tag ? <Badge variant="secondary">{tag}</Badge> : null;
      },
    },
    {
      accessorKey: "visible",
      header: "Visible",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleToggleVisibility(row.original.id)}
          title={row.original.visible ? "Hide project" : "Show project"}
        >
          {row.original.visible ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4 text-muted-foreground" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "order",
      header: "Order",
      cell: ({ row }) => {
        const index = projects.findIndex((p) => p.id === row.original.id);
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm w-6 text-center">
              {row.getValue("order")}
            </span>
            <ButtonGroup>
              <Button
                variant="secondary"
                // size="icon"
                className="size-8"
                disabled={
                  index === projects.length - 1 ||
                  !!reordering ||
                  !row.original.visible ||
                  !projects[index + 1]?.visible
                }
                onClick={() => handleMoveDown(row.original, index)}
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <ButtonGroupSeparator />
              <Button
                variant="secondary"
                // size="icon"
                className="size-8"
                disabled={index === 0 || !!reordering || !row.original.visible}
                onClick={() => handleMoveUp(row.original, index)}
              >
                <ArrowUp className="size-3.5" />
              </Button>
            </ButtonGroup>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="text-right block">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right space-x-2">
          <Link href={`/admin/projects/${row.original.id}/edit`}>
            <Button variant="outline" size="icon">
              <Pencil className="size-4" />
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const featuredColumns = useMemo(
    () => createColumns(featured),
    [featured, reordering],
  );
  const otherColumns = useMemo(() => createColumns(other), [other, reordering]);

  const getRowClassName = (project: Project) =>
    !project.visible ? "opacity-30 hover:bg-transparent" : undefined;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Link href="/admin/projects/new">
          <Button>
            <Plus className="size-4 mr-2" />
            Add Project
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="featured">
            Featured ({featured.length})
          </TabsTrigger>
          <TabsTrigger value="other">Other ({other.length})</TabsTrigger>
        </TabsList>
        <Card className="p-6 mt-4">
          <TabsContent value="featured">
            <DataTable
              columns={featuredColumns}
              data={featured}
              paginated={false}
              getRowClassName={getRowClassName}
              enableFiltering
            />
          </TabsContent>
          <TabsContent value="other">
            <DataTable
              columns={otherColumns}
              data={other}
              paginated={false}
              getRowClassName={getRowClassName}
            />
          </TabsContent>
        </Card>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
