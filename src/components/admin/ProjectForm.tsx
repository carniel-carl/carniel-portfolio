"use client";

import FileDrop from "@/components/admin/form/FileDrop";
import FormSection, { ToggleRow } from "@/components/admin/form/FormSection";
import TagInput from "@/components/admin/form/TagInput";
import { useFormShortcuts } from "@/components/admin/form/useFormShortcuts";
import { Kbd } from "@/components/admin/shell/CommandMenu";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createProject, updateProject } from "@/lib/actions/projects";
import { adminZ } from "@/lib/admin-z";
import routes from "@/lib/routes";
import { projectFormSchema, type ProjectFormValues } from "@/lib/schemas/project";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

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

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      tag: initialData?.tag ?? "",
      description: initialData?.description ?? "",
      img: initialData?.img ?? "",
      mediaType: initialData?.mediaType ?? "image",
      live: initialData?.live ?? "",
      code: initialData?.code ?? "",
      stack: initialData?.stack ?? [],
      featured: initialData?.featured ?? false,
      visible: initialData?.visible ?? true,
    },
  });

  const { isSubmitting, isDirty } = form.formState;
  const featured = useWatch({ control: form.control, name: "featured" });
  const description = useWatch({ control: form.control, name: "description" });

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      if (isEdit && initialData?.id) {
        await updateProject(initialData.id, values);
      } else {
        await createProject(values);
      }
      form.reset(values);
      toast.success(isEdit ? "Project saved" : "Project created");
      router.push(routes.admin.projects);
      router.refresh();
    } catch {
      toast.error("Could not save the project");
    }
  };

  const submit = form.handleSubmit(onSubmit, () =>
    toast.error("Some fields need attention"),
  );

  useFormShortcuts({ onSave: submit, dirty: isDirty && !isSubmitting });

  const saveLabel = isEdit ? "Save changes" : "Create project";

  return (
    <Form {...form}>
      <form
        onSubmit={submit}
        noValidate
        className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_320px] lg:pb-0"
      >
        <div className="min-w-0 space-y-6">
          <FormSection title="Details">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input className="h-10" autoFocus={!isEdit} {...field} />
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
                  <FormLabel>
                    Tag {!featured && <span className="font-normal text-muted-foreground">(optional)</span>}
                  </FormLabel>
                  <FormControl>
                    <Input className="h-10" placeholder="E-commerce, Landing page, Web3" {...field} />
                  </FormControl>
                  <FormDescription>Featured projects show this label on their card.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-baseline justify-between">
                    <FormLabel>Description</FormLabel>
                    <span className="tnum text-xs text-muted-foreground">
                      {description.length} characters
                    </span>
                  </div>
                  <FormControl>
                    <Textarea className="min-h-28 resize-y" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title="Links" description="Both are optional. Visitors see a button for each one you add.">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="live"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Live site</FormLabel>
                    <FormControl>
                      <Input className="h-10" type="url" placeholder="https://" {...field} />
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
                    <FormLabel>Repository</FormLabel>
                    <FormControl>
                      <Input className="h-10" type="url" placeholder="https://github.com/" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          <FormSection title="Tech stack">
            <FormField
              control={form.control}
              name="stack"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Tech stack</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Type a technology and press Enter"
                    />
                  </FormControl>
                  <FormDescription>Separate with Enter or commas. Order is kept.</FormDescription>
                </FormItem>
              )}
            />
          </FormSection>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <FormSection title="Cover image">
            <FormField
              control={form.control}
              name="img"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="sr-only">Cover image</FormLabel>
                  <FormControl>
                    <FileDrop
                      endpoint="imageUploader"
                      value={field.value}
                      onChange={(url) => form.setValue("img", url, { shouldDirty: true, shouldValidate: true })}
                      hint="PNG, JPG or WebP up to 4MB"
                      invalid={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title="Visibility">
            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <ToggleRow
                  title="Featured"
                  description="Show it in the home page lineup."
                  control={
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (form.formState.isSubmitted) form.trigger("tag");
                      }}
                      aria-label="Featured"
                    />
                  }
                />
              )}
            />
            <FormField
              control={form.control}
              name="visible"
              render={({ field }) => (
                <ToggleRow
                  title="Visible"
                  description="Hidden projects stay here but not on the site."
                  control={
                    <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Visible" />
                  }
                />
              )}
            />
          </FormSection>

          <div className="hidden space-y-3 lg:block">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {saveLabel}
            </Button>
            <Link
              href={routes.admin.projects}
              className={cn(buttonVariants({ variant: "outline" }), "w-full hover:bg-muted")}
            >
              Cancel
            </Link>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Kbd>⌘</Kbd>
              <Kbd>S</Kbd>
              saves from anywhere
            </p>
          </div>
        </aside>

        {/* Mobile action bar */}
        <div
          className={cn(
            "admin-mobile-bar fixed inset-x-0 bottom-0 flex items-center gap-2 border-t bg-card/95 px-4 py-3 backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
            adminZ.mobileBar,
          )}
        >
          <span className="flex-1 text-xs text-muted-foreground">
            {isDirty ? "Unsaved changes" : "No changes yet"}
          </span>
          <Link href={routes.admin.projects} className={cn(buttonVariants({ variant: "outline" }), "hover:bg-muted")}>
            Cancel
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {saveLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
