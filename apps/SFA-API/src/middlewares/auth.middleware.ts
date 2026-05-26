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
import { isNeonAuthEnabled, verifyNeonAuthSessionToken, verifyNeonAuthToken } from '../config/neonAuth';

type LegacyJwtPayload = {
  userId: string;
  role: Role;
};

type AuthedUser = {
  id: string;
  email: string;
  role: Role;
};

function looksLikeCompactJwt(token: string) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

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
    try {
      claims = await verifyNeonAuthToken(token);
    } catch (jwtError) {
      if (looksLikeCompactJwt(token)) throw jwtError;
      claims = await verifyNeonAuthSessionToken(token);
    }
  } catch (error) {
    logger.warn('[auth] Neon token verification failed', error instanceof Error ? error.message : error);
    throw new AppError('Invalid or expired authentication token', 401);
  }

  const stackUserId = claims.sub;
  const claimEmail = claims.email ?? '';
  const emailVerified = claims.email_verified === true;
  const displayName = claims.name ?? claimEmail ?? 'User';

  // Find or create the local profile linked to this Neon Auth account.
  let user = await prisma.user.findUnique({
    where: { stackUserId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    // Recover by email if a legacy account exists (e.g. after the migration
    // script linked existing users to their fresh Neon Auth subject).
    //
    // SECURITY: only auto-link when the IdP confirms the email is verified.
    // Without this check, anyone could create a Neon Auth account using a
    // victim's email and have the first authenticated API call rewrite the
    // victim's `stackUserId` — full account takeover.
    if (claimEmail && emailVerified) {
      const byEmail = await prisma.user.findUnique({
        where: { email: claimEmail },
        select: { id: true, email: true, role: true, stackUserId: true },
      });
      if (byEmail) {
        // Refuse to silently overwrite a Neon Auth link that is already in
        // place. If the existing account is bound to a different Neon Auth
        // subject, that's a collision we want a human to resolve.
        if (byEmail.stackUserId && byEmail.stackUserId !== stackUserId) {
          logger.warn('[auth] refusing to relink user already bound to a different stackUserId', {
            userId: byEmail.id,
            existingStackUserId: byEmail.stackUserId,
            incomingStackUserId: stackUserId,
          });
          throw new AppError('Account conflict. Please contact support.', 409);
        }
        if (!byEmail.stackUserId) {
          await prisma.user.update({
            where: { id: byEmail.id },
            data: { stackUserId },
          });
        }
        return { id: byEmail.id, email: byEmail.email, role: byEmail.role };
      }
    }

    // No existing local profile for this Neon Auth subject. We refuse to
    // create one unless the IdP has verified the email — otherwise an
    // attacker could plant a row with a victim's email and later collide
    // with the legitimate sign-up.
    if (!emailVerified || !claimEmail) {
      logger.warn('[auth] refusing to provision profile for unverified email', {
        incomingStackUserId: stackUserId,
        hasEmail: Boolean(claimEmail),
      });
      throw new AppError('Email is not verified. Please verify your email before signing in.', 403);
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
