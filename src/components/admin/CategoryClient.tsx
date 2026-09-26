"use client";

import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import EmptyState from "@/components/admin/ui/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import routes from "@/lib/routes";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/lib/schemas/category";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Lock, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

const COLOR_PALETTE = [
  { hex: "#ef4444", name: "Red" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#f59e0b", name: "Amber" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#10b981", name: "Emerald" },
  { hex: "#06b6d4", name: "Cyan" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#6366f1", name: "Indigo" },
  { hex: "#8b5cf6", name: "Violet" },
  { hex: "#a855f7", name: "Purple" },
  { hex: "#ec4899", name: "Pink" },
  { hex: "#6b7280", name: "Grey" },
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
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", slug: "", color: "#6b7280" },
  });
  const [previewName, previewColor, previewSlug] = useWatch({
    control: form.control,
    name: ["name", "color", "slug"],
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
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      toast.success("Category deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    }
  };

  const submitting = form.formState.isSubmitting;

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Group posts by topic. Each colour tags its posts across the blog."
        backHref={routes.admin.blog}
        backLabel="Blog"
        actions={
          <Button onClick={openCreate}>
            <Plus />
            New category
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Posts without a category fall under Others."
          action={
            <Button size="sm" onClick={openCreate}>
              New category
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const isDefault = category.slug === "others";
            return (
              <li
                key={category.id}
                className="surface surface-interactive group flex items-center gap-3 p-4"
              >
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: `${category.color}22`, color: category.color }}
                >
                  <Tags className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {category.name}
                    {isDefault && (
                      <Lock className="size-3 text-muted-foreground" aria-label="Default category" />
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="tnum">{category._count.posts}</span>{" "}
                    {category._count.posts === 1 ? "post" : "posts"}
                    <span className="font-mono"> · /{category.slug}</span>
                  </p>
                </div>
                {!isDefault && (
                  <div className="flex shrink-0 items-center opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => openEdit(category)}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(category)}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !submitting && setDialogOpen(open)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">
              {editingId ? "Edit category" : "New category"}
            </DialogTitle>
            <DialogDescription>
              The slug is generated from the name.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoFocus
                        className="h-10"
                        onChange={(e) => {
                          field.onChange(e);
                          form.setValue("slug", slugify(e.target.value));
                        }}
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
                    <FormLabel>Colour</FormLabel>
                    <FormControl>
                      <div role="radiogroup" aria-label="Colour" className="grid grid-cols-6 gap-2">
                        {COLOR_PALETTE.map(({ hex, name }) => {
                          const selected = field.value === hex;
                          return (
                            <button
                              key={hex}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              aria-label={name}
                              title={name}
                              onClick={() => field.onChange(hex)}
                              className="grid aspect-square place-items-center rounded-full ring-offset-2 ring-offset-card transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-checked:ring-2 aria-checked:ring-foreground"
                              style={{ backgroundColor: hex }}
                            >
                              {selected && <Check className="size-4 text-white drop-shadow" />}
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Preview</span>
                <span className="flex items-center gap-2">
                  <span
                    className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    style={{ borderColor: previewColor, color: previewColor }}
                  >
                    {previewName || "Category"}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    /{previewSlug || "slug"}
                  </span>
                </span>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="hover:bg-muted"
                  disabled={submitting}
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="animate-spin" />}
                  {editingId ? "Save changes" : "Create category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "category"}?`}
        description={
          deleteTarget?._count.posts
            ? `Its ${deleteTarget._count.posts} ${deleteTarget._count.posts === 1 ? "post moves" : "posts move"} to Others.`
            : "No posts use it, so nothing else changes."
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}
