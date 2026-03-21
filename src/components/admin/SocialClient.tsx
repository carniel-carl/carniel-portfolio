"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Github, Linkedin, Twitter, Instagram } from "lucide-react";
import { socialFormSchema, type SocialFormValues } from "@/lib/schemas/social";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { toast } from "sonner";
import { updateSocialLinks } from "@/lib/actions/social";

const socialPlatforms = [
  {
    name: "github",
    label: "GitHub",
    icon: Github,
    baseUrl: "https://github.com/",
  },
  {
    name: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    baseUrl: "https://linkedin.com/in/",
  },
  {
    name: "twitter",
    label: "Twitter",
    icon: Twitter,
    baseUrl: "https://x.com/",
  },
  {
    name: "instagram",
    label: "Instagram",
    icon: Instagram,
    baseUrl: "https://instagram.com/",
  },
] as const;

type PlatformName = (typeof socialPlatforms)[number]["name"];


interface SocialLink {
  id: string;
  name: string;
  link: string;
}

function extractUsername(fullUrl: string, baseUrl: string): string {
  if (fullUrl.startsWith(baseUrl)) {
    return fullUrl.slice(baseUrl.length);
  }
  // If it's already just a username or doesn't match, return as-is
  if (fullUrl.startsWith("http")) {
    // Try to extract the last path segment
    try {
      const url = new URL(fullUrl);
      return url.pathname.split("/").filter(Boolean).pop() || "";
    } catch {
      return fullUrl;
    }
  }
  return fullUrl;
}

export default function SocialClient({
  links: initialLinks,
}: {
  links: SocialLink[];
}) {
  const defaultValues: SocialFormValues = { github: "", linkedin: "", twitter: "", instagram: "" };

  initialLinks.forEach((link) => {
    const platform = socialPlatforms.find((p) => p.name === link.name);
    if (platform) {
      defaultValues[platform.name as PlatformName] = extractUsername(link.link, platform.baseUrl);
    }
  });

  const form = useForm<SocialFormValues>({
    resolver: zodResolver(socialFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: SocialFormValues) => {
    const payload = socialPlatforms.map((platform) => {
      const username = values[platform.name as PlatformName] || "";
      return {
        name: platform.name,
        link: username ? `${platform.baseUrl}${username}` : "",
      };
    });

    try {
      await updateSocialLinks(payload);
      toast.success("Social links updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-6">Social Links</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {socialPlatforms.map((platform) => (
            <FormField
              key={platform.name}
              control={form.control}
              name={platform.name as PlatformName}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{platform.label}</FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>
                          <platform.icon />
                          <span className="text-xs">{platform.baseUrl}</span>
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        placeholder="username"
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
