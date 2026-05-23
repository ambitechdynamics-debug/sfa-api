import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { travauxController } from './travaux.controller';
import {
  createTravailSchema,
  projectIdParamsSchema,
  travailIdParamsSchema,
  updateTravailSchema
} from './travaux.validation';

/**
 * Router monté à la racine /api/v1 — gère deux familles :
 *   POST /api/v1/projects/:projectId/travaux        → create
 *   GET  /api/v1/travaux?projectId=...              → list
 *   GET  /api/v1/travaux/:travailId                 → getById
 *   PATCH /api/v1/travaux/:travailId                → update
 *   DELETE /api/v1/travaux/:travailId               → delete
 */
const router = Router();

router.use(authMiddleware);

// Create scoped under a project
router.post(
  '/projects/:projectId/travaux',
  validate({ params: projectIdParamsSchema, body: createTravailSchema }),
  asyncHandler(travauxController.create)
);

// Flat travaux endpoints
router.get('/travaux', asyncHandler(travauxController.list));
router.get('/travaux/:travailId', validate({ params: travailIdParamsSchema }), asyncHandler(travauxController.getById));
router.patch(
  '/travaux/:travailId',
  validate({ params: travailIdParamsSchema, body: updateTravailSchema }),
  asyncHandler(travauxController.update)
);
router.delete('/travaux/:travailId', validate({ params: travailIdParamsSchema }), asyncHandler(travauxController.delete));

export default router;
