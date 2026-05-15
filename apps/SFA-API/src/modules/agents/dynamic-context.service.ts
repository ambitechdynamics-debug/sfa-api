import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { upsertMemory } from './agents.service';

import { AIProvider } from '../ai/ai.types';

export interface AgentContextData {
  promptText: string;
  provider: AIProvider;
  model: string;
}

export async function buildAgentContext(agentKey: string, projectId: string): Promise<AgentContextData> {
  // 1. Récupérer l'agent et ses liaisons INPUT / BOTH
  const agent = await prisma.agentDefinition.findUnique({
    where: { key: agentKey },
    include: {
      memoryLinks: {
        where: { usageType: { in: ['INPUT', 'BOTH'] } },
        include: { memory: true },
        orderBy: { priority: 'asc' }
      }
    }
  });

  if (!agent) {
    throw new Error(`Agent with key ${agentKey} not found in database.`);
  }

  // 2. Récupérer les mémoires du projet correspondant
  const memoryKeys = agent.memoryLinks.map(link => link.memory.key);
  
  if (memoryKeys.length === 0) {
    return {
      promptText: "Aucune mémoire en entrée pour cet agent.",
      provider: agent.provider as AIProvider,
      model: agent.model
    };
  }

  const memoryEntries = await prisma.memoryEntry.findMany({
    where: {
      OR: [
        { projectId: projectId },
        { projectId: null }
      ],
      memoryDefinition: { key: { in: memoryKeys } }
    },
    include: { memoryDefinition: true }
  });

  // Créer un dictionnaire pour accès rapide
  const entriesByKey = new Map(
    memoryEntries.map(entry => [entry.memoryDefinition.key, entry.content])
  );

  // 3. Vérifier les mémoires requises
  for (const link of agent.memoryLinks) {
    if (link.isRequired && !entriesByKey.has(link.memory.key)) {
      throw new Error(`Memory ${link.memory.key} (${link.memory.name}) is required for agent ${agentKey} but not found in project.`);
    }
  }

  // 4. Construire le texte du prompt dynamique
  let promptText = '';
  for (const link of agent.memoryLinks) {
    const content = entriesByKey.get(link.memory.key);
    if (content) {
      promptText += `\n## Mémoire: ${link.memory.key} (${link.memory.name})\n`;
      promptText += `${JSON.stringify(content, null, 2)}\n`;
    }
  }
  return {
    promptText: promptText.trim(),
    provider: agent.provider as AIProvider,
    model: agent.model
  };
}

export async function saveAgentOutputs(agentKey: string, projectId: string, aiResult: any): Promise<void> {
  const agent = await prisma.agentDefinition.findUnique({
    where: { key: agentKey },
    include: {
      memoryLinks: {
        where: { usageType: { in: ['OUTPUT', 'BOTH'] } },
        include: { memory: true }
      }
    }
  });

  if (!agent) return;

  for (const link of agent.memoryLinks) {
    // Si aiResult est un objet complexe (comme pour Planner), on le sauvegarde en entier dans la mémoire associée
    await upsertMemory(projectId, link.memory.key, aiResult as Prisma.InputJsonValue);
  }
}
