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
import { getStorageProvider } from '../storage/storage.provider';
import { createImageGenProvider } from './imageGen.providers';
import type { ImageGenProvider } from './imageGen.types';

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
 * Look up M-PROMPT1 content for a given project. Throws if not found.
 */
async function getPrompt1Content(projectId: string): Promise<{ finalPrompt: string; negativePrompt?: string }> {
  const def = await prisma.memoryDefinition.findUnique({ where: { key: 'M_PROMPT1' } });
  if (!def) {
    // Some setups use 'M-PROMPT1' (with dash). Try both.
    const altDef = await prisma.memoryDefinition.findUnique({ where: { key: 'M-PROMPT1' } });
    if (!altDef) throw new AppError('Memory definition M-PROMPT1 not found. Run the orchestrator first.', 400);
    return getPrompt1Entry(projectId, altDef.id);
  }
  return getPrompt1Entry(projectId, def.id);
}

async function getPrompt1Entry(projectId: string, definitionId: string) {
  const entry = await prisma.memoryEntry.findUnique({
    where: { projectId_memoryDefinitionId: { projectId, memoryDefinitionId: definitionId } },
  });
  if (!entry) {
    throw new AppError('M-PROMPT1 entry not found for this project. Generate the prompt first.', 400);
  }
  const content = entry.content as Record<string, unknown>;
  const finalPrompt = (content.final_prompt as string) ?? (content.finalPrompt as string) ?? '';
  const negativePrompt = (content.negative_prompt as string) ?? (content.negativePrompt as string) ?? '';
  if (!finalPrompt.trim()) {
    throw new AppError('M-PROMPT1 contains no final_prompt text', 400);
  }
  return { finalPrompt, negativePrompt };
}

async function getArtisticBaseContent(projectId: string): Promise<{ layoutUrl?: string; styleUrl?: string }> {
  const def = await prisma.memoryDefinition.findUnique({ where: { key: 'M-BA' } });
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
    const { finalPrompt, negativePrompt } = await getPrompt1Content(project.id);
    const { layoutUrl, styleUrl } = await getArtisticBaseContent(project.id);
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

        // 2) Upload to Cloudinary
        const uploaded = await storage.uploadFile({
          buffer:       result.buffer,
          originalName: result.fileName,
          mimetype:     result.mimeType,
          usageType:    'GENERATED_POSTER',
        });

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
};
