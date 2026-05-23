import { z } from 'zod';

export const projectIdParamsSchema = z.object({
  projectId: z.string().min(1, 'projectId is required')
});

export const createProjectSchema = z
  .object({
    title: z.string().trim().min(1, 'title is required'),
    brandDescription: z.string().trim().min(1).max(2_000).optional()
  })
  .strict();

export const updateProjectSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    brandDescription: z.string().trim().min(1).max(2_000).nullable().optional()
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
