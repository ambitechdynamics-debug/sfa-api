import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { callTextAI } from '../ai/ai.service';
import { saveAgentRun } from '../agents/agents.service';

export interface RunDynamicAgentParams {
  agentKey: string;
  travailId: string;
  userId: string;
}

export async function runDynamicAgent(params: RunDynamicAgentParams) {
  // 1. Fetch Agent Definition
  const agentDef = await prisma.agentDefinition.findUnique({
    where: { key: params.agentKey },
    include: {
      memoryLinks: {
        include: { memory: true }
      }
    }
  });

  if (!agentDef) {
    throw new AppError(`Agent definition '${params.agentKey}' not found`, 404);
  }
  if (!agentDef.isActive) {
    throw new AppError(`Agent '${params.agentKey}' is not active`, 400);
  }

  // 2. Fetch Travail Data
  const travail = await prisma.travail.findUnique({
    where: { id: params.travailId },
    include: {
      memoryEntries: {
        include: { memoryDefinition: true }
      },
      project: { select: { id: true, title: true } }
    }
  });

  if (!travail) {
    throw new AppError('Travail not found', 404);
  }

  // Verify Ownership
  if (travail.userId !== params.userId) {
    throw new AppError('Travail not found or access denied', 404);
  }

  // 3. Build Memory Context (INPUT or BOTH)
  const contextMemories: Record<string, unknown> = {};
  const missingRequiredMemories: string[] = [];

  for (const link of agentDef.memoryLinks) {
    if (link.usageType === 'INPUT' || link.usageType === 'BOTH') {
      const memoryKey = link.memory.key;
      const memEntry = travail.memoryEntries.find(m => m.memoryDefinition.key === memoryKey);

      if (memEntry) {
        contextMemories[memoryKey] = memEntry.content;
      } else if (link.isRequired) {
        missingRequiredMemories.push(memoryKey);
      }
    }
  }

  if (missingRequiredMemories.length > 0) {
    throw new AppError(`Missing required memories for this agent: ${missingRequiredMemories.join(', ')}`, 400);
  }

  // 4. Construct User Prompt
  const userPrompt = `
## Données du Travail
- Marque (project) : ${travail.project.title}
- Livrable (travail) : ${travail.title}
- Type : ${travail.posterType || 'Non spécifié'}
- Catégorie : ${travail.category || 'Non spécifiée'}

## Mémoires Disponibles
${JSON.stringify(contextMemories, null, 2)}

Veuillez traiter ces informations conformément à votre instruction système et retourner le JSON attendu.
  `.trim();

  // 5. Call AI
  let agentRunStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let agentError: string | undefined;
  let aiResult = null;

  const startTime = Date.now();

  try {
    aiResult = await callTextAI({
      provider: agentDef.provider.toLowerCase() as 'mock' | 'openai' | 'anthropic' | 'gemini',
      model: agentDef.model,
      systemPrompt: agentDef.systemPrompt,
      userPrompt: userPrompt,
      temperature: 0.5,
      responseFormat: 'json'
    });
  } catch (err) {
    agentRunStatus = 'FAILED';
    agentError = err instanceof Error ? err.message : 'Unknown error';
  }

  const durationMs = Date.now() - startTime;

  // 6. Save Agent Run
  await saveAgentRun({
    travailId: params.travailId,
    agentName: agentDef.name,
    provider: agentDef.provider,
    model: agentDef.model,
    input: contextMemories as unknown as Prisma.InputJsonValue,
    output: (aiResult?.parsed ?? null) as unknown as Prisma.InputJsonValue,
    status: agentRunStatus,
    error: agentError,
    durationMs
  });

  if (agentRunStatus === 'FAILED' || !aiResult) {
    throw new AppError(`Agent '${agentDef.name}' failed: ${agentError}`, 500);
  }

  const parsedOutput = aiResult.parsed as Record<string, unknown>;

  // 7. Save outputs to memory (OUTPUT or BOTH)
  const outputLinks = agentDef.memoryLinks.filter(l => l.usageType === 'OUTPUT' || l.usageType === 'BOTH');

  for (const link of outputLinks) {
    const memoryKey = link.memory.key;
    let contentToSave = parsedOutput;
    if (parsedOutput[memoryKey] !== undefined) {
      contentToSave = parsedOutput[memoryKey] as Record<string, unknown>;
    }

    await prisma.memoryEntry.upsert({
      where: {
        travailId_memoryDefinitionId: {
          travailId: params.travailId,
          memoryDefinitionId: link.memory.id
        }
      },
      create: {
        travailId: params.travailId,
        userId: travail.userId,
        memoryDefinitionId: link.memory.id,
        content: contentToSave as unknown as Prisma.InputJsonValue
      },
      update: {
        content: contentToSave as unknown as Prisma.InputJsonValue
      }
    });
  }

  return {
    success: true,
    agentName: agentDef.name,
    durationMs,
    output: parsedOutput
  };
}
