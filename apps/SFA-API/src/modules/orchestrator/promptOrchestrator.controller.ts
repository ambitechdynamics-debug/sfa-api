import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { runFullOrchestration } from './promptOrchestrator.service';

/**
 * POST /api/projects/:projectId/generate-final-prompt
 *
 * Endpoint orchestrateur principal.
 * Lance le workflow complet des 7 agents pour générer M-PROMPT1.
 */
export const generateFinalPrompt = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { provider, model, visionProvider, visionModel, force } = req.body;

  const result = await runFullOrchestration({
    projectId,
    userId: req.user!.id,
    userRole: req.user!.role,
    provider,
    model,
    visionProvider,
    visionModel,
    force
  });

  const statusCode = result.data.ready_for_generation ? 200 : 202;

  res.status(statusCode).json(result);
});

/**
 * GET /api/projects/:projectId/agent-runs
 *
 * Récupérer l'historique des exécutions d'agents pour un projet.
 */
export const getAgentRuns = asyncHandler(async (req: Request, res: Response) => {
  const { prisma } = await import('../../config/database');
  const { AppError } = await import('../../utils/appError');

  const { projectId } = req.params;
  const userId = req.user!.id;
  const role = req.user!.role;

  const whereClause = role === 'ADMIN' ? { id: projectId } : { id: projectId, userId };
  const project = await prisma.project.findFirst({
    where: whereClause,
    select: { id: true }
  });

  if (!project) {
    throw new AppError('Project not found or access denied', 404);
  }

  const agentRuns = await prisma.agentRun.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      agentName: true,
      provider: true,
      model: true,
      status: true,
      durationMs: true,
      error: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    message: 'Agent runs récupérés avec succès',
    data: {
      projectId,
      count: agentRuns.length,
      runs: agentRuns
    }
  });
});
