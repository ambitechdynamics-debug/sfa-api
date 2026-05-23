import { z } from 'zod';

export const travailIdParamsSchema = z.object({
  travailId: z.string().min(1, 'travailId is required')
});

export const projectIdParamsSchema = z.object({
  projectId: z.string().min(1, 'projectId is required')
});

export const createTravailSchema = z
  .object({
    title: z.string().trim().min(1, 'title is required'),
    posterType: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    format: z.string().trim().min(1).optional(),
    style: z.string().trim().min(1).optional()
  })
  .strict();

export const updateTravailSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    posterType: z.string().trim().min(1).nullable().optional(),
    category: z.string().trim().min(1).nullable().optional(),
    format: z.string().trim().min(1).nullable().optional(),
    style: z.string().trim().min(1).nullable().optional(),
    status: z.enum(['DRAFT', 'QUESTIONING', 'ANALYZING', 'READY_FOR_PROMPT', 'PROMPT_READY', 'GENERATING', 'GENERATED', 'FAILED']).optional()
  })
  .strict();

export type CreateTravailInput = z.infer<typeof createTravailSchema>;
export type UpdateTravailInput = z.infer<typeof updateTravailSchema>;
