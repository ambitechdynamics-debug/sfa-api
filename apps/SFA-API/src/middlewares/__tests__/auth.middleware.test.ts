import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';

const clerkMocks = vi.hoisted(() => {
  const getUser = vi.fn();
  return {
    getUser,
    createClerkClient: vi.fn(() => ({ users: { getUser } })),
    verifyToken: vi.fn(),
  };
});

vi.mock('@clerk/backend', () => ({
  createClerkClient: clerkMocks.createClerkClient,
  verifyToken: clerkMocks.verifyToken,
}));

vi.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    CLERK_SECRET_KEY: 'sk_test_mock',
    CLERK_PUBLISHABLE_KEY: 'pk_test_mock',
  },
}));

import { verifyToken } from '@clerk/backend';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { authMiddleware, requireAdmin } from '../auth.middleware';

function makeReq(token?: string): Request {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as unknown as Request;
}

function makeRes(): Response {
  return {} as Response;
}

function makeNext() {
  return vi.fn() as unknown as NextFunction;
}

function nextError(next: NextFunction) {
  return (next as unknown as { mock: { calls: AppError[][] } }).mock.calls[0][0];
}

function clerkUser(email: string, verified = true, firstName = 'Jane', lastName = 'Doe') {
  return {
    firstName,
    lastName,
    primaryEmailAddressId: 'email_1',
    emailAddresses: [
      {
        id: 'email_1',
        emailAddress: email,
        verification: { status: verified ? 'verified' : 'unverified' },
      },
    ],
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('authMiddleware — header parsing', () => {
  it('rejects missing Authorization header with 401', async () => {
    const next = makeNext();
    await authMiddleware(makeReq(), makeRes(), next);

    const err = nextError(next);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('rejects empty Bearer token with 401', async () => {
    const next = makeNext();
    await authMiddleware(makeReq(''), makeRes(), next);

    expect(nextError(next).statusCode).toBe(401);
  });
});

describe('authMiddleware — Clerk tokens', () => {
  it('rejects when Clerk token verification fails', async () => {
    vi.mocked(verifyToken).mockRejectedValue(new Error('expired'));

    const next = makeNext();
    await authMiddleware(makeReq('bad-token'), makeRes(), next);

    const err = nextError(next);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('attaches req.user when an existing local profile is linked by Clerk id', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'clerk-user-123' } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'jane@example.com',
      role: Role.USER,
    } as never);

    const req = makeReq('valid-token');
    const next = makeNext();
    await authMiddleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect((req as unknown as { user: unknown }).user).toEqual({
      id: 'u1',
      email: 'jane@example.com',
      role: 'USER',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { stackUserId: 'clerk-user-123' },
      select: { id: true, email: true, role: true },
    });
    expect(clerkMocks.getUser).not.toHaveBeenCalled();
  });

  it('links an existing local user matched by verified Clerk email', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'clerk-user-456' } as never);
    clerkMocks.getUser.mockResolvedValue(clerkUser('admin@example.com'));
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'admin-id',
        email: 'admin@example.com',
        role: Role.ADMIN,
        stackUserId: null,
      } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const req = makeReq('valid-token');
    const next = makeNext();
    await authMiddleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect((req as unknown as { user: unknown }).user).toEqual({
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'admin-id' },
      data: { stackUserId: 'clerk-user-456' },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses to overwrite a different Clerk binding', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'attacker-clerk-id' } as never);
    clerkMocks.getUser.mockResolvedValue(clerkUser('victim@example.com'));
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'victim-id',
        email: 'victim@example.com',
        role: Role.USER,
        stackUserId: 'legit-clerk-id',
      } as never);

    const next = makeNext();
    await authMiddleware(makeReq('valid-token'), makeRes(), next);

    const err = nextError(next);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(409);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses to provision or link an unverified Clerk email', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'unverified-clerk-id' } as never);
    clerkMocks.getUser.mockResolvedValue(clerkUser('victim@example.com', false));
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const next = makeNext();
    await authMiddleware(makeReq('valid-token'), makeRes(), next);

    const err = nextError(next);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates a fresh local user when no profile exists and Clerk email is verified', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'clerk-user-789' } as never);
    clerkMocks.getUser.mockResolvedValue(clerkUser('newbie@example.com'));
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'new-id',
      email: 'newbie@example.com',
      role: Role.USER,
    } as never);

    const req = makeReq('valid-token');
    const next = makeNext();
    await authMiddleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect((req as unknown as { user: unknown }).user).toEqual({
      id: 'new-id',
      email: 'newbie@example.com',
      role: 'USER',
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        stackUserId: 'clerk-user-789',
        email: 'newbie@example.com',
        fullName: 'Jane Doe',
        role: Role.USER,
      },
      select: { id: true, email: true, role: true },
    });
  });
});

describe('requireAdmin', () => {
  it('allows ADMIN through', () => {
    const req = { user: { id: 'u1', email: 'a@b.c', role: Role.ADMIN } } as unknown as Request;
    const next = makeNext();
    requireAdmin(req, makeRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects USER with 403', () => {
    const req = { user: { id: 'u1', email: 'a@b.c', role: Role.USER } } as unknown as Request;
    const next = makeNext();
    requireAdmin(req, makeRes(), next);
    expect(nextError(next).statusCode).toBe(403);
  });

  it('rejects when no user is attached', () => {
    const req = {} as Request;
    const next = makeNext();
    requireAdmin(req, makeRes(), next);
    expect(nextError(next).statusCode).toBe(403);
  });
});
