import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

// Mémoires orphelines à supprimer (liens existent mais jamais alimentées)
const ORPHAN_KEYS = [
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
  console.log('=== Cleanup liens orphelins + mémoires associées ===\n');

  // ─── Étape 1 : fix bug casse M-Contact → M-CONTACT ─────────────────────
  console.log('--- Étape 1 : migration M-Contact → M-CONTACT ---');
  const mContactLower = await prisma.memoryDefinition.findUnique({
    where: { key: 'M-Contact' },
  });
  const mContactUpper = await prisma.memoryDefinition.findUnique({
    where: { key: 'M-CONTACT' },
  });

  if (!mContactLower) {
    console.log('  - M-Contact déjà absent');
  } else if (!mContactUpper) {
    console.log('  ! M-CONTACT absent en DB → migration impossible, on garde M-Contact');
  } else {
    const lowerLinks = await prisma.agentMemoryLink.findMany({
      where: { memoryDefinitionId: mContactLower.id },
      include: { agent: { select: { key: true } } },
    });
    for (const link of lowerLinks) {
      const exists = await prisma.agentMemoryLink.findFirst({
        where: {
          agentDefinitionId: link.agentDefinitionId,
          memoryDefinitionId: mContactUpper.id,
        },
      });
      if (exists) {
        await prisma.agentMemoryLink.delete({ where: { id: link.id } });
        console.log(`     · doublon supprimé ${link.agent.key} → M-Contact (M-CONTACT déjà lié)`);
      } else {
        await prisma.agentMemoryLink.update({
          where: { id: link.id },
          data: { memoryDefinitionId: mContactUpper.id },
        });
        console.log(`     → migré ${link.agent.key} : M-Contact → M-CONTACT`);
      }
    }
    await prisma.memoryDefinition.delete({ where: { id: mContactLower.id } });
    console.log('  ✓ M-Contact supprimé (variante casse)\n');
  }

  // ─── Étape 2 : pour chaque mémoire orpheline, supprimer ses liens puis la def ──
  console.log('--- Étape 2 : suppression des liens orphelins et mémoires ---');

  for (const key of ORPHAN_KEYS) {
    const def = await prisma.memoryDefinition.findUnique({
      where: { key },
      include: {
        agentLinks: { include: { agent: { select: { key: true } } } },
        _count: { select: { entries: true } },
      },
    });
    if (!def) {
      console.log(`  - ${key.padEnd(15)} : absent`);
      continue;
    }

    if (def._count.entries > 0) {
      console.log(`  ! ${key.padEnd(15)} : ${def._count.entries} entries → conservé pour ne pas perdre de données`);
      continue;
    }

    for (const link of def.agentLinks) {
      const flag = link.isRequired ? '⚠ required=true' : 'optional';
      console.log(`     · supprimé lien ${link.agent.key} → ${key} (${link.usageType}, ${flag})`);
      await prisma.agentMemoryLink.delete({ where: { id: link.id } });
    }

    await prisma.memoryDefinition.delete({ where: { id: def.id } });
    console.log(`  ✓ ${key.padEnd(15)} : supprimé (def + ${def.agentLinks.length} lien(s))`);
  }

  const total = await prisma.memoryDefinition.count();
  const remaining = await prisma.memoryDefinition.findMany({
    select: { key: true, isSystem: true },
    orderBy: [{ isSystem: 'desc' }, { key: 'asc' }],
  });
  console.log(`\n=== Total MemoryDefinition restantes : ${total} ===`);
  for (const m of remaining) {
    console.log(`  [${m.isSystem ? 'SYS ' : 'user'}] ${m.key}`);
  }
}

main()
  .catch((e) => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
