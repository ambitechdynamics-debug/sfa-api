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
import { AppError } from '../../utils/appError';
import { settingsService } from '../settings/settings.service';
import { fetchAIWithTimeout } from '../ai/ai.providers';
import type { ImageGenAdapter, ImageGenInput, ImageGenProvider, ImageGenResult } from './imageGen.types';

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
const RATIO_DIMS: Record<string, { w: number; h: number }> = {
  '1:1':  { w: 1024, h: 1024 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
  '3:4':  { w: 1080, h: 1440 },
  '4:3':  { w: 1440, h: 1080 },
};

function pickDims(ratio?: string) {
  return RATIO_DIMS[ratio ?? '1:1'] ?? RATIO_DIMS['1:1'];
}

function hashSeed(input: string): number {
  const hex = createHash('sha1').update(input).digest('hex').slice(0, 8);
  return parseInt(hex, 16);
}

// ─── Mock provider ───────────────────────────────────────────────────────────
class MockImageProvider implements ImageGenAdapter {
  async generate(input: ImageGenInput): Promise<ImageGenResult> {
    const { w, h } = pickDims(input.aspectRatio);
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

class GeminiImageProvider implements ImageGenAdapter {
  async generate(input: ImageGenInput): Promise<ImageGenResult> {
    // Resolve API key: DB (AppSetting "gemini_api_key") → env (GEMINI_API_KEY) → error
    const apiKey = await settingsService.resolve('gemini_api_key', 'GEMINI_API_KEY');
    if (!apiKey) {
      throw new AppError(
        'Clé Gemini manquante. Configurez "gemini_api_key" dans /admin/settings, ou définissez GEMINI_API_KEY dans .env, ou basculez "image_gen_provider" sur "mock".',
        500,
      );
    }

    // Resolve model: DB → env → default
    const model =
      (await settingsService.resolve('image_gen_model', 'IMAGE_GEN_MODEL')) ||
      'gemini-2.5-flash-image-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const fullPrompt = [
      input.prompt,
      input.negativePrompt ? `\n\nÉvite absolument : ${input.negativePrompt}` : '',
      `\n\nVariation ${input.variationNumber} (style légèrement différent des autres variantes).`,
      input.layoutReferenceUrl ? `\n\nINSTRUCTION CRITIQUE DE GABARIT (Layout) : Utilise l'image de GABARIT fournie comme structure absolue au pixel près (composition, placement des éléments).` : '',
      input.styleReferenceUrl ? `\n\nINSTRUCTION CRITIQUE DE STYLE (Style Reference) : Utilise l'image de STYLE fournie pour cloner exactement l'esthétique (couleurs, textures, éclairage).` : '',
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
 *  2. AppSetting "image_gen_provider" (DB — admin-editable in /admin/settings)
 *  3. process.env IMAGE_GEN_PROVIDER (deployment fallback)
 *  4. "mock" default
 */
export async function createImageGenProvider(provider?: ImageGenProvider): Promise<ImageGenAdapter> {
  let resolved: ImageGenProvider | undefined = provider;
  if (!resolved) {
    const fromSettings = await settingsService.resolve('image_gen_provider', 'IMAGE_GEN_PROVIDER');
    if (fromSettings && ['mock', 'gemini', 'openai-image'].includes(fromSettings)) {
      resolved = fromSettings as ImageGenProvider;
    }
  }
  resolved = resolved ?? 'mock';

  switch (resolved) {
    case 'gemini':       return new GeminiImageProvider();
    case 'openai-image': throw new AppError('OpenAI image provider not implemented yet', 501);
    case 'mock':
    default:             return new MockImageProvider();
  }
}
