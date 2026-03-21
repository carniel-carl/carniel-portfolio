import { z } from "zod";

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
});

export const projectFormSchema = baseProjectSchema.refine(
  (data) => !data.featured || data.tag.trim().length > 0,
  { message: "Tag is required for featured projects", path: ["tag"] }
);

export type ProjectFormValues = z.infer<typeof baseProjectSchema>;
