import { prisma } from '../../config/database';

export const ARTISTIC_VISION_CONFIG_SETTING_KEY = 'artistic_vision_config';

export interface ArtisticVisionConfig {
  providerId: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}

export const DEFAULT_ARTISTIC_VISION_SYSTEM_PROMPT = `Tu es un expert en direction artistique et analyse visuelle pour le design graphique.
Analyse l'image fournie et extrais les informations pour remplir la base de ressources artistiques.
Tu dois répondre UNIQUEMENT avec un objet JSON valide suivant ce format strict :
{
  "title": "Un titre court et descriptif",
  "category": "Une catégorie appropriée (ex: Événement, Promotion, Corporate, etc. - invente si nécessaire)",
  "resourceType": "STYLE", // Doit être parmi: MODEL, TEXTURE, FONT, PALETTE, STYLE, REFERENCE
  "description": "Une description textuelle de l'image (composition, ambiance, usage)",
  "tags": ["tag1", "tag2", "tag3"],
  "content": {
    "colors": {
      "color_mood": "...",
      "contrast_notes": "...",
      "dominant_colors": ["..."],
      "recommended_color_codes": ["#..."]
    },
    "style_key": "...",
    "style_name": "...",
    "typography": {
      "title_style": "...",
      "badge_text_style": "...",
      "typography_rules": ["..."],
      "recommended_fonts": ["..."],
      "secondary_text_style": "..."
    },
    "composition": {
      "main_subject": "...",
      "title_position": "...",
      "background_style": "...",
      "layout_structure": "...",
      "visual_hierarchy": ["..."],
      "secondary_subjects": "...",
      "year_badge_position": "...",
      "description_position": "..."
    },
    "quality_rules": ["..."],
    "graphic_elements": {
      "elements_to_avoid": ["..."],
      "optional_elements": ["..."],
      "recommended_elements": ["..."]
    },
    "visual_description": {
      "mood": "...",
      "main_style": "...",
      "target_usage": ["..."],
      "visual_level": "premium"
    },
    "negative_prompt_rules": ["..."],
    "prompt_usage_instruction": "..."
  }
}

Assure-toi de respecter scrupuleusement cette structure JSON, en particulier pour le champ 'content'. Si un élément n'est pas applicable, mets une chaîne vide ou omet le, mais garde la structure globale.`;

export const DEFAULT_ARTISTIC_VISION_USER_PROMPT =
  'Analyse cette image et extrais les métadonnées requises au format JSON.';

const DEFAULT_CONFIG: ArtisticVisionConfig = {
  providerId: 'gemini',
  model: '',
  systemPrompt: DEFAULT_ARTISTIC_VISION_SYSTEM_PROMPT,
  userPrompt: DEFAULT_ARTISTIC_VISION_USER_PROMPT,
};

function cloneDefault(): ArtisticVisionConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as ArtisticVisionConfig;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  return value.trim() ? value : fallback;
}

export function normalizeArtisticVisionConfig(input: unknown): ArtisticVisionConfig {
  const record = asRecord(input);
  return {
    providerId: normalizeString(record.providerId, DEFAULT_CONFIG.providerId).trim() || DEFAULT_CONFIG.providerId,
    model: typeof record.model === 'string' ? record.model.trim() : DEFAULT_CONFIG.model,
    systemPrompt: normalizeString(record.systemPrompt, DEFAULT_CONFIG.systemPrompt),
    userPrompt: normalizeString(record.userPrompt, DEFAULT_CONFIG.userPrompt),
  };
}

export const artisticVisionConfigService = {
  get: async (): Promise<ArtisticVisionConfig> => {
    const row = await prisma.appSetting.findUnique({
      where: { key: ARTISTIC_VISION_CONFIG_SETTING_KEY },
      select: { value: true },
    });
    if (!row) return cloneDefault();
    try {
      return normalizeArtisticVisionConfig(JSON.parse(row.value));
    } catch {
      return cloneDefault();
    }
  },

  save: async (input: unknown): Promise<ArtisticVisionConfig> => {
    const config = normalizeArtisticVisionConfig(input);
    await prisma.appSetting.upsert({
      where: { key: ARTISTIC_VISION_CONFIG_SETTING_KEY },
      create: {
        key: ARTISTIC_VISION_CONFIG_SETTING_KEY,
        value: JSON.stringify(config, null, 2),
        category: 'artistic',
        isSecret: false,
        description: "Configuration de l'analyseur d'images de la base artistique (provider, modèle, prompt système).",
      },
      update: {
        value: JSON.stringify(config, null, 2),
        category: 'artistic',
        isSecret: false,
        description: "Configuration de l'analyseur d'images de la base artistique (provider, modèle, prompt système).",
      },
    });
    return config;
  },
};
