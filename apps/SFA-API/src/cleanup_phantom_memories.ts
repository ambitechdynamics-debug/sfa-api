import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

// Paires tiret → underscore. On supprime le tiret uniquement si l'agent lié
// possède déjà la version underscore (pas de perte de contexte) OU si la
// MemoryDefinition tiret n'a aucune entry.
const PAIRS: Array<{ dash: string; underscore: string }> = [
  { dash: 'M-SMS',     underscore: 'M_SMS' },
  { dash: 'M-QT1',     underscore: 'M_QT1' },
  { dash: 'M-QT2',     underscore: 'M_QT2' },
  { dash: 'M-MD',      underscore: 'M_MD' },
  { dash: 'M-ID',      underscore: 'M_ID' },
  { dash: 'M-PROMPT1', underscore: 'M_PROMPT1' },
];

async function main() {
  console.log('=== Cleanup MemoryDefinition fantômes (variantes tiret) ===\n');

  for (const { dash, underscore } of PAIRS) {
    const dashDef = await prisma.memoryDefinition.findUnique({
      where: { key: dash },
      include: { _count: { select: { entries: true } } },
    });

    if (!dashDef) {
      console.log(`  - ${dash.padEnd(12)} : absent en DB`);
      continue;
    }

    if (dashDef._count.entries > 0) {
      console.log(`  ! ${dash.padEnd(12)} : ${dashDef._count.entries} MemoryEntry existent → conservé pour ne pas perdre de données`);
      continue;
    }

    const underscoreDef = await prisma.memoryDefinition.findUnique({
      where: { key: underscore },
      select: { id: true },
    });

    // Trouver tous les AgentMemoryLink qui pointent vers la version tiret
    const dashLinks = await prisma.agentMemoryLink.findMany({
      where: { memoryDefinitionId: dashDef.id },
      include: { agent: { select: { key: true, name: true } } },
    });

    if (!underscoreDef && dashLinks.length > 0) {
      console.log(`  ! ${dash.padEnd(12)} : pas d'équivalent ${underscore} en DB — conservé`);
      continue;
    }

    let safeToDeleteDef = true;

    for (const link of dashLinks) {
      // L'agent possède-t-il déjà un lien vers la version underscore ?
      const hasUnderscoreLink = underscoreDef
        ? await prisma.agentMemoryLink.findFirst({
            where: {
              agentDefinitionId: link.agentDefinitionId,
              memoryDefinitionId: underscoreDef.id,
            },
          })
        : null;

      if (hasUnderscoreLink) {
        await prisma.agentMemoryLink.delete({ where: { id: link.id } });
        console.log(`     · supprimé doublon ${link.agent.key} → ${dash} (équivalent ${underscore} déjà présent)`);
      } else if (underscoreDef) {
        // Réassigne le lien vers la version underscore (corrige le bug de config :
        // ces agents lisaient un memory key jamais alimenté en runtime).
        await prisma.agentMemoryLink.update({
          where: { id: link.id },
          data: { memoryDefinitionId: underscoreDef.id },
        });
        console.log(`     → migré ${link.agent.key} : ${dash} → ${underscore} (lien réassigné)`);
      } else {
        console.log(`     ! ${link.agent.key} → ${dash} sans équivalent underscore — conservé`);
        safeToDeleteDef = false;
      }
    }

    if (!safeToDeleteDef) {
      console.log(`  ! ${dash.padEnd(12)} : MemoryDefinition conservée (liens orphelins)`);
      continue;
    }

    await prisma.memoryDefinition.delete({ where: { id: dashDef.id } });
    console.log(`  ✓ ${dash.padEnd(12)} : supprimé (id=${dashDef.id})`);
  }

  const total = await prisma.memoryDefinition.count();
  console.log(`\nTotal MemoryDefinition restantes : ${total}`);
}

main()
  .catch((e) => {
    console.error('ERREUR :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
