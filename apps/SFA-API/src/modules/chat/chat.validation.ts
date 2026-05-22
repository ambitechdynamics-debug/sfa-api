import { z } from 'zod';

const optionalIdSchema = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.string().trim().min(1).max(160).optional()
);

export const chatHistoryMessageSchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(8_000)
  })
  .strict();

export const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(8_000),
    conversationId: optionalIdSchema,
    projectId: optionalIdSchema,
    history: z.preprocess(
      (value) => (value === undefined || value === null ? [] : value),
      z.array(chatHistoryMessageSchema).max(40).default([])
    ),
    visualConfig: z.record(z.unknown()).optional()
  });

export type ChatRequestSchema = z.infer<typeof chatRequestSchema>;

export const chatOpeningRequestSchema = z
  .object({
    projectId: z.string().trim().min(1).max(160),
  })
  .strict();

export type ChatOpeningRequestSchema = z.infer<typeof chatOpeningRequestSchema>;
