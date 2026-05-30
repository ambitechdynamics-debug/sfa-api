/**
 * Image Generation Service
 *
 * Pipeline: prompt → image-gen provider → Cloudinary upload → GeneratedPoster row.
 *
 * Designed to run as the final stage of the orchestration, after M-PROMPT1 is ready.
 * Generates N parallel variations, persists each as a GeneratedPoster, and updates
 * Project.status accordingly.
 */

import { GeneratedPoster, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { logger } from '../../utils/logger';
import { getStorageProvider } from '../storage/storage.provider';
import { createImageGenProvider } from './imageGen.providers';
import type { ImageGenProvider } from './imageGen.types';
import { orchestratorPipelineService } from '../orchestrator/orchestratorPipeline.service';
import { composeOverlayForTravail } from './imageOverlay.service';

// ─── Helpers réutilisables (cf. AUDIT.md §2) ────────────────────────────────

const CLOUDINARY_RETRY_DELAYS_MS = [500, 1500, 4500];

async function uploadWithRetry<T>(label: string, op: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= CLOUDINARY_RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await op();
    } catch (err) {
      lastError = err;
      if (attempt === CLOUDINARY_RETRY_DELAYS_MS.length) break;
      const delay = CLOUDINARY_RETRY_DELAYS_MS[attempt];
      logger.warn(`[imageGen] ${label} attempt ${attempt + 1} failed; retrying in ${delay}ms`, {
        error: err instanceof Error ? err.message : err,
      });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} failed after retries`);
}

/**
 * Vérifie qu'une URL distante est joignable (HEAD), pour éviter de passer une
 * référence morte au générateur image. Retourne l'URL si OK, undefined sinon.
 */
async function validateRemoteUrl(url: string | undefined): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      logger.warn(`[imageGen] reference URL not reachable (${res.status}) — ignored: ${url}`);
      return undefined;
    }
    return url;
  } catch (err) {
    logger.warn('[imageGen] HEAD check failed; reference URL ignored', {
      url,
      error: err instanceof Error ? err.message : err,
    });
    return undefined;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map a project's `format` field to an aspect ratio understood by the image-gen
 * provider. Defaults to 1:1.
 */
function ratioFromFormat(format: string | null | undefined): '1:1' | '9:16' | '16:9' | '3:4' | '4:3' {
  if (!format) return '1:1';
  const f = format.toLowerCase();
  if (f === 'story' || f === '9:16' || f.includes('1080x1920')) return '9:16';
  if (f === 'banner' || f === '16:9' || f.includes('1920x1080')) return '16:9';
  if (f === 'a4' || f === '3:4' || f.includes('210x297') || f.includes('148x210')) return '3:4';
  if (f === '4:3') return '4:3';
  return '1:1';
}

/**
 * Resolve which MemoryDefinition key holds the prompt-architect output.
 *
 * Source of truth: the admin-configured orchestrator pipeline (the step whose
 * agentKey is `PROMPT_ARCHITECT_AGENT`). Falls back to `M_PROMPT1` then
 * `M-PROMPT1` for legacy/seeded installs.
 */
async function resolvePromptMemoryKeys(): Promise<string[]> {
  const keys: string[] = [];
  try {
    const config = await orchestratorPipelineService.getRuntimeConfig();
    const step = config.steps.find((s) => s.agentKey === 'PROMPT_ARCHITECT_AGENT');
    const configured = step?.outputMemoryKey?.trim();
    if (configured) keys.push(configured);
  } catch (err) {
    logger.warn('[imageGen] failed to load orchestrator pipeline config; falling back to legacy keys', {
      error: err instanceof Error ? err.message : err,
    });
  }
  for (const fallback of ['M_PROMPT1', 'M-PROMPT1']) {
    if (!keys.includes(fallback)) keys.push(fallback);
  }
  return keys;
}

/**
 * Accept both the legacy flat snake_case shape and the new nested camelCase
 * shape produced by the configurable pipeline.
 *
 * Legacy: { final_prompt, negative_prompt, quality_score }
 * New:    { finalPrompt: { prompt, negativePrompt, referenceImageUrls }, quality_score }
 */
function extractFinalPromptShape(content: unknown): {
  finalPrompt: string;
  negativePrompt: string;
  qualityScore?: number;
  referenceImageUrls?: string[];
} {
  const c = (content && typeof content === 'object' && !Array.isArray(content) ? content : {}) as Record<string, unknown>;

  let finalPrompt = '';
  let negativePrompt = '';
  let referenceImageUrls: string[] | undefined;

  const nested = c.finalPrompt;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const obj = nested as Record<string, unknown>;
    // Prompt text may live under a variety of keys depending on which prompt
    // template the architect agent followed (canonical "prompt", legacy
    // memory-style "M-PROMPT1", or a free-form key). We try the well-known
    // names first then fall back to the longest descriptive string in the
    // object.
    const PROMPT_KEYS = ['prompt', 'M-PROMPT1', 'M_PROMPT1', 'final_prompt', 'finalPrompt'];
    const NEGATIVE_KEYS = ['negativePrompt', 'negative_prompt', 'M-NEGATIVE'];
    const REFERENCE_KEYS = ['referenceImageUrls', 'reference_image_urls'];

    for (const key of PROMPT_KEYS) {
      if (typeof obj[key] === 'string' && (obj[key] as string).trim()) {
        finalPrompt = obj[key] as string;
        break;
      }
    }
    if (!finalPrompt) {
      // Fallback: pick the longest string value that isn't a negative-prompt
      // or reference-url field. Helps when the agent invents a custom key.
      const reservedKeys = new Set<string>([...NEGATIVE_KEYS, ...REFERENCE_KEYS]);
      let longest = '';
      for (const [key, value] of Object.entries(obj)) {
        if (reservedKeys.has(key)) continue;
        if (typeof value === 'string' && value.length > longest.length) longest = value;
      }
      if (longest.trim().length >= 40) finalPrompt = longest;
    }

    for (const key of NEGATIVE_KEYS) {
      if (typeof obj[key] === 'string' && (obj[key] as string).trim()) {
        negativePrompt = obj[key] as string;
        break;
      }
    }

    for (const key of REFERENCE_KEYS) {
      if (Array.isArray(obj[key])) {
        referenceImageUrls = (obj[key] as unknown[]).filter((u): u is string => typeof u === 'string');
        break;
      }
    }
  } else {
    // Flat shape. Accept canonical "prompt"/"negativePrompt", legacy snake
    // "final_prompt"/"negative_prompt", and the earlier "finalPrompt" string.
    finalPrompt =
      typeof c.prompt === 'string'
        ? c.prompt
        : typeof c.final_prompt === 'string'
          ? c.final_prompt
          : typeof c.finalPrompt === 'string'
            ? c.finalPrompt
            : '';
    negativePrompt =
      typeof c.negativePrompt === 'string'
        ? c.negativePrompt
        : typeof c.negative_prompt === 'string'
          ? c.negative_prompt
          : '';
    if (Array.isArray(c.referenceImageUrls)) {
      referenceImageUrls = c.referenceImageUrls.filter((u): u is string => typeof u === 'string');
    }
  }

  const qualityScoreRaw = c.quality_score ?? c.qualityScore ?? null;
  const qualityScore = typeof qualityScoreRaw === 'number' ? qualityScoreRaw : undefined;

  return { finalPrompt, negativePrompt, qualityScore, referenceImageUrls };
}

/**
 * Look up the prompt-architect memory entry for a given travail.
 *
 * Resolves the memory key dynamically from the orchestrator pipeline config
 * (falls back to legacy `M_PROMPT1` / `M-PROMPT1`). Accepts both the legacy
 * flat shape and the new nested camelCase shape.
 */
async function getPrompt1Content(travailId: string): Promise<{
  finalPrompt: string;
  negativePrompt?: string;
  qualityScore?: number;
  referenceImageUrls?: string[];
}> {
  const candidateKeys = await resolvePromptMemoryKeys();

  let resolvedKey: string | null = null;
  let definitionId: string | null = null;
  for (const key of candidateKeys) {
    const def = await prisma.memoryDefinition.findUnique({ where: { key } });
    if (def) {
      resolvedKey = key;
      definitionId = def.id;
      break;
    }
  }
  if (!definitionId || !resolvedKey) {
    throw new AppError(
      `Prompt memory not found. Expected one of: ${candidateKeys.join(', ')}. Run the orchestrator first.`,
      400,
    );
  }

  const entry = await prisma.memoryEntry.findUnique({
    where: { travailId_memoryDefinitionId: { travailId, memoryDefinitionId: definitionId } },
  });
  if (!entry) {
    throw new AppError(`${resolvedKey} entry not found for this travail. Generate the prompt first.`, 400);
  }

  const shape = extractFinalPromptShape(entry.content);
  if (!shape.finalPrompt.trim()) {
    throw new AppError(`${resolvedKey} contains no final prompt text`, 400);
  }
  return shape;
}

/**
 * Refuse la génération si le quality_score est en-dessous du seuil configuré.
 * Seuil lu via AppSetting `min_quality_score` (défaut 70). Mettre 0 pour désactiver.
 */
async function ensureQualityAboveThreshold(qualityScore?: number): Promise<void> {
  // Import dynamique pour éviter cycles d'import éventuels.
  const { settingsService } = await import('../settings/settings.service');
  const raw = await settingsService.getRaw('min_quality_score');
  const threshold = raw && !Number.isNaN(Number(raw)) ? Number(raw) : 70;
  if (threshold <= 0) return; // gate désactivée
  if (typeof qualityScore !== 'number') {
    // Pas de score → on laisse passer pour ne pas bloquer les anciens projets.
    return;
  }
  if (qualityScore < threshold) {
    throw new AppError(
      `Le prompt n'a pas atteint le seuil de qualité requis (${qualityScore}/100, seuil ${threshold}). Améliorez le brief ou relancez l'orchestrateur.`,
      400,
    );
  }
}

async function getArtisticBaseContent(travailId: string): Promise<{ layoutUrl?: string; styleUrl?: string }> {
  // L'orchestrateur écrit dans M_BA (underscore). On accepte aussi M-BA en fallback.
  const def =
    (await prisma.memoryDefinition.findUnique({ where: { key: 'M_BA' } })) ||
    (await prisma.memoryDefinition.findUnique({ where: { key: 'M-BA' } }));
  if (!def) return {};
  const entry = await prisma.memoryEntry.findUnique({
    where: { travailId_memoryDefinitionId: { travailId, memoryDefinitionId: def.id } },
  });
  if (!entry) return {};
  
  const content = entry.content as Record<string, unknown>;
  return {
    layoutUrl: (content.selected_model_url as string) || undefined,
    styleUrl: (content.selected_style_url as string) || undefined,
  };
}

async function ensureTravailAccess(travailId: string, userId: string, userRole: string) {
  const where: Prisma.TravailWhereInput = userRole === 'ADMIN' ? { id: travailId } : { id: travailId, userId };
  const travail = await prisma.travail.findFirst({
    where,
    include: { project: { select: { id: true, title: true } } },
  });
  if (!travail) throw new AppError('Travail not found or access denied', 404);
  return travail;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface GenerateImagesInput {
  travailId: string;
  userId: string;
  userRole: string;
  /** Number of variations to produce (default: 4). */
  variations?: number;
  /** Optional explicit provider override. */
  provider?: ImageGenProvider;
}

export interface GenerateImagesResult {
  travailId: string;
  posters: GeneratedPoster[];
  durationMs: number;
}

export const imageGenService = {
  async generate(input: GenerateImagesInput): Promise<GenerateImagesResult> {
    const start = Date.now();
    const travail = await ensureTravailAccess(input.travailId, input.userId, input.userRole);
    const { finalPrompt, negativePrompt, qualityScore } = await getPrompt1Content(travail.id);

    // Quality gate : refuse de générer si le score Quality Agent est sous le
    // seuil configuré (par défaut 70). AppSetting `min_quality_score`.
    await ensureQualityAboveThreshold(qualityScore);

    // Récupération + validation des URLs de référence.
    const { layoutUrl: rawLayoutUrl, styleUrl: rawStyleUrl } = await getArtisticBaseContent(travail.id);
    const [layoutUrl, styleUrl] = await Promise.all([
      validateRemoteUrl(rawLayoutUrl),
      validateRemoteUrl(rawStyleUrl),
    ]);

    const variations = Math.min(8, Math.max(1, input.variations ?? 4));
    const ratio = ratioFromFormat(travail.format);

    // Set status → GENERATING
    await prisma.travail.update({ where: { id: travail.id }, data: { status: 'GENERATING' } });

    const adapter = await createImageGenProvider(input.provider);
    const storage = getStorageProvider();

    // Generate N variations in parallel; each variation gets its own seed via variationNumber
    const settled = await Promise.allSettled(
      Array.from({ length: variations }, async (_, i) => {
        const variationNumber = i + 1;

        // 1) Generate image
        const result = await adapter.generate({
          prompt: finalPrompt,
          negativePrompt,
          aspectRatio: ratio,
          variationNumber,
          styleSeed: travail.style ?? travail.id,
          layoutReferenceUrl: layoutUrl,
          styleReferenceUrl: styleUrl,
        });

        // 2) Upload to Cloudinary avec retry exponentiel (3 tentatives)
        const uploaded = await uploadWithRetry(`cloudinary upload v${variationNumber}`, () =>
          storage.uploadFile({
            buffer:       result.buffer,
            originalName: result.fileName,
            mimetype:     result.mimeType,
            usageType:    'GENERATED_POSTER',
          })
        );

        // 2.bis) Compose overlay (title / subtitle / services / CTA) on top
        // of the raw background if LAYOUT_OVERLAY_AGENT produced a M-OVERLAY
        // entry for this travail. composeOverlayForTravail returns null when
        // no overlay spec exists — we keep the raw URL in that case.
        let finalUrl = uploaded.fileUrl;
        try {
          const composed = await composeOverlayForTravail(travail.id, uploaded.fileUrl, variationNumber);
          if (composed) finalUrl = composed;
        } catch {
          // composeOverlayForTravail already logs internally — fail soft.
        }

        // 3) Persist GeneratedPoster
        const poster = await prisma.generatedPoster.create({
          data: {
            userId:         travail.userId,
            travailId:      travail.id,
            imageUrl:       finalUrl,
            promptUsed:     finalPrompt,
            variationNumber,
            status:         'GENERATED',
          },
        });

        return poster;
      }),
    );

    const posters = settled
      .filter((r): r is PromiseFulfilledResult<GeneratedPoster> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failures = settled.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    if (posters.length === 0) {
      // All failed → mark travail as failed
      await prisma.travail.update({ where: { id: travail.id }, data: { status: 'FAILED' } });
      const reasons = failures.map((f) => (f.reason as Error)?.message ?? 'unknown').join(' | ');
      throw new AppError(`All image generations failed: ${reasons}`, 502);
    }

    // At least one succeeded → mark as GENERATED
    await prisma.travail.update({ where: { id: travail.id }, data: { status: 'GENERATED' } });

    return {
      travailId: travail.id,
      posters,
      durationMs: Date.now() - start,
    };
  },

  async listForTravail(travailId: string, userId: string, userRole: string): Promise<GeneratedPoster[]> {
    await ensureTravailAccess(travailId, userId, userRole);
    return prisma.generatedPoster.findMany({
      where: { travailId },
      orderBy: { variationNumber: 'asc' },
    });
  },

  async deletePoster(userId: string, travailId: string, posterId: string): Promise<{ id: string }> {
    const poster = await prisma.generatedPoster.findFirst({
      where: { id: posterId, travailId, userId },
    });
    if (!poster) throw new AppError('Poster not found', 404);
    await prisma.generatedPoster.delete({ where: { id: posterId } });
    return { id: posterId };
  },

  /**
   * Build a Cloudinary-transformed URL for a poster, ready to serve as a
   * download. Supports format conversion (PNG/JPG/PDF/WEBP), resizing and
   * quality control via Cloudinary's URL-based transformation API.
   *
   * The returned URL points to Cloudinary's CDN — callers can either 302-redirect
   * the user to it or stream the bytes through their own response.
   */
  async buildDownloadUrl(input: {
    userId: string;
    userRole: string;
    travailId: string;
    posterId: string;
    format?: 'png' | 'jpg' | 'pdf' | 'webp';
    width?: number;
    quality?: number;
  }): Promise<{ url: string; filename: string }> {
    const poster = await prisma.generatedPoster.findFirst({
      where:
        input.userRole === 'ADMIN'
          ? { id: input.posterId, travailId: input.travailId }
          : { id: input.posterId, travailId: input.travailId, userId: input.userId },
      include: { travail: { select: { title: true, project: { select: { title: true } } } } },
    });
    if (!poster) throw new AppError('Poster not found', 404);

    const baseUrl = poster.imageUrl;
    if (!baseUrl.includes('/upload/')) {
      // Pas une URL Cloudinary reconnaissable — on renvoie l'URL brute.
      return { url: baseUrl, filename: `poster-${poster.variationNumber}` };
    }

    const parts: string[] = [];
    if (input.format) {
      parts.push(`f_${input.format}`);
    } else {
      parts.push('f_auto');
    }
    if (typeof input.quality === 'number' && input.quality > 0 && input.quality <= 100) {
      parts.push(`q_${Math.round(input.quality)}`);
    } else {
      parts.push('q_auto');
    }
    if (typeof input.width === 'number' && input.width > 0 && input.width <= 4096) {
      parts.push(`w_${Math.round(input.width)}`);
      parts.push('c_limit'); // ne pas upscaler
    }
    parts.push('fl_attachment'); // demande à Cloudinary de renvoyer Content-Disposition: attachment

    const transformedUrl = baseUrl.replace('/upload/', `/upload/${parts.join(',')}/`);

    const safeTitle = (poster.travail?.title || poster.travail?.project?.title || `travail-${input.travailId}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'poster';
    const ext = input.format ?? 'jpg';
    const filename = `${safeTitle}-v${poster.variationNumber}.${ext}`;

    return { url: transformedUrl, filename };
  },
};
