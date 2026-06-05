import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError';

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  credits: true,
  createdAt: true,
  updatedAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
  subscriptionCurrentPeriodEnd: true,
};

export interface AdminJwtPayload {
  sub: string;
  role: Role;
  scope: 'admin';
}

function signAdminToken(payload: Omit<AdminJwtPayload, 'scope'>): string {
  return jwt.sign(
    { ...payload, scope: 'admin' } satisfies AdminJwtPayload,
    env.ADMIN_JWT_SECRET,
    { expiresIn: env.ADMIN_JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  let payload: unknown;
  try {
    payload = jwt.verify(token, env.ADMIN_JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired admin token', 401);
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    (payload as AdminJwtPayload).scope !== 'admin' ||
    typeof (payload as AdminJwtPayload).sub !== 'string'
  ) {
    throw new AppError('Invalid admin token payload', 401);
  }
  return payload as AdminJwtPayload;
}

export const authService = {
  getMe: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  },

  adminLogin: async (email: string, password: string) => {
    // Lookup ignoring case so the user is not confused by trailing capitals.
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      select: { id: true, password: true, role: true },
    });

    // Generic error on every failure path — do not leak whether the email
    // exists or whether the role is admin.
    const failure = new AppError('Email ou mot de passe incorrect.', 401);

    if (!user || !user.password) throw failure;
    if (user.role !== Role.ADMIN) throw failure;

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw failure;

    const token = signAdminToken({ sub: user.id, role: user.role });
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: publicUserSelect,
    });

    return { token, user: profile };
  },
};

export { signAdminToken };
