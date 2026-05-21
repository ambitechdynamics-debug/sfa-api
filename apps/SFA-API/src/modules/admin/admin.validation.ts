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
