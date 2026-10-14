"use client";

import FileDrop from "@/components/admin/form/FileDrop";
import FormSection from "@/components/admin/form/FormSection";
import TagInput from "@/components/admin/form/TagInput";
import { useFormShortcuts } from "@/components/admin/form/useFormShortcuts";
import { Kbd } from "@/components/admin/shell/CommandMenu";
import TiptapEditor from "@/components/admin/TiptapEditor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createBlogPost, updateBlogPost } from "@/lib/actions/blog";
import { adminZ } from "@/lib/admin-z";
import { LEVEL_LABELS, LEVELS } from "@/lib/blog/levels";
import routes from "@/lib/routes";
import { blogPostFormSchema, type BlogPostFormValues } from "@/lib/schemas/blog";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

interface BlogFormData {
  id?: string;
  title: string | null;
  slug: string | null;
  content: string | null;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  categoryId: string | null;
  tags: string[];
  seriesId?: string | null;
  level?: string | null;
}

interface BlogPostFormProps {
  initialData?: BlogFormData;
  isEdit?: boolean;
  categories: { id: string; name: string }[];
  series: { id: string; title: string; episodeCount: number }[];
  /** New post: start it as the next episode of this series */
  defaultSeriesId?: string;
}

const EXCERPT_TARGET = 160;
// Radix Select can't hold an empty value
const NONE = "none";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export default function BlogPostForm({
  initialData,
  isEdit,
  categories,
  series,
  defaultSeriesId,
}: BlogPostFormProps) {
  const router = useRouter();
  // Existing posts keep their URL unless the slug is edited on purpose
  const [slugTouched, setSlugTouched] = useState(!!isEdit);

  const othersCategory = categories.find((c) => c.name.toLowerCase() === "others");
  const defaultCategoryId = othersCategory?.id ?? categories[0]?.id ?? "";

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      content: initialData?.content ?? "",
      excerpt: initialData?.excerpt ?? "",
      coverImage: initialData?.coverImage ?? "",
      published: initialData?.published ?? false,
      categoryId: initialData?.categoryId ?? defaultCategoryId,
      tags: initialData?.tags ?? [],
      seriesId: initialData?.seriesId ?? defaultSeriesId ?? "",
      level: initialData?.level ?? "",
    },
  });

  const { isSubmitting, isDirty } = form.formState;
  const [published, excerpt, seriesId] = useWatch({
    control: form.control,
    name: ["published", "excerpt", "seriesId"],
  });
  const chosenSeries = series.find((s) => s.id === seriesId);
  const joiningSeries = chosenSeries && chosenSeries.id !== (initialData?.seriesId ?? "");

  const onSubmit = async (values: BlogPostFormValues) => {
    try {
      if (isEdit && initialData?.id) {
        await updateBlogPost(initialData.id, values);
        form.reset(values);
      } else {
        await createBlogPost(values);
        // Cache Components keeps this route mounted (hidden) after navigating
        // away, so clear it or "New post" reopens with the saved post in it.
        form.reset();
        setSlugTouched(false);
      }
      toast.success(
        values.published ? (isEdit ? "Post updated" : "Post published") : "Draft saved",
      );
      // Episodes started from a series page go back to that series
      router.push(
        !isEdit && defaultSeriesId && values.seriesId === defaultSeriesId
          ? routes.admin.blogSeriesEdit(defaultSeriesId)
          : routes.admin.blog,
      );
      router.refresh();
    } catch {
      toast.error("Could not save the post");
    }
  };

  const submit = form.handleSubmit(onSubmit, () => toast.error("Some fields need attention"));
  useFormShortcuts({ onSave: submit, dirty: isDirty && !isSubmitting });

  const saveLabel = published ? (isEdit && initialData?.published ? "Update post" : "Publish") : "Save draft";

  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="mx-auto w-full max-w-4xl space-y-6 pb-24 lg:pb-0">
        {/* The writing sheet: a card, so it rises over the band */}
        <div className="surface min-w-0 p-5 md:p-7">
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Title</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      autoFocus={!isEdit}
                      placeholder="Post title"
                      onChange={(e) => {
                        field.onChange(e);
                        if (!slugTouched) {
                          form.setValue("slug", slugify(e.target.value), { shouldDirty: true });
                        }
                      }}
                      className="w-full bg-transparent font-display text-3xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/70 md:text-4xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">URL slug</FormLabel>
                  <div className="flex h-8 w-fit max-w-full items-center rounded-md border border-transparent font-mono text-xs text-muted-foreground transition-colors focus-within:border-input focus-within:bg-card hover:border-input">
                    <span className="pl-2">/blog/</span>
                    <FormControl>
                      <input
                        {...field}
                        onChange={(e) => {
                          setSlugTouched(true);
                          field.onChange(slugify(e.target.value));
                        }}
                        placeholder="your-post-url"
                        size={Math.max(field.value.length, 14)}
                        className="h-full min-w-0 bg-transparent pr-2 text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </FormControl>
                  </div>
                  {isEdit && initialData?.published && field.value !== initialData.slug && (
                    <p className="text-xs text-destructive">
                      Changing the URL breaks existing links to this post.
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>

          {/* Settings sit under the title like document properties: seen at a glance, out of the way of the writing */}
          <div className="my-6 grid gap-5 border-y py-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput value={field.value} onChange={field.onChange} placeholder="React, CSS" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seriesId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Series</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                    value={field.value || NONE}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Standalone post</SelectItem>
                      {series.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {chosenSeries && (
                    <FormDescription>
                      {joiningSeries
                        ? `Saves as episode ${chosenSeries.episodeCount + 1}. Reorder in `
                        : "Change its place in "}
                      <Link
                        href={routes.admin.blogSeriesEdit(chosenSeries.id)}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        the series
                      </Link>
                      .
                    </FormDescription>
                  )}
                  {series.length === 0 && (
                    <FormDescription>
                      <Link
                        href={routes.admin.blogSeries}
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Create a series
                      </Link>{" "}
                      to group tutorial episodes.
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                    value={field.value || NONE}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Not set</SelectItem>
                      {LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {LEVEL_LABELS[l]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Shown on the post, and groups a series into parts.</FormDescription>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Content</FormLabel>
                <FormControl>
                  <TiptapEditor
                    content={field.value}
                    onChange={field.onChange}
                    placeholder="Start writing..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Everything that shapes the post card, ordered as the card shows it */}
        <FormSection title="Post card" description="How it looks in the blog list and search results.">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover image</FormLabel>
                  <FormControl>
                    <FileDrop
                      endpoint="imageUploader"
                      value={field.value}
                      onChange={(url) => form.setValue("coverImage", url, { shouldDirty: true })}
                      aspectClass="aspect-[1200/630]"
                      hint="Optional. 1200 x 630 works best."
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-baseline justify-between">
                    <FormLabel>Excerpt</FormLabel>
                    <span
                      className={cn(
                        "tnum text-xs",
                        excerpt.length > EXCERPT_TARGET ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {excerpt.length}/{EXCERPT_TARGET}
                    </span>
                  </div>
                  <FormControl>
                    <Textarea rows={4} className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Action bar: pinned to the screen edge on phones, floats at the foot of the column on desktop */}
        <div
          className={cn(
            "admin-mobile-bar fixed inset-x-0 bottom-0 flex items-center gap-3 border-t bg-card/95 px-4 py-3 backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]",
            "lg:sticky lg:bottom-4 lg:rounded-xl lg:border lg:[box-shadow:var(--shadow-surface-hover)]",
            adminZ.mobileBar,
          )}
        >
          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Published" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {field.value ? "Live" : "Draft"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {isDirty
                      ? "Unsaved changes"
                      : field.value
                        ? "Visible on the blog after saving."
                        : "Only admins can see it."}
                  </span>
                </span>
              </label>
            )}
          />
          {isEdit && initialData?.id && (
            <Link
              href={routes.admin.blogPreview(initialData.id)}
              aria-label="Preview"
              className={cn(buttonVariants({ variant: "outline" }), "hover:bg-muted")}
            >
              <Eye />
              <span className="max-sm:hidden">Preview</span>
            </Link>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {saveLabel}
            <span className="hidden items-center gap-0.5 lg:flex" aria-hidden>
              <Kbd>⌘</Kbd>
              <Kbd>S</Kbd>
            </span>
          </Button>
        </div>
      </form>
    </Form>
  );
}
