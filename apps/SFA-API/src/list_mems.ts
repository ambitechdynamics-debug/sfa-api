import { prisma } from './config/database';

async function main() {
  const mems = await prisma.memoryDefinition.findMany({ select: { key: true, name: true } });
  console.log("Memories:", mems);
}

main().catch(console.error).finally(() => prisma.$disconnect());
