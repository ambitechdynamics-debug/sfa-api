import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

const KEPT = [
  'M-Contact',
  'M-CLIENT',
  'M-COLOR',
  'M-COMPOSITION',
  'M-EXPORT',
  'M-FORMAT',
  'M-QUALITE',
  'M-STYLE',
  'M-VARIANTES',
];

async function main() {
  console.log('=== Liens AgentMemoryLink → MemoryDefinition jamais alimentées ===\n');
  console.log('Format : MEMORY ← AGENT (usageType, required)\n');

  for (const key of KEPT) {
    const def = await prisma.memoryDefinition.findUnique({
      where: { key },
      include: {
        agentLinks: {
          include: { agent: { select: { key: true, name: true } } },
        },
        _count: { select: { entries: true } },
      },
    });
    if (!def) continue;

    console.log(`${key.padEnd(15)} (${def._count.entries} entries, ${def.agentLinks.length} liens):`);
    for (const l of def.agentLinks) {
      console.log(`  - ${l.agent.key.padEnd(28)} (${l.usageType}, required=${l.isRequired})`);
    }
    console.log();
  }
}

main()
  .catch((e) => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
