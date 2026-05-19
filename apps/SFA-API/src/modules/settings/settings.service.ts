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
  { key: 'default_model',                 value: 'gpt-4o',category: 'ia',          isSecret: false, description: 'Modèle IA par défaut' },
  { key: 'timeout_ms',                    value: '30000', category: 'ia',          isSecret: false, description: 'Timeout requête IA (ms)' },
  { key: 'max_retries',                   value: '3',     category: 'ia',          isSecret: false, description: 'Tentatives max en cas d\'erreur' },

  // Providers
  { key: 'openai_api_key',                value: '',      category: 'providers',   isSecret: true,  description: 'Clé API OpenAI' },
  { key: 'openai_model',                  value: 'gpt-4o',category: 'providers',   isSecret: false, description: 'Modèle OpenAI par défaut' },
  { key: 'anthropic_api_key',             value: '',      category: 'providers',   isSecret: true,  description: 'Clé API Anthropic' },
  { key: 'anthropic_model',               value: 'claude-3-5-sonnet-20241022', category: 'providers', isSecret: false, description: 'Modèle Anthropic par défaut' },
  { key: 'gemini_api_key',                value: '',      category: 'providers',   isSecret: true,  description: 'Clé API Google Gemini' },
  { key: 'gemini_model',                  value: 'gemini-2.0-flash', category: 'providers', isSecret: false, description: 'Modèle Gemini par défaut' },
  { key: 'text_ai_provider',              value: 'auto',  category: 'providers',   isSecret: false, description: 'Provider IA conversationnel (auto | openai | anthropic | gemini | mock)' },
  { key: 'chat_agent_name',               value: 'Studio Flyer AI', category: 'providers', isSecret: false, description: 'Nom affiché de l’agent conversationnel du dashboard client' },
  { key: 'chat_agent_system_prompt',      value: "Tu es l'assistant de chat interactif et intelligent de Studio Flyer AI. Ton but unique est d'aider l'utilisateur à concevoir son flyer étape par étape à travers une conversation fluide. Pose une seule question simple à la fois et propose des choix si approprié.", category: 'providers', isSecret: false, description: 'Prompt système de l’agent conversationnel du dashboard client' },
  { key: 'image_gen_provider',            value: 'mock',  category: 'providers',   isSecret: false, description: 'Provider de génération d\'image (mock | gemini | openai-image)' },
  { key: 'image_gen_model',               value: 'gemini-2.5-flash-image-preview', category: 'providers', isSecret: false, description: 'Modèle de génération d\'image (Nano Banana / Gemini Image)' },
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

export const settingsService = {
  /**
   * Ensure all default keys exist in the DB (run once on startup or on demand).
   */
  seed: async () => {
    let created = 0;
    for (const def of DEFAULT_SETTINGS) {
      const existing = await prisma.appSetting.findUnique({ where: { key: def.key } });
      if (!existing) {
        await prisma.appSetting.create({ data: def });
        created++;
      }
    }
    return { created };
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
   * Resolve a setting value with env-var fallback.
   *
   * Priority: AppSetting (DB) → process.env[envFallback] → null.
   * Empty strings in DB are treated as "not set" so they don't shadow env vars.
   *
   * Used by AI/image-gen providers so admins can manage keys from /admin/settings
   * without redeploying.
   */
  resolve: async (dbKey: string, envFallback?: string): Promise<string | null> => {
    const fromDb = await settingsService.getRaw(dbKey);
    if (fromDb && fromDb.trim().length > 0) {
      // Ignorer l'ancien prompt système par défaut pour forcer le nouveau prompt interactif pas-à-pas
      if (dbKey === 'chat_agent_system_prompt' && fromDb.includes('Tu es l’assistant IA de Flyer Studio.')) {
        return null;
      }
      return fromDb;
    }
    if (envFallback) {
      const fromEnv = process.env[envFallback];
      if (fromEnv && fromEnv.trim().length > 0) return fromEnv;
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
};
