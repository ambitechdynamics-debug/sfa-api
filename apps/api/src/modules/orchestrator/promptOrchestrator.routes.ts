import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { GenerateFinalPromptSchema } from './promptOrchestrator.validation';
import { generateFinalPrompt, getAgentRuns } from './promptOrchestrator.controller';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

/**
 * POST /api/projects/:projectId/generate-final-prompt
 * Lance l'orchestration complète des 7 agents pour générer M-PROMPT1
 */
router.post(
  '/:projectId/generate-final-prompt',
  validate({ body: GenerateFinalPromptSchema }),
  generateFinalPrompt
);

/**
 * GET /api/projects/:projectId/agent-runs
 * Récupérer l'historique des runs d'agents
 */
router.get('/:projectId/agent-runs', getAgentRuns);

export default router;
