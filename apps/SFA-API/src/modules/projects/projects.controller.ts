import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { projectsService } from './projects.service';

export const projectsController = {
  create: async (req: Request, res: Response) => {
    const project = await projectsService.create(req.user!.id, req.body);
    return sendSuccess(res, 'Project created successfully', project, 201);
  },

  list: async (req: Request, res: Response) => {
    const projects = await projectsService.list(req.user!.id);
    return sendSuccess(res, 'Projects retrieved successfully', projects);
  },

  getById: async (req: Request, res: Response) => {
    const project = await projectsService.getById(req.user!.id, req.params.projectId);
    return sendSuccess(res, 'Project retrieved successfully', project);
  },

  update: async (req: Request, res: Response) => {
    const project = await projectsService.update(req.user!.id, req.params.projectId, req.body);
    return sendSuccess(res, 'Project updated successfully', project);
  },

  delete: async (req: Request, res: Response) => {
    const result = await projectsService.delete(req.user!.id, req.params.projectId);
    return sendSuccess(res, 'Project deleted successfully', result);
  }
};
