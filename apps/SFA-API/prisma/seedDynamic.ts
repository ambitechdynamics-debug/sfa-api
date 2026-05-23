import { PrismaClient, MemoryScope, AgentMemoryUsageType } from '@prisma/client';

// provider est un String libre côté schéma (default "mock"). On garde un objet
// pour préserver la lisibilité des seeds sans dépendre d'un enum inexistant.
const AgentProvider = { MOCK: 'mock', OPENAI: 'openai', ANTHROPIC: 'anthropic', GEMINI: 'gemini' } as const;
import { PLANNER_SYSTEM_PROMPT } from '../src/modules/agents/system-prompts/planner.prompt';
import { IMAGE_ANALYST_SYSTEM_PROMPT } from '../src/modules/agents/system-prompts/imageAnalyst.prompt';
import { TEXT_ANALYST_SYSTEM_PROMPT } from '../src/modules/agents/system-prompts/textAnalyst.prompt';
import { BRAND_AGENT_SYSTEM_PROMPT } from '../src/modules/agents/system-prompts/brandAgent.prompt';
import { ARTISTIC_BASE_SYSTEM_PROMPT } from '../src/modules/agents/system-prompts/artisticBase.prompt';
import { PROMPT_ARCHITECT_SYSTEM_PROMPT } from '../src/modules/agents/system-prompts/promptArchitect.prompt';
import { QUALITY_AGENT_SYSTEM_PROMPT } from '../src/modules/agents/system-prompts/qualityAgent.prompt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding memory definitions...');

  // 1. Memory Definitions
  const memoriesToSeed = [
    { key: 'M_SMS', name: 'Demande Client Initiale', description: 'Le SMS ou la demande initiale du client', isSystem: true },
    { key: 'M_QT1', name: 'Questions pour le client', description: 'Questions générées par Planner', isSystem: true },
    { key: 'M_QT2', name: 'Réponses du client', description: 'Réponses aux questions M-QT1', isSystem: true },
    { key: 'M_MD', name: 'Analyse Image', description: 'Analyse des images fournies', isSystem: true },
    { key: 'M_ID', name: 'Identité Visuelle', description: 'Identité de marque extraite', isSystem: true },
    { key: 'M_BA', name: 'Base Artistique', description: 'Ressources artistiques recommandées', isSystem: true },
    { key: 'M_PROMPT1', name: 'Prompt Final', description: 'Le prompt final prêt pour génération', isSystem: true },
    { key: 'M-CREATIVE-BRIEF', name: 'Brief Créatif', description: 'Configuration créative du dashboard (format, couleurs, polices, qualité, style, objectif)', isSystem: false },
    { key: 'M-ASSETS', name: 'Assets Importés', description: 'Fichiers importés dans le panel Configuration Créative (URLs Cloudinary)', isSystem: false },
  ];

  const memDefs: Record<string, string> = {};

  for (const m of memoriesToSeed) {
    const def = await prisma.memoryDefinition.upsert({
      where: { key: m.key },
      update: { name: m.name, description: m.description },
      create: {
        key: m.key,
        name: m.name,
        description: m.description,
        scope: MemoryScope.PROJECT,
        schema: {}, // Schema vide par défaut pour flexibilité
        isSystem: m.isSystem
      }
    });
    memDefs[m.key] = def.id;
  }

  console.log('Seeding agent definitions...');

  // 2. Agent Definitions
  const agentsToSeed = [
    {
      key: 'PLANNER_AGENT',
      name: 'Planner Agent',
      provider: AgentProvider.MOCK,
      model: 'mock-text',
      systemPrompt: PLANNER_SYSTEM_PROMPT,
      links: [
        { memoryKey: 'M_SMS', usageType: AgentMemoryUsageType.INPUT, isRequired: true },
        { memoryKey: 'M_QT2', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_MD', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_ID', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_QT1', usageType: AgentMemoryUsageType.OUTPUT, isRequired: false }
      ]
    },
    {
      key: 'IMAGE_ANALYST_AGENT',
      name: 'Image Analyst Agent',
      provider: AgentProvider.MOCK,
      model: 'mock-vision',
      systemPrompt: IMAGE_ANALYST_SYSTEM_PROMPT,
      links: [
        { memoryKey: 'M_SMS', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_MD', usageType: AgentMemoryUsageType.OUTPUT, isRequired: false }
      ]
    },
    {
      key: 'TEXT_ANALYST_AGENT',
      name: 'Text Analyst Agent',
      provider: AgentProvider.MOCK,
      model: 'mock-text',
      systemPrompt: TEXT_ANALYST_SYSTEM_PROMPT,
      links: [
        { memoryKey: 'M_SMS', usageType: AgentMemoryUsageType.INPUT, isRequired: true },
        { memoryKey: 'M_QT2', usageType: AgentMemoryUsageType.INPUT, isRequired: false }
      ]
    },
    {
      key: 'BRAND_AGENT',
      name: 'Brand Agent',
      provider: AgentProvider.MOCK,
      model: 'mock-text',
      systemPrompt: BRAND_AGENT_SYSTEM_PROMPT,
      links: [
        { memoryKey: 'M_SMS', usageType: AgentMemoryUsageType.INPUT, isRequired: true },
        { memoryKey: 'M_QT2', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_MD', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_ID', usageType: AgentMemoryUsageType.BOTH, isRequired: false }
      ]
    },
    {
      key: 'ARTISTIC_BASE_AGENT',
      name: 'Artistic Base Agent',
      provider: AgentProvider.MOCK,
      model: 'mock-text',
      systemPrompt: ARTISTIC_BASE_SYSTEM_PROMPT,
      links: [
        { memoryKey: 'M_BA', usageType: AgentMemoryUsageType.BOTH, isRequired: false }
      ]
    },
    {
      key: 'PROMPT_ARCHITECT_AGENT',
      name: 'Prompt Architect Agent',
      provider: AgentProvider.MOCK,
      model: 'mock-text',
      systemPrompt: PROMPT_ARCHITECT_SYSTEM_PROMPT,
      links: [
        { memoryKey: 'M_SMS', usageType: AgentMemoryUsageType.INPUT, isRequired: true },
        { memoryKey: 'M_QT1', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_QT2', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_MD', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_ID', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_BA', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_PROMPT1', usageType: AgentMemoryUsageType.OUTPUT, isRequired: false }
      ]
    },
    {
      key: 'QUALITY_AGENT',
      name: 'Quality Agent',
      provider: AgentProvider.MOCK,
      model: 'mock-text',
      systemPrompt: QUALITY_AGENT_SYSTEM_PROMPT,
      links: [
        { memoryKey: 'M_PROMPT1', usageType: AgentMemoryUsageType.INPUT, isRequired: true },
        { memoryKey: 'M_SMS', usageType: AgentMemoryUsageType.INPUT, isRequired: true },
        { memoryKey: 'M_QT2', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_MD', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_ID', usageType: AgentMemoryUsageType.INPUT, isRequired: false },
        { memoryKey: 'M_BA', usageType: AgentMemoryUsageType.INPUT, isRequired: false }
      ]
    }
  ];

  for (const a of agentsToSeed) {
    const agent = await prisma.agentDefinition.upsert({
      where: { key: a.key },
      update: {
        name: a.name,
        systemPrompt: a.systemPrompt,
        provider: a.provider
      },
      create: {
        key: a.key,
        name: a.name,
        provider: a.provider,
        model: a.model,
        systemPrompt: a.systemPrompt,
        expectedOutputSchema: {}
      }
    });

    for (const link of a.links) {
      const memoryDefId = memDefs[link.memoryKey];
      if (memoryDefId) {
        await prisma.agentMemoryLink.upsert({
          where: {
            agentDefinitionId_memoryDefinitionId: {
              agentDefinitionId: agent.id,
              memoryDefinitionId: memoryDefId
            }
          },
          update: {
            usageType: link.usageType,
            isRequired: link.isRequired
          },
          create: {
            agentDefinitionId: agent.id,
            memoryDefinitionId: memoryDefId,
            usageType: link.usageType,
            isRequired: link.isRequired
          }
        });
      }
    }
  }

  console.log('Seed done successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
