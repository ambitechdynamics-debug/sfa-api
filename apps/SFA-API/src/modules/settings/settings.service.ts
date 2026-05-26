import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { UpsertSettingsInput } from './settings.validation';

// ─── Default settings seed ────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = [
  // IA
  { key: 'credits_per_generation',        value: '10',    category: 'ia',          isSecret: false, description: 'Crédits déduits par affiche générée' },
  { key: 'credits_per_prompt',            value: '2',     category: 'ia',          isSecret: false, description: 'Crédits déduits par génération de prompt' },
  { key: 'free_generations',              value: '3',     category: 'ia',          isSecret: false, description: 'Générations gratuites à l\'inscription' },
  { key: 'free_prompts',                  value: '5',     category: 'ia',          isSecret: false, description: 'Prompts gratuits à l\'inscription' },
  { key: 'default_model',                 value: '',      category: 'ia',          isSecret: false, description: 'Modèle IA par défaut (à configurer manuellement)' },
  { key: 'timeout_ms',                    value: '30000', category: 'ia',          isSecret: false, description: 'Timeout requête IA (ms)' },
  { key: 'max_retries',                   value: '3',     category: 'ia',          isSecret: false, description: 'Tentatives max en cas d\'erreur' },

  // Providers
  { key: 'openai_api_key',                value: '',      category: 'providers',   isSecret: true,  description: 'Clé API OpenAI' },
  { key: 'openai_model',                  value: '',      category: 'providers',   isSecret: false, description: 'Modèle OpenAI (ex: gpt-4o) — à saisir manuellement' },
  { key: 'anthropic_api_key',             value: '',      category: 'providers',   isSecret: true,  description: 'Clé API Anthropic' },
  { key: 'anthropic_model',               value: '',      category: 'providers',   isSecret: false, description: 'Modèle Anthropic (ex: claude-3-5-sonnet-20241022) — à saisir manuellement' },
  { key: 'gemini_api_key',                value: '',      category: 'providers',   isSecret: true,  description: 'Clé API Google Gemini' },
  { key: 'gemini_model',                  value: '',      category: 'providers',   isSecret: false, description: 'Modèle Gemini (ex: gemini-2.0-flash) — à saisir manuellement' },
  { key: 'text_ai_provider',              value: '',      category: 'providers',   isSecret: false, description: 'Provider IA conversationnel (openai | anthropic | gemini | mock) — à choisir manuellement' },
  { key: 'chat_agent_name',               value: 'Studio Flyer AI', category: 'providers', isSecret: false, description: 'Nom affiché de l’agent conversationnel du dashboard client' },
  { key: 'chat_agent_system_prompt',      value: "Tu es l'assistant de chat interactif et intelligent de Studio Flyer AI. Ton but unique est d'aider l'utilisateur à concevoir son flyer étape par étape à travers une conversation fluide. Pose une seule question simple à la fois et propose des choix si approprié.", category: 'providers', isSecret: false, description: 'Prompt système de l’agent conversationnel du dashboard client' },
  { key: 'chat_workspace_context_prompts', value: '[]', category: 'providers', isSecret: false, description: 'Prompts workspace CRUD de l’agent conversationnel (JSON : id, title, trigger, priority, enabled, content)' },
  { key: 'image_gen_provider',            value: '',      category: 'providers',   isSecret: false, description: 'Provider de génération d\'image (mock | gemini | openai-image) — à choisir manuellement' },
  { key: 'image_gen_model',               value: '',      category: 'providers',   isSecret: false, description: 'Modèle de génération d\'image (ex: gemini-2.5-flash-image-preview) — à saisir manuellement' },
  // Storage
  { key: 'storage_provider',              value: 'cloudinary', category: 'storage', isSecret: false, description: 'Provider de stockage fichiers' },
  { key: 'max_file_size_mb',              value: '10',    category: 'storage',     isSecret: false, description: 'Taille max par fichier (MB)' },
  { key: 'allowed_types',                 value: 'image/jpeg,image/png,image/webp', category: 'storage', isSecret: false, description: 'MIME types autorisés' },
  { key: 'auto_compress',                 value: 'true',  category: 'storage',     isSecret: false, description: 'Compression auto images' },
  { key: 'compression_quality',           value: '85',    category: 'storage',     isSecret: false, description: 'Qualité compression (1-100)' },

  // Payment
  { key: 'currency',                      value: 'XOF',   category: 'payment',     isSecret: false, description: 'Devise par défaut' },
  { key: 'mtn_enabled',                   value: 'true',  category: 'payment',     isSecret: false, description: 'MTN Mobile Money activé' },
  { key: 'mtn_number',                    value: '',      category: 'payment',     isSecret: false, description: 'Numéro MTN marchand' },
  { key: 'airtel_enabled',                value: 'true',  category: 'payment',     isSecret: false, description: 'Airtel Money activé' },
  { key: 'airtel_number',                 value: '',      category: 'payment',     isSecret: false, description: 'Numéro Airtel marchand' },
  { key: 'stripe_enabled',                value: 'false', category: 'payment',     isSecret: false, description: 'Stripe (carte bancaire) activé' },
  { key: 'stripe_secret_key',             value: '',      category: 'payment',     isSecret: true,  description: 'Clé secrète Stripe' },
  { key: 'stripe_public_key',             value: '',      category: 'payment',     isSecret: false, description: 'Clé publique Stripe' },

  // Security
  { key: 'jwt_expiry_hours',              value: '24',    category: 'security',    isSecret: false, description: 'Expiration token JWT (heures)' },
  { key: 'max_login_attempts',            value: '5',     category: 'security',    isSecret: false, description: 'Tentatives de login max' },
  { key: 'lockout_minutes',               value: '30',    category: 'security',    isSecret: false, description: 'Durée verrouillage (minutes)' },
  { key: 'require_email_verification',    value: 'false', category: 'security',    isSecret: false, description: 'Vérification email obligatoire' },
  { key: 'allowed_origins',               value: 'http://localhost:3000', category: 'security', isSecret: false, description: 'Origines CORS autorisées' },

  // Maintenance
  { key: 'maintenance_mode',              value: 'false', category: 'maintenance', isSecret: false, description: 'Mode maintenance activé' },
  { key: 'maintenance_message',           value: 'La plateforme est en cours de maintenance. Revenez bientôt.', category: 'maintenance', isSecret: false, description: 'Message affiché en maintenance' },
  { key: 'auto_cleanup_enabled',          value: 'true',  category: 'maintenance', isSecret: false, description: 'Active le cron in-app qui débloque les projets coincés (GENERATING/ANALYZING/QUESTIONING)' },
  { key: 'min_quality_score',             value: '70',    category: 'ia',          isSecret: false, description: 'Seuil minimum du Quality Agent pour autoriser la génération d\'image (0 pour désactiver)' },
  { key: 'image_ratio_dims',              value: '{"1:1":{"w":1024,"h":1024},"9:16":{"w":1080,"h":1920},"16:9":{"w":1920,"h":1080},"3:4":{"w":1080,"h":1440},"4:3":{"w":1440,"h":1080}}', category: 'providers', isSecret: false, description: 'Dimensions (w/h) par aspect ratio pour le MockImageProvider (JSON). Gemini ignore ces dimensions.' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mask secret values — replace all chars after first 4 with bullets */
function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 6) return '••••••••';
  return value.slice(0, 6) + '••••••••••••••••••••••••••';
}

function sanitizeSetting(s: { key: string; value: string; isSecret: boolean; category: string; description: string | null; updatedAt: Date }) {
  return {
    key:         s.key,
    value:       s.isSecret ? maskSecret(s.value) : s.value,
    category:    s.category,
    isSecret:    s.isSecret,
    description: s.description,
    updatedAt:   s.updatedAt,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

// ─── One-shot migration ───────────────────────────────────────────────────────
// Lignes d'AppSetting créées par d'anciens seeds avec des valeurs hardcodées
// (gpt-4o, claude-3-5-sonnet-20241022, gemini-2.0-flash, …). On les remet à ''
// pour forcer l'admin à saisir explicitement provider + modèle dans
// /admin/settings. Si l'admin a déjà personnalisé la valeur, on ne touche à
// rien (clé absente du mapping ou valeur ≠ ancien défaut).
const OBSOLETE_DEFAULT_VALUES: Record<string, string[]> = {
  default_model:      ['gpt-4o'],
  openai_model:       ['gpt-4o'],
  anthropic_model:    ['claude-3-5-sonnet-20241022'],
  gemini_model:       ['gemini-2.0-flash', 'gemini-1.5-pro'],
  image_gen_model:    ['gemini-2.5-flash-image-preview'],
  text_ai_provider:   ['auto'],
  image_gen_provider: ['mock'],
};

const OBSOLETE_MODEL_REPLACEMENTS: Record<string, string> = {
  'gemini-3.1-flash-lite-preview': 'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite': 'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite-001': 'gemini-2.5-flash-lite',
  'gemini-2.0-flash': 'gemini-2.5-flash',
  'gemini-2.0-flash-001': 'gemini-2.5-flash',
};

export function replaceObsoleteModel(model: string): string {
  const trimmed = model.trim();
  return OBSOLETE_MODEL_REPLACEMENTS[trimmed] ?? trimmed;
}

const LEGACY_CHAT_WORKSPACE_PROMPT_KEYS = [
  'chat_workspace_brief_prompt',
  'chat_workspace_assets_prompt',
  'chat_workspace_no_assets_prompt',
  'chat_workspace_vision_prompt',
  'chat_workspace_opening_assets_prompt',
  'chat_workspace_opening_no_assets_prompt',
  'chat_workspace_opening_vision_prompt',
];

const GENERATED_CHAT_WORKSPACE_PROMPT_IDS = new Set([
  'workspace_brief_default',
  'assets_present_default',
  'assets_missing_default',
  'vision_chat_default',
  'opening_assets_default',
  'opening_no_assets_default',
  'opening_vision_default',
]);

function removeGeneratedWorkspacePrompts(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;

    const filtered = parsed.filter((item) => {
      if (!item || typeof item !== 'object') return true;
      const id = (item as Record<string, unknown>).id;
      return typeof id !== 'string' || !GENERATED_CHAT_WORKSPACE_PROMPT_IDS.has(id);
    });

    if (filtered.length === parsed.length) return null;
    return JSON.stringify(filtered, null, 2);
  } catch {
    return null;
  }
}

async function migrateObsoleteProviderModels(): Promise<number> {
  const providerSettings = await prisma.appSetting.findMany({
    where: { category: 'providers' },
  });
  const byKey = new Map(providerSettings.map((setting) => [setting.key, setting]));
  const updates: Array<ReturnType<typeof prisma.appSetting.update>> = [];

  for (const setting of providerSettings) {
    const customMatch = setting.key.match(/^custom_(.+)_default_model$/);
    const isGeminiModel = setting.key === 'gemini_model';
    const isGeminiCustomModel = Boolean(
      customMatch && byKey.get(`custom_${customMatch[1]}_type`)?.value === 'gemini-compatible'
    );

    if (!isGeminiModel && !isGeminiCustomModel) continue;

    const replacement = replaceObsoleteModel(setting.value);
    if (replacement === setting.value.trim()) continue;

    updates.push(
      prisma.appSetting.update({
        where: { key: setting.key },
        data: { value: replacement },
      })
    );
  }

  if (updates.length) await prisma.$transaction(updates);
  return updates.length;
}

export const settingsService = {
  /**
   * Ensure all default keys exist in the DB (run once on startup or on demand).
   * Also clears any legacy hardcoded provider/model values (one-shot migration).
   */
  seed: async () => {
    let created = 0;
    let migrated = 0;

    for (const def of DEFAULT_SETTINGS) {
      const existing = await prisma.appSetting.findUnique({ where: { key: def.key } });
      if (!existing) {
        await prisma.appSetting.create({ data: def });
        created++;
        continue;
      }
      const obsoleteValues = OBSOLETE_DEFAULT_VALUES[def.key];
      if (obsoleteValues && obsoleteValues.includes(existing.value)) {
        await prisma.appSetting.update({ where: { key: def.key }, data: { value: '' } });
        migrated++;
      }
    }

    await prisma.appSetting.deleteMany({
      where: { key: { in: LEGACY_CHAT_WORKSPACE_PROMPT_KEYS } },
    });

    const workspacePrompts = await prisma.appSetting.findUnique({
      where: { key: 'chat_workspace_context_prompts' },
      select: { value: true },
    });
    if (workspacePrompts) {
      const cleanedPrompts = removeGeneratedWorkspacePrompts(workspacePrompts.value);
      if (cleanedPrompts !== null) {
        await prisma.appSetting.update({
          where: { key: 'chat_workspace_context_prompts' },
          data: { value: cleanedPrompts },
        });
        migrated++;
      }
    }

    migrated += await migrateObsoleteProviderModels();

    return { created, migrated };
  },

  /** Return all settings, grouped by category. Secrets are masked. */
  getAll: async () => {
    const rows = await prisma.appSetting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
    const grouped: Record<string, ReturnType<typeof sanitizeSetting>[]> = {};
    for (const row of rows) {
      const cat = row.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(sanitizeSetting(row));
    }
    return grouped;
  },

  /** Return all settings for a specific category. Secrets are masked. */
  getByCategory: async (category: string) => {
    const rows = await prisma.appSetting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
    return rows.map(sanitizeSetting);
  },

  /**
   * Bulk upsert settings.
   * - Secret fields: only update if the new value is not a masked value (contains '••')
   */
  upsertMany: async (input: UpsertSettingsInput) => {
    const results = [];

    for (const { key, value, category: inputCategory, isSecret: inputIsSecret } of input.settings) {
      // Skip if the client sent back the masked placeholder
      if (value.includes('••')) continue;

      // Look up the metadata (isSecret, category, description) from defaults or DB
      const existing = await prisma.appSetting.findUnique({ where: { key } });
      const defaults = DEFAULT_SETTINGS.find((d) => d.key === key);

      const isSecret     = inputIsSecret    ?? existing?.isSecret    ?? defaults?.isSecret     ?? false;
      const category     = inputCategory    ?? existing?.category    ?? defaults?.category     ?? 'general';
      const description  = existing?.description  ?? defaults?.description  ?? null;

      const row = await prisma.appSetting.upsert({
        where:  { key },
        create: { key, value, isSecret, category, description },
        update: { value },
      });

      results.push(sanitizeSetting(row));
    }

    return results;
  },

  /**
   * Bulk delete settings by key.
   */
  deleteMany: async (keys: string[]) => {
    await prisma.appSetting.deleteMany({
      where: { key: { in: keys } },
    });
  },

  /**
   * Get raw (unmasked) value for internal backend use.
   */
  getRaw: async (key: string): Promise<string | null> => {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  },

  /**
   * Resolve a setting value strictly from the DB.
   *
   * Empty strings are treated as "not set" → return null. Aucun fallback env :
   * la source unique est AppSetting (configurée via /admin/settings). Le
   * paramètre `envFallback` est conservé pour la compatibilité de signature
   * mais ignoré — il sera retiré quand tous les call-sites seront nettoyés.
   */
  resolve: async (dbKey: string, _envFallbackIgnored?: string): Promise<string | null> => {
    const fromDb = await settingsService.getRaw(dbKey);
    if (fromDb && fromDb.trim().length > 0) {
      return fromDb;
    }
    return null;
  },

  /**
   * Get a single setting (masked if secret).
   */
  getOne: async (key: string) => {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    if (!row) throw new AppError(`Setting "${key}" not found`, 404);
    return sanitizeSetting(row);
  },

  /**
   * Liste les valeurs effectives résolues par le backend, en indiquant
   * d'où chaque valeur provient :
   *   - "db"      : la valeur AppSetting est non vide et est utilisée
   *   - "default" : aucune valeur DB → un défaut codé reste utilisable
   *   - "missing" : aucune valeur DB ET pas de défaut → à configurer
   *
   * Plus aucun fallback env runtime : la source unique est AppSetting.
   */
  listEffective: async () => {
    const rows = await prisma.appSetting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const result = rows.map((row) => {
      const dbValue = row.value?.trim() ?? '';

      let source: 'db' | 'default' | 'missing';
      let effective: string;

      if (dbValue.length > 0) {
        source = 'db';
        effective = dbValue;
      } else {
        const defaults = DEFAULT_SETTINGS.find((d) => d.key === row.key);
        if (defaults?.value && defaults.value.trim().length > 0) {
          source = 'default';
          effective = defaults.value;
        } else {
          source = 'missing';
          effective = '';
        }
      }

      return {
        key: row.key,
        category: row.category,
        isSecret: row.isSecret,
        description: row.description,
        source,
        envFallback: null,
        dbValue: row.isSecret ? (dbValue ? maskSecret(dbValue) : '') : dbValue,
        envValue: '',
        effective: row.isSecret ? (effective ? maskSecret(effective) : '') : effective,
      };
    });

    return result;
  },
};
