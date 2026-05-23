import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { GenerateFinalPromptSchema } from './promptOrchestrator.validation';
import { generateFinalPrompt, getAgentRuns, extractColors } from './promptOrchestrator.controller';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

/**
 * POST /api/travaux/:travailId/generate-final-prompt
 * Lance l'orchestration complète des 7 agents pour générer M-PROMPT1
 */
router.post(
  '/:travailId/generate-final-prompt',
  validate({ body: GenerateFinalPromptSchema }),
  generateFinalPrompt
);

/**
 * POST /api/travaux/:travailId/extract-colors
 * Analyse un logo via le provider vision configuré et retourne une palette hex
 */
router.post('/:travailId/extract-colors', extractColors);

/**
 * GET /api/travaux/:travailId/agent-runs
 * Récupérer l'historique des runs d'agents
 */
router.get('/:travailId/agent-runs', getAgentRuns);

export default router;
