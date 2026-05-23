import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { runFullOrchestration } from './promptOrchestrator.service';
import { callVisionAI } from '../ai/ai.service';
import { AppError } from '../../utils/appError';

/**
 * POST /api/travaux/:travailId/generate-final-prompt
 *
 * Endpoint orchestrateur principal.
 * Lance le workflow complet des 7 agents pour générer M-PROMPT1.
 */
export const generateFinalPrompt = asyncHandler(async (req: Request, res: Response) => {
  const { travailId } = req.params;
  const { provider, model, visionProvider, visionModel, force } = req.body;

  const result = await runFullOrchestration({
    travailId,
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
 * POST /api/travaux/:travailId/extract-colors
 *
 * Uses vision AI to analyze an image and extract a color palette.
 * Returns { primary, secondary, accent, background, text } as hex strings.
 */
export const extractColors = asyncHandler(async (req: Request, res: Response) => {
  const { travailId } = req.params;
  const { imageUrl } = req.body as { imageUrl?: string };

  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new AppError('imageUrl is required', 400);
  }

  const response = await callVisionAI({
    imageUrls: [imageUrl],
    systemPrompt: `Tu es un expert en design graphique et identité visuelle.
Analyse l'image fournie et extrais une palette de couleurs harmonieuse en 5 valeurs hex.
Réponds UNIQUEMENT avec un objet JSON strict, sans markdown, sans texte autour.`,
    userPrompt: `Extrais les 5 couleurs dominantes de cette image et retourne-les sous forme JSON exactement comme ceci:
{
  "primary": "#xxxxxx",
  "secondary": "#xxxxxx",
  "accent": "#xxxxxx",
  "background": "#xxxxxx",
  "text": "#xxxxxx"
}
Règles: primary = couleur principale la plus représentative, secondary = couleur secondaire complémentaire, accent = couleur d'accentuation (peut être vive), background = couleur de fond idéale pour ce logo, text = couleur de texte lisible sur ce fond.`,
    responseFormat: 'json',
  });

  let colors: Record<string, string> = {};
  if (response.parsed && typeof response.parsed === 'object') {
    colors = response.parsed as Record<string, string>;
  }

  const hexRe = /^#[0-9a-fA-F]{6}$/;
  const safeColors = {
    primary:    hexRe.test(colors.primary    ?? '') ? colors.primary    : '#808080',
    secondary:  hexRe.test(colors.secondary  ?? '') ? colors.secondary  : '#2a2a2a',
    accent:     hexRe.test(colors.accent     ?? '') ? colors.accent     : '#a0a0a0',
    background: hexRe.test(colors.background ?? '') ? colors.background : '#111111',
    text:       hexRe.test(colors.text       ?? '') ? colors.text       : '#f0f0f0',
  };

  res.json({
    success: true,
    message: 'Couleurs extraites avec succès.',
    data: { travailId, colors: safeColors, provider: response.provider, model: response.model },
  });
});

/**
 * GET /api/travaux/:travailId/agent-runs
 *
 * Récupérer l'historique des exécutions d'agents pour un travail.
 */
export const getAgentRuns = asyncHandler(async (req: Request, res: Response) => {
  const { prisma } = await import('../../config/database');

  const { travailId } = req.params;
  const userId = req.user!.id;
  const role = req.user!.role;

  const whereClause = role === 'ADMIN' ? { id: travailId } : { id: travailId, userId };
  const travail = await prisma.travail.findFirst({
    where: whereClause,
    select: { id: true }
  });

  if (!travail) {
    throw new AppError('Travail not found or access denied', 404);
  }

  const agentRuns = await prisma.agentRun.findMany({
    where: { travailId },
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
      travailId,
      count: agentRuns.length,
      runs: agentRuns
    }
  });
});
