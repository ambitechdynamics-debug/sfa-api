/**
 * Adaptateurs de providers IA.
 * Chaque provider implémente AIProviderAdapter.
 * En mode mock, des réponses JSON simulées sont retournées pour le développement.
 */

import { AIProviderAdapter, CallTextAIOptions, CallVisionAIOptions, AIProviderCapabilities } from './ai.types';
import { settingsService } from '../settings/settings.service';

// ─────────────────────────────────────────────────────────
//  TIMEOUT helper (cf. AUDIT.md §6 — câblage timeout_ms)
// ─────────────────────────────────────────────────────────
const DEFAULT_AI_TIMEOUT_MS = 60_000; // 60 s par appel provider

async function resolveAITimeoutMs(): Promise<number> {
  const raw = await settingsService.getRaw('timeout_ms');
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AI_TIMEOUT_MS;
}

/**
 * Wrapper fetch avec AbortController + timeout configurable.
 * Le timeout est lu depuis AppSetting `timeout_ms` (défaut 60 000 ms).
 */
export async function fetchAIWithTimeout(input: string, init?: RequestInit): Promise<Response> {
  const timeoutMs = await resolveAITimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`AI provider timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────
//  IMAGE → INLINE DATA helper (Gemini)
// ─────────────────────────────────────────────────────────
// Gemini's fileData.fileUri requires the URL to be fetchable by Google's
// infra. Cloudinary URLs are public but Google's fetcher hits "Cannot fetch
// content from the provided URL" intermittently. Workaround: download the
// image bytes ourselves and pass them as inlineData (base64).
// Cloudinary transformation is applied to cap size (1280px wide, JPEG, q_auto)
// so we don't blow past Gemini's request limits with large originals.
async function fetchImageAsInline(url: string): Promise<{ mimeType: string; data: string }> {
  let fetchUrl = url;
  if (/res\.cloudinary\.com\/.+\/image\/upload\//.test(url) && !/\/upload\/[a-z]_/.test(url)) {
    fetchUrl = url.replace('/image/upload/', '/image/upload/c_limit,w_1280,f_jpg,q_auto/');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(fetchUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Image fetch failed (${response.status}): ${fetchUrl}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = (response.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
    return { mimeType, data: buffer.toString('base64') };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Image fetch timed out after 15s: ${fetchUrl}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────
//  MOCK PROVIDER (développement sans clé API)
// ─────────────────────────────────────────────────────────

const MOCK_PLANNER = JSON.stringify({
  project_summary: "Affiche promotionnelle pour une boutique locale",
  poster_type: "Promotionnel",
  category: "Commerce",
  objective: "Attirer des clients vers la boutique",
  target_audience: "Grand public local",
  main_message: "Découvrez nos offres exclusives",
  format: "Instagram (1080×1080)",
  style: "Moderne et coloré",
  missing_information: ["Nom exact de la boutique", "Promotion spécifique"],
  questions_to_user: [
    "Quel est le nom exact de votre boutique ?",
    "Y a-t-il une promotion ou offre spéciale à mettre en avant ?"
  ],
  ready_for_next_step: true
});

const MOCK_IMAGE_ANALYST = JSON.stringify({
  image_type: "Logo ou référence visuelle",
  visual_style: "Moderne et minimaliste",
  main_colors: ["#1A1A2E", "#16213E"],
  secondary_colors: ["#E94560", "#FFFFFF"],
  color_codes: ["#1A1A2E", "#16213E", "#E94560"],
  typography_detected: "Sans-serif moderne",
  layout_description: "Composition centrée avec logo en haut et texte en bas",
  graphic_elements: ["Logo vectoriel", "Fond dégradé"],
  detected_text: ["Nom de marque"],
  detected_contact_info: [],
  logo_analysis: {
    is_logo_present: true,
    logo_position: "Centre haut",
    logo_style: "Minimaliste vectoriel",
    brand_feeling: "Professionnel et moderne"
  },
  quality_observations: ["Image nette", "Bonne résolution"],
  design_constraints: ["Respecter les couleurs de marque"],
  recommendations_for_creation: ["Utiliser les couleurs extraites comme palette principale"]
});

const MOCK_TEXT_ANALYST = JSON.stringify({
  main_title: "OFFRE SPÉCIALE",
  subtitle: "Profitez de nos promotions exclusives",
  description: "Découvrez une sélection de produits de qualité à prix réduits",
  call_to_action: "Visitez-nous dès maintenant !",
  corrected_text: "Offre Spéciale — Profitez de nos promotions exclusives. Visitez-nous dès maintenant !",
  text_hierarchy: {
    level_1: "OFFRE SPÉCIALE",
    level_2: "Profitez de nos promotions exclusives",
    level_3: "Visitez-nous dès maintenant !"
  }
});

const MOCK_BRAND_AGENT = JSON.stringify({
  brand_identity: {
    brand_name: "Ma Boutique",
    logo_url: "",
    slogan: "La qualité à votre service",
    visual_style: "Moderne et professionnel",
    typography: "Sans-serif bold pour titres, regular pour corps",
    specific_elements: ["Couleurs de marque", "Logo vectoriel"]
  },
  m_contact: {
    company_name: "Ma Boutique",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    website: "",
    facebook: "",
    instagram: ""
  },
  m_colors: {
    primary: "#1A1A2E",
    secondary: "#E94560",
    accent: "#16213E",
    extracted_colors: ["#1A1A2E", "#16213E", "#E94560", "#FFFFFF"],
    source: "Logo analysé"
  },
  missing_brand_information: ["Numéro de téléphone", "Adresse de la boutique"]
});

const MOCK_ARTISTIC_BASE = JSON.stringify({
  recommended_models: ["Affiche promotionnelle moderne", "Flyer commerce local"],
  recommended_textures: ["Fond dégradé sombre", "Texture subtile géométrique"],
  recommended_fonts: ["Montserrat Bold", "Open Sans Regular", "Bebas Neue"],
  recommended_palettes: ["Palette sombre + accent vif", "Bleu nuit et rouge dynamique"],
  recommended_styles: ["Minimaliste moderne", "High contrast"],
  forbidden_elements: [
    "Polices manuscrites illisibles",
    "Fond surchargé de textures",
    "Logo déformé ou pixelisé",
    "Contraste insuffisant texte/fond",
    "Informations de contact inventées",
    "Surcharge visuelle"
  ],
  quality_rules: [
    "Le texte principal doit être lisible à 2m",
    "Logo intégré sans déformation",
    "Minimum 72dpi pour les exports print",
    "Hiérarchie visuelle claire : titre > sous-titre > CTA"
  ]
});

const MOCK_PROMPT_ARCHITECT = JSON.stringify({
  final_prompt: `Créer une affiche professionnelle de type Promotionnel pour Ma Boutique.

Objectif :
Attirer des clients vers la boutique avec une offre promotionnelle.

Texte principal :
OFFRE SPÉCIALE

Texte secondaire :
Profitez de nos promotions exclusives

Informations de contact :
[À compléter par le client]

Style visuel :
Moderne et minimaliste, high contrast, fond sombre avec accent vif.

Direction artistique :
Composition centrée, logo en haut, titre impactant en milieu, CTA en bas. Utiliser un fond dégradé bleu nuit (#1A1A2E → #16213E) avec accent rouge (#E94560).

Couleurs :
Primaire : #1A1A2E | Secondaire : #E94560 | Accent : #16213E | Texte : #FFFFFF

Format :
Instagram carré 1080×1080px

Contraintes :
- respecter le logo ;
- respecter l'identité visuelle ;
- texte lisible ;
- composition équilibrée ;
- rendu professionnel qualité Photoshop ;
- ne pas inventer d'informations ;
- éviter les éléments interdits.`,
  negative_prompt: "Polices illisibles, fond surchargé, logo déformé, contraste faible, informations inventées, textures de mauvaise qualité, surcharge visuelle",
  poster_type: "Promotionnel",
  category: "Commerce",
  style: "Moderne minimaliste",
  format: "Instagram 1080×1080",
  main_text: "OFFRE SPÉCIALE — Profitez de nos promotions exclusives",
  contact_info: "À compléter",
  colors: ["#1A1A2E", "#E94560", "#16213E", "#FFFFFF"],
  visual_direction: "Fond sombre dégradé avec accent rouge vif, typographie bold sans-serif",
  quality_rules: ["Texte lisible à 2m", "Logo non déformé", "Hiérarchie visuelle claire"],
  missing_information: ["Numéro de téléphone", "Adresse"],
  ready_for_generation: true
});

const MOCK_QUALITY_AGENT = JSON.stringify({
  quality_score: 82,
  is_valid: true,
  issues: ["Informations de contact incomplètes"],
  recommendations: [
    "Demander le numéro de téléphone et l'adresse au client",
    "Le prompt est utilisable mais gagnerait en précision avec les contacts"
  ]
});

class MockProvider implements AIProviderAdapter {
  capabilities = {
    supportsText: true,
    supportsVision: true,
    supportsReasoning: false,
    supportsImageGeneration: false
  };

  async callText(options: CallTextAIOptions): Promise<string> {
    const prompt = options.userPrompt.toLowerCase();
    await new Promise(r => setTimeout(r, 100)); // Simuler latence

    if (prompt.includes('planner') || prompt.includes('analyser la demande')) return MOCK_PLANNER;
    if (prompt.includes('text analyst') || prompt.includes('corriger')) return MOCK_TEXT_ANALYST;
    if (prompt.includes('brand') || prompt.includes('identité visuelle')) return MOCK_BRAND_AGENT;
    if (prompt.includes('artistic') || prompt.includes('base artistique')) return MOCK_ARTISTIC_BASE;
    if (prompt.includes('prompt architect') || prompt.includes('prompt final')) return MOCK_PROMPT_ARCHITECT;
    if (prompt.includes('quality') || prompt.includes('vérifier')) return MOCK_QUALITY_AGENT;

    return JSON.stringify({ result: 'mock response', input: options.userPrompt.substring(0, 100) });
  }

  async callVision(_options: CallVisionAIOptions): Promise<string> {
    await new Promise(r => setTimeout(r, 150));
    return MOCK_IMAGE_ANALYST;
  }
}

// ─────────────────────────────────────────────────────────
//  OPENAI PROVIDER
// ─────────────────────────────────────────────────────────

class OpenAIProvider implements AIProviderAdapter {
  private apiKey: string;
  capabilities = {
    supportsText: true,
    supportsVision: true,
    supportsReasoning: true,
    supportsImageGeneration: true
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchOpenAI(body: object): Promise<string> {
    const response = await fetchAIWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content ?? '';
  }

  async callText(options: CallTextAIOptions): Promise<string> {
    return this.fetchOpenAI({
      model: options.model ?? 'gpt-4o',
      temperature: options.temperature ?? 0.7,
      response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: options.userPrompt }
      ]
    });
  }

  async callVision(options: CallVisionAIOptions): Promise<string> {
    const imageContent = options.imageUrls.map(url => ({
      type: 'image_url',
      image_url: { url, detail: 'high' }
    }));

    return this.fetchOpenAI({
      model: options.model ?? 'gpt-4o',
      temperature: options.temperature ?? 0.3,
      response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: options.systemPrompt },
        {
          role: 'user',
          content: [{ type: 'text', text: options.userPrompt }, ...imageContent]
        }
      ]
    });
  }
}

// ─────────────────────────────────────────────────────────
//  ANTHROPIC PROVIDER
// ─────────────────────────────────────────────────────────

class AnthropicProvider implements AIProviderAdapter {
  private apiKey: string;
  capabilities = {
    supportsText: true,
    supportsVision: true,
    supportsReasoning: false,
    supportsImageGeneration: false
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchClaude(body: object): Promise<string> {
    const response = await fetchAIWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      content: Array<{ text: string }>;
    };
    return data.content[0]?.text ?? '';
  }

  async callText(options: CallTextAIOptions): Promise<string> {
    return this.fetchClaude({
      model: options.model ?? 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: options.temperature ?? 0.7,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: options.userPrompt }]
    });
  }

  async callVision(options: CallVisionAIOptions): Promise<string> {
    const imageContent = options.imageUrls.map(url => ({
      type: 'image',
      source: { type: 'url', url }
    }));

    return this.fetchClaude({
      model: options.model ?? 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: options.systemPrompt,
      messages: [
        {
          role: 'user',
          content: [...imageContent, { type: 'text', text: options.userPrompt }]
        }
      ]
    });
  }
}

// ─────────────────────────────────────────────────────────
//  GEMINI PROVIDER
// ─────────────────────────────────────────────────────────

class GeminiProvider implements AIProviderAdapter {
  private apiKey: string;
  capabilities = {
    supportsText: true,
    supportsVision: true,
    supportsReasoning: false,
    supportsImageGeneration: false
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchGemini(model: string, body: object): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const response = await fetchAIWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    return data.candidates[0]?.content?.parts[0]?.text ?? '';
  }

  async callText(options: CallTextAIOptions): Promise<string> {
    const model = options.model ?? 'gemini-2.0-flash';
    return this.fetchGemini(model, {
      systemInstruction: { parts: [{ text: options.systemPrompt }] },
      contents: [{ parts: [{ text: options.userPrompt }], role: 'user' }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        responseMimeType: options.responseFormat === 'json' ? 'application/json' : 'text/plain'
      }
    });
  }

  async callVision(options: CallVisionAIOptions): Promise<string> {
    const model = options.model ?? 'gemini-2.0-flash';
    const imageParts = await Promise.all(
      options.imageUrls.map(async (url) => {
        const { mimeType, data } = await fetchImageAsInline(url);
        return { inlineData: { mimeType, data } };
      })
    );

    const parts = [
      { text: options.userPrompt },
      ...imageParts
    ];

    return this.fetchGemini(model, {
      systemInstruction: { parts: [{ text: options.systemPrompt }] },
      contents: [{ parts, role: 'user' }],
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        responseMimeType: options.responseFormat === 'json' ? 'application/json' : 'text/plain'
      }
    });
  }
}

// ─────────────────────────────────────────────────────────
//  DYNAMIC / CUSTOM PROVIDERS
// ─────────────────────────────────────────────────────────

class OpenAICompatibleProvider implements AIProviderAdapter {
  private apiKey: string;
  private baseUrl: string;
  capabilities: AIProviderCapabilities;

  constructor(apiKey: string, baseUrl: string, capabilities: AIProviderCapabilities) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.capabilities = capabilities;
  }

  private async fetchOpenAI(body: object): Promise<string> {
    const response = await fetchAIWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI-compatible API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content ?? '';
  }

  async callText(options: CallTextAIOptions): Promise<string> {
    return this.fetchOpenAI({
      model: options.model ?? 'gpt-4o',
      temperature: options.temperature ?? 0.7,
      response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: options.userPrompt }
      ]
    });
  }

  async callVision(options: CallVisionAIOptions): Promise<string> {
    const imageContent = options.imageUrls.map(url => ({
      type: 'image_url',
      image_url: { url, detail: 'high' }
    }));

    return this.fetchOpenAI({
      model: options.model ?? 'gpt-4o',
      temperature: options.temperature ?? 0.3,
      response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      messages: [
        { role: 'system', content: options.systemPrompt },
        {
          role: 'user',
          content: [{ type: 'text', text: options.userPrompt }, ...imageContent]
        }
      ]
    });
  }
}

class AnthropicCompatibleProvider implements AIProviderAdapter {
  private apiKey: string;
  private baseUrl: string;
  capabilities: AIProviderCapabilities;

  constructor(apiKey: string, baseUrl: string, capabilities: AIProviderCapabilities) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.capabilities = capabilities;
  }

  private async fetchClaude(body: object): Promise<string> {
    const response = await fetchAIWithTimeout(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic-compatible API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      content: Array<{ text: string }>;
    };
    return data.content[0]?.text ?? '';
  }

  async callText(options: CallTextAIOptions): Promise<string> {
    return this.fetchClaude({
      model: options.model ?? 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: options.temperature ?? 0.7,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: options.userPrompt }]
    });
  }

  async callVision(options: CallVisionAIOptions): Promise<string> {
    const imageContent = options.imageUrls.map(url => ({
      type: 'image',
      source: { type: 'url', url }
    }));

    return this.fetchClaude({
      model: options.model ?? 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: options.systemPrompt,
      messages: [
        {
          role: 'user',
          content: [...imageContent, { type: 'text', text: options.userPrompt }]
        }
      ]
    });
  }
}

class GeminiCompatibleProvider implements AIProviderAdapter {
  private apiKey: string;
  private baseUrl: string;
  capabilities: AIProviderCapabilities;

  constructor(apiKey: string, baseUrl: string, capabilities: AIProviderCapabilities) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.capabilities = capabilities;
  }

  private async fetchGemini(model: string, body: object): Promise<string> {
    const url = `${this.baseUrl}/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const response = await fetchAIWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini-compatible API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    return data.candidates[0]?.content?.parts[0]?.text ?? '';
  }

  async callText(options: CallTextAIOptions): Promise<string> {
    const model = options.model ?? 'gemini-2.0-flash';
    return this.fetchGemini(model, {
      systemInstruction: { parts: [{ text: options.systemPrompt }] },
      contents: [{ parts: [{ text: options.userPrompt }], role: 'user' }],
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        responseMimeType: options.responseFormat === 'json' ? 'application/json' : 'text/plain'
      }
    });
  }

  async callVision(options: CallVisionAIOptions): Promise<string> {
    const model = options.model ?? 'gemini-2.0-flash';
    const imageParts = await Promise.all(
      options.imageUrls.map(async (url) => {
        const { mimeType, data } = await fetchImageAsInline(url);
        return { inlineData: { mimeType, data } };
      })
    );

    const parts = [
      { text: options.userPrompt },
      ...imageParts
    ];

    return this.fetchGemini(model, {
      systemInstruction: { parts: [{ text: options.systemPrompt }] },
      contents: [{ parts, role: 'user' }],
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        responseMimeType: options.responseFormat === 'json' ? 'application/json' : 'text/plain'
      }
    });
  }
}

// ─────────────────────────────────────────────────────────
//  FACTORY
// ─────────────────────────────────────────────────────────

/**
 * Resolve API key + instantiate the right adapter.
 *
 * Keys are pulled from the AppSetting table first (admin-editable in
 * /admin/settings) and fall back to environment variables. This allows ops to
 * rotate keys without redeploying.
 */
export async function createProvider(provider: string): Promise<AIProviderAdapter> {
  switch (provider) {
    case 'openai': {
      const key = await settingsService.resolve('openai_api_key', 'OPENAI_API_KEY');
      if (!key) throw new Error('Clé OpenAI manquante (configurez "openai_api_key" dans /admin/settings ou OPENAI_API_KEY)');
      return new OpenAIProvider(key);
    }
    case 'anthropic': {
      const key = await settingsService.resolve('anthropic_api_key', 'ANTHROPIC_API_KEY');
      if (!key) throw new Error('Clé Anthropic manquante (configurez "anthropic_api_key" dans /admin/settings ou ANTHROPIC_API_KEY)');
      return new AnthropicProvider(key);
    }
    case 'gemini': {
      const key = await settingsService.resolve('gemini_api_key', 'GEMINI_API_KEY');
      if (!key) throw new Error('Clé Gemini manquante (configurez "gemini_api_key" dans /admin/settings ou GEMINI_API_KEY)');
      return new GeminiProvider(key);
    }
    case 'mock':
      return new MockProvider();
    default: {
      const slug = provider.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const prefix = `custom_${slug}_`;

      const [
        name, type, apiKey, baseUrl, defaultModel, isActive,
        supportsTextSetting, supportsVisionSetting, supportsReasoningSetting, supportsImageGenSetting
      ] = await Promise.all([
        settingsService.getRaw(`${prefix}name`),
        settingsService.getRaw(`${prefix}type`),
        settingsService.getRaw(`${prefix}api_key`),
        settingsService.getRaw(`${prefix}base_url`),
        settingsService.getRaw(`${prefix}default_model`),
        settingsService.getRaw(`${prefix}is_active`),
        settingsService.getRaw(`${prefix}supports_text`),
        settingsService.getRaw(`${prefix}supports_vision`),
        settingsService.getRaw(`${prefix}supports_reasoning`),
        settingsService.getRaw(`${prefix}supports_image_generation`),
      ]);

      if (!name) throw new Error(`Provider "${provider}" introuvable.`);
      if (isActive !== 'true') throw new Error(`Provider "${provider}" est désactivé.`);

      // Default values: supportsText is true if not explicitly set to 'false'
      let supportsText = supportsTextSetting === 'true' || supportsTextSetting === null;
      let supportsVision = supportsVisionSetting === 'true';
      let supportsReasoning = supportsReasoningSetting === 'true';
      let supportsImageGeneration = supportsImageGenSetting === 'true';

      // Special DeepSeek config override
      if (slug.includes('deepseek') || (defaultModel && defaultModel.toLowerCase().includes('deepseek'))) {
        supportsText = true;
        supportsVision = false;
        supportsImageGeneration = false;
        // supportsReasoning is true for deepseek-reasoner or if explicitly configured
        supportsReasoning = (defaultModel && defaultModel.toLowerCase().includes('reasoner')) || supportsReasoningSetting === 'true';
      }

      const capabilities: AIProviderCapabilities = {
        supportsText,
        supportsVision,
        supportsReasoning,
        supportsImageGeneration,
      };

      switch (type) {
        case 'openai-compatible':
          return new OpenAICompatibleProvider(apiKey!, baseUrl!, capabilities);
        case 'anthropic-compatible':
          return new AnthropicCompatibleProvider(apiKey!, baseUrl!, capabilities);
        case 'gemini-compatible':
          return new GeminiCompatibleProvider(apiKey!, baseUrl!, capabilities);
        default:
          throw new Error(`Type de provider "${type}" non supporté.`);
      }
    }
  }
}
