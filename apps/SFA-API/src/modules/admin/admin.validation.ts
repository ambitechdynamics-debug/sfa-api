import { z } from 'zod';
import { MemoryScope, AgentMemoryUsageType } from '@prisma/client';

export const createMemoryDefSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  scope: z.nativeEnum(MemoryScope).optional(),
  schema: z.record(z.unknown()).optional(),
  isSystem: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const updateMemoryDefSchema = createMemoryDefSchema.partial();

export const createAgentDefSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  provider: z.string().min(1).optional(),
  model: z.string(),
  systemPrompt: z.string().min(1),
  expectedOutputSchema: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional()
});

export const updateAgentDefSchema = createAgentDefSchema.partial();

export const createAgentMemoryLinkSchema = z.object({
  agentDefinitionId: z.string().min(1),
  memoryDefinitionId: z.string().min(1),
  usageType: z.nativeEnum(AgentMemoryUsageType).optional(),
  isRequired: z.boolean().optional(),
  priority: z.number().optional()
});

export const updateAgentMemoryLinkSchema = z.object({
  usageType: z.nativeEnum(AgentMemoryUsageType).optional(),
  isRequired: z.boolean().optional(),
  priority: z.number().optional()
});

export const orchestratorPipelineStepSchema = z.object({
  id: z.enum([
    'image_analysis',
    'planning',
    'text_analysis',
    'brand_analysis',
    'artistic_base',
    'prompt_architect',
    'safety',
    'quality',
  ]),
  label: z.string().min(1),
  agentKey: z.string().min(1),
  order: z.number(),
  enabled: z.boolean(),
  required: z.boolean(),
  executionMode: z.enum(['sequential', 'parallel']),
  inputMemoryKeys: z.array(z.string()),
  outputMemoryKey: z.string().nullable(),
  retries: z.number().int().min(0).max(5),
  timeoutMs: z.number().int().min(1000).max(300000),
  condition: z.enum(['always', 'has_files', 'planner_ready_or_force', 'has_prompt']),
});

export const orchestratorPipelineConfigSchema = z.object({
  version: z.number().optional(),
  steps: z.array(orchestratorPipelineStepSchema).min(1),
});
