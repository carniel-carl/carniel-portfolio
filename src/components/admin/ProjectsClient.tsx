"use client";

import { useState, useOptimistic, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [isPending, startTransition] = useTransition();

  const [optimisticFeatured, setOptimisticFeatured] = useOptimistic(featured);
  const [optimisticOther, setOptimisticOther] = useOptimistic(other);

  const handleTabChange = (value: string) => {
    router.push(`${pathname}?tab=${value}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);

    startTransition(async () => {
      setOptimisticFeatured((prev) => prev.filter((p) => p.id !== id));
      setOptimisticOther((prev) => prev.filter((p) => p.id !== id));
      try {
        await deleteProject(id);
        toast.success("Project deleted");
      } catch {
        toast.error("Failed to delete project");
      }
      router.refresh();
    });
  };

  const handleMoveUp = (project: Project, index: number) => {
    if (index === 0) return;
    const setOptimistic = project.featured
      ? setOptimisticFeatured
      : setOptimisticOther;

    startTransition(async () => {
      setOptimistic((prev) => {
        const next = [...prev];
        const prevOrder = next[index - 1].order;
        const currOrder = next[index].order;
        next[index - 1] = { ...next[index - 1], order: currOrder };
        next[index] = { ...next[index], order: prevOrder };
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        return next;
      });
      const projects = project.featured ? featured : other;
      try {
        const targetOrder = projects[index - 1].order;
        await reorderProject(project.id, targetOrder);
      } catch {
        toast.error("Failed to reorder");
      }
      router.refresh();
    });
  };

  const handleMoveDown = (project: Project, index: number) => {
    const projects = project.featured ? featured : other;
    if (index === projects.length - 1) return;
    const setOptimistic = project.featured
      ? setOptimisticFeatured
      : setOptimisticOther;

    startTransition(async () => {
      setOptimistic((prev) => {
        const next = [...prev];
        const nextOrder = next[index + 1].order;
        const currOrder = next[index].order;
        next[index + 1] = { ...next[index + 1], order: currOrder };
        next[index] = { ...next[index], order: nextOrder };
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        return next;
      });
      try {
        const targetOrder = projects[index + 1].order;
        await reorderProject(project.id, targetOrder);
      } catch {
        toast.error("Failed to reorder");
      }
      router.refresh();
    });
  };

  const handleToggleVisibility = (id: string) => {
    startTransition(async () => {
      setOptimisticFeatured((prev) =>
        prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p))
      );
      setOptimisticOther((prev) =>
        prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p))
      );
      try {
        await toggleProjectVisibility(id);
      } catch {
        toast.error("Failed to update visibility");
      }
      router.refresh();
    });
  };

  const renderTable = (projects: Project[]) => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead>Visible</TableHead>
            <TableHead className="w-20">Order</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, index) => (
            <TableRow
              key={project.id}
              className={!project.visible ? "opacity-50" : undefined}
            >
              <TableCell>
                <div className="relative w-12 h-8 rounded overflow-hidden">
                  <Image
                    src={project.img}
                    alt={project.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>
                {project.tag && (
                  <Badge variant="secondary">{project.tag}</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleVisibility(project.id)}
                  title={project.visible ? "Hide project" : "Show project"}
                >
                  {project.visible ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4 text-muted-foreground" />
                  )}
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === 0 || isPending}
                    onClick={() => handleMoveUp(project, index)}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <span className="text-sm w-6 text-center">
                    {project.order}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={index === projects.length - 1 || isPending}
                    onClick={() => handleMoveDown(project, index)}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Link href={`/admin/projects/${project.id}/edit`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="size-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(project.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {projects.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-8"
              >
                No projects in this category.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

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
            Featured ({optimisticFeatured.length})
          </TabsTrigger>
          <TabsTrigger value="other">
            Other ({optimisticOther.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="featured" className="mt-4">
          {renderTable(optimisticFeatured)}
        </TabsContent>
        <TabsContent value="other" className="mt-4">
          {renderTable(optimisticOther)}
        </TabsContent>
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
