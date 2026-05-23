import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { imageGenService } from './imageGen.service';
import type { ImageGenProvider } from './imageGen.types';

export const imageGenController = {
  /**
   * POST /api/travaux/:travailId/generate-images
   * Body: { variations?: number, provider?: 'mock' | 'gemini' | 'openai-image' }
   */
  generate: async (req: Request, res: Response) => {
    const { travailId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const variations = req.body?.variations ? Number(req.body.variations) : undefined;
    const provider = req.body?.provider as ImageGenProvider | undefined;

    const result = await imageGenService.generate({ travailId, userId, userRole, variations, provider });
    return sendSuccess(res, `${result.posters.length} variation(s) générée(s) avec succès`, result, 201);
  },

  /**
   * GET /api/travaux/:travailId/generated-posters
   */
  list: async (req: Request, res: Response) => {
    const { travailId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const posters = await imageGenService.listForTravail(travailId, userId, userRole);
    return sendSuccess(res, 'Generated posters retrieved', posters);
  },

  /**
   * DELETE /api/travaux/:travailId/generated-posters/:posterId
   */
  deletePoster: async (req: Request, res: Response) => {
    const { travailId, posterId } = req.params;
    const userId = req.user!.id;
    const result = await imageGenService.deletePoster(userId, travailId, posterId);
    return sendSuccess(res, 'Poster deleted', result);
  },

  /**
   * GET /api/travaux/:travailId/generated-posters/:posterId/download
   *   ?format=png|jpg|pdf|webp  (défaut : auto)
   *   &width=NN                  (défaut : taille originale, plafond 4096)
   *   &quality=NN                (défaut : auto)
   */
  download: async (req: Request, res: Response) => {
    const { travailId, posterId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const rawFormat = typeof req.query.format === 'string' ? req.query.format.toLowerCase() : undefined;
    const allowedFormats = ['png', 'jpg', 'pdf', 'webp'] as const;
    const format = (allowedFormats as readonly string[]).includes(rawFormat ?? '')
      ? (rawFormat as 'png' | 'jpg' | 'pdf' | 'webp')
      : undefined;

    const width = typeof req.query.width === 'string' ? Number(req.query.width) : undefined;
    const quality = typeof req.query.quality === 'string' ? Number(req.query.quality) : undefined;

    const { url, filename } = await imageGenService.buildDownloadUrl({
      userId,
      userRole,
      travailId,
      posterId,
      format,
      width: Number.isFinite(width) ? width : undefined,
      quality: Number.isFinite(quality) ? quality : undefined,
    });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.redirect(302, url);
  },
};
