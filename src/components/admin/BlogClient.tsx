"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { deleteBlogPost } from "@/lib/actions/blog";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  category: { id: string; name: string } | null;
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
          <Badge variant="outline">
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
            {new Date(row.getValue("createdAt")).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="text-right block">Actions</span>,
        cell: ({ row }) => (
          <div className="text-right space-x-2">
            <Link href={`/admin/blog/${row.original.id}/preview`}>
              <Button variant="ghost" size="icon">
                <Eye className="size-4" />
              </Button>
            </Link>
            <Link href={`/admin/blog/${row.original.id}/edit`}>
              <Button variant="ghost" size="icon">
                <Pencil className="size-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Blog Posts</h2>
        <div className="flex items-center gap-2">
          <Link href="/admin/blog/categories">
            <Button variant="outline">Manage Categories</Button>
          </Link>
          <Link href="/admin/blog/new">
            <Button>
              <Plus className="size-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={posts}
        paginated={true}
        enableFiltering={true}
      />

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
    </div>
  );
}
