import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { memoryService } from './memory.service';

export const memoryController = {
  create: async (req: Request, res: Response) => {
    const memory = await memoryService.create(req.user!.id, req.params.travailId, req.body);
    return sendSuccess(res, 'Memory created successfully', memory, 201);
  },

  list: async (req: Request, res: Response) => {
    const memories = await memoryService.list(req.user!.id, req.params.travailId);
    return sendSuccess(res, 'Memories retrieved successfully', memories);
  },

  getByKey: async (req: Request, res: Response) => {
    const memory = await memoryService.getByKey(
      req.user!.id,
      req.params.travailId,
      req.params.memoryKey
    );
    return sendSuccess(res, 'Memory retrieved successfully', memory);
  },

  updateByKey: async (req: Request, res: Response) => {
    const memory = await memoryService.updateByKey(
      req.user!.id,
      req.params.travailId,
      req.params.memoryKey,
      req.body
    );
    return sendSuccess(res, 'Memory updated successfully', memory);
  },

  deleteByKey: async (req: Request, res: Response) => {
    const result = await memoryService.deleteByKey(
      req.user!.id,
      req.params.travailId,
      req.params.memoryKey
    );
    return sendSuccess(res, 'Memory deleted successfully', result);
  }
};
