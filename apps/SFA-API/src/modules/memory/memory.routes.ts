import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { memoryController } from './memory.controller';
import {
  createMemorySchema,
  memoryParamsSchema,
  memoryKeyParamsSchema,
  updateMemorySchema
} from './memory.validation';

const router = Router();

router.use(authMiddleware);

router.post('/:projectId/memories', validate({ params: memoryParamsSchema, body: createMemorySchema }), asyncHandler(memoryController.create));
router.get('/:projectId/memories', validate({ params: memoryParamsSchema }), asyncHandler(memoryController.list));
router.get('/:projectId/memories/:memoryKey', validate({ params: memoryKeyParamsSchema }), asyncHandler(memoryController.getByKey));
router.patch(
  '/:projectId/memories/:memoryKey',
  validate({ params: memoryKeyParamsSchema, body: updateMemorySchema }),
  asyncHandler(memoryController.updateByKey)
);
router.delete('/:projectId/memories/:memoryKey', validate({ params: memoryKeyParamsSchema }), asyncHandler(memoryController.deleteByKey));

export default router;
