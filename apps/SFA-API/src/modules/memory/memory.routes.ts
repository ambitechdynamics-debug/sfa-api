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

router.post('/:travailId/memories', validate({ params: memoryParamsSchema, body: createMemorySchema }), asyncHandler(memoryController.create));
router.get('/:travailId/memories', validate({ params: memoryParamsSchema }), asyncHandler(memoryController.list));
router.get('/:travailId/memories/:memoryKey', validate({ params: memoryKeyParamsSchema }), asyncHandler(memoryController.getByKey));
router.patch(
  '/:travailId/memories/:memoryKey',
  validate({ params: memoryKeyParamsSchema, body: updateMemorySchema }),
  asyncHandler(memoryController.updateByKey)
);
router.delete('/:travailId/memories/:memoryKey', validate({ params: memoryKeyParamsSchema }), asyncHandler(memoryController.deleteByKey));

export default router;
