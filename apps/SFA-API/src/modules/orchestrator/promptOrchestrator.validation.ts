import { z } from 'zod';

const AIProviderSchema = z.enum(['openai', 'anthropic', 'gemini', 'mock']).optional();

export const GenerateFinalPromptSchema = z.object({
  provider: AIProviderSchema,
  model: z.string().optional(),
  visionProvider: AIProviderSchema,
  visionModel: z.string().optional(),
  force: z.boolean().optional().default(false) // forcer la re-génération même si PROMPT_READY
});

export type GenerateFinalPromptInput = z.infer<typeof GenerateFinalPromptSchema>;
