/**
 * Authentication middleware (Clerk).
 *
 * Verifies the incoming Bearer token as a Clerk session token via
 * @clerk/backend.verifyToken, then resolves/creates the local User row that
 * downstream controllers read as `req.user`.
 *
 * The User table's `stackUserId` column stores the Clerk user id (legacy name
 * kept from the prior Neon Auth integration to avoid a Prisma migration).
 */

import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

type AuthedUser = {
  id: string;
  email: string;
  role: Role;
};

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? '';
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

if (!CLERK_SECRET_KEY && env.NODE_ENV !== 'test') {
  logger.warn('[auth] CLERK_SECRET_KEY is not set — protected endpoints will reject every request.');
}

const clerk = createClerkClient({
  secretKey: CLERK_SECRET_KEY,
  publishableKey: CLERK_PUBLISHABLE_KEY,
});

async function fetchClerkUserEmail(userId: string): Promise<{ email: string; verified: boolean; fullName: string }> {
  const user = await clerk.users.getUser(userId);
  const primaryEmailId = user.primaryEmailAddressId;
  const primary = user.emailAddresses.find((entry) => entry.id === primaryEmailId) ?? user.emailAddresses[0];
  if (!primary) {
    throw new AppError('Clerk user has no email address attached', 403);
  }
  const verified = primary.verification?.status === 'verified';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || primary.emailAddress;
  return { email: primary.emailAddress, verified, fullName };
}

async function authenticateWithClerk(token: string): Promise<AuthedUser> {
  if (!CLERK_SECRET_KEY) {
    throw new AppError('Clerk is not configured on this backend (CLERK_SECRET_KEY missing)', 500);
  }

  let claims: { sub?: string };
  try {
    claims = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
    });
  } catch (error) {
    logger.warn('[auth] Clerk token verification failed', error instanceof Error ? error.message : error);
    throw new AppError('Invalid or expired authentication token', 401);
  }

  const clerkUserId = claims.sub;
  if (!clerkUserId) throw new AppError('Authentication token is missing a subject claim', 401);

  // Fast path: User already linked to this Clerk subject.
  const existingByClerk = await prisma.user.findUnique({
    where: { stackUserId: clerkUserId },
    select: { id: true, email: true, role: true },
  });
  if (existingByClerk) return existingByClerk;

  // Slow path: fetch the Clerk profile to get a verified email, then link or
  // provision a local User.
  const { email, verified, fullName } = await fetchClerkUserEmail(clerkUserId);

  if (!verified) {
    logger.warn('[auth] refusing to provision profile for unverified Clerk email', { clerkUserId, email });
    throw new AppError('Email is not verified. Please verify your email before signing in.', 403);
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, stackUserId: true },
  });

  if (existingByEmail) {
    if (existingByEmail.stackUserId && existingByEmail.stackUserId !== clerkUserId) {
      logger.warn('[auth] account collision: existing user bound to a different Clerk subject', {
        userId: existingByEmail.id,
        existingStackUserId: existingByEmail.stackUserId,
        incomingClerkUserId: clerkUserId,
      });
      throw new AppError('Account conflict. Please contact support.', 409);
    }
    if (!existingByEmail.stackUserId) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { stackUserId: clerkUserId },
      });
    }
    return { id: existingByEmail.id, email: existingByEmail.email, role: existingByEmail.role };
  }

  const created = await prisma.user.create({
    data: {
      stackUserId: clerkUserId,
      email,
      fullName,
      role: Role.USER,
    },
    select: { id: true, email: true, role: true },
  });
  return created;
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

    const user = await authenticateWithClerk(token);
    req.user = user;
    next();
  } catch (error) {
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
