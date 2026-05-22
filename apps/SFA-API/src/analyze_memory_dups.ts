import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

const PAIRS = [
  ['M_SMS', 'M-SMS'],
  ['M_QT1', 'M-QT1'],
  ['M_QT2', 'M-QT2'],
  ['M_MD', 'M-MD'],
  ['M_BA', 'M-BA'],
  ['M_ID', 'M-ID'],
  ['M_PROMPT1', 'M-PROMPT1'],
];

async function main() {
  for (const [sys, user] of PAIRS) {
    const sysDef = await prisma.memoryDefinition.findUnique({ where: { key: sys } });
    const userDef = await prisma.memoryDefinition.findUnique({ where: { key: user } });

    console.log(`\n=== Paire ${sys}  vs  ${user} ===`);
    for (const [label, def] of [['SYS ', sysDef], ['USER', userDef]] as const) {
      if (!def) { console.log(`  ${label} : ABSENT`); continue; }
      const [entries, links] = await Promise.all([
        prisma.memoryEntry.count({ where: { memoryDefinitionId: def.id } }),
        prisma.agentMemoryLink.findMany({
          where: { memoryDefinitionId: def.id },
          include: { agent: { select: { key: true, name: true } } },
        }),
      ]);
      console.log(`  ${label} : key=${def.key} scope=${def.scope} isSystem=${def.isSystem} isActive=${def.isActive}`);
      console.log(`         name="${def.name}"`);
      console.log(`         entries=${entries}  agentLinks=${links.length}`);
      if (links.length) {
        for (const l of links) console.log(`           -> agent ${l.agent.key} (${l.usageType}, required=${l.isRequired})`);
      }
    }
  }

  // M-Contact (lower) vs M-CONTACT (upper) — case mismatch
  console.log(`\n=== Cas particulier : M-Contact vs M-CONTACT (dashboard envoie M-CONTACT) ===`);
  const allKeysLike = await prisma.memoryDefinition.findMany({
    where: { key: { contains: 'ontact', mode: 'insensitive' } },
    select: { id: true, key: true, name: true, scope: true, isSystem: true },
  });
  for (const k of allKeysLike) {
    const entries = await prisma.memoryEntry.count({ where: { memoryDefinitionId: k.id } });
    const links = await prisma.agentMemoryLink.count({ where: { memoryDefinitionId: k.id } });
    console.log(`  ${k.key.padEnd(12)} scope=${k.scope} sys=${k.isSystem} entries=${entries} agentLinks=${links} (id=${k.id})`);
  }
}

main()
  .catch(e => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
