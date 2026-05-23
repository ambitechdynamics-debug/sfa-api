import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { travauxService } from './travaux.service';

export const travauxController = {
  create: async (req: Request, res: Response) => {
    const travail = await travauxService.create(req.user!.id, req.params.projectId, req.body);
    return sendSuccess(res, 'Travail created successfully', travail, 201);
  },

  list: async (req: Request, res: Response) => {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    const travaux = await travauxService.list(req.user!.id, projectId);
    return sendSuccess(res, 'Travaux retrieved successfully', travaux);
  },

  getById: async (req: Request, res: Response) => {
    const travail = await travauxService.getById(req.user!.id, req.params.travailId);
    return sendSuccess(res, 'Travail retrieved successfully', travail);
  },

  update: async (req: Request, res: Response) => {
    const travail = await travauxService.update(req.user!.id, req.params.travailId, req.body);
    return sendSuccess(res, 'Travail updated successfully', travail);
  },

  delete: async (req: Request, res: Response) => {
    const result = await travauxService.delete(req.user!.id, req.params.travailId);
    return sendSuccess(res, 'Travail deleted successfully', result);
  }
};
