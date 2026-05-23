import { z } from 'zod';

export const chatHistoryMessageSchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(8_000)
  })
  .strict();

export const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(8_000),
    travailId: z.string().trim().min(1).max(160),
    history: z.preprocess(
      (value) => (value === undefined || value === null ? [] : value),
      z.array(chatHistoryMessageSchema).max(40).default([])
    ),
    visualConfig: z.record(z.unknown()).optional()
  });

export type ChatRequestSchema = z.infer<typeof chatRequestSchema>;

export const chatOpeningRequestSchema = z
  .object({
    travailId: z.string().trim().min(1).max(160),
  })
  .strict();

export type ChatOpeningRequestSchema = z.infer<typeof chatOpeningRequestSchema>;
