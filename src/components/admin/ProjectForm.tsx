"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
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
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { createProject, updateProject } from "@/lib/actions/projects";
import {
  projectFormSchema,
  type ProjectFormValues,
} from "@/lib/schemas/project";

interface ProjectFormData {
  id?: string;
  name: string | null;
  tag: string | null;
  description: string | null;
  img: string | null;
  mediaType: string | null;
  live: string | null;
  code: string | null;
  stack: string[];
  featured: boolean;
  visible: boolean;
}

interface ProjectFormProps {
  initialData?: ProjectFormData;
  isEdit?: boolean;
}

export default function ProjectForm({ initialData, isEdit }: ProjectFormProps) {
  const router = useRouter();
  const [newStackItem, setNewStackItem] = useState("");

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name ?? "",
          tag: initialData.tag ?? "",
          description: initialData.description ?? "",
          img: initialData.img ?? "",
          mediaType: initialData.mediaType ?? "image",
          live: initialData.live ?? "",
          code: initialData.code ?? "",
          stack: initialData.stack ?? [],
          featured: initialData.featured ?? false,
          visible: initialData.visible ?? true,
        }
      : {
          name: "",
          tag: "",
          description: "",
          img: "",
          mediaType: "image",
          live: "",
          code: "",
          stack: [],
          featured: false,
          visible: true,
        },
  });

  const addStackItem = () => {
    if (newStackItem.trim()) {
      const current = form.getValues("stack");
      form.setValue("stack", [...current, newStackItem.trim()]);
      setNewStackItem("");
    }
  };

  const removeStackItem = (index: number) => {
    const current = form.getValues("stack");
    form.setValue(
      "stack",
      current.filter((_, i) => i !== index),
    );
  };

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      if (isEdit && initialData?.id) {
        await updateProject(initialData.id, values);
      } else {
        await createProject(values);
      }
      toast.success(isEdit ? "Project updated" : "Project created");
      router.push("/admin/projects");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const watchedFeatured = form.watch("featured");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag {watchedFeatured ? "*" : ""}</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. ECommerce, Landing, Blog, Web3"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea className="resize-none h-24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="img"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Image *</FormLabel>
              <FormControl>
                <div>
                  {field.value && (
                    <div className="relative w-full max-w-md h-48 rounded-md overflow-hidden mb-2">
                      <Image
                        src={field.value}
                        alt="Project preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => form.setValue("img", "")}
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
                          form.setValue("img", res[0].ufsUrl);
                          toast.success("Image uploaded");
                        }
                      }}
                      onUploadError={(err) => {
                        toast.error(err.message);
                      }}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Or enter URL directly:
                  </p>
                  <Input
                    placeholder="https://... or /images/projects/..."
                    value={field.value ?? ""}
                    onChange={(e) => form.setValue("img", e.target.value)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="live"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Live URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            {form.watch("stack").map((item, i) => (
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
          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-3">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        form.trigger("tag");
                      }}
                    />
                  </FormControl>
                  <FormLabel>Featured Project</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="visible"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-3">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Visible on Site</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting
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
    </Form>
  );
}
