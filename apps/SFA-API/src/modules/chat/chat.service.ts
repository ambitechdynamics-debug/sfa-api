import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { createProvider } from '../ai/ai.providers';
import type { AIProvider } from '../ai/ai.types';
import { replaceObsoleteModel, settingsService } from '../settings/settings.service';
import { chatAgentConfigService } from './chatAgentConfig.service';
import type {
  ChatHistoryMessage,
  ChatOpeningInput,
  ChatOpeningPayload,
  ChatRequestInput,
  ChatResponsePayload,
} from './chat.types';

export const DEFAULT_CHAT_AGENT_NAME = 'Studio Flyer AI';

type OpenAICompatibleMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const BUILT_IN_TEXT_PROVIDERS: ReadonlySet<string> = new Set(['openai', 'anthropic', 'gemini', 'mock']);

/**
 * Vérifie qu'un slug correspond à un provider custom existant et actif en DB.
 * Convention : un provider custom est défini par la présence de `custom_${slug}_name`.
 */
async function isActiveCustomProvider(slug: string): Promise<boolean> {
  const [name, isActive] = await Promise.all([
    settingsService.getRaw(`custom_${slug}_name`),
    settingsService.getRaw(`custom_${slug}_is_active`),
  ]);
  if (!name || !name.trim()) return false;
  return isActive === 'true';
}

export function buildChatMessages(
  history: ChatHistoryMessage[] | undefined,
  message: string,
  systemPrompt: string,
  visualConfig?: Record<string, unknown>
): OpenAICompatibleMessage[] {
  const cleanHistory = (history ?? [])
    .filter((item) => item.content.trim())
    .map((item) => ({
      role: item.role,
      content: item.content.trim()
    }));

  const cleanSystemPrompt = systemPrompt.trim();
  if (!cleanSystemPrompt) {
    throw new Error('chat_agent_system_prompt is required to build chat messages.');
  }

  let systemContent = cleanSystemPrompt;
  if (visualConfig && Object.keys(visualConfig).length > 0) {
    systemContent += `\n\n═══════════════════════════════════════\nCONFIGURATION CRÉATIVE ACTIVE (utilise ces paramètres en priorité)\n═══════════════════════════════════════\n${JSON.stringify(visualConfig, null, 2)}`;
  }

  return [
    { role: 'system', content: systemContent },
    ...cleanHistory,
    { role: 'user', content: message.trim() }
  ];
}



/**
 * Strict mode : le provider conversationnel vient UNIQUEMENT de l'AppSetting
 * `text_ai_provider` (configuré dans /admin/settings). La valeur peut être :
 *   - un built-in : openai | anthropic | gemini | mock
 *   - le slug d'un provider custom actif (cf. table custom_${slug}_*)
 * Aucun fallback. Aucune auto-détection. Si rien n'est configuré ou si le slug
 * n'existe pas / est inactif → erreur explicite.
 */
async function resolveChatProvider(): Promise<AIProvider> {
  const raw = (await settingsService.getRaw('text_ai_provider'))?.trim().toLowerCase();
  if (!raw) {
    throw new Error(
      "Aucun provider IA configuré. Renseignez 'text_ai_provider' dans /admin/settings (built-in : openai | anthropic | gemini | mock, ou slug d'un provider custom)."
    );
  }

  if (BUILT_IN_TEXT_PROVIDERS.has(raw)) return raw as AIProvider;

  if (await isActiveCustomProvider(raw)) return raw;

  throw new Error(
    `Provider "${raw}" introuvable ou inactif. Ajoutez-le dans /admin/settings → onglet Providers, ou choisissez un built-in (openai | anthropic | gemini | mock).`
  );
}

/**
 * Strict mode : modèle lu uniquement depuis AppSetting.
 *   - built-in   : `${provider}_model` → `default_model`
 *   - custom slug : `custom_${slug}_default_model`
 * Aucun défaut codé en dur. Si rien n'est configuré → erreur explicite.
 */
async function resolveChatModel(provider: AIProvider): Promise<string> {
  if (provider === 'mock') return 'mock-text';

  const resolveModelValue = (model: string) => {
    const replacement = replaceObsoleteModel(model);
    if (replacement !== model.trim()) {
      logger.warn('[chat] replacing obsolete AI model', {
        provider,
        configuredModel: model.trim(),
        replacementModel: replacement,
      });
    }
    return replacement;
  };

  // Custom provider : modèle stocké sous la clé `custom_${slug}_default_model`.
  if (!BUILT_IN_TEXT_PROVIDERS.has(provider)) {
    const customModel = await settingsService.getRaw(`custom_${provider}_default_model`);
    if (customModel && customModel.trim().length > 0) return resolveModelValue(customModel);
    throw new Error(
      `Aucun modèle configuré pour le provider custom "${provider}". Renseignez "Modèle par défaut" dans /admin/settings → Providers → ${provider}.`
    );
  }

  const providerModelKey = `${provider}_model`;
  const fromProvider = await settingsService.getRaw(providerModelKey);
  if (fromProvider && fromProvider.trim().length > 0) return resolveModelValue(fromProvider);

  const fromDefault = await settingsService.getRaw('default_model');
  if (fromDefault && fromDefault.trim().length > 0) return resolveModelValue(fromDefault);

  throw new Error(
    `Aucun modèle configuré pour le provider "${provider}". Renseignez "${providerModelKey}" (ou "default_model") dans /admin/settings.`
  );
}

async function resolveChatAgentProfile() {
  const name = (await settingsService.resolve('chat_agent_name')) ?? DEFAULT_CHAT_AGENT_NAME;
  const systemPrompt = await settingsService.resolve('chat_agent_system_prompt');
  if (!systemPrompt) {
    throw new Error(
      'Prompt système du chat non configuré. Renseignez "chat_agent_system_prompt" dans /admin/settings.'
    );
  }

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

const FORMAT_LABELS: Record<string, string> = {
  '3:4': 'Portrait - 3:4 (Flyer / Affiche / A4)',
  '1:1': 'Carre - 1:1 (Instagram / Facebook)',
  '9:16': 'Story - 9:16 (Story / Reels / TikTok)',
  '16:9': 'Banniere - 16:9 (YouTube / web)',
  '4:3': 'Paysage - 4:3 (presentation / pub)',
};

const CHAT_FILE_USAGE_LABELS: Record<string, string> = {
  LOGO: 'Logo',
  PRODUCT_IMAGE: 'Produit',
  REFERENCE_IMAGE: 'Inspiration',
  GENERATED_POSTER: 'Affiche de référence',
  PERSON_IMAGE: 'Personnage principal',
  MODEL: 'Modèle',
  BRAND_GUIDELINE: 'Charte graphique',
  OTHER: 'Autre',
};

const CHAT_WORKSPACE_CONTEXT_PROMPTS_KEY = 'chat_workspace_context_prompts';
const WORKSPACE_PROMPT_TRIGGERS = [
  'workspace_brief',
  'assets_present',
  'assets_missing',
  'vision_chat',
  'opening_assets',
  'opening_no_assets',
  'opening_vision',
] as const;

type WorkspacePromptTrigger = typeof WORKSPACE_PROMPT_TRIGGERS[number];
type WorkspaceContextPrompt = {
  id: string;
  title: string;
  trigger: WorkspacePromptTrigger;
  content: string;
  priority: number;
  enabled: boolean;
};

function isWorkspacePromptTrigger(value: unknown): value is WorkspacePromptTrigger {
  return typeof value === 'string' && WORKSPACE_PROMPT_TRIGGERS.includes(value as WorkspacePromptTrigger);
}

function parseWorkspaceContextPrompts(raw: string | null): WorkspaceContextPrompt[] {
  if (!raw?.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index): WorkspaceContextPrompt | null => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;
        const content = typeof record.content === 'string' ? record.content.trim() : '';
        if (!content || !isWorkspacePromptTrigger(record.trigger)) return null;

        const title = typeof record.title === 'string' && record.title.trim()
          ? record.title.trim()
          : `Prompt workspace ${index + 1}`;
        const id = typeof record.id === 'string' && record.id.trim()
          ? record.id.trim()
          : `workspace_prompt_${index + 1}`;
        const priority = Number(record.priority);

        return {
          id,
          title,
          trigger: record.trigger,
          content,
          priority: Number.isFinite(priority) ? priority : 0,
          enabled: record.enabled !== false,
        };
      })
      .filter((item): item is WorkspaceContextPrompt => Boolean(item))
      .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title, 'fr'));
  } catch (err) {
    logger.warn('[chat] invalid chat_workspace_context_prompts JSON', err instanceof Error ? err.message : err);
    return [];
  }
}

async function loadWorkspaceContextPrompts(): Promise<WorkspaceContextPrompt[]> {
  return parseWorkspaceContextPrompts(await settingsService.getRaw(CHAT_WORKSPACE_CONTEXT_PROMPTS_KEY));
}

function applyWorkspacePromptVariables(
  template: string,
  variables: Record<string, string | number>
) {
  return template
    .replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      const value = variables[key];
      return value === undefined ? match : String(value);
    })
    .trim();
}

function formatWorkspacePromptBlock(title: string, content: string) {
  const body = content.trim();
  if (!body) return '';
  return [
    '═══════════════════════════════════════',
    title,
    '═══════════════════════════════════════',
    body,
    '═══════════════════════════════════════',
  ].join('\n');
}

function renderWorkspacePromptBlocks(
  prompts: WorkspaceContextPrompt[],
  trigger: WorkspacePromptTrigger,
  variables: Record<string, string | number> = {}
) {
  return prompts
    .filter((prompt) => prompt.enabled && prompt.trigger === trigger)
    .map((prompt) => formatWorkspacePromptBlock(
      `${prompt.title} — priorité ${prompt.priority}`,
      applyWorkspacePromptVariables(prompt.content, variables)
    ))
    .filter(Boolean)
    .join('\n\n');
}

function renderWorkspacePromptContent(
  prompts: WorkspaceContextPrompt[],
  trigger: WorkspacePromptTrigger,
  variables: Record<string, string | number> = {}
) {
  return prompts
    .filter((prompt) => prompt.enabled && prompt.trigger === trigger)
    .map((prompt) => applyWorkspacePromptVariables(prompt.content, variables))
    .filter(Boolean)
    .join('\n\n');
}

function canSendFileToChatVision(file: { fileUrl?: string | null; fileType?: string | null; format?: string | null }) {
  if (!file.fileUrl?.startsWith('http')) return false;
  if (file.fileType?.startsWith('image/')) return true;
  const format = file.format?.toLowerCase();
  return Boolean(format && ['jpg', 'jpeg', 'png', 'webp'].includes(format));
}

type WorkspaceBriefContext = {
  title?: string | null;
  projectTitle?: string | null;
  projectBrandDescription?: string | null;
  posterType?: string | null;
  posterTypeName?: string | null;
  posterTypeContextPrompt?: string | null;
  format?: string | null;
  category?: string | null;
  style?: string | null;
};

async function loadWorkspaceBriefContext(travailId: string): Promise<WorkspaceBriefContext | null> {
  const travail = await prisma.travail.findUnique({
    where: { id: travailId },
    select: {
      title: true,
      posterType: true,
      category: true,
      format: true,
      style: true,
      project: {
        select: {
          title: true,
          brandDescription: true,
        },
      },
    },
  });

  if (!travail) return null;

  const posterType = travail.posterType?.trim() || null;
  let posterTypeName: string | null = null;
  let posterTypeContextPrompt: string | null = null;

  if (posterType) {
    const option = await prisma.creationOption.findUnique({
      where: { slug: posterType },
      select: { name: true, contextPrompt: true, isActive: true },
    }).catch(() => null);

    if (option?.isActive) {
      posterTypeName = option.name;
      posterTypeContextPrompt = option.contextPrompt;
    }
  }

  return {
    title: travail.title,
    projectTitle: travail.project?.title,
    projectBrandDescription: travail.project?.brandDescription,
    posterType,
    posterTypeName,
    posterTypeContextPrompt,
    format: travail.format,
    category: travail.category,
    style: travail.style,
  };
}

function stringFromVisualConfig(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function mergeWorkspaceBriefContext(
  dbContext: WorkspaceBriefContext | null,
  visualConfig: Record<string, unknown> | undefined
): WorkspaceBriefContext | null {
  if (!dbContext && !visualConfig) return null;

  return {
    ...dbContext,
    posterType:
      stringFromVisualConfig(visualConfig?.creationType) ??
      stringFromVisualConfig(visualConfig?.posterType) ??
      dbContext?.posterType ??
      null,
    posterTypeName:
      stringFromVisualConfig(visualConfig?.posterTypeLabel) ??
      dbContext?.posterTypeName ??
      null,
    format:
      stringFromVisualConfig(visualConfig?.format) ??
      dbContext?.format ??
      null,
    category:
      stringFromVisualConfig(visualConfig?.category) ??
      dbContext?.category ??
      null,
    style:
      stringFromVisualConfig(visualConfig?.style) ??
      dbContext?.style ??
      null,
  };
}

function workspaceBriefVariables(context: WorkspaceBriefContext): Record<string, string> {
  return {
    workspaceTitle: context.title?.trim() || '',
    projectTitle: context.projectTitle?.trim() || '',
    brandDescription: context.projectBrandDescription?.trim() || '',
    posterType: context.posterType?.trim() || '',
    posterTypeName: context.posterTypeName?.trim() || '',
    format: context.format?.trim() || '',
    formatLabel: context.format ? (FORMAT_LABELS[context.format] || context.format) : '',
    category: context.category?.trim() || '',
    style: context.style?.trim() || '',
  };
}

function buildWorkspaceBriefPrompt(context: WorkspaceBriefContext | null, instructions = '') {
  if (!context) return '';

  const lines = [
    context.title ? `- Nom du travail : ${context.title}` : '',
    context.projectTitle ? `- Projet / marque : ${context.projectTitle}` : '',
    context.projectBrandDescription ? `- Description marque : ${context.projectBrandDescription}` : '',
    context.posterType || context.posterTypeName
      ? `- Type de visuel choisi dans le sidebar : ${context.posterTypeName || context.posterType}${context.posterType ? ` (${context.posterType})` : ''}`
      : '',
    context.format
      ? `- Forme / format choisi dans le sidebar : ${FORMAT_LABELS[context.format] || context.format}`
      : '',
    context.category ? `- Categorie : ${context.category}` : '',
    context.style ? `- Style initial : ${context.style}` : '',
  ].filter(Boolean);

  if (lines.length === 0) return '';

  return [
    '═══════════════════════════════════════',
    'CONTEXTE INITIAL DU WORKSPACE',
    '═══════════════════════════════════════',
    ...(instructions.trim() ? [instructions.trim(), ''] : []),
    lines.join('\n'),
  ].join('\n');
}

async function buildArtisticBaseContextBlock(
  workspaceBrief: WorkspaceBriefContext | null,
): Promise<string> {
  const category = workspaceBrief?.category?.trim() || undefined;
  try {
    const where = category ? { category: { contains: category, mode: 'insensitive' as const } } : {};
    const items = await prisma.artisticResource.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 12,
      select: { title: true, category: true, resourceType: true, description: true, url: true },
    });
    if (items.length === 0) return '';

    const lines = items
      .map((r) => {
        const head = `${r.resourceType} · ${r.title}${r.category ? ` (${r.category})` : ''}`;
        const desc = r.description?.trim() ? ` — ${r.description.trim().slice(0, 120)}` : '';
        return `  • ${head}${desc}`;
      })
      .join('\n');

    return [
      '═══════════════════════════════════════',
      `BASE ARTISTIQUE DISPONIBLE${category ? ` (filtre catégorie : ${category})` : ''}`,
      '═══════════════════════════════════════',
      'Tu peux suggérer ces ressources au client si pertinent (styles, palettes, polices, modèles) :',
      lines,
    ].join('\n');
  } catch (err) {
    logger.warn('[chat] failed to load artistic base for context', err);
    return '';
  }
}

async function buildForbiddenRulesContextBlock(): Promise<string> {
  try {
    const rules = await prisma.forbiddenRule.findMany({
      where: { isActive: true },
      orderBy: [{ severity: 'desc' }, { title: 'asc' }],
      take: 30,
      select: { title: true, category: true, severity: true, description: true },
    });
    if (rules.length === 0) return '';

    const lines = rules
      .map((r) => {
        const head = `[${r.severity}] ${r.title} · ${r.category}`;
        const desc = r.description?.trim() ? ` — ${r.description.trim().slice(0, 140)}` : '';
        return `  • ${head}${desc}`;
      })
      .join('\n');

    return [
      '═══════════════════════════════════════',
      'RÈGLES INTERDITES (à ne jamais suggérer / valider)',
      '═══════════════════════════════════════',
      'Si le client demande explicitement l\'une de ces choses, refuse poliment et explique pourquoi :',
      lines,
    ].join('\n');
  } catch (err) {
    logger.warn('[chat] failed to load forbidden rules for context', err);
    return '';
  }
}

async function callChatProvider(input: ChatRequestInput): Promise<string> {
  const [provider, agentProfile, workspaceContextPrompts, chatAgentConfig] = await Promise.all([
    resolveChatProvider(),
    resolveChatAgentProfile(),
    loadWorkspaceContextPrompts(),
    chatAgentConfigService.get(),
  ]);
  const moduleAccess = chatAgentConfig.moduleAccess;

  let workspaceContextPrompt = '';
  const workspaceBrief = mergeWorkspaceBriefContext(
    input.travailId ? await loadWorkspaceBriefContext(input.travailId) : null,
    input.visualConfig
  );
  const workspaceBriefPrompt = buildWorkspaceBriefPrompt(
    workspaceBrief,
    workspaceBrief
      ? renderWorkspacePromptContent(
          workspaceContextPrompts,
          'workspace_brief',
          workspaceBriefVariables(workspaceBrief)
        )
      : ''
  );
  if (workspaceBriefPrompt) {
    workspaceContextPrompt += `\n\n${workspaceBriefPrompt}`;
  }

  if (moduleAccess.creation_options && workspaceBrief?.posterTypeContextPrompt) {
    workspaceContextPrompt += `\n\n═══════════════════════════════════════\nCONTEXTE SPÉCIFIQUE (TYPE DE CRÉATION : ${workspaceBrief.posterTypeName || workspaceBrief.posterType})\n═══════════════════════════════════════\n${workspaceBrief.posterTypeContextPrompt}`;
  }

  if (moduleAccess.artistic_base) {
    const artisticBlock = await buildArtisticBaseContextBlock(workspaceBrief);
    if (artisticBlock) workspaceContextPrompt += `\n\n${artisticBlock}`;
  }

  if (moduleAccess.forbidden_rules) {
    const forbiddenBlock = await buildForbiddenRulesContextBlock();
    if (forbiddenBlock) workspaceContextPrompt += `\n\n${forbiddenBlock}`;
  }

  if (input.visualConfig && Object.keys(input.visualConfig).length > 0) {
    const restConfig = { ...input.visualConfig };
    for (const key of [
      'creationType',
      'posterType',
      'posterTypeLabel',
      'format',
      'formatLabel',
      'formatHint',
      'workspaceSidebar',
    ]) {
      delete restConfig[key];
    }
    if (Object.keys(restConfig).length > 0) {
      workspaceContextPrompt += `\n\n═══════════════════════════════════════\nCONFIGURATION CRÉATIVE ACTIVE (utilise ces paramètres en priorité)\n═══════════════════════════════════════\n${JSON.stringify(restConfig, null, 2)}`;
    }
  }

  // Extraction des URLs d'assets attachés (logo, produit, inspiration…).
  // Le provider conversationnel doit VOIR les fichiers du workspace pour
  // comprendre directement le contexte client avant la génération image.
  type AttachedAsset = { type?: string; url: string; name?: string };
  type ChatVisionAsset = { label: string; url: string; name?: string };
  const rawAssets = (input.visualConfig?.assets ?? []) as AttachedAsset[];
  const attachedImageAssets: ChatVisionAsset[] = rawAssets
    .filter((a) => typeof a?.url === 'string' && a.url.startsWith('http'))
    .map((a) => ({ label: a.type || 'Image', url: a.url, name: a.name }));

  // ─── Inventaire des fichiers déjà attachés au projet ─────────────────
  // Source 1 (autoritative) : table FileAsset via projectId (DB)
  // Source 2 (fallback) : visualConfig.assets envoyé par le client
  // On utilise la DB en priorité car elle reflète l'état réel.
  type AssetSummaryItem = { label: string; count: number; names: string[] };
  let projectAssetSummary: AssetSummaryItem[] = [];

  if (moduleAccess.files && input.travailId) {
    try {
      // Fichiers visibles = ceux du travail + ceux du projet parent (assets de marque)
      const files = await prisma.fileAsset.findMany({
        where: {
          OR: [
            { travailId: input.travailId },
            { project: { travaux: { some: { id: input.travailId } } } },
          ],
        },
        select: { originalName: true, usageType: true, fileUrl: true, fileType: true, format: true },
      });
      const byLabel = new Map<string, AssetSummaryItem>();
      for (const f of files) {
        const label = CHAT_FILE_USAGE_LABELS[f.usageType] ?? f.usageType;
        const item = byLabel.get(label) ?? { label, count: 0, names: [] };
        item.count++;
        if (item.names.length < 3) item.names.push(f.originalName);
        byLabel.set(label, item);

        if (canSendFileToChatVision(f)) {
          attachedImageAssets.push({ label, url: f.fileUrl, name: f.originalName });
        }
      }
      projectAssetSummary = Array.from(byLabel.values());
    } catch (err) {
      logger.warn('[chat] failed to load travail files for context', err);
    }
  }

  const seenVisionUrls = new Set<string>();
  const uniqueImageAssets = attachedImageAssets
    .filter((asset) => {
      if (seenVisionUrls.has(asset.url)) return false;
      seenVisionUrls.add(asset.url);
      return true;
    })
    .slice(0, 8);
  const attachedImageUrls = uniqueImageAssets.map((asset) => asset.url);
  const useVision = attachedImageUrls.length > 0;

  // ─── Bloc CONTEXTUEL CRITIQUE injecté à CHAQUE appel ─────────────────
  // Empêche l'agent de redemander des ressources déjà fournies. Le prompt
  // admin reste la base système ; ces blocs complètent le contexte Workspace.
  if (projectAssetSummary.length > 0) {
    const lines = projectAssetSummary
      .map((it) => `  • ${it.label} : ${it.count} fichier${it.count > 1 ? 's' : ''}${it.names.length ? ` (${it.names.join(', ')})` : ''}`)
      .join('\n');
    const assetsPrompt = renderWorkspacePromptBlocks(workspaceContextPrompts, 'assets_present', {
      assetCount: projectAssetSummary.reduce((sum, item) => sum + item.count, 0),
      assetLines: lines,
    });
    if (assetsPrompt) workspaceContextPrompt += `\n\n${assetsPrompt}`;
  } else if (input.travailId) {
    // Travail existe mais 0 fichier — autoriser l'agent à proposer l'upload
    const noAssetsPrompt = renderWorkspacePromptBlocks(workspaceContextPrompts, 'assets_missing');
    if (noAssetsPrompt) workspaceContextPrompt += `\n\n${noAssetsPrompt}`;
  }

  if (useVision) {
    const visionLines = uniqueImageAssets
      .map((asset, index) => `- Image ${index + 1} : ${asset.label}${asset.name ? ` (${asset.name})` : ''}`)
      .join('\n');
    const visionPrompt = renderWorkspacePromptBlocks(workspaceContextPrompts, 'vision_chat', {
      imageCount: attachedImageUrls.length,
      visionLines,
    });
    if (visionPrompt) workspaceContextPrompt += `\n\n${visionPrompt}`;
  }

  const resolvedSystemPrompt = [
    `PROMPT SYSTÈME ADMIN CONFIGURÉ DANS /admin/settings :\n${agentProfile.systemPrompt}`,
    workspaceContextPrompt.trim()
      ? `CONTEXTE WORKSPACE À RESPECTER SANS IGNORER LE PROMPT SYSTÈME ADMIN :${workspaceContextPrompt}`
      : '',
  ].filter(Boolean).join('\n\n');

  const model = await resolveChatModel(provider);
  logger.info('[chat] calling AI provider', {
    provider,
    model,
    agentName: agentProfile.name,
    mode: useVision ? 'vision' : 'text',
    attachmentCount: attachedImageUrls.length,
  });

  const adapter = await createProvider(provider);
  const reply = (
    useVision
      ? await adapter.callVision({
          provider,
          model,
          systemPrompt: resolvedSystemPrompt,
          userPrompt: buildChatUserPrompt(input.history, input.message),
          imageUrls: attachedImageUrls,
          temperature: 0.4,
          responseFormat: 'text',
        })
      : await adapter.callText({
          provider,
          model,
          systemPrompt: resolvedSystemPrompt,
          userPrompt: buildChatUserPrompt(input.history, input.message),
          temperature: 0.4,
          responseFormat: 'text',
        })
  ).trim();

  if (!reply) throw new Error('AI provider returned an empty reply');
  return reply;
}

export const chatService = {
  async sendMessage(input: ChatRequestInput, userId: string): Promise<ChatResponsePayload> {
    const { travailId } = input;

    const travail = await prisma.travail.findFirst({
      where: { id: travailId, userId },
      select: { id: true, projectId: true, _count: { select: { messages: true } } }
    });

    if (!travail) {
      throw new Error('Travail not found or unauthorized');
    }

    const isFirstMessage = travail._count.messages === 0;

    logger.info('[chat] message received', {
      travailId,
      isFirstMessage,
      historyLength: input.history?.length ?? 0,
      messageLength: input.message.length
    });

    const reply = await callChatProvider(input);

    logger.info('[chat] reply generated', {
      travailId,
      replyLength: reply.length
    });

    await prisma.$transaction(async (tx) => {
      await tx.message.createMany({
        data: [
          { travailId, role: 'USER',      content: input.message.trim() },
          { travailId, role: 'ASSISTANT', content: reply }
        ]
      });

      await tx.travail.update({
        where: { id: travailId },
        data: { updatedAt: new Date(), lastMessageAt: new Date() }
      });
    });

    // Persiste le premier message dans la mémoire configurée par l'admin
    // (ex M_SMS par défaut). Awaité — erreurs loguées en soft-fail.
    if (isFirstMessage) {
      try {
        const config = await chatAgentConfigService.get();
        const targetKey = config.memoryTargetKey;
        const def = await prisma.memoryDefinition.findUnique({ where: { key: targetKey } });
        if (def) {
          await prisma.memoryEntry.upsert({
            where: {
              travailId_memoryDefinitionId: {
                travailId,
                memoryDefinitionId: def.id,
              },
            },
            update: {},
            create: {
              travailId,
              userId,
              memoryDefinitionId: def.id,
              content: {
                request: input.message.trim(),
                savedAt: new Date().toISOString(),
              },
            },
          });
        } else {
          logger.warn('[chat] memory target not found', { targetKey });
        }
      } catch (err) {
        logger.warn('[chat] failed to persist chat memory', err instanceof Error ? err.message : err);
      }
    }

    return {
      success: true,
      reply,
      message: {
        role: 'assistant',
        content: reply
      },
      travailId,
      projectId: travail.projectId
    };
  },

  /**
   * Generate the opening assistant message for a fresh conversation,
   * adapted to the assets the user uploaded in the "éléments importants" panel.
   *
   * Idempotent : if a conversation already exists for this project AND it already
   * has at least one assistant message, the existing first assistant message is
   * returned without calling the AI again.
   */
  async generateOpening(input: ChatOpeningInput, userId: string): Promise<ChatOpeningPayload> {
    const { travailId } = input;

    const travail = await prisma.travail.findFirst({
      where: { id: travailId, userId },
      include: {
        files: true,
        project: { include: { files: true } },
        messages: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
    });
    if (!travail) {
      throw new Error('Travail not found or unauthorized');
    }

    const projectId = travail.projectId;
    // Combine travail-specific assets + brand-level assets (logo, brand book, …)
    const allFiles = [...travail.files, ...travail.project.files];

    // Group files by usage type, mapping FileUsageType enum → French label.
    const USAGE_LABEL: Record<string, string> = {
      LOGO: 'Logo',
      PRODUCT_IMAGE: 'Produit',
      REFERENCE_IMAGE: 'Inspiration',
      GENERATED_POSTER: 'Affiche',
      PERSON_IMAGE: 'Personnage principal',
      MODEL: 'Modèle',
      BRAND_GUIDELINE: 'Charte graphique',
      OTHER: 'Autre',
    };

    const assetSummary: Record<string, number> = {};
    const assetsByLabel: Record<string, string[]> = {};
    for (const f of allFiles) {
      const label = USAGE_LABEL[f.usageType] ?? f.usageType;
      assetSummary[label] = (assetSummary[label] ?? 0) + 1;
      assetsByLabel[label] = assetsByLabel[label] ?? [];
      assetsByLabel[label].push(f.originalName);
    }
    const hasAssets = allFiles.length > 0;
    const openingVisionAssets = allFiles
      .filter((file) => canSendFileToChatVision(file))
      .map((file) => ({
        label: USAGE_LABEL[file.usageType] ?? file.usageType,
        name: file.originalName,
        url: file.fileUrl,
      }))
      .slice(0, 8);
    const openingImageUrls = openingVisionAssets.map((asset) => asset.url);

    // Idempotence : si le travail a déjà un premier message assistant, on le réutilise.
    const firstMessage = travail.messages[0];
    if (firstMessage && firstMessage.role === 'ASSISTANT') {
      return {
        success: true,
        opening: firstMessage.content,
        message: {
          id: firstMessage.id,
          role: 'assistant',
          content: firstMessage.content,
          createdAt: firstMessage.createdAt.toISOString(),
        },
        travailId,
        projectId,
        hasAssets,
        assetSummary,
        reused: true,
      };
    }

    // Build a context block describing what the user uploaded (or didn't).
    const assetLines = hasAssets
      ? Object.entries(assetSummary)
          .map(([label, count]) => {
            const names = (assetsByLabel[label] ?? []).slice(0, 3).join(', ');
            return `- ${label} : ${count} fichier(s)${names ? ` (${names})` : ''}`;
          })
          .join('\n')
      : 'Aucun fichier importé pour l’instant.';

    const workspaceContextPrompts = await loadWorkspaceContextPrompts();
    const openingInstruction = hasAssets
      ? renderWorkspacePromptContent(workspaceContextPrompts, 'opening_assets', {
          assetCount: allFiles.length,
          assetLines,
        })
      : renderWorkspacePromptContent(workspaceContextPrompts, 'opening_no_assets', { assetLines });

    const provider = await resolveChatProvider();
    const agentProfile = await resolveChatAgentProfile();
    const workspaceBrief = mergeWorkspaceBriefContext(
      await loadWorkspaceBriefContext(travailId),
      input.visualConfig
    );
    const workspaceBriefPrompt = buildWorkspaceBriefPrompt(
      workspaceBrief,
      workspaceBrief
        ? renderWorkspacePromptContent(
            workspaceContextPrompts,
            'workspace_brief',
            workspaceBriefVariables(workspaceBrief)
          )
        : ''
    );
    const openingVisionPrompt = openingVisionAssets.length
      ? renderWorkspacePromptContent(workspaceContextPrompts, 'opening_vision', {
          imageCount: openingVisionAssets.length,
          visionLines: openingVisionAssets.map((asset, index) => (
            `- Image ${index + 1} : ${asset.label} (${asset.name})`
          )).join('\n'),
        })
      : '';
    const systemPrompt = [
      `PROMPT SYSTÈME ADMIN CONFIGURÉ DANS /admin/settings :\n${agentProfile.systemPrompt}`,
      workspaceBriefPrompt
        ? `CONTEXTE WORKSPACE À UTILISER DÈS L’OUVERTURE :\n${workspaceBriefPrompt}`
        : '',
      openingVisionPrompt,
      openingInstruction
        ? `INSTRUCTION SPÉCIALE — OUVERTURE WORKSPACE :\n${openingInstruction}`
        : '',
    ].filter(Boolean).join('\n\n═══════════════════════════════════════\n\n');

    const model = await resolveChatModel(provider);
    const adapter = await createProvider(provider);
    const opening = (
      openingImageUrls.length > 0
        ? await adapter.callVision({
            provider,
            model,
            systemPrompt,
            userPrompt:
              'Tu démarres maintenant. Tu vois les images du workspace. Produis uniquement la réponse demandée, sans préambule.',
            imageUrls: openingImageUrls,
            temperature: 0.4,
            responseFormat: 'text',
          })
        : await adapter.callText({
            provider,
            model,
            systemPrompt,
            userPrompt:
              'Tu démarres maintenant. Produis uniquement la réponse demandée, sans préambule.',
            temperature: 0.4,
            responseFormat: 'text',
          })
    ).trim();

    if (!opening) {
      throw new Error('AI provider returned an empty opening');
    }

    const savedMessage = await prisma.message.create({
      data: {
        travailId,
        role: 'ASSISTANT',
        content: opening,
      },
    });

    await prisma.travail.update({
      where: { id: travailId },
      data: { lastMessageAt: new Date(), updatedAt: new Date() },
    });

    return {
      success: true,
      opening,
      message: {
        id: savedMessage.id,
        role: 'assistant',
        content: savedMessage.content,
        createdAt: savedMessage.createdAt.toISOString(),
      },
      travailId,
      projectId,
      hasAssets,
      assetSummary,
      reused: false,
    };
  },
};
