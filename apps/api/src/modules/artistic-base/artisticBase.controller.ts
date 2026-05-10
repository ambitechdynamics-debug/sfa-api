import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { artisticBaseService } from './artisticBase.service';
import { ListArtisticResourcesQuery, SearchArtisticResourcesQuery } from './artisticBase.validation';

export const artisticBaseController = {
  create: async (req: Request, res: Response) => {
    const resource = await artisticBaseService.create(req.body);
    return sendSuccess(res, 'Artistic resource created successfully', resource, 201);
  },

  list: async (req: Request, res: Response) => {
    const query = req.query as unknown as ListArtisticResourcesQuery;
    const resources = await artisticBaseService.list(query);
    return sendSuccess(res, 'Artistic resources retrieved successfully', resources);
  },

  search: async (req: Request, res: Response) => {
    const query = req.query as unknown as SearchArtisticResourcesQuery;
    const resources = await artisticBaseService.search(query);
    return sendSuccess(res, 'Artistic resources search completed successfully', resources);
  },

  getById: async (req: Request, res: Response) => {
    const resource = await artisticBaseService.getById(req.params.resourceId);
    return sendSuccess(res, 'Artistic resource retrieved successfully', resource);
  },

  update: async (req: Request, res: Response) => {
    const resource = await artisticBaseService.update(req.params.resourceId, req.body);
    return sendSuccess(res, 'Artistic resource updated successfully', resource);
  },

  delete: async (req: Request, res: Response) => {
    const result = await artisticBaseService.delete(req.params.resourceId);
    return sendSuccess(res, 'Artistic resource deleted successfully', result);
  },

  uploadImage: async (req: Request, res: Response) => {
    if (!req.file) throw new AppError('Aucun fichier fourni.', 400);
    const result = await artisticBaseService.uploadImage(req.file);
    return sendSuccess(res, 'Image uploadée avec succès.', result, 201);
  },
};
