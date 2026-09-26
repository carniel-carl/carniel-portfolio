"use client";

import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateSocialLinks } from "@/lib/actions/social";
import { socialFormSchema, type SocialFormValues } from "@/lib/schemas/social";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, Github, Instagram, Linkedin, Loader2, Twitter } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const socialPlatforms = [
  { name: "github", label: "GitHub", icon: Github, baseUrl: "https://github.com/" },
  { name: "linkedin", label: "LinkedIn", icon: Linkedin, baseUrl: "https://linkedin.com/in/" },
  { name: "twitter", label: "X (Twitter)", icon: Twitter, baseUrl: "https://x.com/" },
  { name: "instagram", label: "Instagram", icon: Instagram, baseUrl: "https://instagram.com/" },
] as const;

type PlatformName = (typeof socialPlatforms)[number]["name"];

interface SocialLink {
  id: string;
  name: string;
  link: string;
}

function extractUsername(fullUrl: string, baseUrl: string): string {
  if (fullUrl.startsWith(baseUrl)) return fullUrl.slice(baseUrl.length);
  if (fullUrl.startsWith("http")) {
    try {
      return new URL(fullUrl).pathname.split("/").filter(Boolean).pop() || "";
    } catch {
      return fullUrl;
    }
  }
  return fullUrl;
}

export default function SocialClient({ links: initialLinks }: { links: SocialLink[] }) {
  const defaultValues: SocialFormValues = { github: "", linkedin: "", twitter: "", instagram: "" };
  initialLinks.forEach((link) => {
    const platform = socialPlatforms.find((p) => p.name === link.name);
    if (platform) defaultValues[platform.name] = extractUsername(link.link, platform.baseUrl);
  });

  const form = useForm<SocialFormValues>({
    resolver: zodResolver(socialFormSchema),
    defaultValues,
  });
  const { isSubmitting, isDirty } = form.formState;

  const onSubmit = async (values: SocialFormValues) => {
    const payload = socialPlatforms.map((platform) => {
      const username = values[platform.name as PlatformName]?.trim() || "";
      return { name: platform.name, link: username ? `${platform.baseUrl}${username}` : "" };
    });

    try {
      await updateSocialLinks(payload);
      form.reset(values);
      toast.success("Social links saved");
    } catch {
      toast.error("Could not save social links");
    }
  };

  return (
    <div className="max-w-2xl">
      <AdminPageHeader
        title="Social links"
        description="Only the username is needed. Leave a field empty to hide that profile on the site."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="surface divide-y">
            {socialPlatforms.map((platform) => (
              <FormField
                key={platform.name}
                control={form.control}
                name={platform.name as PlatformName}
                render={({ field }) => (
                  <FormItem className="grid gap-3 space-y-0 p-4 sm:grid-cols-[160px_1fr] sm:items-center sm:gap-4">
                    <FormLabel className="flex items-center gap-2.5 font-medium">
                      <span className="grid size-8 place-items-center rounded-lg bg-muted">
                        <platform.icon className="size-4" />
                      </span>
                      {platform.label}
                    </FormLabel>
                    <div className="space-y-1.5">
                      <div className="flex h-10 items-center overflow-hidden rounded-md border border-input bg-card shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
                        <span className="hidden h-full items-center border-r bg-muted/60 px-3 font-mono text-xs text-muted-foreground sm:flex">
                          {platform.baseUrl.replace("https://", "")}
                        </span>
                        <FormControl>
                          <input
                            {...field}
                            placeholder="username"
                            autoComplete="off"
                            spellCheck={false}
                            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                          />
                        </FormControl>
                        {field.value?.trim() && (
                          <a
                            href={`${platform.baseUrl}${field.value.trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${platform.label} profile`}
                            className="grid h-full place-items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <ArrowUpRight className="size-4" />
                          </a>
                        )}
                      </div>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            {isDirty && (
              <span className="text-sm text-muted-foreground">Unsaved changes</span>
            )}
            <Button
              type="button"
              variant="outline"
              className="hover:bg-muted"
              disabled={!isDirty || isSubmitting}
              onClick={() => form.reset()}
            >
              Discard
            </Button>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Save links
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
