import { NextFunction, Request, Response, Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/appError';
import { chatController } from './chat.controller';

const router = Router();

function chatAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  authMiddleware(req, res, (error?: unknown) => {
    if (!error) {
      next();
      return;
    }

    const statusCode = error instanceof AppError ? error.statusCode : 401;
    const message = error instanceof Error ? error.message : 'Authentication failed';
    res.status(statusCode).json({ success: false, error: message });
  });
}

router.post('/', chatAuthMiddleware, asyncHandler(chatController.sendMessage));
router.post('/opening', chatAuthMiddleware, asyncHandler(chatController.generateOpening));

router.all('/', (_req, res) => {
  res.status(405).json({ success: false, error: 'Method not allowed' });
});

export default router;
