"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { createProject, updateProject } from "@/lib/actions/projects";

interface ProjectFormData {
  id?: string;
  name: string;
  tag: string;
  description: string;
  img: string;
  mediaType: string;
  live: string;
  code: string;
  stack: string[];
  featured: boolean;
  order: number;
}

interface ProjectFormProps {
  initialData?: ProjectFormData;
  isEdit?: boolean;
}

export default function ProjectForm({ initialData, isEdit }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newStackItem, setNewStackItem] = useState("");
  const [form, setForm] = useState<ProjectFormData>(
    initialData || {
      name: "",
      tag: "",
      description: "",
      img: "",
      mediaType: "image",
      live: "",
      code: "",
      stack: [],
      featured: false,
      order: 0,
    }
  );

  const addStackItem = () => {
    if (newStackItem.trim()) {
      setForm({ ...form, stack: [...form.stack, newStackItem.trim()] });
      setNewStackItem("");
    }
  };

  const removeStackItem = (index: number) => {
    setForm({ ...form, stack: form.stack.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.img) {
      toast.error("Name, description, and image are required");
      return;
    }

    setLoading(true);

    try {
      if (isEdit && form.id) {
        await updateProject(form.id, form);
      } else {
        await createProject(form);
      }
      toast.success(isEdit ? "Project updated" : "Project created");
      router.push("/admin/projects");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tag">Tag</Label>
        <Input
          id="tag"
          placeholder="e.g. ECommerce, Landing, Blog, Web3"
          value={form.tag}
          onChange={(e) => setForm({ ...form, tag: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Project Image *</Label>
        {form.img && (
          <div className="relative w-full max-w-md h-48 rounded-md overflow-hidden mb-2">
            <Image
              src={form.img}
              alt="Project preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => setForm({ ...form, img: "" })}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        {!form.img && (
          <UploadButton<OurFileRouter, "imageUploader">
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res?.[0]) {
                setForm({ ...form, img: res[0].ufsUrl });
                toast.success("Image uploaded");
              }
            }}
            onUploadError={(err) => { toast.error(err.message); }}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Or enter URL directly:
        </p>
        <Input
          placeholder="https://... or /images/projects/..."
          value={form.img}
          onChange={(e) => setForm({ ...form, img: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="live">Live URL</Label>
          <Input
            id="live"
            placeholder="https://..."
            value={form.live}
            onChange={(e) => setForm({ ...form, live: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code URL</Label>
          <Input
            id="code"
            placeholder="https://github.com/..."
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tech Stack</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Nextjs"
            value={newStackItem}
            onChange={(e) => setNewStackItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addStackItem();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addStackItem}>
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.stack.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
            >
              {item}
              <button type="button" onClick={() => removeStackItem(i)}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <Switch
            checked={form.featured}
            onCheckedChange={(checked) =>
              setForm({ ...form, featured: checked })
            }
          />
          <Label>Featured Project</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="order">Display Order</Label>
          <Input
            id="order"
            type="number"
            value={form.order}
            onChange={(e) =>
              setForm({ ...form, order: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : isEdit
              ? "Update Project"
              : "Create Project"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/projects")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
