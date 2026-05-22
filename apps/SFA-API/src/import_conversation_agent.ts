import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_CHAT_AGENT_NAME,
  DEFAULT_CHAT_SYSTEM_PROMPT,
} from './modules/chat/chat.service';

const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  // Lire les valeurs actuelles dans AppSetting pour les copier dans l'agent
  // (provider / model) afin que /admin/agents reflète l'état actuel.
  const [providerRow, modelRow, nameRow, promptRow] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'text_ai_provider' } }),
    prisma.appSetting.findUnique({ where: { key: 'openai_model' } }),
    prisma.appSetting.findUnique({ where: { key: 'chat_agent_name' } }),
    prisma.appSetting.findUnique({ where: { key: 'chat_agent_system_prompt' } }),
  ]);

  // Provider : valeur actuelle de l'AppSetting, sinon "auto"
  const provider = providerRow?.value?.trim() || 'auto';
  // Modèle : si openai_model défini, sinon valeur générique
  const model = modelRow?.value?.trim() || 'gpt-4o';
  // Nom : valeur AppSetting si différente, sinon DEFAULT
  const name =
    nameRow?.value?.trim() && nameRow.value.trim() !== ''
      ? nameRow.value.trim()
      : DEFAULT_CHAT_AGENT_NAME;
  // Prompt système : on importe celui codé en dur dans chat.service.ts
  // (sauf si l'admin en a déjà saisi un personnalisé non vide ET différent
  // du legacy ignoré par settingsService.resolve)
  const customPrompt = promptRow?.value?.trim();
  const isLegacyIgnored = customPrompt?.includes('Tu es l’assistant IA de Flyer Studio.');
  const systemPrompt =
    customPrompt && !isLegacyIgnored ? customPrompt : DEFAULT_CHAT_SYSTEM_PROMPT;

  const description =
    'Agent conversationnel du dashboard client. Guide l’utilisateur étape par étape pour créer un flyer (10 questions à choix cliquables).';
  const expectedOutputSchema = {
    type: 'object',
    description:
      'Réponse texte simple. Format imposé par le prompt : validation courte + 1 question + 4-6 [Choix] avec [Autre] en dernier.',
    properties: {
      reply: { type: 'string', description: 'Texte de la réponse de l’agent' },
    },
  };

  const updated = await prisma.agentDefinition.upsert({
    where: { key: 'CONVERSATION_AGENT' },
    update: {
      name,
      description,
      provider,
      model,
      systemPrompt,
      expectedOutputSchema,
      isActive: true,
    },
    create: {
      key: 'CONVERSATION_AGENT',
      name,
      description,
      provider,
      model,
      systemPrompt,
      expectedOutputSchema,
      isActive: true,
    },
  });

  console.log('CONVERSATION_AGENT prêt :');
  console.log({
    id: updated.id,
    key: updated.key,
    name: updated.name,
    provider: updated.provider,
    model: updated.model,
    isActive: updated.isActive,
    systemPromptLen: updated.systemPrompt.length,
    systemPromptPreview: updated.systemPrompt.slice(0, 120) + '…',
  });
}

main()
  .catch(e => { console.error('ERREUR :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
