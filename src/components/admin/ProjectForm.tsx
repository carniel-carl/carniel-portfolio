"use client";

import FileDrop from "@/components/admin/form/FileDrop";
import FormSection, { ToggleRow } from "@/components/admin/form/FormSection";
import TagInput from "@/components/admin/form/TagInput";
import TiptapEditor from "@/components/admin/TiptapEditor";
import VideoDrop from "@/components/admin/form/VideoDrop";
import ScreenshotsDrop from "@/components/admin/form/ScreenshotsDrop";
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
import {
  hasOwnMedia,
  projectFormSchema,
  type ProjectFormValues,
} from "@/lib/schemas/project";
import { cn } from "@/lib/utils";
import { toSlug } from "@/lib/projects/slug";
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
  platform?: string | null;
  status?: string | null;
  role?: string | null;
  team?: string | null;
  highlights?: string[];
  videoUrl?: string | null;
  posterUrl?: string | null;
  screenshots?: string[];
  appStoreUrl?: string | null;
  playStoreUrl?: string | null;
  betaUrl?: string | null;
  slug?: string | null;
  caseStudy?: string | null;
}

const PLATFORM_OPTIONS = [
  { value: "web", label: "Web" },
  { value: "mobile", label: "Mobile" },
  { value: "both", label: "Web + Mobile" },
] as const;

const STATUS_OPTIONS = [
  { value: "", label: "No label" },
  { value: "live", label: "Live" },
  { value: "beta", label: "In beta" },
  { value: "prototype", label: "Prototype" },
  { value: "internal", label: "Internal (NDA)" },
  { value: "in-development", label: "In development" },
] as const;

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
      platform: (initialData?.platform as ProjectFormValues["platform"]) || "web",
      status: (initialData?.status as ProjectFormValues["status"]) || "",
      role: initialData?.role ?? "",
      team: initialData?.team ?? "",
      highlights: initialData?.highlights ?? [],
      videoUrl: initialData?.videoUrl ?? "",
      posterUrl: initialData?.posterUrl ?? "",
      screenshots: initialData?.screenshots ?? [],
      appStoreUrl: initialData?.appStoreUrl ?? "",
      playStoreUrl: initialData?.playStoreUrl ?? "",
      betaUrl: initialData?.betaUrl ?? "",
      slug: initialData?.slug ?? "",
      caseStudy: initialData?.caseStudy ?? "",
    },
  });

  const { isSubmitting, isDirty } = form.formState;
  const featured = useWatch({ control: form.control, name: "featured" });
  const description = useWatch({ control: form.control, name: "description" });
  const name = useWatch({ control: form.control, name: "name" });
  const platform = useWatch({ control: form.control, name: "platform" });
  const isMobile = platform === "mobile" || platform === "both";
  const [videoUrl, posterUrl, screenshots] = useWatch({
    control: form.control,
    name: ["videoUrl", "posterUrl", "screenshots"],
  });
  const coverOptional = hasOwnMedia({ platform, videoUrl, posterUrl, screenshots });

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
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Page URL <span className="font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <div className="flex h-10 items-center rounded-md border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring">
                    <span className="select-none pl-3 text-sm text-muted-foreground">/work/</span>
                    <FormControl>
                      <input
                        className="h-full min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none placeholder:text-muted-foreground/60"
                        placeholder={name ? toSlug(name) : "project-name"}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>Leave empty to use the project name. Changing it breaks old links.</FormDescription>
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

          <FormSection title="Type & status">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <div role="radiogroup" aria-label="Platform" className="flex w-fit rounded-full border p-1">
                    {PLATFORM_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={field.value === o.value}
                        onClick={() => field.onChange(o.value)}
                        className={cn(
                          "h-8 rounded-full px-4 text-sm font-medium transition-colors",
                          field.value === o.value
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <FormDescription>Mobile projects show in a phone frame and get store links.</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status label</FormLabel>
                  <FormControl>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    Be upfront: &ldquo;Internal (NDA)&rdquo; for company apps you can only show, &ldquo;In beta&rdquo; for TestFlight or APK builds.
                  </FormDescription>
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title="Your role" description="What you did on this project. Recruiters read this first on team work.">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input className="h-10" placeholder="Mobile developer" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="team"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team</FormLabel>
                    <FormControl>
                      <Input className="h-10" placeholder="Team of 6 at Acme" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="highlights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What you built</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-28 resize-y"
                      placeholder={"Built the offline sync layer\nImplemented checkout and the payment SDK\nCut app start-up time from 3.1s to 1.4s"}
                      value={field.value.join("\n")}
                      onChange={(e) => field.onChange(e.target.value.split("\n"))}
                    />
                  </FormControl>
                  <FormDescription>One per line. The first 3 show on the card.</FormDescription>
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection
            title="Case study (optional)"
            description="The story on the project's page: the problem, your approach, the result. Use headings to break it into sections."
          >
            <FormField
              control={form.control}
              name="caseStudy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Case study</FormLabel>
                  <FormControl>
                    <TiptapEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="What problem did this project solve?"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection title="Links" description="All optional. Visitors see a button for each one you add.">
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
            {isMobile && (
              <div className="grid gap-5 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="appStoreUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App Store</FormLabel>
                      <FormControl>
                        <Input className="h-10" type="url" placeholder="https://apps.apple.com/" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="playStoreUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Play</FormLabel>
                      <FormControl>
                        <Input className="h-10" type="url" placeholder="https://play.google.com/" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="betaUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beta or demo</FormLabel>
                      <FormControl>
                        <Input className="h-10" type="url" placeholder="TestFlight, APK or Expo" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
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
          <FormSection
            title={coverOptional ? "Cover image (optional)" : "Cover image"}
            description={
              coverOptional
                ? "Leave empty to use the video poster or first screenshot. Used on the home page and admin lists."
                : isMobile
                  ? "Or add a video or screenshots below and this becomes optional."
                  : undefined
            }
          >
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

          {isMobile && (
            <>
              <FormSection title="App preview video" description="Plays muted on loop inside a phone frame.">
                <VideoDrop
                  value={form.watch("videoUrl")}
                  onChange={(url) => form.setValue("videoUrl", url, { shouldDirty: true })}
                  onPoster={(url) => form.setValue("posterUrl", url, { shouldDirty: true })}
                />
              </FormSection>

              <FormSection title="Screenshots" description="Portrait app screens. Shown when there's no video.">
                <FormField
                  control={form.control}
                  name="screenshots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Screenshots</FormLabel>
                      <ScreenshotsDrop value={field.value} onChange={(urls) => form.setValue("screenshots", urls, { shouldDirty: true })} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>
            </>
          )}

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
