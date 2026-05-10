import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { usersService } from './users.service';

export const usersController = {
  getMe: async (req: Request, res: Response) => {
    const user = await usersService.getMe(req.user!.id);
    return sendSuccess(res, 'User profile retrieved successfully', user);
  },

  updateMe: async (req: Request, res: Response) => {
    const user = await usersService.updateMe(req.user!.id, req.body);
    return sendSuccess(res, 'User profile updated successfully', user);
  }
};
