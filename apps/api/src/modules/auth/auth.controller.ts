import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { authService } from './auth.service';

export const authController = {
  register: async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return sendSuccess(res, 'User registered successfully', result, 201);
  },

  login: async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return sendSuccess(res, 'User logged in successfully', result);
  },

  me: async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.id);
    return sendSuccess(res, 'Authenticated user retrieved successfully', user);
  }
};
