import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  const [activeBefore, inactiveBefore] = await Promise.all([
    prisma.agentDefinition.count({ where: { isActive: true } }),
    prisma.agentDefinition.count({ where: { isActive: false } }),
  ]);
  console.log(`Avant : ${inactiveBefore} inactif(s), ${activeBefore} actif(s)`);

  const result = await prisma.agentDefinition.updateMany({
    data: { isActive: true },
  });
  console.log(`updateMany : ${result.count} ligne(s) touchée(s)`);

  const [activeAfter, inactiveAfter] = await Promise.all([
    prisma.agentDefinition.count({ where: { isActive: true } }),
    prisma.agentDefinition.count({ where: { isActive: false } }),
  ]);
  console.log(`Après : ${inactiveAfter} inactif(s), ${activeAfter} actif(s) ${inactiveAfter === 0 ? '✓' : '✗'}`);

  // Rappel : lister les agents dont le prompt est encore TODO
  const todoAgents = await prisma.agentDefinition.findMany({
    where: { systemPrompt: { startsWith: 'TODO' } },
    select: { key: true, name: true },
    orderBy: { key: 'asc' },
  });
  if (todoAgents.length > 0) {
    console.log(`\nPrompts encore TODO (${todoAgents.length}) — à compléter avant utilisation réelle :`);
    for (const a of todoAgents) console.log(`  - ${a.key.padEnd(26)} (${a.name})`);
  } else {
    console.log('\nAucun prompt TODO restant.');
  }
}

main()
  .catch(e => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
