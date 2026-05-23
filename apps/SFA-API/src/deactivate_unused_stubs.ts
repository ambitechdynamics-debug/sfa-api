import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

// SAFETY_AGENT reste actif : il est invoqué par l'orchestrateur (Phase 1).
// Les 5 autres ne sont câblés à aucun code path → isActive=false pour éviter
// qu'un appel via /api/agents-dynamic ne renvoie du mock silencieux.
const UNUSED_STUBS = [
  'FILE_MANAGER_AGENT',
  'MEMORY_AGENT',
  'PROJECT_CONTEXT_AGENT',
  'REVISION_AGENT',
  'VARIATION_AGENT',
];

async function main() {
  console.log('=== Désactivation des stubs non câblés ===\n');
  console.log('(SAFETY_AGENT reste actif — invoqué par l\'orchestrateur)\n');

  for (const key of UNUSED_STUBS) {
    const agent = await prisma.agentDefinition.findUnique({ where: { key } });
    if (!agent) {
      console.log(`  - ${key.padEnd(26)} : absent`);
      continue;
    }
    if (!agent.isActive) {
      console.log(`  · ${key.padEnd(26)} : déjà inactif`);
      continue;
    }
    await prisma.agentDefinition.update({
      where: { id: agent.id },
      data: { isActive: false },
    });
    console.log(`  ✓ ${key.padEnd(26)} : isActive=false`);
  }

  const all = await prisma.agentDefinition.findMany({
    select: { key: true, isActive: true },
    orderBy: { key: 'asc' },
  });
  console.log(`\nÉtat final (${all.length} agents) :`);
  for (const a of all) {
    console.log(`  ${a.isActive ? '[ON ]' : '[off]'} ${a.key}`);
  }
}

main()
  .catch((e) => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
