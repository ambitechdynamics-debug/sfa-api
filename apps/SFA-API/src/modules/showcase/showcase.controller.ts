import { Request, Response } from 'express';
import { showcaseService } from './showcase.service';

export const showcaseController = {
  /** GET /api/showcase/visuals?limit=N (public, pas d'auth) */
  listVisuals: async (req: Request, res: Response) => {
    const rawLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const limit = Number.isFinite(rawLimit) && (rawLimit as number) > 0 ? (rawLimit as number) : undefined;
    const visuals = await showcaseService.list(limit);
    res.json(visuals);
  },
};
