import { z } from "zod";

export const PLATFORMS = ["web", "mobile", "both"] as const;
export const PROJECT_STATUSES = [
  "live",
  "beta",
  "prototype",
  "internal",
  "in-development",
] as const;

const baseProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tag: z.string(),
  description: z.string().min(1, "Description is required"),
  img: z.string(),
  mediaType: z.string(),
  live: z.string(),
  code: z.string(),
  stack: z.array(z.string()),
  featured: z.boolean(),
  visible: z.boolean(),
  // Mobile / team showcase
  platform: z.enum(PLATFORMS),
  status: z.union([z.enum(PROJECT_STATUSES), z.literal("")]),
  role: z.string(),
  team: z.string(),
  highlights: z.array(z.string()),
  videoUrl: z.string(),
  posterUrl: z.string(),
  screenshots: z.array(z.string()).max(6, "Up to 6 screenshots"),
  appStoreUrl: z.string(),
  playStoreUrl: z.string(),
  betaUrl: z.string(),
  // Case study page
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and hyphens only"),
  caseStudy: z.string(),
});

/** Mobile projects with a video or screenshots can use those as the cover. */
export const hasOwnMedia = (data: {
  platform?: string;
  videoUrl?: string;
  posterUrl?: string;
  screenshots?: string[];
}) =>
  (data.platform === "mobile" || data.platform === "both") &&
  Boolean(data.videoUrl || data.posterUrl || data.screenshots?.length);

export const projectFormSchema = baseProjectSchema
  .refine((data) => !data.featured || data.tag.trim().length > 0, {
    message: "Tag is required for featured projects",
    path: ["tag"],
  })
  .refine((data) => data.img.trim().length > 0 || hasOwnMedia(data), {
    message: "Add a cover image, or a video or screenshots for a mobile app",
    path: ["img"],
  });

export type ProjectFormValues = z.infer<typeof baseProjectSchema>;
