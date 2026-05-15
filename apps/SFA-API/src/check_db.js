const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.appSetting.findMany();
  console.log(settings.filter(s => s.key.includes('api_key') || s.key.includes('provider')));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
