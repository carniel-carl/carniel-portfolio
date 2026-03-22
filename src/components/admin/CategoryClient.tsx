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
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/actions/category";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/lib/schemas/category";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import PageHeader from "@/components/general/PageHeader";

const COLOR_PALETTE = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#6b7280",
];

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  createdAt: string;
  _count: { posts: number };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export default function CategoryClient({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", slug: "", color: "#6b7280" },
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({ name: "", slug: "", color: "#6b7280" });
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingId(category.id);
    form.reset({
      name: category.name,
      slug: category.slug,
      color: category.color,
    });
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    form.setValue("slug", slugify(name));
  };

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (editingId) {
        await updateCategory(editingId, values);
        toast.success("Category updated");
      } else {
        await createCategory(values);
        toast.success("Category created");
      }
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory(deleteId);
      toast.success("Category deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
    setDeleteId(null);
  };

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.getValue("slug")}
          </span>
        ),
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) => (
          <span
            className="inline-block size-5 rounded-full border"
            style={{ backgroundColor: row.getValue("color") }}
          />
        ),
      },
      {
        id: "postCount",
        header: "Posts",
        cell: ({ row }) => (
          <span className="text-sm">{row.original._count.posts}</span>
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
        cell: ({ row }) => {
          const isDefault = row.original.slug === "others";
          return (
            <div className="text-right space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEdit(row.original)}
                disabled={isDefault}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(row.original.id)}
                disabled={isDefault}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader showBackBtn title="Categories" />
        <Button onClick={openCreate}>
          <Plus className="size-4 " />
          New Category
        </Button>
      </div>

      <DataTable columns={columns} data={categories} paginated={true} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <input type="hidden" {...form.register("slug")} />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PALETTE.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            className="size-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110"
                            style={{
                              backgroundColor: hex,
                              borderColor:
                                field.value === hex
                                  ? "hsl(var(--foreground))"
                                  : "transparent",
                            }}
                            onClick={() => field.onChange(hex)}
                          >
                            {field.value === hex && (
                              <Check className="size-4 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting
                  ? "Saving..."
                  : editingId
                    ? "Update"
                    : "Create"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Posts in this category will be moved to &quot;Others&quot;.
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
