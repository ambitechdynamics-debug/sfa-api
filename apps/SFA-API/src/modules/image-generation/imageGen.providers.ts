/**
 * Provider adapters for image generation.
 *
 * Strategy:
 *  - "mock"   → fetches a deterministic placeholder from picsum.photos (uses the prompt
 *               hash as seed). Keeps the full pipeline (upload to Cloudinary, DB record)
 *               functional in dev environments without an image-gen API key.
 *  - "gemini" → calls Google Gemini's image-generation model (formerly Nano Banana).
 *               Requires GEMINI_API_KEY in env.
 *  - "openai-image" → DALL-E-style (placeholder; not implemented yet, falls through).
 */

import { createHash } from 'node:crypto';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { settingsService } from '../settings/settings.service';
import { fetchAIWithTimeout } from '../ai/ai.providers';
import type { ImageGenAdapter, ImageGenInput, ImageGenProvider, ImageGenResult } from './imageGen.types';

const ALLOWED_PROVIDERS = new Set<ImageGenProvider>(['mock', 'gemini', 'openai-image']);

/**
 * Lit la config image-gen depuis l'AgentDefinition `Generator-Agent`
 * (source de vérité prioritaire pour qu'un admin puisse switcher provider/
 * model depuis /admin/agents). Retourne null si l'agent est manquant,
 * inactif, ou si son provider n'est pas un ImageGenProvider connu.
 */
async function resolveGeneratorAgentConfig(): Promise<{ provider: ImageGenProvider; model: string | null } | null> {
  const agent = await prisma.agentDefinition.findUnique({
    where: { key: 'Generator-Agent' },
    select: { provider: true, model: true, isActive: true },
  });
  if (!agent || !agent.isActive) return null;
  const p = agent.provider?.toLowerCase() as ImageGenProvider | undefined;
  if (!p || !ALLOWED_PROVIDERS.has(p)) return null;
  return { provider: p, model: agent.model || null };
}

/**
 * When no Generator-Agent is configured, piggyback on whatever provider the
 * orchestrator agents are already using. PROMPT_ARCHITECT_AGENT is the closest
 * semantic neighbour (it consumes the same prompt imageGen will). Any active
 * agent whose provider maps to a known image-gen provider works as fallback.
 */
async function resolveOrchestratorAgentFallback(): Promise<{ provider: ImageGenProvider; model: null } | null> {
  const candidates = await prisma.agentDefinition.findMany({
    where: {
      isActive: true,
      key: { in: ['PROMPT_ARCHITECT_AGENT', 'PLANNER_AGENT', 'BRAND_AGENT'] },
    },
    select: { provider: true },
  });
  for (const agent of candidates) {
    const raw = agent.provider?.toLowerCase() ?? '';
    // Treat any "gemini*" provider slug (e.g. "gemini", "gemini-01") as gemini
    // for image generation purposes.
    if (raw.startsWith('gemini')) return { provider: 'gemini', model: null };
    if (raw === 'openai' || raw === 'openai-image') return { provider: 'openai-image', model: null };
  }
  return null;
}

// ─── Utility to fetch image and convert to base64 ─────────────────────────────
async function fetchImageAsBase64(url: string): Promise<{ mimeType: string; data: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  return {
    mimeType,
    data: buffer.toString('base64')
  };
}

// ─── Aspect ratio → pixel dimensions ────────────────────────────────────────
// Utilisé uniquement par MockImageProvider (placeholder picsum.photos). Gemini
// reçoit l'aspectRatio brut via `generationConfig.imageConfig` et choisit lui-
// même la résolution finale, donc ces dimensions n'ont aucun effet sur la
// génération réelle.
//
// Externalisé en AppSetting `image_ratio_dims` (JSON) pour qu'un admin puisse
// l'ajuster sans déploiement. Fallback codé en dur en cas de JSON invalide.
const RATIO_DIMS_FALLBACK: Record<string, { w: number; h: number }> = {
  '1:1':  { w: 1024, h: 1024 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
  '3:4':  { w: 1080, h: 1440 },
  '4:3':  { w: 1440, h: 1080 },
};

async function resolveRatioDims(): Promise<Record<string, { w: number; h: number }>> {
  const raw = await settingsService.getRaw('image_ratio_dims');
  if (!raw) return RATIO_DIMS_FALLBACK;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // JSON invalide → fallback silencieux (le mock continue à fonctionner)
  }
  return RATIO_DIMS_FALLBACK;
}

async function pickDims(ratio?: string) {
  const dims = await resolveRatioDims();
  return dims[ratio ?? '1:1'] ?? dims['1:1'] ?? RATIO_DIMS_FALLBACK['1:1'];
}

function hashSeed(input: string): number {
  const hex = createHash('sha1').update(input).digest('hex').slice(0, 8);
  return parseInt(hex, 16);
}

// ─── Mock provider ───────────────────────────────────────────────────────────
class MockImageProvider implements ImageGenAdapter {
  async generate(input: ImageGenInput): Promise<ImageGenResult> {
    const { w, h } = await pickDims(input.aspectRatio);
    const seed = hashSeed(`${input.styleSeed ?? ''}::${input.prompt}::v${input.variationNumber}`);
    // picsum.photos accepts numeric seeds and returns deterministic JPEGs
    const url = `https://picsum.photos/seed/${seed}/${w}/${h}.jpg`;

    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      throw new AppError(`Mock image provider failed (${res.status})`, 502);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      buffer,
      mimeType: 'image/jpeg',
      fileName: `mock-${seed}-v${input.variationNumber}.jpg`,
      metadata: { seed, source: 'picsum.photos', dims: `${w}x${h}` },
    };
  }
}

// ─── Gemini provider ─────────────────────────────────────────────────────────
//
// Uses the `gemini-2.5-flash-image-preview` model (formerly Nano Banana).
// Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
// Returns images as inline base64 data in the response.

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { mimeType: string; data: string };
        text?: string;
      }>;
    };
  }>;
  promptFeedback?: { blockReason?: string };
}

/**
 * Resolve the Gemini API key. Source priority:
 *   1. AppSetting `gemini_api_key` (built-in slot).
 *   2. Any active custom provider declared as image-gen capable
 *      (`custom_<slug>_api_key` with `is_active=true` and
 *      `supports_image_generation=true`).
 *
 * This lets installs that drive the whole pipeline through a custom provider
 * (e.g. slug `gemini-01`) generate images with the same key the orchestrator
 * agents already use, without forcing the admin to duplicate it in the
 * built-in slot.
 */
async function resolveGeminiApiKey(): Promise<string | null> {
  const direct = await settingsService.getRaw('gemini_api_key');
  if (direct && direct.trim()) return direct.trim();

  const allSettings = await prisma.appSetting.findMany({
    where: { category: 'providers' },
    select: { key: true, value: true },
  });
  const byKey = new Map(allSettings.map((s) => [s.key, s.value]));

  const slugs = new Set<string>();
  for (const key of byKey.keys()) {
    const match = key.match(/^custom_(.+)_name$/);
    if (match) slugs.add(match[1]);
  }

  // First pass: providers explicitly declared as image-gen capable.
  for (const slug of slugs) {
    const isActive = byKey.get(`custom_${slug}_is_active`) === 'true';
    const supportsImage = byKey.get(`custom_${slug}_supports_image_generation`) === 'true';
    if (!isActive || !supportsImage) continue;
    const key = byKey.get(`custom_${slug}_api_key`);
    if (key && key.trim()) return key.trim();
  }
  // Second pass: any active Gemini-compatible provider — Gemini uses the same
  // API key for text and image endpoints, so the admin's "supports_image_*"
  // self-flag does not actually gate eligibility for image generation.
  for (const slug of slugs) {
    const isActive = byKey.get(`custom_${slug}_is_active`) === 'true';
    if (!isActive) continue;
    const type = (byKey.get(`custom_${slug}_type`) ?? '').toLowerCase();
    if (!type.includes('gemini')) continue;
    const key = byKey.get(`custom_${slug}_api_key`);
    if (key && key.trim()) return key.trim();
  }
  return null;
}

class GeminiImageProvider implements ImageGenAdapter {
  constructor(private readonly modelOverride: string | null = null) {}

  async generate(input: ImageGenInput): Promise<ImageGenResult> {
    // Clé API Gemini : built-in slot OR active custom provider declared as
    // image-gen capable. See resolveGeminiApiKey for the resolution order.
    const apiKey = await resolveGeminiApiKey();
    if (!apiKey) {
      throw new AppError(
        'Clé Gemini manquante. Renseignez "gemini_api_key" dans /admin/settings, ou activez un provider custom avec "supports_image_generation=true" dans /admin/settings.',
        500,
      );
    }

    // Modèle : Generator-Agent.model (DB) → AppSetting `image_gen_model` →
    // canonical Gemini image-output model. The orchestrator agents (text) run
    // on gemini-2.5-flash-lite; the publicly available Gemini model that
    // returns IMAGE responses via :generateContent is
    // gemini-2.0-flash-exp-image-generation. Admins can override via either
    // route if Google ships a different SKU on their plan.
    const GEMINI_IMAGE_MODEL_DEFAULT = 'gemini-2.0-flash-exp-image-generation';
    const rawModel =
      this.modelOverride ||
      (await settingsService.getRaw('image_gen_model')) ||
      GEMINI_IMAGE_MODEL_DEFAULT;
    const model = rawModel.trim();
    if (!model) {
      throw new AppError(
        'Aucun modèle de génération d\'image configuré. Renseignez "image_gen_model" (ex: gemini-2.5-flash-image-preview) dans /admin/settings, ou définissez le champ Model du Generator-Agent dans /admin/agents.',
        500,
      );
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.trim()}:generateContent?key=${apiKey}`;

    // Instructions textuelles par type d'asset utilisateur — guide Gemini sur
    // l'usage attendu de chaque image attachée.
    const ASSET_INSTRUCTIONS: Record<NonNullable<ImageGenInput['userAssets']>[number]['type'], string> = {
      logo:      "INSTRUCTION CRITIQUE — LOGO UTILISATEUR : Une image de LOGO est fournie. Tu DOIS l'intégrer telle quelle dans l'affiche, sans déformation, sans le redessiner, en respectant ses couleurs et proportions.",
      product:   "INSTRUCTION CRITIQUE — PRODUIT UTILISATEUR : Une image de PRODUIT est fournie. Mets-la en valeur comme sujet principal du visuel.",
      reference: "INSTRUCTION — INSPIRATION UTILISATEUR : Une image d'INSPIRATION est fournie. Inspire-toi de son ambiance, sa palette, sa composition.",
      poster:    "INSTRUCTION — AFFICHE DE RÉFÉRENCE : Une affiche existante est fournie comme repère stylistique.",
      character: "INSTRUCTION — PERSONNAGE PRINCIPAL : Une image de PERSONNAGE est fournie. Reprends-le fidèlement dans la composition.",
      other:     "INSTRUCTION — IMAGE COMPLÉMENTAIRE : Une image complémentaire est fournie pour contexte.",
    };

    const userAssets = input.userAssets ?? [];
    const userAssetInstructions = userAssets
      .map((a) => ASSET_INSTRUCTIONS[a.type])
      .filter(Boolean)
      .join('\n');

    const fullPrompt = [
      input.prompt,
      input.negativePrompt ? `\n\nÉvite absolument : ${input.negativePrompt}` : '',
      `\n\nVariation ${input.variationNumber} (style légèrement différent des autres variantes).`,
      input.layoutReferenceUrl ? `\n\nINSTRUCTION CRITIQUE DE GABARIT (Layout) : Utilise l'image de GABARIT fournie comme structure absolue au pixel près (composition, placement des éléments).` : '',
      input.styleReferenceUrl ? `\n\nINSTRUCTION CRITIQUE DE STYLE (Style Reference) : Utilise l'image de STYLE fournie pour cloner exactement l'esthétique (couleurs, textures, éclairage).` : '',
      userAssetInstructions ? `\n\n${userAssetInstructions}` : '',
    ].join('').trim();

    const parts: any[] = [{ text: fullPrompt }];

    if (input.layoutReferenceUrl) {
      try {
        const layoutImage = await fetchImageAsBase64(input.layoutReferenceUrl);
        parts.push({
          inlineData: {
            mimeType: layoutImage.mimeType,
            data: layoutImage.data
          }
        });
      } catch (err) {
        console.warn(`Could not fetch layout reference image: ${err}`);
      }
    }

    // Assets utilisateur — fetch chacun et ajoute en inlineData. En cas
    // d'échec sur un asset, on log et on continue (graceful degradation).
    for (const asset of userAssets) {
      try {
        const img = await fetchImageAsBase64(asset.url);
        parts.push({
          inlineData: { mimeType: img.mimeType, data: img.data },
        });
      } catch (err) {
        console.warn(`Could not fetch user ${asset.type} asset: ${err}`);
      }
    }

    if (input.styleReferenceUrl) {
      try {
        const styleImage = await fetchImageAsBase64(input.styleReferenceUrl);
        parts.push({
          inlineData: {
            mimeType: styleImage.mimeType,
            data: styleImage.data
          }
        });
      } catch (err) {
        console.warn(`Could not fetch style reference image: ${err}`);
      }
    }

    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        ...(input.aspectRatio && { imageConfig: { aspectRatio: input.aspectRatio } }),
      },
    };

    let res: Response;
    try {
      res = await fetchAIWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new AppError(`Gemini API unreachable: ${err instanceof Error ? err.message : 'Unknown'}`, 502);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new AppError(`Gemini Image API error (${res.status}): ${errText.slice(0, 300)}`, res.status >= 500 ? 502 : res.status);
    }

    const json = (await res.json()) as GeminiResponse;

    if (json.promptFeedback?.blockReason) {
      throw new AppError(`Image generation blocked: ${json.promptFeedback.blockReason}`, 400);
    }

    const responseParts = json.candidates?.[0]?.content?.parts ?? [];
    const imagePart = responseParts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new AppError('Gemini response did not contain an image', 502);
    }

    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
    return {
      buffer,
      mimeType: imagePart.inlineData.mimeType || 'image/png',
      fileName: `gemini-v${input.variationNumber}.png`,
      metadata: { model, provider: 'gemini' },
    };
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * Resolve the active image-generation provider and instantiate its adapter.
 *
 * Priority for the provider name:
 *  1. Explicit argument (caller override, e.g. admin testing with `?provider=mock`)
 *  2. AgentDefinition `Generator-Agent` row in DB (provider + model)
 *     → c'est le chemin canonique : changer Generator-Agent dans /admin/agents
 *       pilote effectivement la génération d'image.
 *  3. AppSetting "image_gen_provider" (compat ascendante)
 *  4. process.env IMAGE_GEN_PROVIDER (deployment fallback)
 *  5. "mock" default
 *
 * Pour Gemini, le model est récupéré de Generator-Agent.model si disponible,
 * sinon AppSetting `image_gen_model`, sinon défaut codé en dur.
 */
export async function createImageGenProvider(provider?: ImageGenProvider): Promise<ImageGenAdapter> {
  let resolved: ImageGenProvider | undefined = provider;
  let modelOverride: string | null = null;

  // (1) Override explicite via param API (route image-gen)
  // (2) Generator-Agent (DB) — provider + model
  if (!resolved) {
    const agentCfg = await resolveGeneratorAgentConfig();
    if (agentCfg) {
      resolved = agentCfg.provider;
      modelOverride = agentCfg.model;
    }
  }

  // (3) AppSetting `image_gen_provider`
  if (!resolved) {
    const fromSettings = await settingsService.getRaw('image_gen_provider');
    if (fromSettings && ALLOWED_PROVIDERS.has(fromSettings as ImageGenProvider)) {
      resolved = fromSettings as ImageGenProvider;
    }
  }

  // (4) Piggyback on the orchestrator agents. If PROMPT_ARCHITECT_AGENT (or
  // its peers) is already running on Gemini, the same provider can serve the
  // image generation service call — no need to require a Generator-Agent.
  if (!resolved) {
    const fallback = await resolveOrchestratorAgentFallback();
    if (fallback) resolved = fallback.provider;
  }

  // Aucun défaut : si rien n'est configuré, on erreur.
  if (!resolved) {
    throw new AppError(
      'Aucun provider de génération d\'image configuré. Choisissez "image_gen_provider" (mock | gemini | openai-image) dans /admin/settings, ou activez le Generator-Agent dans /admin/agents.',
      500,
    );
  }

  console.log(`[imageGen] provider=${resolved} modelOverride=${modelOverride ?? '(none)'}`);

  switch (resolved) {
    case 'gemini':       return new GeminiImageProvider(modelOverride);
    case 'openai-image': throw new AppError('OpenAI image provider not implemented yet', 501);
    case 'mock':         return new MockImageProvider();
    default:
      throw new AppError(`Provider de génération d'image "${resolved}" non supporté.`, 500);
  }
}
