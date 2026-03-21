import { z } from "zod";

export const blogPostFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string(),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string(),
  coverImage: z.string(),
  published: z.boolean(),
});

export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;
