/**
 * Agents Controller
 *
 * Handlers HTTP pour les routes individuelles de chaque agent.
 * Ces routes permettent de tester chaque agent indépendamment.
 */

import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import {
  runPlannerAgent,
  runImageAnalystAgent,
  runTextAnalystAgent,
  runBrandAgent,
  runArtisticBaseAgent,
  runQualityAgent,
  upsertMemory
} from './agents.service';

// ─── Helper : récupération du travail avec vérification ownership ───

async function getTravailOrFail(travailId: string, userId: string, role: string) {
  const whereClause = role === 'ADMIN' ? { id: travailId } : { id: travailId, userId };
  const travail = await prisma.travail.findFirst({
    where: whereClause,
    include: {
      memoryEntries: {
        include: { memoryDefinition: true }
      },
      files: true,
      project: { include: { files: true } }
    }
  });

  if (!travail) {
    throw new AppError('Travail not found or access denied', 404);
  }

  return travail;
}

interface MemoryEntryWithDef {
  memoryDefinition: { key: string };
  content: unknown;
}

function getMemoryContent(memoryEntries: MemoryEntryWithDef[], memoryKey: string) {
  const mem = memoryEntries.find(m => m.memoryDefinition.key === memoryKey);
  return mem ? (mem.content as Record<string, unknown>) : null;
}

// ─── 1. PLANNER AGENT ───────────────────────────────────

export const runPlanner = asyncHandler(async (req: Request, res: Response) => {
  const { travailId } = req.params;
  const { provider, model } = req.body;

  const travail = await getTravailOrFail(travailId, req.user!.id, req.user!.role);
  const mSms = getMemoryContent(travail.memoryEntries, 'M_SMS');

  if (!mSms) {
    throw new AppError('M-SMS (demande client) est requis pour exécuter le Planner Agent.', 400);
  }

  const result = await runPlannerAgent({
    travailId,
    provider,
    model
  });

  // Sauvegarder les questions dans M-QT1
  await upsertMemory(travailId, 'M_QT1', {
    questions_to_user: result.questions_to_user,
    missing_information: result.missing_information,
    generated_at: new Date().toISOString()
  } as Record<string, unknown> as import('@prisma/client').Prisma.InputJsonValue);

  sendSuccess(res, 'Planner Agent exécuté avec succès', result);
});

// ─── 2. IMAGE ANALYST AGENT ─────────────────────────────

export const runImageAnalyst = asyncHandler(async (req: Request, res: Response) => {
  const { travailId } = req.params;
  const { provider, model, fileIds } = req.body;

  const travail = await getTravailOrFail(travailId, req.user!.id, req.user!.role);

  // Inclut les fichiers du travail ET les assets de marque du projet parent
  const allFiles = [...travail.files, ...travail.project.files];
  let files = allFiles;
  if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
    files = files.filter(f => fileIds.includes(f.id));
  }

  if (files.length === 0) {
    throw new AppError('Aucun fichier à analyser pour ce travail.', 400);
  }

  const results = await runImageAnalystAgent({
    travailId,
    files: files.map(f => ({
      id: f.id,
      fileUrl: f.fileUrl,
      fileType: f.fileType,
      originalName: f.originalName,
      usageType: f.usageType
    })),
    provider,
    model
  });

  // Sauvegarder dans M-MD
  await upsertMemory(travailId, 'M_MD', {
    analyses: results,
    file_count: results.length,
    generated_at: new Date().toISOString()
  } as Record<string, unknown> as import('@prisma/client').Prisma.InputJsonValue);

  sendSuccess(res, 'Image Analyst Agent exécuté avec succès', { count: results.length, analyses: results });
});

// ─── 3. TEXT ANALYST AGENT ──────────────────────────────

export const runTextAnalyst = asyncHandler(async (req: Request, res: Response) => {
  const { travailId } = req.params;
  const { provider, model } = req.body;

  const travail = await getTravailOrFail(travailId, req.user!.id, req.user!.role);
  const mSms = getMemoryContent(travail.memoryEntries, 'M_SMS');

  if (!mSms) {
    throw new AppError('M-SMS est requis pour exécuter le Text Analyst Agent.', 400);
  }

  // Construire un PlannerOutput minimal à partir des mémoires si disponible
  const plannerResult = {
    project_summary: (mSms.text as string) ?? '',
    poster_type: (travail.posterType as string) ?? 'Promotionnel',
    category: (travail.category as string) ?? 'Commerce',
    objective: 'Promotion',
    target_audience: 'Grand public',
    main_message: (mSms.text as string) ?? '',
    format: (travail.format as string) ?? 'Instagram',
    style: (travail.style as string) ?? 'Moderne',
    missing_information: [],
    questions_to_user: [],
    ready_for_next_step: true
  };

  const result = await runTextAnalystAgent({
    travailId,
    plannerResult,
    provider,
    model
  });

  sendSuccess(res, 'Text Analyst Agent exécuté avec succès', result);
});

// ─── 4. BRAND AGENT ─────────────────────────────────────

export const runBrand = asyncHandler(async (req: Request, res: Response) => {
  const { travailId } = req.params;
  const { provider, model } = req.body;

  const travail = await getTravailOrFail(travailId, req.user!.id, req.user!.role);
  const mSms = getMemoryContent(travail.memoryEntries, 'M_SMS');

  if (!mSms) {
    throw new AppError('M-SMS est requis pour exécuter le Brand Agent.', 400);
  }

  // Le logo vit côté Project (assets de marque) — pas côté Travail
  const logoFile = travail.project.files.find(f => f.usageType === 'LOGO') ?? null;

  const result = await runBrandAgent({
    travailId,
    logoFile: logoFile
      ? {
          id: logoFile.id,
          fileUrl: logoFile.fileUrl,
          fileType: logoFile.fileType,
          originalName: logoFile.originalName,
          usageType: logoFile.usageType
        }
      : null,
    provider,
    model
  });

  // Sauvegarder dans M-ID
  await upsertMemory(travailId, 'M_ID', result as unknown as import('@prisma/client').Prisma.InputJsonValue);

  sendSuccess(res, 'Brand Agent exécuté avec succès', result);
});

// ─── 5. ARTISTIC BASE AGENT ─────────────────────────────

export const runArtisticBase = asyncHandler(async (req: Request, res: Response) => {
  const { travailId } = req.params;
  const { provider, model } = req.body;

  const travail = await getTravailOrFail(travailId, req.user!.id, req.user!.role);

  // Construire un plannerResult minimal
  const plannerResult = {
    project_summary: '',
    poster_type: (travail.posterType as string) ?? 'Promotionnel',
    category: (travail.category as string) ?? 'Commerce',
    objective: 'Promotion',
    target_audience: 'Grand public',
    main_message: '',
    format: (travail.format as string) ?? 'Instagram',
    style: (travail.style as string) ?? 'Moderne',
    missing_information: [],
    questions_to_user: [],
    ready_for_next_step: true
  };

  // Récupérer les ressources artistiques filtrées par catégorie
  const artisticResources = await prisma.artisticResource.findMany({
    where: {
      OR: [{ category: plannerResult.category }, { category: { contains: plannerResult.poster_type, mode: 'insensitive' } }]
    },
    take: 20
  });

  const result = await runArtisticBaseAgent({
    travailId,
    plannerResult,
    artisticResources: artisticResources.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      resourceType: r.resourceType,
      description: r.description,
      tags: r.tags,
      content: r.content,
      url: r.url
    })),
    provider,
    model
  });

  // Sauvegarder dans M-BA
  await upsertMemory(travailId, 'M_BA', result as unknown as import('@prisma/client').Prisma.InputJsonValue);

  sendSuccess(res, 'Artistic Base Agent exécuté avec succès', result);
});

// ─── 6. PROMPT ARCHITECT AGENT ──────────────────────────

export const runPromptArchitect = asyncHandler(async (req: Request, res: Response) => {
  const { travailId } = req.params;

  const travail = await getTravailOrFail(travailId, req.user!.id, req.user!.role);
  const mSms = getMemoryContent(travail.memoryEntries, 'M_SMS');

  if (!mSms) {
    throw new AppError('M-SMS est requis pour exécuter le Prompt Architect Agent.', 400);
  }

  const mPrompt1Mem = getMemoryContent(travail.memoryEntries, 'M_PROMPT1');
  if (!mPrompt1Mem) {
    throw new AppError('Veuillez d\'abord exécuter l\'orchestrateur complet (POST /generate-final-prompt).', 400);
  }

  sendSuccess(res, 'M-PROMPT1 récupéré avec succès', mPrompt1Mem);
});

// ─── 7. QUALITY AGENT ───────────────────────────────────

export const runQuality = asyncHandler(async (req: Request, res: Response) => {
  const { travailId } = req.params;
  const { provider, model } = req.body;

  const travail = await getTravailOrFail(travailId, req.user!.id, req.user!.role);
  const mPrompt1 = getMemoryContent(travail.memoryEntries, 'M_PROMPT1');

  if (!mPrompt1) {
    throw new AppError('M-PROMPT1 n\'existe pas encore. Lancez d\'abord l\'orchestrateur.', 400);
  }

  const result = await runQualityAgent({
    travailId,
    mPrompt1: mPrompt1 as unknown as import('./agents.service').PromptArchitectOutput,
    provider,
    model
  });

  sendSuccess(res, 'Quality Agent exécuté avec succès', result);
});
