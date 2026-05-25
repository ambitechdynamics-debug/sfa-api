import { MemoryScope, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_AGENT_KEYS = [
  'PLANNER_AGENT',
  'IMAGE_ANALYST_AGENT',
  'TEXT_ANALYST_AGENT',
  'BRAND_AGENT',
  'ARTISTIC_BASE_AGENT',
  'PROMPT_ARCHITECT_AGENT',
  'SAFETY_AGENT',
  'QUALITY_AGENT',
];

async function main() {
  console.log('Seeding memory definitions...');

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

  for (const memory of memoriesToSeed) {
    await prisma.memoryDefinition.upsert({
      where: { key: memory.key },
      update: { name: memory.name, description: memory.description },
      create: {
        key: memory.key,
        name: memory.name,
        description: memory.description,
        scope: MemoryScope.PROJECT,
        schema: {},
        isSystem: memory.isSystem,
      },
    });
  }

  const removed = await prisma.agentDefinition.deleteMany({
    where: { key: { in: DEFAULT_AGENT_KEYS } },
  });

  console.log(`Seed done. Removed ${removed.count} default agent definition(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
