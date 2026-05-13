import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { uxMetricsService } from './uxMetrics.service';

export const uxMetricsController = {
  createEvent: async (req: Request, res: Response) => {
    const event = await uxMetricsService.createEvent(req.user!.id, req.body);
    return sendSuccess(res, 'UX metric event recorded successfully', event, 201);
  },

  getSummary: async (req: Request, res: Response) => {
    const summary = await uxMetricsService.getSummary(req.user!.id);
    return sendSuccess(res, 'UX metrics summary retrieved successfully', summary);
  }
};
