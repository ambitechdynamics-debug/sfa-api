import { ForbiddenRuleCategory, ForbiddenRuleScope, ForbiddenRuleSeverity } from '@prisma/client';
import { z } from 'zod';

const jsonValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.unknown()),
  z.record(z.unknown())
]);

export const forbiddenRuleIdParamsSchema = z.object({
  id: z.string().min(1, 'id is required')
});

export const forbiddenRuleCategoryParamsSchema = z.object({
  category: z.nativeEnum(ForbiddenRuleCategory)
});

export const createForbiddenRuleSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, 'key is required')
      .regex(/^[A-Z][A-Z0-9_]*$/, 'key must be UPPER_SNAKE_CASE'),
    title: z.string().trim().min(1, 'title is required'),
    description: z.string().trim().min(1).optional(),
    category: z.nativeEnum(ForbiddenRuleCategory),
    severity: z.nativeEnum(ForbiddenRuleSeverity).optional(),
    scope: z.nativeEnum(ForbiddenRuleScope).optional(),
    appliesTo: jsonValueSchema.optional(),
    examples: z.array(z.string().trim().min(1)).optional(),
    correctionTips: z.array(z.string().trim().min(1)).optional(),
    negativePrompt: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional()
  })
  .strict();

export const updateForbiddenRuleSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1)
      .regex(/^[A-Z][A-Z0-9_]*$/, 'key must be UPPER_SNAKE_CASE')
      .optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).nullable().optional(),
    category: z.nativeEnum(ForbiddenRuleCategory).optional(),
    severity: z.nativeEnum(ForbiddenRuleSeverity).optional(),
    scope: z.nativeEnum(ForbiddenRuleScope).optional(),
    appliesTo: jsonValueSchema.nullable().optional(),
    examples: z.array(z.string().trim().min(1)).nullable().optional(),
    correctionTips: z.array(z.string().trim().min(1)).nullable().optional(),
    negativePrompt: z.string().trim().min(1).nullable().optional(),
    isActive: z.boolean().optional()
  })
  .strict();

export const searchForbiddenRulesQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  category: z.nativeEnum(ForbiddenRuleCategory).optional(),
  severity: z.nativeEnum(ForbiddenRuleSeverity).optional(),
  scope: z.nativeEnum(ForbiddenRuleScope).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50)
});

export type CreateForbiddenRuleInput = z.infer<typeof createForbiddenRuleSchema>;
export type UpdateForbiddenRuleInput = z.infer<typeof updateForbiddenRuleSchema>;
export type SearchForbiddenRulesQuery = z.infer<typeof searchForbiddenRulesQuerySchema>;
