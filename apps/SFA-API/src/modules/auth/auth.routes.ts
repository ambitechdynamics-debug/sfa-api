import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { adminJwtMiddleware } from '../../middlewares/adminJwt.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { authController } from './auth.controller';

const router = Router();

// Clerk-protected — used by the end-user client app.
router.get('/me', authMiddleware, asyncHandler(authController.me));

// Admin auth (email + password → JWT). Independent of Clerk.
router.post('/admin/login', asyncHandler(authController.adminLogin));
router.get('/admin/me', adminJwtMiddleware, asyncHandler(authController.adminMe));

export default router;
