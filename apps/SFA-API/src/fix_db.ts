import { prisma } from './config/database';

async function main() {
  await prisma.appSetting.upsert({
    where: { key: 'gemini_model' },
    update: { value: 'gemini-flash-latest' },
    create: { key: 'gemini_model', value: 'gemini-flash-latest', category: 'providers', isSecret: false, description: 'Modèle Gemini par défaut' }
  });
  console.log("Fixed Gemini model name to gemini-flash-latest");
}

main().catch(console.error).finally(() => prisma.$disconnect());
