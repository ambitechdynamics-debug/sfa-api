import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_CHAT_AGENT_NAME,
  DEFAULT_CHAT_SYSTEM_PROMPT,
} from './modules/chat/chat.service';

const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  // Écrit le prompt système hardcodé dans AppSetting.chat_agent_system_prompt
  // pour qu'il s'affiche dans /admin/agents > "Prompt système envoyé au modèle".
  // Écrit aussi chat_agent_name pour cohérence.

  const promptBefore = await prisma.appSetting.findUnique({
    where: { key: 'chat_agent_system_prompt' },
  });
  console.log('Avant :');
  console.log('  chat_agent_system_prompt =', promptBefore?.value?.slice(0, 120) + '…');

  const promptRow = await prisma.appSetting.upsert({
    where: { key: 'chat_agent_system_prompt' },
    update: { value: DEFAULT_CHAT_SYSTEM_PROMPT },
    create: {
      key: 'chat_agent_system_prompt',
      value: DEFAULT_CHAT_SYSTEM_PROMPT,
      category: 'providers',
      isSecret: false,
      description:
        'Prompt système de l’agent conversationnel du dashboard client',
    },
  });

  const nameRow = await prisma.appSetting.upsert({
    where: { key: 'chat_agent_name' },
    update: {}, // n'écrase pas si déjà fixé
    create: {
      key: 'chat_agent_name',
      value: DEFAULT_CHAT_AGENT_NAME,
      category: 'providers',
      isSecret: false,
      description:
        'Nom affiché de l’agent conversationnel du dashboard client',
    },
  });

  console.log('\nAprès :');
  console.log(`  chat_agent_name = "${nameRow.value}"`);
  console.log(`  chat_agent_system_prompt = ${promptRow.value.length} caractères`);
  console.log(`  preview = ${promptRow.value.slice(0, 120)}…`);
}

main()
  .catch(e => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
