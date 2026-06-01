import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { authService } from './auth.service';

export const authController = {
  me: async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.id);
    return sendSuccess(res, 'Authenticated user retrieved successfully', user);
  }
};
