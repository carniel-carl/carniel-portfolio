"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { X } from "lucide-react";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import TiptapEditor from "@/components/admin/TiptapEditor";
import { createBlogPost, updateBlogPost } from "@/lib/actions/blog";
import {
  blogPostFormSchema,
  type BlogPostFormValues,
} from "@/lib/schemas/blog";

interface BlogFormData {
  id?: string;
  title: string | null;
  slug: string | null;
  content: string | null;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
}

interface BlogPostFormProps {
  initialData?: BlogFormData;
  isEdit?: boolean;
}

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
}: BlogPostFormProps) {
  const router = useRouter();

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: initialData
      ? {
          title: initialData.title ?? "",
          slug: initialData.slug ?? "",
          content: initialData.content ?? "",
          excerpt: initialData.excerpt ?? "",
          coverImage: initialData.coverImage ?? "",
          published: initialData.published ?? false,
        }
      : {
          title: "",
          slug: "",
          content: "",
          excerpt: "",
          coverImage: "",
          published: false,
        },
  });

  const handleTitleChange = (title: string) => {
    form.setValue("title", title);
    form.setValue("slug", slugify(title));
  };

  const onSubmit = async (values: BlogPostFormValues) => {
    try {
      if (isEdit && initialData?.id) {
        await updateBlogPost(initialData.id, values);
      } else {
        await createBlogPost(values);
      }
      toast.success(isEdit ? "Post updated" : "Post created");
      router.push("/admin/blog");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const watchedPublished = useWatch({
    control: form.control,
    name: "published",
  });

  const slug = useWatch({
    control: form.control,
    name: "slug",
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-3xl"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Slug</Label>
          <p className="text-sm text-muted-foreground">/blog/{slug || "..."}</p>
        </div>

        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image</FormLabel>
              <FormControl>
                <div>
                  {field.value && (
                    <div className="relative w-full max-w-md h-48 rounded-md overflow-hidden mb-2">
                      <Image
                        src={field.value}
                        alt="Cover"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => form.setValue("coverImage", "")}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                  {!field.value && (
                    <UploadButton<OurFileRouter, "imageUploader">
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]) {
                          form.setValue("coverImage", res[0].ufsUrl);
                          toast.success("Image uploaded");
                        }
                      }}
                      onUploadError={(err) => {
                        toast.error(err.message);
                      }}
                    />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Brief summary of the post..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content *</FormLabel>
              <FormControl>
                <TiptapEditor
                  content={field.value}
                  onChange={field.onChange}
                  placeholder="Write your blog post..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-3">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Published</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting
              ? "Saving..."
              : watchedPublished
                ? isEdit
                  ? "Update Post"
                  : "Publish Post"
                : "Save Draft"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/blog")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
