"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import TiptapEditor from "@/components/admin/TiptapEditor";
import { X } from "lucide-react";
import { createBlogPost, updateBlogPost } from "@/lib/actions/blog";

interface BlogFormData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
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
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<BlogFormData>(
    initialData || {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      coverImage: "",
      published: false,
    }
  );

  const handleTitleChange = (title: string) => {
    setForm({
      ...form,
      title,
      slug: slugify(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error("Title and content are required");
      return;
    }

    setLoading(true);

    try {
      if (isEdit && form.id) {
        await updateBlogPost(form.id, form);
      } else {
        await createBlogPost(form);
      }
      toast.success(isEdit ? "Post updated" : "Post created");
      router.push("/admin/blog");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Slug</Label>
        <p className="text-sm text-muted-foreground">
          /blog/{form.slug || "..."}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Cover Image</Label>
        {form.coverImage && (
          <div className="relative w-full max-w-md h-48 rounded-md overflow-hidden mb-2">
            <Image
              src={form.coverImage}
              alt="Cover"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => setForm({ ...form, coverImage: "" })}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        {!form.coverImage && (
          <UploadButton<OurFileRouter, "imageUploader">
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res?.[0]) {
                setForm({ ...form, coverImage: res[0].ufsUrl });
                toast.success("Image uploaded");
              }
            }}
            onUploadError={(err) => { toast.error(err.message); }}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          rows={2}
          placeholder="Brief summary of the post..."
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Content *</Label>
        <TiptapEditor
          content={form.content}
          onChange={(html) => setForm({ ...form, content: html })}
          placeholder="Write your blog post..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.published}
          onCheckedChange={(checked) =>
            setForm({ ...form, published: checked })
          }
        />
        <Label>Published</Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : form.published
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
  );
}
