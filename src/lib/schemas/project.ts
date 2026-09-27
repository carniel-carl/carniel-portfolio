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
  img: z.string().min(1, "Image is required"),
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
});

export const projectFormSchema = baseProjectSchema.refine(
  (data) => !data.featured || data.tag.trim().length > 0,
  { message: "Tag is required for featured projects", path: ["tag"] }
);

export type ProjectFormValues = z.infer<typeof baseProjectSchema>;
