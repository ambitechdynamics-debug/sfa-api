import { PrismaClient } from '@prisma/client';

// Plain PrismaClient — bypass le middleware de retry qui interfère avec les transactions.
const prisma = new PrismaClient({ log: ['error'] });

// ---------- Plan validé par l'utilisateur ----------
// 1) Doublon ARTISTIC_BASE_AGENT : garder l'ID récent, fusionner les memoryLinks de l'ancien.
// 2) Supprimer les 5 hors-liste.
// 3) Créer 8 stubs (isActive=false) pour les agents officiels manquants.
// ----------------------------------------------------

const KEEP_ABA = 'cmpep35qd0013v8co3atytyhf';
const DROP_ABA = 'cmoxol4gd001dv85gkofa7pmd';

const OFFLIST_KEYS_TO_DELETE = [
  'Contact-Agent',
  'Colors-Agent',
  'Composition-Agent',
  'Variant-Agent',
  'Retouch-Agent',
];

const MISSING_STUBS = [
  { key: 'QUESTIONNAIRE_AGENT', name: 'Questionnaire Agent' },
  { key: 'MEMORY_AGENT', name: 'Memory Agent' },
  { key: 'PROJECT_CONTEXT_AGENT', name: 'Project Context Agent' },
  { key: 'REVISION_AGENT', name: 'Revision Agent' },
  { key: 'VARIATION_AGENT', name: 'Variation Agent' },
  { key: 'SAFETY_AGENT', name: 'Safety Agent' },
  { key: 'FILE_MANAGER_AGENT', name: 'File Manager Agent' },
  { key: 'CONVERSATION_AGENT', name: 'Conversation Agent' },
];

async function main() {
  console.log('=== Sanity checks ===');
  const namesToCheck = [
    'Artistic-Base-Agent', 'Artistic Base Agent',
    ...OFFLIST_KEYS_TO_DELETE,
    'Contact Agent', 'Colors Agent', 'Composition Agent', 'Variant Agent', 'Retouch Agent',
  ];
  const runs = await prisma.agentRun.findMany({
    where: { agentName: { in: namesToCheck } },
    select: { id: true, agentName: true },
  });
  if (runs.length > 0) {
    console.error('STOP — AgentRun référencent encore des agents à supprimer :', runs);
    process.exit(1);
  }
  console.log('OK — aucun AgentRun bloquant.\n');

  // ============================================================
  // Étape 1 : fusion ARTISTIC_BASE_AGENT
  // ============================================================
  console.log('=== Étape 1 : fusion ARTISTIC_BASE_AGENT ===');
  await prisma.$transaction(async tx => {
    const keepLinks = await tx.agentMemoryLink.findMany({
      where: { agentDefinitionId: KEEP_ABA },
      select: { memoryDefinitionId: true },
    });
    const keepMemIds = keepLinks.map(l => l.memoryDefinitionId);
    console.log(`Agent gardé (${KEEP_ABA}) : ${keepMemIds.length} liens existants.`);

    const oldLinksToCount = await tx.agentMemoryLink.count({
      where: { agentDefinitionId: DROP_ABA },
    });
    console.log(`Agent supprimé (${DROP_ABA}) : ${oldLinksToCount} liens.`);

    // Transfert en une seule requête : tous les liens de l'ancien dont
    // le memoryDefinitionId N'EST PAS déjà sur le nouveau.
    const transferred = await tx.agentMemoryLink.updateMany({
      where: {
        agentDefinitionId: DROP_ABA,
        memoryDefinitionId: { notIn: keepMemIds.length > 0 ? keepMemIds : [''] },
      },
      data: { agentDefinitionId: KEEP_ABA },
    });
    console.log(`Liens transférés : ${transferred.count}`);

    // Cascade supprime les liens restants (doublons) de l'ancien agent.
    await tx.agentDefinition.delete({ where: { id: DROP_ABA } });
    console.log(`Supprimé : ancien agent id=${DROP_ABA}\n`);
  }, { timeout: 30000 });

  // ============================================================
  // Étape 2 : suppression des 5 hors-liste
  // ============================================================
  console.log('=== Étape 2 : suppression des agents hors-liste ===');
  for (const key of OFFLIST_KEYS_TO_DELETE) {
    const agent = await prisma.agentDefinition.findUnique({ where: { key } });
    if (!agent) { console.log(`Introuvable : ${key}`); continue; }
    const memCount = await prisma.agentMemoryLink.count({
      where: { agentDefinitionId: agent.id },
    });
    await prisma.agentDefinition.delete({ where: { id: agent.id } });
    console.log(`Supprimé : ${key} (id=${agent.id}, ${memCount} liens cascade-supprimés)`);
  }

  // ============================================================
  // Étape 3 : création des stubs manquants
  // ============================================================
  console.log('\n=== Étape 3 : création des stubs officiels manquants ===');
  for (const stub of MISSING_STUBS) {
    const existing = await prisma.agentDefinition.findUnique({ where: { key: stub.key } });
    if (existing) { console.log(`Existe déjà : ${stub.key} — saut.`); continue; }
    const created = await prisma.agentDefinition.create({
      data: {
        key: stub.key,
        name: stub.name,
        description: 'STUB — à compléter',
        provider: 'mock',
        model: 'mock',
        systemPrompt: 'TODO — à compléter pour ' + stub.key,
        expectedOutputSchema: {},
        isActive: false,
      },
    });
    console.log(`Créé : ${stub.key} (id=${created.id}, isActive=false)`);
  }

  // ============================================================
  // Récapitulatif final
  // ============================================================
  console.log('\n=== Récapitulatif final ===');
  const finalAgents = await prisma.agentDefinition.findMany({
    select: { id: true, key: true, name: true, isActive: true },
    orderBy: { key: 'asc' },
  });
  console.log(`Total agents en base : ${finalAgents.length}`);
  for (const a of finalAgents) {
    console.log(`  ${a.isActive ? '[OK]   ' : '[STUB] '} ${a.key.padEnd(28)} -- ${a.name}`);
  }
}

main()
  .catch(e => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
