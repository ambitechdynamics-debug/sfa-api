import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { verifyAdminToken } from '../modules/auth/auth.service';

/**
 * Verifies an admin JWT issued by POST /api/auth/admin/login and attaches the
 * resolved admin User to `req.user`. Distinct from authMiddleware (Clerk) so
 * the admin dashboard can run a bcrypt/JWT flow independent of the end-user
 * identity provider.
 */
export const adminJwtMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Admin token is required', 401);
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) throw new AppError('Admin token is required', 401);

    const payload = verifyAdminToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user || user.role !== Role.ADMIN) {
      throw new AppError('Admin access revoked. Please sign in again.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
