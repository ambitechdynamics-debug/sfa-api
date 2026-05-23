import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const NEW_TIMEOUT = '120000'; // 2 min — laisse de la marge pour prompts créatifs lourds

  const before = await prisma.appSetting.findUnique({ where: { key: 'timeout_ms' } });
  console.log(`Before: timeout_ms = ${before?.value ?? '<unset>'}`);

  await prisma.appSetting.upsert({
    where: { key: 'timeout_ms' },
    update: { value: NEW_TIMEOUT },
    create: { key: 'timeout_ms', value: NEW_TIMEOUT, category: 'ia', isSecret: false, description: 'Timeout requête IA (ms)' },
  });

  const after = await prisma.appSetting.findUnique({ where: { key: 'timeout_ms' } });
  console.log(`After:  timeout_ms = ${after?.value}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
