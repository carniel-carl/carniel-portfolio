"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { deleteBlogPost } from "@/lib/actions/blog";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: { id: string; name: string; color: string } | null;
  author: { name: string | null } | null;
}

export default function BlogClient({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBlogPost(deleteId);
      toast.success("Post deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteId(null);
  };

  const columns = useMemo<ColumnDef<BlogPost>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("title")}</span>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            style={{
              borderColor: row.original.category?.color,
              color: row.original.category?.color,
            }}
          >
            {row.original.category?.name ?? "Others"}
          </Badge>
        ),
      },
      {
        id: "author",
        header: "Author",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.author?.name ?? "Unknown"}
          </span>
        ),
      },
      {
        accessorKey: "published",
        header: "Status",
        cell: ({ row }) =>
          row.getValue("published") ? (
            <Badge>Published</Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm">
            {dayjs(row.getValue("createdAt")).format("DD MMM YYYY")}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="text-right block">Actions</span>,
        cell: ({ row }) => (
          <div className="text-right space-x-2">
            <Link href={`/admin/blog/${row.original.id}/preview`}>
              <Button variant="outline" size="icon">
                <Eye className="size-4" />
              </Button>
            </Link>
            <Link href={`/admin/blog/${row.original.id}/edit`}>
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
    ],
    [],
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Blog Posts</h2>
        <div className="flex items-center gap-2">
          <Link
            href={routes.admin.blogCategories}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Manage Categories
          </Link>
          <Link href={routes.admin.blogNew} className={cn(buttonVariants({}))}>
            <Plus className="size-4" />
            New Post
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <DataTable
          columns={columns}
          data={posts}
          paginated={true}
          enableFiltering={true}
        />
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this blog post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
