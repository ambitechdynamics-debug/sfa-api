import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { uxMetricsService } from '../ux-metrics/uxMetrics.service';
import { metricEventSchema, metricSatisfactionSchema } from './metrics.validation';

const EVENT_TYPE_BY_NAME: Record<string, 'PAGE_VIEW' | 'NAVIGATION' | 'SATISFACTION' | 'NAVIGATION_ERROR'> = {
  dashboard_opened: 'PAGE_VIEW',
  create_page_opened: 'PAGE_VIEW',
  ai_workspace_opened: 'PAGE_VIEW',
  billing_opened: 'PAGE_VIEW',
  notifications_opened: 'PAGE_VIEW',
  support_opened: 'PAGE_VIEW',
  nav_clicked: 'NAVIGATION',
  new_creation_clicked: 'NAVIGATION',
  prompt_submitted: 'NAVIGATION',
  generation_started: 'NAVIGATION',
  generation_completed: 'NAVIGATION',
  generation_failed: 'NAVIGATION_ERROR',
  project_opened: 'NAVIGATION',
  export_clicked: 'NAVIGATION',
  satisfaction_submitted: 'SATISFACTION'
};

const router = Router();

router.use(authMiddleware);

router.post(
  '/event',
  validate({ body: metricEventSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as { name: string; payload?: Record<string, unknown>; path?: string };
    const event = await uxMetricsService.createEvent(req.user!.id, {
      eventType: EVENT_TYPE_BY_NAME[body.name] ?? 'NAVIGATION',
      path: body.path ?? String(body.payload?.path ?? '/dashboard'),
      metadata: { name: body.name, ...(body.payload ?? {}) }
    });
    return sendSuccess(res, 'Metric event recorded successfully', event, 201);
  })
);

router.post(
  '/satisfaction',
  validate({ body: metricSatisfactionSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as { score: number; payload?: Record<string, unknown>; path?: string };
    const event = await uxMetricsService.createEvent(req.user!.id, {
      eventType: 'SATISFACTION',
      path: body.path ?? '/dashboard/metrics',
      satisfactionScore: body.score,
      metadata: { name: 'satisfaction_submitted', ...(body.payload ?? {}) }
    });
    return sendSuccess(res, 'Satisfaction recorded successfully', event, 201);
  })
);

export default router;
