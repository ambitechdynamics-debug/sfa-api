import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { authController } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();

router.post('/register', validate({ body: registerSchema }), asyncHandler(authController.register));
router.post('/login', validate({ body: loginSchema }), asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.me));

export default router;
