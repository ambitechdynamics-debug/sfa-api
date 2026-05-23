import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../../middlewares/auth.middleware';
import { agentsDynamicController } from './agentsDynamic.controller';

const router = Router();

// Restreint à ADMIN : ce endpoint permet d'invoquer N'IMPORTE quel agent du
// registry, y compris les stubs avec provider=mock. Exposer ça aux clients
// finaux laisserait passer des appels qui retournent du JSON mocké et
// pourraient interférer avec le pipeline.
router.use(authMiddleware);
router.use(requireAdmin);

router.post('/:agentKey/run/:travailId', agentsDynamicController.runAgent);

export default router;
