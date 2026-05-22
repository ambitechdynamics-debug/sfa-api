import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { imageGenController } from './imageGen.controller';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

// POST /api/projects/:projectId/generate-images
router.post('/:projectId/generate-images', asyncHandler(imageGenController.generate));

// GET /api/projects/:projectId/generated-posters
router.get('/:projectId/generated-posters', asyncHandler(imageGenController.list));

// DELETE /api/projects/:projectId/generated-posters/:posterId
router.delete('/:projectId/generated-posters/:posterId', asyncHandler(imageGenController.deletePoster));

// GET /api/projects/:projectId/generated-posters/:posterId/download
router.get('/:projectId/generated-posters/:posterId/download', asyncHandler(imageGenController.download));

export default router;
