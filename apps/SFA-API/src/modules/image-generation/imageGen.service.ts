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
 * Look up M_PROMPT1 content for a given project. Throws if not found.
 * Renvoie aussi le quality_score s'il est présent dans le payload
 * (utile pour la quality gate en amont de la génération).
 */
async function getPrompt1Content(projectId: string): Promise<{
  finalPrompt: string;
  negativePrompt?: string;
  qualityScore?: number;
}> {
  const def = await prisma.memoryDefinition.findUnique({ where: { key: 'M_PROMPT1' } });
  if (!def) {
    // Fallback historique (M-PROMPT1 tiret) — cf. AUDIT.md §3.
    const altDef = await prisma.memoryDefinition.findUnique({ where: { key: 'M-PROMPT1' } });
    if (!altDef) throw new AppError('Memory definition M_PROMPT1 not found. Run the orchestrator first.', 400);
    return getPrompt1Entry(projectId, altDef.id);
  }
  return getPrompt1Entry(projectId, def.id);
}

async function getPrompt1Entry(projectId: string, definitionId: string) {
  const entry = await prisma.memoryEntry.findUnique({
    where: { projectId_memoryDefinitionId: { projectId, memoryDefinitionId: definitionId } },
  });
  if (!entry) {
    throw new AppError('M_PROMPT1 entry not found for this project. Generate the prompt first.', 400);
  }
  const content = entry.content as Record<string, unknown>;
  const finalPrompt = (content.final_prompt as string) ?? (content.finalPrompt as string) ?? '';
  const negativePrompt = (content.negative_prompt as string) ?? (content.negativePrompt as string) ?? '';
  const qualityScoreRaw = content.quality_score ?? content.qualityScore ?? null;
  const qualityScore = typeof qualityScoreRaw === 'number' ? qualityScoreRaw : undefined;
  if (!finalPrompt.trim()) {
    throw new AppError('M_PROMPT1 contains no final_prompt text', 400);
  }
  return { finalPrompt, negativePrompt, qualityScore };
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

async function getArtisticBaseContent(projectId: string): Promise<{ layoutUrl?: string; styleUrl?: string }> {
  // L'orchestrateur écrit dans M_BA (underscore). On accepte aussi M-BA en
  // fallback pour ne pas casser les anciennes entrées créées par la version
  // précédente du service (cf. AUDIT.md §2 / §3 — bug write/read).
  const def =
    (await prisma.memoryDefinition.findUnique({ where: { key: 'M_BA' } })) ||
    (await prisma.memoryDefinition.findUnique({ where: { key: 'M-BA' } }));
  if (!def) return {};
  const entry = await prisma.memoryEntry.findUnique({
    where: { projectId_memoryDefinitionId: { projectId, memoryDefinitionId: def.id } },
  });
  if (!entry) return {};
  
  const content = entry.content as Record<string, unknown>;
  return {
    layoutUrl: (content.selected_model_url as string) || undefined,
    styleUrl: (content.selected_style_url as string) || undefined,
  };
}

async function ensureProjectAccess(projectId: string, userId: string, userRole: string) {
  const where: Prisma.ProjectWhereInput = userRole === 'ADMIN' ? { id: projectId } : { id: projectId, userId };
  const project = await prisma.project.findFirst({ where });
  if (!project) throw new AppError('Project not found or access denied', 404);
  return project;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface GenerateImagesInput {
  projectId: string;
  userId: string;
  userRole: string;
  /** Number of variations to produce (default: 4). */
  variations?: number;
  /** Optional explicit provider override. */
  provider?: ImageGenProvider;
}

export interface GenerateImagesResult {
  projectId: string;
  posters: GeneratedPoster[];
  durationMs: number;
}

export const imageGenService = {
  async generate(input: GenerateImagesInput): Promise<GenerateImagesResult> {
    const start = Date.now();
    const project = await ensureProjectAccess(input.projectId, input.userId, input.userRole);
    const { finalPrompt, negativePrompt, qualityScore } = await getPrompt1Content(project.id);

    // Quality gate : refuse de générer si le score Quality Agent est sous le
    // seuil configuré (par défaut 70). AppSetting `min_quality_score`.
    await ensureQualityAboveThreshold(qualityScore);

    // Récupération + validation des URLs de référence (cf. AUDIT.md §2).
    const { layoutUrl: rawLayoutUrl, styleUrl: rawStyleUrl } = await getArtisticBaseContent(project.id);
    const [layoutUrl, styleUrl] = await Promise.all([
      validateRemoteUrl(rawLayoutUrl),
      validateRemoteUrl(rawStyleUrl),
    ]);
    const variations = Math.min(8, Math.max(1, input.variations ?? 4));
    const ratio = ratioFromFormat(project.format);

    // Set status → GENERATING
    await prisma.project.update({ where: { id: project.id }, data: { status: 'GENERATING' } });

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
          styleSeed: project.style ?? project.id,
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

        // 3) Persist GeneratedPoster
        const poster = await prisma.generatedPoster.create({
          data: {
            userId:         project.userId,
            projectId:      project.id,
            imageUrl:       uploaded.fileUrl,
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
      // All failed → mark project as failed
      await prisma.project.update({ where: { id: project.id }, data: { status: 'FAILED' } });
      const reasons = failures.map((f) => (f.reason as Error)?.message ?? 'unknown').join(' | ');
      throw new AppError(`All image generations failed: ${reasons}`, 502);
    }

    // At least one succeeded → mark as GENERATED
    await prisma.project.update({ where: { id: project.id }, data: { status: 'GENERATED' } });

    return {
      projectId: project.id,
      posters,
      durationMs: Date.now() - start,
    };
  },

  async listForProject(projectId: string, userId: string, userRole: string): Promise<GeneratedPoster[]> {
    await ensureProjectAccess(projectId, userId, userRole);
    return prisma.generatedPoster.findMany({
      where: { projectId },
      orderBy: { variationNumber: 'asc' },
    });
  },

  async deletePoster(userId: string, projectId: string, posterId: string): Promise<{ id: string }> {
    const poster = await prisma.generatedPoster.findFirst({
      where: { id: posterId, projectId, userId },
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
    projectId: string;
    posterId: string;
    format?: 'png' | 'jpg' | 'pdf' | 'webp';
    width?: number;
    quality?: number;
  }): Promise<{ url: string; filename: string }> {
    const poster = await prisma.generatedPoster.findFirst({
      where:
        input.userRole === 'ADMIN'
          ? { id: input.posterId, projectId: input.projectId }
          : { id: input.posterId, projectId: input.projectId, userId: input.userId },
      include: { project: { select: { title: true } } },
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

    const safeTitle = (poster.project?.title || `project-${input.projectId}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'poster';
    const ext = input.format ?? 'jpg';
    const filename = `${safeTitle}-v${poster.variationNumber}.${ext}`;

    return { url: transformedUrl, filename };
  },
};
