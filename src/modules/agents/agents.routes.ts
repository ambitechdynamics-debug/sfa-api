/**
 * Routes des agents individuels
 * POST /api/agents/planner/:projectId
 * POST /api/agents/analyze-images/:projectId
 * POST /api/agents/text/:projectId
 * POST /api/agents/brand/:projectId
 * POST /api/agents/artistic-base/:projectId
 * POST /api/agents/prompt-architect/:projectId
 * POST /api/agents/quality/:projectId
 */

import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  RunPlannerSchema,
  RunImageAnalystSchema,
  RunTextAnalystSchema,
  RunBrandAgentSchema,
  RunArtisticBaseSchema,
  RunPromptArchitectSchema,
  RunQualityAgentSchema
} from './agents.validation';
import {
  runPlanner,
  runImageAnalyst,
  runTextAnalyst,
  runBrand,
  runArtisticBase,
  runPromptArchitect,
  runQuality
} from './agents.controller';

const router = Router();

router.use(authMiddleware);

router.post('/planner/:projectId', validate({ body: RunPlannerSchema }), runPlanner);
router.post('/analyze-images/:projectId', validate({ body: RunImageAnalystSchema }), runImageAnalyst);
router.post('/text/:projectId', validate({ body: RunTextAnalystSchema }), runTextAnalyst);
router.post('/brand/:projectId', validate({ body: RunBrandAgentSchema }), runBrand);
router.post('/artistic-base/:projectId', validate({ body: RunArtisticBaseSchema }), runArtisticBase);
router.post('/prompt-architect/:projectId', validate({ body: RunPromptArchitectSchema }), runPromptArchitect);
router.post('/quality/:projectId', validate({ body: RunQualityAgentSchema }), runQuality);

export default router;
