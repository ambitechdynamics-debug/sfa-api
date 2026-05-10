import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { forbiddenRulesController } from './forbiddenRules.controller';
import {
  createForbiddenRuleSchema,
  forbiddenRuleCategoryParamsSchema,
  forbiddenRuleIdParamsSchema,
  searchForbiddenRulesQuerySchema,
  updateForbiddenRuleSchema
} from './forbiddenRules.validation';

const router = Router();

// ─── PUBLIC / AGENT-ACCESSIBLE (auth required, but no admin) ──────────────────
router.get(
  '/forbidden-rules/active',
  authMiddleware,
  asyncHandler(forbiddenRulesController.active)
);
router.get(
  '/forbidden-rules/search',
  authMiddleware,
  validate({ query: searchForbiddenRulesQuerySchema }),
  asyncHandler(forbiddenRulesController.list)
);
router.get(
  '/forbidden-rules/by-category/:category',
  authMiddleware,
  validate({ params: forbiddenRuleCategoryParamsSchema }),
  asyncHandler(forbiddenRulesController.byCategory)
);
router.get(
  '/forbidden-rules/negative-prompt',
  authMiddleware,
  asyncHandler(forbiddenRulesController.buildNegativePrompt)
);

// ─── ADMIN ────────────────────────────────────────────────────────────────────
router.post(
  '/admin/forbidden-rules',
  authMiddleware,
  requireAdmin,
  validate({ body: createForbiddenRuleSchema }),
  asyncHandler(forbiddenRulesController.create)
);
router.get(
  '/admin/forbidden-rules',
  authMiddleware,
  requireAdmin,
  validate({ query: searchForbiddenRulesQuerySchema }),
  asyncHandler(forbiddenRulesController.list)
);
router.post(
  '/admin/forbidden-rules/seed',
  authMiddleware,
  requireAdmin,
  asyncHandler(forbiddenRulesController.seedDefaults)
);
router.post(
  '/admin/forbidden-rules/sync-memory',
  authMiddleware,
  requireAdmin,
  asyncHandler(forbiddenRulesController.syncToMemory)
);
router.get(
  '/admin/forbidden-rules/:id',
  authMiddleware,
  requireAdmin,
  validate({ params: forbiddenRuleIdParamsSchema }),
  asyncHandler(forbiddenRulesController.getById)
);
router.patch(
  '/admin/forbidden-rules/:id',
  authMiddleware,
  requireAdmin,
  validate({ params: forbiddenRuleIdParamsSchema, body: updateForbiddenRuleSchema }),
  asyncHandler(forbiddenRulesController.update)
);
router.post(
  '/admin/forbidden-rules/:id/toggle',
  authMiddleware,
  requireAdmin,
  validate({ params: forbiddenRuleIdParamsSchema }),
  asyncHandler(forbiddenRulesController.toggleStatus)
);
router.delete(
  '/admin/forbidden-rules/:id',
  authMiddleware,
  requireAdmin,
  validate({ params: forbiddenRuleIdParamsSchema }),
  asyncHandler(forbiddenRulesController.delete)
);

export default router;
