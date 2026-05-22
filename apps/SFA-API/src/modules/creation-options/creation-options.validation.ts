import { z } from "zod";

export const createCreationOptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  icon: z.string().min(1, "Icon is required"),
  category: z.string().optional(),
  description: z.string().optional().nullable(),
  formatPreset: z.string().optional().nullable(),
  dimensions: z.string().optional().nullable(),
  orientation: z.string().optional().nullable(),
  usage: z.string().optional().nullable(),
  contextPrompt: z.string().min(1, "Context Prompt is required"),
  recommendedQuestions: z.any().optional(), // Can be array of strings
  constraints: z.any().optional(), // Can be object
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCreationOptionSchema = createCreationOptionSchema.partial();
