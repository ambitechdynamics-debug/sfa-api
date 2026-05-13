/**
 * Authentication middleware.
 *
 * Supports two backends, switchable via NEON_AUTH_ENABLED:
 *  - Neon Auth (JWT verified via JWKS, OIDC standard, recommended)
 *  - Legacy JWT (signed by JWT_SECRET, kept for the migration window)
 *
 * Both paths populate `req.user` with `{ id, email, role }` so downstream code
 * is identical regardless of the backend.
 */

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { isNeonAuthEnabled, verifyNeonAuthToken } from '../config/neonAuth';

type LegacyJwtPayload = {
  userId: string;
  role: Role;
};

type AuthedUser = {
  id: string;
  email: string;
  role: Role;
};

// ─── Legacy JWT path (kept until full Neon Auth migration) ───────────────────
async function authenticateWithLegacyJwt(token: string): Promise<AuthedUser> {
  let decoded: LegacyJwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as LegacyJwtPayload;
  } catch {
    throw new AppError('Invalid or expired authentication token', 401);
  }
  if (!decoded.userId) throw new AppError('Invalid authentication token', 401);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) throw new AppError('Authenticated user not found', 401);
  return user;
}

// ─── Neon Auth path (JWKS verification) ──────────────────────────────────────
async function authenticateWithNeonAuth(token: string): Promise<AuthedUser> {
  let claims;
  try {
    claims = await verifyNeonAuthToken(token);
  } catch (error) {
    logger.warn('[auth] Neon token verification failed', error instanceof Error ? error.message : error);
    throw new AppError('Invalid or expired authentication token', 401);
  }

  const stackUserId = claims.sub;
  const claimEmail = claims.email ?? '';
  const displayName = claims.name ?? claimEmail ?? 'User';

  // Find or create the local profile linked to this Neon Auth account.
  let user = await prisma.user.findUnique({
    where: { stackUserId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    // Recover by email if a legacy account exists (e.g. after the migration
    // script linked existing users to their fresh Neon Auth subject).
    if (claimEmail) {
      const byEmail = await prisma.user.findUnique({
        where: { email: claimEmail },
        select: { id: true, email: true, role: true },
      });
      if (byEmail) {
        await prisma.user.update({
          where: { id: byEmail.id },
          data: { stackUserId },
        });
        return byEmail;
      }
    }

    user = await prisma.user.create({
      data: {
        stackUserId,
        email: claimEmail,
        fullName: displayName,
        role: Role.USER,
      },
      select: { id: true, email: true, role: true },
    });
  }
  return user;
}

// ─── Middleware ──────────────────────────────────────────────────────────────
export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication token is required', 401);
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) throw new AppError('Authentication token is required', 401);

    let user: AuthedUser;
    if (isNeonAuthEnabled()) {
      try {
        user = await authenticateWithNeonAuth(token);
      } catch (neonError) {
        try {
          user = await authenticateWithLegacyJwt(token);
          logger.info('[auth] accepted legacy JWT while Neon Auth is enabled');
        } catch {
          throw neonError;
        }
      }
    } else {
      user = await authenticateWithLegacyJwt(token);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(new AppError('Invalid or expired authentication token', 401));
      return;
    }
    next(error);
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== Role.ADMIN) {
    next(new AppError('Admin access is required', 403));
    return;
  }
  next();
};
