import { NextFunction, Request, Response, Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/appError';
import { conversationsController } from './conversations.controller';

const router = Router();

function conversationAuthMiddleware(req: Request, res: Response, next: NextFunction) {
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

router.use(conversationAuthMiddleware);

router.get('/', asyncHandler(conversationsController.getConversations));
router.post('/', asyncHandler(conversationsController.createConversation));
router.get('/:id', asyncHandler(conversationsController.getConversationById));
router.patch('/:id', asyncHandler(conversationsController.updateConversation));
router.delete('/:id', asyncHandler(conversationsController.deleteConversation));

export default router;
