import { z } from "zod";

export const socialFormSchema = z.object({
  github: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  instagram: z.string().optional(),
});

export type SocialFormValues = z.infer<typeof socialFormSchema>;
