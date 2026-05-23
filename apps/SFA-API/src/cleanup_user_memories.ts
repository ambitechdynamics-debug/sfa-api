import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

// Candidats à supprimer (d'après AUDIT.md §3 — aucune lecture/écriture détectée
// dans le code backend ni client). Quelques cas spéciaux :
//   - M-CONTACT : ÉCRIT par le client (dashboard/create/page.tsx:75) → on garde
//   - M-Contact : variante casse — fusion vers M-CONTACT puis suppression
//   - M-CREATIVE-BRIEF, M-ASSETS, M-INTERDITS : usages prouvés → on garde
//
// Pour les autres, on vérifie : (1) zéro MemoryEntry, (2) zéro AgentMemoryLink.
// Si les deux conditions sont vraies → suppression. Sinon → rapport.

const CANDIDATES = [
  'M-CLIENT',
  'M-COLOR',
  'M-COMPOSITION',
  'M-EXPORT',
  'M-FORMAT',
  'M-HISTORIQUE',
  'M-PRINT',
  'M-QUALITE',
  'M-RESEAUX',
  'M-RETOUCHE',
  'M-STYLE',
  'M-TEXTE',
  'M-VARIANTES',
];

async function main() {
  console.log('=== Audit + cleanup MemoryDefinition utilisateur ===\n');

  // ─── Cas spécial : M-Contact (casse) → M-CONTACT ─────────────────────────
  const mContactLower = await prisma.memoryDefinition.findUnique({
    where: { key: 'M-Contact' },
    include: { _count: { select: { entries: true, agentLinks: true } } },
  });
  if (mContactLower) {
    if (mContactLower._count.entries > 0 || mContactLower._count.agentLinks > 0) {
      console.log(`  ! M-Contact   : ${mContactLower._count.entries} entries / ${mContactLower._count.agentLinks} liens — conservé pour migration manuelle`);
    } else {
      await prisma.memoryDefinition.delete({ where: { id: mContactLower.id } });
      console.log(`  ✓ M-Contact   : supprimé (duplicate casse de M-CONTACT, 0 entry/lien)`);
    }
  } else {
    console.log(`  - M-Contact   : absent`);
  }

  // ─── Cleanup des candidats sans usage ─────────────────────────────────────
  let kept = 0;
  let deleted = 0;

  for (const key of CANDIDATES) {
    const def = await prisma.memoryDefinition.findUnique({
      where: { key },
      include: { _count: { select: { entries: true, agentLinks: true } } },
    });

    if (!def) {
      console.log(`  - ${key.padEnd(15)} : absent`);
      continue;
    }

    const { entries, agentLinks } = def._count;
    if (entries > 0 || agentLinks > 0) {
      console.log(`  ! ${key.padEnd(15)} : ${entries} entries / ${agentLinks} liens — conservé`);
      kept++;
      continue;
    }

    await prisma.memoryDefinition.delete({ where: { id: def.id } });
    console.log(`  ✓ ${key.padEnd(15)} : supprimé (0 entry, 0 lien)`);
    deleted++;
  }

  const total = await prisma.memoryDefinition.count();
  console.log(`\nRécap : ${deleted} supprimées, ${kept} conservées (entries ou liens présents)`);
  console.log(`Total MemoryDefinition restantes : ${total}`);
}

main()
  .catch((e) => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
