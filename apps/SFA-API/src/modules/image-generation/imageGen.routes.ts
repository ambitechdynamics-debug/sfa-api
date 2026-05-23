import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { imageGenController } from './imageGen.controller';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

// POST /api/travaux/:travailId/generate-images
router.post('/:travailId/generate-images', asyncHandler(imageGenController.generate));

// GET /api/travaux/:travailId/generated-posters
router.get('/:travailId/generated-posters', asyncHandler(imageGenController.list));

// DELETE /api/travaux/:travailId/generated-posters/:posterId
router.delete('/:travailId/generated-posters/:posterId', asyncHandler(imageGenController.deletePoster));

// GET /api/travaux/:travailId/generated-posters/:posterId/download
router.get('/:travailId/generated-posters/:posterId/download', asyncHandler(imageGenController.download));

export default router;
