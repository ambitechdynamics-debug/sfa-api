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
  runPromptArchitectAgent,
  runQualityAgent,
  upsertMemory
} from './agents.service';

// ─── Helper : récupération du projet avec vérification ownership ───

async function getProjectOrFail(projectId: string, userId: string, role: string) {
  const whereClause = role === 'ADMIN' ? { id: projectId } : { id: projectId, userId };
  const project = await prisma.project.findFirst({
    where: whereClause,
    include: {
      memoryEntries: {
        include: { memoryDefinition: true }
      },
      files: true
    }
  });

  if (!project) {
    throw new AppError('Project not found or access denied', 404);
  }

  return project;
}

function getMemoryContent(memoryEntries: any[], memoryKey: string) {
  const mem = memoryEntries.find(m => m.memoryDefinition.key === memoryKey);
  return mem ? (mem.content as Record<string, unknown>) : null;
}

// ─── 1. PLANNER AGENT ───────────────────────────────────

export const runPlanner = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { provider, model } = req.body;

  const project = await getProjectOrFail(projectId, req.user!.id, req.user!.role);
  const mSms = getMemoryContent(project.memoryEntries, 'M_SMS');

  if (!mSms) {
    throw new AppError('M-SMS (demande client) est requis pour exécuter le Planner Agent.', 400);
  }

  const mQt2 = getMemoryContent(project.memoryEntries, 'M_QT2');
  const mMd = getMemoryContent(project.memoryEntries, 'M_MD');
  const mId = getMemoryContent(project.memoryEntries, 'M_ID');

  const result = await runPlannerAgent({
    projectId,
    mSms,
    mQt2,
    mMd,
    mId,
    provider,
    model
  });

  // Sauvegarder les questions dans M-QT1
  await upsertMemory(projectId, 'M_QT1', {
    questions_to_user: result.questions_to_user,
    missing_information: result.missing_information,
    generated_at: new Date().toISOString()
  } as Record<string, unknown> as import('@prisma/client').Prisma.InputJsonValue);

  sendSuccess(res, 'Planner Agent exécuté avec succès', result);
});

// ─── 2. IMAGE ANALYST AGENT ─────────────────────────────

export const runImageAnalyst = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { provider, model, fileIds } = req.body;

  const project = await getProjectOrFail(projectId, req.user!.id, req.user!.role);

  let files = project.files;
  if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
    files = files.filter(f => fileIds.includes(f.id));
  }

  if (files.length === 0) {
    throw new AppError('Aucun fichier à analyser pour ce projet.', 400);
  }

  const mSms = getMemoryContent(project.memoryEntries, 'M_SMS');

  const results = await runImageAnalystAgent({
    projectId,
    files: files.map(f => ({
      id: f.id,
      fileUrl: f.fileUrl,
      fileType: f.fileType,
      originalName: f.originalName,
      usageType: f.usageType
    })),
    mSms,
    provider,
    model
  });

  // Sauvegarder dans M-MD
  await upsertMemory(projectId, 'M_MD', {
    analyses: results,
    file_count: results.length,
    generated_at: new Date().toISOString()
  } as Record<string, unknown> as import('@prisma/client').Prisma.InputJsonValue);

  sendSuccess(res, 'Image Analyst Agent exécuté avec succès', { count: results.length, analyses: results });
});

// ─── 3. TEXT ANALYST AGENT ──────────────────────────────

export const runTextAnalyst = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { provider, model } = req.body;

  const project = await getProjectOrFail(projectId, req.user!.id, req.user!.role);
  const mSms = getMemoryContent(project.memoryEntries, 'M_SMS');

  if (!mSms) {
    throw new AppError('M-SMS est requis pour exécuter le Text Analyst Agent.', 400);
  }

  const mQt2 = getMemoryContent(project.memoryEntries, 'M_QT2');

  // Construire un PlannerOutput minimal à partir des mémoires si disponible
  const mQt1 = getMemoryContent(project.memoryEntries, 'M_QT1') as Record<string, unknown> | null;
  const plannerResult = {
    project_summary: (mSms.text as string) ?? '',
    poster_type: (project.posterType as string) ?? 'Promotionnel',
    category: (project.category as string) ?? 'Commerce',
    objective: 'Promotion',
    target_audience: 'Grand public',
    main_message: (mSms.text as string) ?? '',
    format: (project.format as string) ?? 'Instagram',
    style: (project.style as string) ?? 'Moderne',
    missing_information: [],
    questions_to_user: [],
    ready_for_next_step: true
  };

  const result = await runTextAnalystAgent({
    projectId,
    mSms,
    mQt2,
    plannerResult,
    provider,
    model
  });

  sendSuccess(res, 'Text Analyst Agent exécuté avec succès', result);
});

// ─── 4. BRAND AGENT ─────────────────────────────────────

export const runBrand = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { provider, model } = req.body;

  const project = await getProjectOrFail(projectId, req.user!.id, req.user!.role);
  const mSms = getMemoryContent(project.memoryEntries, 'M_SMS');

  if (!mSms) {
    throw new AppError('M-SMS est requis pour exécuter le Brand Agent.', 400);
  }

  const mQt2 = getMemoryContent(project.memoryEntries, 'M_QT2');
  const mMd = getMemoryContent(project.memoryEntries, 'M_MD');
  const mId = getMemoryContent(project.memoryEntries, 'M_ID');
  const logoFile = project.files.find(f => f.usageType === 'LOGO') ?? null;

  const result = await runBrandAgent({
    projectId,
    mSms,
    mQt2,
    mMd,
    mId,
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
  await upsertMemory(projectId, 'M_ID', result as unknown as import('@prisma/client').Prisma.InputJsonValue);

  sendSuccess(res, 'Brand Agent exécuté avec succès', result);
});

// ─── 5. ARTISTIC BASE AGENT ─────────────────────────────

export const runArtisticBase = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { provider, model } = req.body;

  const project = await getProjectOrFail(projectId, req.user!.id, req.user!.role);

  // Construire un plannerResult minimal
  const plannerResult = {
    project_summary: '',
    poster_type: (project.posterType as string) ?? 'Promotionnel',
    category: (project.category as string) ?? 'Commerce',
    objective: 'Promotion',
    target_audience: 'Grand public',
    main_message: '',
    format: (project.format as string) ?? 'Instagram',
    style: (project.style as string) ?? 'Moderne',
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

  const mBa = getMemoryContent(project.memoryEntries, 'M_BA');

  const result = await runArtisticBaseAgent({
    projectId,
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
    mBa,
    provider,
    model
  });

  // Sauvegarder dans M-BA
  await upsertMemory(projectId, 'M_BA', result as unknown as import('@prisma/client').Prisma.InputJsonValue);

  sendSuccess(res, 'Artistic Base Agent exécuté avec succès', result);
});

// ─── 6. PROMPT ARCHITECT AGENT ──────────────────────────

export const runPromptArchitect = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { provider, model } = req.body;

  const project = await getProjectOrFail(projectId, req.user!.id, req.user!.role);
  const mSms = getMemoryContent(project.memoryEntries, 'M_SMS');

  if (!mSms) {
    throw new AppError('M-SMS est requis pour exécuter le Prompt Architect Agent.', 400);
  }

  const mPrompt1Mem = getMemoryContent(project.memoryEntries, 'M_PROMPT1');
  if (!mPrompt1Mem) {
    throw new AppError('Veuillez d\'abord exécuter l\'orchestrateur complet (POST /generate-final-prompt).', 400);
  }

  sendSuccess(res, 'M-PROMPT1 récupéré avec succès', mPrompt1Mem);
});

// ─── 7. QUALITY AGENT ───────────────────────────────────

export const runQuality = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { provider, model } = req.body;

  const project = await getProjectOrFail(projectId, req.user!.id, req.user!.role);
  const mPrompt1 = getMemoryContent(project.memoryEntries, 'M_PROMPT1');

  if (!mPrompt1) {
    throw new AppError('M-PROMPT1 n\'existe pas encore. Lancez d\'abord l\'orchestrateur.', 400);
  }

  const allMemories: Record<string, unknown> = {};
  for (const mem of project.memoryEntries) {
    allMemories[mem.memoryDefinition.key] = mem.content;
  }

  const result = await runQualityAgent({
    projectId,
    mPrompt1: mPrompt1 as unknown as import('./agents.service').PromptArchitectOutput,
    allMemories,
    provider,
    model
  });

  sendSuccess(res, 'Quality Agent exécuté avec succès', result);
});
