import { Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { authService } from './auth.service';

const adminLoginSchema = z.object({
  email: z.string().email('Adresse email invalide.'),
  password: z.string().min(1, 'Mot de passe requis.'),
});

export const authController = {
  me: async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.id);
    return sendSuccess(res, 'Authenticated user retrieved successfully', user);
  },

  adminLogin: async (req: Request, res: Response) => {
    const parsed = adminLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Requête invalide.';
      throw new AppError(first, 400);
    }
    const result = await authService.adminLogin(parsed.data.email, parsed.data.password);
    return sendSuccess(res, 'Connexion réussie', result);
  },

  adminMe: async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.id);
    return sendSuccess(res, 'Admin profile retrieved', user);
  },
};
