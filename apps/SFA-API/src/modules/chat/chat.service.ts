import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { createProvider } from '../ai/ai.providers';
import type { AIProvider } from '../ai/ai.types';
import { settingsService } from '../settings/settings.service';
import type { ChatHistoryMessage, ChatRequestInput, ChatResponsePayload } from './chat.types';

const DEFAULT_CHAT_AGENT_NAME = 'Studio Flyer AI';
const DEFAULT_CHAT_SYSTEM_PROMPT =
  "Tu es l’assistant IA de Flyer Studio. Ton rôle est d’aider l’utilisateur à créer des flyers, affiches, posters, visuels publicitaires, publications réseaux sociaux et supports de communication professionnels. Tu dois poser des questions utiles si le brief est incomplet, proposer des idées de contenu, structurer les textes, conseiller le style visuel, les couleurs, la composition et préparer un prompt exploitable pour générer le visuel.";

type OpenAICompatibleMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const TEXT_PROVIDERS: AIProvider[] = ['openai', 'anthropic', 'gemini', 'mock'];

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

function createMockReply(message: string) {
  if (/restaurant/i.test(message)) {
    return "Très bien. Pour créer un flyer professionnel pour votre restaurant, j’ai besoin de quelques informations : nom du restaurant, type de cuisine, offre à mettre en avant, adresse, contacts, couleurs souhaitées et format du flyer.";
  }

  return [
    "Je peux vous aider à structurer ce visuel.",
    `Pour votre demande : "${message.trim()}", précisez idéalement le format, le public cible, le texte principal, les couleurs ou l'ambiance souhaitée.`,
    "Ensuite je peux transformer ces informations en brief clair pour affiche, flyer, poster ou contenu social."
  ].join('\n\n');
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
  if (configuredProvider) return configuredProvider;

  if (await hasConfiguredProviderKey('openai')) return 'openai';
  if (await hasConfiguredProviderKey('anthropic')) return 'anthropic';
  if (await hasConfiguredProviderKey('gemini')) return 'gemini';

  const envProvider = normalizeProvider(env.AI_DEFAULT_TEXT_PROVIDER);
  if (envProvider) return envProvider;

  return 'mock';
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
  const provider = await resolveChatProvider();
  if (provider === 'mock') {
    logger.warn('[chat] text AI provider resolved to mock');
    return createMockReply(input.message);
  }

  const model = await resolveChatModel(provider);
  const agentProfile = await resolveChatAgentProfile();
  logger.info('[chat] calling AI provider', { provider, model, agentName: agentProfile.name });

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
        data: { updatedAt: new Date() }
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
