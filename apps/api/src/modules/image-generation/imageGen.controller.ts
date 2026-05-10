import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { imageGenService } from './imageGen.service';
import type { ImageGenProvider } from './imageGen.types';

export const imageGenController = {
  /**
   * POST /api/projects/:projectId/generate-images
   * Body: { variations?: number, provider?: 'mock' | 'gemini' | 'openai-image' }
   */
  generate: async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const variations = req.body?.variations ? Number(req.body.variations) : undefined;
    const provider = req.body?.provider as ImageGenProvider | undefined;

    const result = await imageGenService.generate({ projectId, userId, userRole, variations, provider });
    return sendSuccess(res, `${result.posters.length} variation(s) générée(s) avec succès`, result, 201);
  },

  /**
   * GET /api/projects/:projectId/generated-posters
   */
  list: async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const posters = await imageGenService.listForProject(projectId, userId, userRole);
    return sendSuccess(res, 'Generated posters retrieved', posters);
  },
};
