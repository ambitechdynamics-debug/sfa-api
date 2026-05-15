import { prisma } from './config/database';

async function main() {
  const agents = await prisma.agentDefinition.findMany({ select: { key: true, name: true } });
  console.log("Agent keys:");
  console.log(agents);
}

main().catch(console.error).finally(() => prisma.$disconnect());
