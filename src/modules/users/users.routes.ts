import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { usersController } from './users.controller';
import { updateMeSchema } from './users.validation';

const router = Router();

router.get('/me', authMiddleware, asyncHandler(usersController.getMe));
router.patch('/me', authMiddleware, validate({ body: updateMeSchema }), asyncHandler(usersController.updateMe));

export default router;
