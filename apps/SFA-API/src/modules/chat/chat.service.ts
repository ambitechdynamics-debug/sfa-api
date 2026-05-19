import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { createProvider } from '../ai/ai.providers';
import type { AIProvider } from '../ai/ai.types';
import { settingsService } from '../settings/settings.service';
import type { ChatHistoryMessage, ChatRequestInput, ChatResponsePayload } from './chat.types';

const DEFAULT_CHAT_AGENT_NAME = 'Studio Flyer AI';
const DEFAULT_CHAT_SYSTEM_PROMPT =
  "Tu es l'assistant de chat interactif et intelligent de Studio Flyer AI. Ton but unique est d'aider l'utilisateur à concevoir son flyer étape par étape à travers une conversation fluide.\n\n" +
  "RÈGLES D'OR DE COMPORTEMENT :\n" +
  "1. Pose UNE SEULE question à la fois. Simple, claire et directe.\n" +
  "2. Ne fais JAMAIS d'introductions longues, de salutations excessives ou de bavardage inutile (Pas de \"Bonjour, je suis l'IA de...\", réponds directement).\n" +
  "3. Ne présente jamais toutes les questions en même temps. Attends la réponse de l'utilisateur pour chaque étape. Le client peut soit cliquer sur une option proposée, soit saisir sa réponse directement par texte.\n" +
  "4. Pour chaque question (si approprié), propose systématiquement des choix rapides au format :\n" +
  "[Choix 1]\n" +
  "[Choix 2]\n" +
  "[Choix 3]\n" +
  "[Autre / Personnaliser]\n" +
  "Chaque choix doit être court, entre crochets et sur sa propre ligne.\n\n" +
  "ORDRE STRICT DES QUESTIONS À POSER :\n" +
  "Détermine dans l'historique de la conversation quelles informations ont déjà été fournies et pose l'unique question suivante dans cet ordre :\n" +
  "1. Nom du restaurant (ou de l'entreprise/projet)\n" +
  "2. Type de cuisine (ou secteur d'activité) - propose des choix de types de cuisine populaires + option Autre\n" +
  "3. Objectif principal du flyer (ex: Attirer des clients, Promouvoir un plat, Annoncer une ouverture)\n" +
  "4. Clientèle cible (ex: Familles, Étudiants, Professionnels, Végétariens)\n" +
  "5. Offre ou message principal (ex: -10% sur tout le menu, Un plat acheté = un offert)\n" +
  "6. Style visuel souhaité (ex: Moderne, Chaleureux, Luxe, Minimaliste, Coloré et dynamique)\n" +
  "7. Couleurs préférées (ex: Orange, noir et blanc / Vert et crème)\n" +
  "8. Format du flyer (ex: Post Instagram carré, Story Instagram, Flyer A5, Affiche A4)\n" +
  "9. Logo ou image à utiliser (ex: Uploader mon logo, Utiliser des illustrations IA, Sans logo)\n" +
  "10. Adresse, horaires et contacts (ex: Téléphone, Instagram, Adresse physique)\n\n" +
  "RÉSUMÉ FINAL ET VALIDATION :\n" +
  "Dès que les 10 informations sont collectées (ou s'il y a suffisamment d'éléments pour conclure), affiche le résumé EXACT sous cette forme structurée :\n\n" +
  "Voici le résumé de votre flyer :\n\n" +
  "Restaurant : [Nom]\n" +
  "Cuisine : [Type de cuisine]\n" +
  "Objectif : [Objectif]\n" +
  "Style : [Style]\n" +
  "Format : [Format]\n" +
  "Couleurs : [Couleurs]\n" +
  "Contact : [Contact]\n\n" +
  "Voulez-vous générer le flyer maintenant ?\n\n" +
  "[Générer le flyer]\n" +
  "[Modifier les informations]\n" +
  "[Ajouter une image]\n\n" +
  "Reste professionnel, concis et fluide. Adapte-toi s'il s'agit d'un autre type d'entreprise qu'un restaurant.";

type OpenAICompatibleMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const TEXT_PROVIDERS: AIProvider[] = ['openai', 'anthropic', 'gemini'];

export function buildChatMessages(history: ChatHistoryMessage[] | undefined, message: string): OpenAICompatibleMessage[] {
  const cleanHistory = (history ?? [])
    .filter((item) => item.content.trim())
    .map((item) => ({
      role: item.role,
      content: item.content.trim()
    }));

  return [
    { role: 'system', content: DEFAULT_CHAT_SYSTEM_PROMPT },
    ...cleanHistory,
    { role: 'user', content: message.trim() }
  ];
}



function normalizeProvider(value: string | null | undefined): AIProvider | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  return TEXT_PROVIDERS.includes(normalized as AIProvider) ? (normalized as AIProvider) : null;
}

async function resolveProviderFromSettings(): Promise<AIProvider | null> {
  const providerKeys = ['text_ai_provider', 'ai_text_provider', 'default_text_provider'];

  for (const key of providerKeys) {
    const provider = normalizeProvider(await settingsService.getRaw(key));
    if (provider) return provider;
  }

  return null;
}

async function hasConfiguredProviderKey(provider: Exclude<AIProvider, 'mock'>): Promise<boolean> {
  const keyByProvider: Record<Exclude<AIProvider, 'mock'>, string> = {
    openai: 'openai_api_key',
    anthropic: 'anthropic_api_key',
    gemini: 'gemini_api_key'
  };

  const envByProvider: Record<Exclude<AIProvider, 'mock'>, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    gemini: 'GEMINI_API_KEY'
  };

  return Boolean(await settingsService.resolve(keyByProvider[provider], envByProvider[provider]));
}

async function resolveChatProvider(): Promise<AIProvider> {
  const configuredProvider = await resolveProviderFromSettings();
  if (configuredProvider && configuredProvider !== 'mock') return configuredProvider;

  if (await hasConfiguredProviderKey('openai')) return 'openai';
  if (await hasConfiguredProviderKey('anthropic')) return 'anthropic';
  if (await hasConfiguredProviderKey('gemini')) return 'gemini';

  const envProvider = normalizeProvider(env.AI_DEFAULT_TEXT_PROVIDER);
  if (envProvider && envProvider !== 'mock') return envProvider;

  throw new Error("Aucun fournisseur d'IA configuré. Veuillez ajouter une clé API dans les paramètres.");
}

async function resolveChatModel(provider: AIProvider): Promise<string> {
  switch (provider) {
    case 'openai':
      return (
        (await settingsService.resolve('openai_model', 'AI_MODEL')) ??
        (await settingsService.resolve('default_model', 'AI_DEFAULT_TEXT_MODEL')) ??
        'gpt-4o'
      );
    case 'anthropic':
      return (
        (await settingsService.resolve('anthropic_model', 'AI_MODEL')) ??
        (await settingsService.resolve('default_model', 'AI_DEFAULT_TEXT_MODEL')) ??
        'claude-3-5-sonnet-20241022'
      );
    case 'gemini':
      return (
        (await settingsService.resolve('gemini_model', 'AI_MODEL')) ??
        (await settingsService.resolve('default_model', 'AI_DEFAULT_TEXT_MODEL')) ??
        'gemini-1.5-pro'
      );
    case 'mock':
    default:
      return 'mock-text';
  }
}

async function resolveFallbackProviders(primary: AIProvider): Promise<AIProvider[]> {
  const providers: AIProvider[] = [primary];

  for (const provider of ['openai', 'anthropic', 'gemini'] as const) {
    if (provider !== primary && await hasConfiguredProviderKey(provider)) {
      providers.push(provider);
    }
  }

  return providers;
}

async function resolveChatAgentProfile() {
  const name = (await settingsService.resolve('chat_agent_name')) ?? DEFAULT_CHAT_AGENT_NAME;
  const systemPrompt = (await settingsService.resolve('chat_agent_system_prompt')) ?? DEFAULT_CHAT_SYSTEM_PROMPT;

  return {
    name,
    systemPrompt: [
      systemPrompt.trim(),
      '',
      `Nom de l'agent conversationnel : ${name.trim() || DEFAULT_CHAT_AGENT_NAME}.`
    ].join('\n')
  };
}

function buildChatUserPrompt(history: ChatHistoryMessage[] | undefined, message: string) {
  const cleanHistory = (history ?? [])
    .filter((item) => item.content.trim())
    .slice(-20)
    .map((item) => {
      const label = item.role === 'assistant' ? 'Assistant' : 'Utilisateur';
      return `${label}: ${item.content.trim()}`;
    });

  if (cleanHistory.length === 0) return message.trim();

  return [
    'Historique récent de la conversation :',
    cleanHistory.join('\n\n'),
    '',
    'Nouveau message utilisateur :',
    message.trim()
  ].join('\n');
}

async function callChatProvider(input: ChatRequestInput): Promise<string> {
  const primaryProvider = await resolveChatProvider();
  const agentProfile = await resolveChatAgentProfile();
  const providers = await resolveFallbackProviders(primaryProvider);
  let lastError: unknown;

  for (const provider of providers) {
    const model = await resolveChatModel(provider);
    logger.info('[chat] calling AI provider', { provider, model, agentName: agentProfile.name });

    try {
      const adapter = await createProvider(provider);
      const reply = (
        await adapter.callText({
          provider,
          model,
          systemPrompt: agentProfile.systemPrompt,
          userPrompt: buildChatUserPrompt(input.history, input.message),
          temperature: 0.7,
          responseFormat: 'text'
        })
      ).trim();

      if (!reply) throw new Error('AI provider returned an empty reply');
      return reply;
    } catch (error) {
      lastError = error;
      logger.error('[chat] AI provider failed; trying fallback', {
        provider,
        model,
        error: error instanceof Error ? error.message : error
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI provider returned an empty reply');
}

export const chatService = {
  async sendMessage(input: ChatRequestInput, userId: string): Promise<ChatResponsePayload> {
    let conversationId = input.conversationId;
    let isNewConversation = false;
    let title = 'Nouvelle conversation';
    let projectId = input.projectId;

    if (!conversationId) {
      isNewConversation = true;
      title = input.message.trim().split('\n')[0].slice(0, 50);
      if (title.length === 50) title += '...';
    } else {
      const existingConv = await prisma.conversation.findFirst({
        where: { id: conversationId, userId }
      });

      if (!existingConv) {
        throw new Error('Conversation not found or unauthorized');
      }
      projectId = existingConv.projectId ?? projectId;
    }

    logger.info('[chat] message received', {
      conversationId,
      historyLength: input.history?.length ?? 0,
      messageLength: input.message.length
    });

    const reply = await callChatProvider(input);

    logger.info('[chat] reply generated', {
      conversationId,
      replyLength: reply.length
    });

    const persistedConversationId = await prisma.$transaction(async (tx) => {
      let currentConversationId = conversationId;

      if (!currentConversationId) {
        const newConversation = await tx.conversation.create({
          data: {
            userId,
            title,
            projectId: projectId || null
          }
        });
        currentConversationId = newConversation.id;
      }

      await tx.message.createMany({
        data: [
          {
            conversationId: currentConversationId,
            role: 'USER',
            content: input.message.trim()
          },
          {
            conversationId: currentConversationId,
            role: 'ASSISTANT',
            content: reply
          }
        ]
      });

      await tx.conversation.update({
        where: { id: currentConversationId },
        data: { updatedAt: new Date(), lastMessageAt: new Date() }
      });

      return currentConversationId;
    });

    return {
      success: true,
      reply,
      message: {
        role: 'assistant',
        content: reply
      },
      conversationId: persistedConversationId,
      projectId,
      title: isNewConversation ? title : undefined
    };
  }
};
