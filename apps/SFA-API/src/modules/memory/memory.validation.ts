import { z } from 'zod';

const jsonValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.unknown()),
  z.record(z.unknown())
]);

export const memoryParamsSchema = z.object({
  projectId: z.string().min(1, 'projectId is required')
});

export const memoryKeyParamsSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  memoryKey: z.string().min(1, 'memoryKey is required')
});

export const createMemorySchema = z
  .object({
    memoryKey: z.string().min(1, 'memoryKey is required'),
    content: jsonValueSchema
  })
  .strict();

export const updateMemorySchema = z
  .object({
    content: jsonValueSchema
  })
  .strict();

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;

