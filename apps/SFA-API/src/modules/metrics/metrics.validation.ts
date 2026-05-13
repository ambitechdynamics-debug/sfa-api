import { z } from 'zod';

export const metricEventSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    payload: z.record(z.unknown()).optional(),
    path: z.string().trim().min(1).max(512).optional()
  })
  .strict();

export const metricSatisfactionSchema = z
  .object({
    score: z.number().int().min(1).max(5),
    path: z.string().trim().min(1).max(512).optional(),
    payload: z.record(z.unknown()).optional()
  })
  .strict();

export type MetricEventInput = z.infer<typeof metricEventSchema>;
export type MetricSatisfactionInput = z.infer<typeof metricSatisfactionSchema>;
