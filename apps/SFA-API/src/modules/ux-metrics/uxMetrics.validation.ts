import { z } from 'zod';

const eventTypes = ['PAGE_VIEW', 'NAVIGATION', 'SATISFACTION', 'NAVIGATION_ERROR'] as const;

export const createUxMetricEventSchema = z
  .object({
    eventType: z.enum(eventTypes),
    path: z.string().trim().min(1).max(512),
    fromPath: z.string().trim().min(1).max(512).nullable().optional(),
    toPath: z.string().trim().min(1).max(512).nullable().optional(),
    durationMs: z.number().int().min(0).max(86_400_000).nullable().optional(),
    satisfactionScore: z.number().int().min(1).max(5).nullable().optional(),
    metadata: z.record(z.unknown()).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.eventType === 'SATISFACTION' && !value.satisfactionScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['satisfactionScore'],
        message: 'satisfactionScore is required for SATISFACTION events'
      });
    }
  });

export type CreateUxMetricEventInput = z.infer<typeof createUxMetricEventSchema>;
