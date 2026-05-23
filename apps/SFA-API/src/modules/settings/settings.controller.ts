import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { settingsService } from './settings.service';

export const settingsController = {
  /** GET /admin/settings  →  all settings grouped by category */
  getAll: async (_req: Request, res: Response) => {
    const data = await settingsService.getAll();
    return sendSuccess(res, 'Settings retrieved successfully', data);
  },

  /** GET /admin/settings/category/:category */
  getByCategory: async (req: Request, res: Response) => {
    const data = await settingsService.getByCategory(req.params.category);
    return sendSuccess(res, 'Settings retrieved successfully', data);
  },

  /** GET /admin/settings/:key */
  getOne: async (req: Request, res: Response) => {
    const data = await settingsService.getOne(req.params.key);
    return sendSuccess(res, 'Setting retrieved successfully', data);
  },

  /** PUT /admin/settings  →  bulk upsert */
  upsertMany: async (req: Request, res: Response) => {
    const data = await settingsService.upsertMany(req.body);
    return sendSuccess(res, 'Settings saved successfully', data);
  },

  /** POST /admin/settings/seed  →  populate default keys */
  seed: async (_req: Request, res: Response) => {
    const data = await settingsService.seed();
    return sendSuccess(res, `Settings seeded (${data.created} new keys)`, data);
  },

  /** POST /admin/settings/delete  →  bulk delete */
  deleteMany: async (req: Request, res: Response) => {
    const { keys } = req.body;
    await settingsService.deleteMany(keys);
    return sendSuccess(res, 'Settings deleted successfully', {});
  },

  /** GET /admin/settings/effective  →  valeurs résolues + source (db|env|default|missing) */
  listEffective: async (_req: Request, res: Response) => {
    const data = await settingsService.listEffective();
    return sendSuccess(res, 'Effective settings retrieved successfully', data);
  },
};
