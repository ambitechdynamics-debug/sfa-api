import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { agentsDynamicController } from './agentsDynamic.controller';

const router = Router();

router.use(authMiddleware);

router.post('/:agentKey/run/:projectId', agentsDynamicController.runAgent);

export default router;
