import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { uxMetricsController } from './uxMetrics.controller';
import { createUxMetricEventSchema } from './uxMetrics.validation';

const router = Router();

router.use(authMiddleware);

router.post('/events', validate({ body: createUxMetricEventSchema }), asyncHandler(uxMetricsController.createEvent));
router.get('/summary', asyncHandler(uxMetricsController.getSummary));

export default router;
