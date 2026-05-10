import { ProjectStatus } from '@prisma/client';
import { z } from 'zod';

export const projectIdParamsSchema = z.object({
  projectId: z.string().min(1, 'projectId is required')
});

export const createProjectSchema = z
  .object({
    title: z.string().trim().min(1, 'title is required'),
    posterType: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    format: z.string().trim().min(1).optional(),
    style: z.string().trim().min(1).optional()
  })
  .strict();

export const updateProjectSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    posterType: z.string().trim().min(1).nullable().optional(),
    category: z.string().trim().min(1).nullable().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    format: z.string().trim().min(1).nullable().optional(),
    style: z.string().trim().min(1).nullable().optional()
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
