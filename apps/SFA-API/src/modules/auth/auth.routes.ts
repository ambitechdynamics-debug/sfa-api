import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { authController } from './auth.controller';

const router = Router();

router.get('/me', authMiddleware, asyncHandler(authController.me));

export default router;
