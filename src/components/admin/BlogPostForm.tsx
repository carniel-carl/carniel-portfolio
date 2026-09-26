"use client";

import FileDrop from "@/components/admin/form/FileDrop";
import FormSection, { ToggleRow } from "@/components/admin/form/FormSection";
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
}

interface BlogPostFormProps {
  initialData?: BlogFormData;
  isEdit?: boolean;
  categories: { id: string; name: string }[];
}

const EXCERPT_TARGET = 160;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export default function BlogPostForm({ initialData, isEdit, categories }: BlogPostFormProps) {
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
    },
  });

  const { isSubmitting, isDirty } = form.formState;
  const [published, excerpt] = useWatch({ control: form.control, name: ["published", "excerpt"] });

  const onSubmit = async (values: BlogPostFormValues) => {
    try {
      if (isEdit && initialData?.id) {
        await updateBlogPost(initialData.id, values);
      } else {
        await createBlogPost(values);
      }
      form.reset(values);
      toast.success(
        values.published ? (isEdit ? "Post updated" : "Post published") : "Draft saved",
      );
      router.push(routes.admin.blog);
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
      <form
        onSubmit={submit}
        noValidate
        className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_320px] lg:pb-0"
      >
        {/* The writing sheet: a card, so it rises over the band like the aside */}
        <div className="surface min-w-0 space-y-6 p-5 md:p-7">
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
                  <Textarea rows={2} className="resize-none" {...field} />
                </FormControl>
                <FormDescription>Shown on post cards and in search results.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
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

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <FormSection title="Publishing">
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <ToggleRow
                  title={field.value ? "Live" : "Draft"}
                  description={
                    field.value ? "Visible on the blog after saving." : "Only admins can see it."
                  }
                  control={
                    <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Published" />
                  }
                />
              )}
            />
            <div className="hidden space-y-3 lg:block">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {saveLabel}
              </Button>
              {isEdit && initialData?.id && (
                <Link
                  href={routes.admin.blogPreview(initialData.id)}
                  className={cn(buttonVariants({ variant: "outline" }), "w-full hover:bg-muted")}
                >
                  <Eye />
                  Preview
                </Link>
              )}
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Kbd>⌘</Kbd>
                <Kbd>S</Kbd>
                saves from anywhere
              </p>
            </div>
          </FormSection>

          <FormSection title="Organise">
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
          </FormSection>

          <FormSection title="Cover image">
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Cover image</FormLabel>
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
          </FormSection>
        </aside>

        {/* Mobile action bar */}
        <div
          className={cn(
            "admin-mobile-bar fixed inset-x-0 bottom-0 flex items-center gap-2 border-t bg-card/95 px-4 py-3 backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
            adminZ.mobileBar,
          )}
        >
          <span className="flex-1 text-xs text-muted-foreground">
            {isDirty ? "Unsaved changes" : published ? "Live" : "Draft"}
          </span>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {saveLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
