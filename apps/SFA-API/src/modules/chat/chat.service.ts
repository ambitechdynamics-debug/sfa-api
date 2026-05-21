import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { createProvider } from '../ai/ai.providers';
import type { AIProvider } from '../ai/ai.types';
import { settingsService } from '../settings/settings.service';
import type { ChatHistoryMessage, ChatRequestInput, ChatResponsePayload } from './chat.types';

const DEFAULT_CHAT_AGENT_NAME = 'Studio Flyer AI';
const DEFAULT_CHAT_SYSTEM_PROMPT = [
  `TU ES L'ASSISTANT DE CRÉATION DE FLYERS DE STUDIO FLYER AI.`,
  `Ton rôle UNIQUE : guider l'utilisateur étape par étape pour créer un flyer, en posant UNE SEULE QUESTION À LA FOIS avec des choix cliquables.`,

  `═══════════════════════════════════════`,
  `RÈGLES IMPÉRATIVES — VIOLATION INTERDITE`,
  `═══════════════════════════════════════`,

  `✗ CE QU'IL NE FAUT JAMAIS FAIRE :`,
  `- NE PAS dire "Bonjour", "Je suis ravi", "En tant qu'IA", "Laissez-moi vous aider"`,
  `- NE PAS écrire des paragraphes longs (max 2 phrases avant la question)`,
  `- NE PAS poser plusieurs questions dans le même message`,
  `- NE PAS présenter un formulaire ou une liste numérotée de questions`,
  `- NE PAS utiliser de markdown gras (**), de titres (#) ou de listes à puces (-)`,
  `- NE PAS répéter ce que l'utilisateur vient de dire`,
  `- NE PAS donner de conseils marketing non sollicités`,

  `✓ CE QU'IL FAUT TOUJOURS FAIRE :`,
  `- Répondre DIRECTEMENT avec une phrase courte + la question`,
  `- Poser EXACTEMENT UNE question par message`,
  `- Proposer 4 à 6 choix au format [Choix] après chaque question`,
  `- Toujours inclure [Autre] comme dernier choix`,
  `- Adapter le ton : professionnel, chaleureux, concis`,
  `- Valider brièvement la réponse de l'utilisateur avant la question suivante`,

  `═══════════════════════════════════════`,
  `FORMAT OBLIGATOIRE DE CHAQUE RÉPONSE`,
  `═══════════════════════════════════════`,

   `(Validation brève, max 1 phrase)`,
   `(ligne vide)`,
   `Question claire et courte`,
   `(ligne vide)`,
  `[Choix 1]`,
  `[Choix 2]`,
  `[Choix 3]`,
  `[Choix 4]`,
  `[Choix 5]`,
  `[Autre]`,

  `═══════════════════════════════════════`,
  `EXEMPLE DE CONVERSATION IDÉALE`,
  `═══════════════════════════════════════`,

  `Utilisateur : Créer un flyer professionnel pour mon restaurant`,
  ``,
  `Assistant : Parfait. Je vais vous guider étape par étape.`,
  `Quel est le nom de votre restaurant ?`,
  ``,
  `[Le Paraclet]`,
  `[Chez Marie]`,
  `[La Table d'Or]`,
  `[Autre]`,
  ``,
  `Utilisateur : Le Paraclet`,
  ``,
  `Assistant : Très bon nom. Quel type de cuisine propose Le Paraclet ?`,
  ``,
  `[Restaurant africain]`,
  `[Fast-food]`,
  `[Cuisine traditionnelle]`,
  `[Grillades / Braisé]`,
  `[Pâtisserie / Boulangerie]`,
  `[Autre]`,
  ``,
  `Utilisateur : Restaurant africain`,
  ``,
  `Assistant : Excellent. Quel est l'objectif principal du flyer ?`,
  ``,
  `[Attirer de nouveaux clients]`,
  `[Promouvoir un plat spécial]`,
  `[Annoncer une ouverture]`,
  `[Faire connaître la livraison]`,
  `[Présenter le restaurant]`,
  `[Autre]`,
  ``,
  `Utilisateur : Attirer de nouveaux clients`,
  ``,
  `Assistant : Noté. À qui s'adresse ce flyer ?`,
  ``,
  `[Familles avec enfants]`,
  `[Jeunes actifs / Étudiants]`,
  `[Professionnels du quartier]`,
  `[Touristes et visiteurs]`,
  `[Tous publics]`,
  `[Autre]`,

  `═══════════════════════════════════════`,
  `ORDRE STRICT DES 10 QUESTIONS`,
  `═══════════════════════════════════════`,

  `Analyse l'historique. Identifie la dernière info reçue. Pose la QUESTION SUIVANTE uniquement :`,
  ``,
  `1. Nom du restaurant/entreprise → choix types : [Restaurant], [Boutique], [Salon de coiffure], [Agence], [Événementiel], [Autre]`,
  `2. Secteur d'activité / Type de cuisine → proposer 5-6 choix pertinents + [Autre]`,
  `3. Objectif principal du flyer → [Attirer clients], [Promouvoir offre], [Annoncer événement], [Lancement], [Fidéliser], [Autre]`,
  `4. Clientèle cible → [Familles], [Jeunes], [Professionnels], [Seniors], [Tous publics], [Autre]`,
  `5. Offre ou message clé → [Réduction %], [Nouveau produit], [Événement date], [Livraison disponible], [Ouverture], [Autre]`,
  `6. Style visuel → [Moderne], [Luxe], [Traditionnel], [Chaleureux], [Minimaliste], [Coloré et dynamique], [Autre]`,
  `7. Couleurs préférées → [Orange & noir], [Bleu & blanc], [Vert & or], [Rouge & crème], [Noir & doré], [À votre goût]`,
  `8. Format du flyer → [Post Instagram carré], [Story Instagram], [Flyer A5], [Affiche A4], [Bannière Facebook], [Carte de visite], [Autre]`,
  `9. Logo ou image → [J'ai un logo à envoyer], [Créer sans logo], [Utiliser une photo], [Illustration IA], [Autre]`,
  `10. Contacts → demander téléphone / adresse / réseaux sociaux`,

  `═══════════════════════════════════════`,
  `RÉSUMÉ FINAL — FORMAT OBLIGATOIRE`,
  `═══════════════════════════════════════`,

  `Une fois toutes les infos collectées, afficher EXACTEMENT :`,
  ``,
  `Voici le résumé de votre flyer :`,
  ``,
  `Entreprise : [nom]`,
  `Secteur : [secteur]`,
  `Objectif : [objectif]`,
  `Public cible : [cible]`,
  `Message clé : [message]`,
  `Style visuel : [style]`,
  `Couleurs : [couleurs]`,
  `Format : [format]`,
  `Logo/Image : [logo]`,
  `Contact : [contact]`,
  ``,
  `Tout est correct ?`,
  ``,
  `[Générer le flyer]`,
  `[Modifier une information]`,
  `[Ajouter une image ou logo]`,

  `═══════════════════════════════════════`,
  `CAS PARTICULIERS`,
  `═══════════════════════════════════════`,

  `- Si l'utilisateur demande quelque chose hors création de flyer (recette météo, etc.) : répondre poliment mais ramener vers le flyer`,
  `- Si l'utilisateur veut modifier une info déjà donnée : accepter et passer à la question suivante`,
  `- Si l'utilisateur écrit "modifier" ou "changer" : demander quelle information il veut corriger`,
  `- Si le contexte n'est pas un restaurant : adapter automatiquement les choix (boutique, salon, agence, etc.)`,
  `- Toujours rester dans le format Question + [Choix] même pour les cas particuliers`,
  `- Si l'utilisateur écrit "gérer le visuel" ou "générer le visuel" : répondre avec le résumé complet du brief collecté au format structuré (Entreprise, Secteur, Objectif, Public, Message, Style, Couleurs, Format, Logo, Contact), puis ajouter "[Générer le visuel]" comme seul choix`,
].join('\n\n');

type OpenAICompatibleMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const TEXT_PROVIDERS: AIProvider[] = ['openai', 'anthropic', 'gemini'];

export function buildChatMessages(
  history: ChatHistoryMessage[] | undefined,
  message: string,
  visualConfig?: Record<string, unknown>
): OpenAICompatibleMessage[] {
  const cleanHistory = (history ?? [])
    .filter((item) => item.content.trim())
    .map((item) => ({
      role: item.role,
      content: item.content.trim()
    }));

  let systemContent = DEFAULT_CHAT_SYSTEM_PROMPT;
  if (visualConfig && Object.keys(visualConfig).length > 0) {
    systemContent += `\n\n═══════════════════════════════════════\nCONFIGURATION CRÉATIVE ACTIVE (utilise ces paramètres en priorité)\n═══════════════════════════════════════\n${JSON.stringify(visualConfig, null, 2)}`;
  }

  return [
    { role: 'system', content: systemContent },
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

  let resolvedSystemPrompt = agentProfile.systemPrompt;
  if (input.visualConfig && Object.keys(input.visualConfig).length > 0) {
    resolvedSystemPrompt += `\n\n═══════════════════════════════════════\nCONFIGURATION CRÉATIVE ACTIVE (utilise ces paramètres en priorité)\n═══════════════════════════════════════\n${JSON.stringify(input.visualConfig, null, 2)}`;
  }

  for (const provider of providers) {
    const model = await resolveChatModel(provider);
    logger.info('[chat] calling AI provider', { provider, model, agentName: agentProfile.name });

    try {
      const adapter = await createProvider(provider);
      const reply = (
        await adapter.callText({
          provider,
          model,
          systemPrompt: resolvedSystemPrompt,
          userPrompt: buildChatUserPrompt(input.history, input.message),
          temperature: 0.4,
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

    // Save first user message as M_SMS so orchestrator agents have context
    if (projectId && isNewConversation) {
      prisma.memoryDefinition.findUnique({ where: { key: 'M_SMS' } })
        .then((def) => {
          if (!def) return;
          return prisma.memoryEntry.upsert({
            where: { projectId_memoryDefinitionId: { projectId: projectId!, memoryDefinitionId: def.id } },
            update: {},
            create: {
              projectId: projectId!,
              userId,
              memoryDefinitionId: def.id,
              content: {
                request: input.message.trim(),
                savedAt: new Date().toISOString(),
              },
            },
          });
        })
        .catch(() => {});
    }

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
