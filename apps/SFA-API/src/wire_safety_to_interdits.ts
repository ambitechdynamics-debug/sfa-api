import { PrismaClient, AgentMemoryUsageType } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  console.log('=== Câblage SAFETY_AGENT → M-INTERDITS ===\n');

  const agent = await prisma.agentDefinition.findUnique({ where: { key: 'SAFETY_AGENT' } });
  if (!agent) {
    console.error('SAFETY_AGENT introuvable en DB. Lance d\'abord src/fix_agents.ts.');
    process.exit(1);
  }

  const memory = await prisma.memoryDefinition.findUnique({ where: { key: 'M-INTERDITS' } });
  if (!memory) {
    console.error('M-INTERDITS introuvable en DB. Lance d\'abord forbiddenRules.service.syncToGlobalMemory.');
    process.exit(1);
  }

  const existing = await prisma.agentMemoryLink.findUnique({
    where: {
      agentDefinitionId_memoryDefinitionId: {
        agentDefinitionId: agent.id,
        memoryDefinitionId: memory.id,
      },
    },
  });

  if (existing) {
    console.log(`Lien déjà présent (id=${existing.id}, usageType=${existing.usageType}, isRequired=${existing.isRequired})`);
    return;
  }

  const link = await prisma.agentMemoryLink.create({
    data: {
      agentDefinitionId: agent.id,
      memoryDefinitionId: memory.id,
      usageType: AgentMemoryUsageType.INPUT,
      isRequired: false, // n'empêche pas Safety de tourner si la mémoire est vide
      priority: 10,
    },
  });
  console.log(`✓ Lien créé : SAFETY_AGENT → M-INTERDITS (id=${link.id}, INPUT, optional)`);
  console.log('Le Safety Agent recevra désormais les règles interdites synchronisées dans son contexte mémoire.');
}

main()
  .catch((e) => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
