import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { upsertMemory } from './agents.service';

import { AIProvider } from '../ai/ai.types';
import {
  buildAgentModuleBlocks,
  normalizeAgentModuleAccess,
  type AgentModuleAccess,
} from './agentModuleContext.service';

export interface AgentContextData {
  promptText: string;
  provider: AIProvider;
  model: string;
  systemPrompt: string;
}

export interface AgentContextOptions {
  inputMemoryKeys?: string[];
}

/**
 * Snapshot mémoire pré-chargé (par exemple par l'orchestrateur, qui le partage
 * entre les 7 agents pour éviter 7 queries `MemoryEntry.findMany`). Map de
 * `memoryKey` → `content`.
 */
export type MemorySnapshot = Map<string, unknown>;

export async function buildAgentContext(
  agentKey: string,
  travailId: string,
  snapshot?: MemorySnapshot,
  options: AgentContextOptions = {},
): Promise<AgentContextData> {
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

  // 1.bis. Modules optionnels accordés à cet agent (fichiers, base artistique,
  // règles interdites, type de création). Chargés en parallèle des mémoires
  // pour ne pas pénaliser le temps de réponse.
  const moduleAccess: AgentModuleAccess = normalizeAgentModuleAccess(agent.moduleAccess);
  const hasAnyModule =
    moduleAccess.files || moduleAccess.artistic_base || moduleAccess.forbidden_rules || moduleAccess.creation_options;

  const moduleBlocksPromise: Promise<string> = hasAnyModule
    ? (async () => {
        const travail = await prisma.travail.findUnique({
          where: { id: travailId },
          select: { category: true, posterType: true },
        });
        return buildAgentModuleBlocks(moduleAccess, {
          travailId,
          category: travail?.category ?? null,
          posterType: travail?.posterType ?? null,
        });
      })()
    : Promise.resolve('');

  const composeSystemPrompt = async () => {
    const moduleBlocks = await moduleBlocksPromise;
    return moduleBlocks ? `${agent.systemPrompt}\n\n${moduleBlocks}` : agent.systemPrompt;
  };

  // 2. Récupérer les mémoires du travail correspondant. Par défaut les liens
  // AgentMemoryLink restent la source, mais l'orchestrateur peut injecter une
  // liste administrée par pipeline pour tester un flux sans modifier les liens.
  type PromptMemoryLink = { memory: { key: string; name: string }; isRequired: boolean };
  let promptLinks: PromptMemoryLink[];

  if (options.inputMemoryKeys !== undefined) {
    const keys = Array.from(new Set(options.inputMemoryKeys.map((key) => key.trim()).filter(Boolean)));
    const definitions = keys.length > 0
      ? await prisma.memoryDefinition.findMany({
          where: { key: { in: keys }, isActive: true },
          select: { key: true, name: true },
        })
      : [];
    const byKey = new Map(definitions.map((memory) => [memory.key, memory]));

    promptLinks = keys.map((key) => ({
      memory: byKey.get(key) ?? { key, name: key },
      isRequired: false,
    }));
  } else {
    promptLinks = agent.memoryLinks.map((link) => ({
      memory: { key: link.memory.key, name: link.memory.name },
      isRequired: link.isRequired,
    }));
  }

  const memoryKeys = promptLinks.map(link => link.memory.key);

  if (memoryKeys.length === 0) {
    return {
      promptText: "Aucune mémoire en entrée pour cet agent.",
      provider: agent.provider as AIProvider,
      model: agent.model,
      systemPrompt: await composeSystemPrompt(),
    };
  }

  // Si un snapshot est fourni par l'orchestrateur, on l'utilise — sinon on
  // tombe sur une query DB (mode legacy, agent invoqué seul).
  let entriesByKey: Map<string, unknown>;
  if (snapshot) {
    entriesByKey = new Map();
    for (const key of memoryKeys) {
      const content = snapshot.get(key);
      if (content !== undefined) entriesByKey.set(key, content);
    }
  } else {
    const memoryEntries = await prisma.memoryEntry.findMany({
      where: {
        travailId,
        memoryDefinition: { key: { in: memoryKeys } }
      },
      include: { memoryDefinition: true }
    });

    entriesByKey = new Map(
      memoryEntries.map(entry => [entry.memoryDefinition.key, entry.content])
    );
  }

  // 3. Vérifier les mémoires requises
  for (const link of promptLinks) {
    if (link.isRequired && !entriesByKey.has(link.memory.key)) {
      throw new Error(`Memory ${link.memory.key} (${link.memory.name}) is required for agent ${agentKey} but not found in travail.`);
    }
  }

  // 4. Construire le texte du prompt dynamique
  let promptText = '';
  for (const link of promptLinks) {
    const content = entriesByKey.get(link.memory.key);
    if (content) {
      promptText += `\n## Mémoire: ${link.memory.key} (${link.memory.name})\n`;
      promptText += `${JSON.stringify(content, null, 2)}\n`;
    }
  }
  return {
    promptText: promptText.trim(),
    provider: agent.provider as AIProvider,
    model: agent.model,
    systemPrompt: await composeSystemPrompt(),
  };
}

/**
 * Construit un snapshot mémoire (key → content) à partir d'un tableau de
 * MemoryEntry déjà chargé (typiquement par l'orchestrateur via
 * `travail.memoryEntries`). Évite N queries Prisma supplémentaires en aval.
 */
export function buildMemorySnapshot(
  entries: Array<{ memoryDefinition: { key: string }; content: unknown }>,
): MemorySnapshot {
  const snapshot: MemorySnapshot = new Map();
  for (const e of entries) {
    snapshot.set(e.memoryDefinition.key, e.content);
  }
  return snapshot;
}

export async function saveAgentOutputs(agentKey: string, travailId: string, aiResult: unknown): Promise<void> {
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
    await upsertMemory(travailId, link.memory.key, aiResult as Prisma.InputJsonValue);
  }
}
