import { z } from 'zod';

const AIProviderSchema = z.enum(['openai', 'anthropic', 'gemini', 'mock']).optional();

export const RunPlannerSchema = z.object({
  provider: AIProviderSchema,
  model: z.string().optional()
});

export const RunImageAnalystSchema = z.object({
  fileIds: z.array(z.string()).optional(),
  provider: AIProviderSchema,
  model: z.string().optional()
});

export const RunTextAnalystSchema = z.object({
  provider: AIProviderSchema,
  model: z.string().optional()
});

export const RunBrandAgentSchema = z.object({
  provider: AIProviderSchema,
  model: z.string().optional()
});

export const RunArtisticBaseSchema = z.object({
  provider: AIProviderSchema,
  model: z.string().optional()
});

export const RunPromptArchitectSchema = z.object({
  provider: AIProviderSchema,
  model: z.string().optional()
});

export const RunQualityAgentSchema = z.object({
  provider: AIProviderSchema,
  model: z.string().optional()
});

export type RunPlannerInput = z.infer<typeof RunPlannerSchema>;
export type RunImageAnalystInput = z.infer<typeof RunImageAnalystSchema>;
export type RunTextAnalystInput = z.infer<typeof RunTextAnalystSchema>;
export type RunBrandAgentInput = z.infer<typeof RunBrandAgentSchema>;
export type RunArtisticBaseInput = z.infer<typeof RunArtisticBaseSchema>;
export type RunPromptArchitectInput = z.infer<typeof RunPromptArchitectSchema>;
export type RunQualityAgentInput = z.infer<typeof RunQualityAgentSchema>;
