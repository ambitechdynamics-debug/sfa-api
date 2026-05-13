import { z } from 'zod';

export const updateMeSchema = z
  .object({
    fullName: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).nullable().optional()
  })
  .strict();

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
