import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { filesService } from './files.service';
import { uploadFileBodySchema } from './files.validation';

export const filesController = {
  /**
   * POST /projects/:projectId/files
   * Legacy endpoint — stores a file URL provided by the client (JSON body).
   */
  create: async (req: Request, res: Response) => {
    const file = await filesService.create(req.user!.id, req.params.projectId, req.body);
    return sendSuccess(res, 'File asset created successfully', file, 201);
  },

  /**
   * POST /projects/:projectId/files/upload
   * Multipart upload → Cloudinary.
   */
  upload: async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('Aucun fichier fourni.', 400);
    }

    const parsed = uploadFileBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('usageType invalide.', 400);
    }

    const fileAsset = await filesService.upload(
      req.user!.id,
      req.params.projectId,
      req.file,
      parsed.data.usageType,
    );

    return sendSuccess(res, 'Fichier uploadé avec succès.', fileAsset, 201);
  },

  listByProject: async (req: Request, res: Response) => {
    const files = await filesService.listByProject(req.user!.id, req.params.projectId);
    return sendSuccess(res, 'File assets retrieved successfully', files);
  },

  update: async (req: Request, res: Response) => {
    const file = await filesService.update(req.user!.id, req.params.fileId, req.body);
    return sendSuccess(res, 'File asset updated successfully', file);
  },

  delete: async (req: Request, res: Response) => {
    const result = await filesService.delete(req.user!.id, req.params.fileId);
    return sendSuccess(res, 'File asset deleted successfully', result);
  },
};
