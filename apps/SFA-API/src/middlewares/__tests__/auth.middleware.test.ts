/**
 * Auth middleware tests — covers both authentication paths:
 *  - Neon Auth (JWKS verification)
 *  - Legacy JWT
 *
 * `prisma` and `verifyNeonAuthToken` are mocked via vi.mock to keep tests
 * hermetic (no DB, no network call to JWKS).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../config/neonAuth', () => ({
  isNeonAuthEnabled: vi.fn(() => true),
  verifyNeonAuthToken: vi.fn(),
  verifyNeonAuthSessionToken: vi.fn(() => Promise.reject(new Error('invalid session'))),
}));

vi.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret',
    NEON_AUTH_ENABLED: true,
    NEON_AUTH_ISSUER: 'https://test/auth',
    NEON_AUTH_JWKS_URL: 'https://test/auth/jwks',
  },
}));

import { prisma } from '../../config/database';
import { isNeonAuthEnabled, verifyNeonAuthSessionToken, verifyNeonAuthToken } from '../../config/neonAuth';
import { authMiddleware, requireAdmin } from '../auth.middleware';
import { AppError } from '../../utils/appError';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

afterEach(() => {
  vi.clearAllMocks();
});

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('authMiddleware — header parsing', () => {
  it('rejects missing Authorization header with 401', async () => {
    const next = makeNext();
    await authMiddleware(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as unknown as { mock: { calls: AppError[][] } }).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('rejects empty Bearer token with 401', async () => {
    const next = makeNext();
    await authMiddleware(makeReq(''), makeRes(), next);
    const err = (next as unknown as { mock: { calls: AppError[][] } }).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

describe('authMiddleware — Neon Auth path', () => {
  beforeEach(() => {
    vi.mocked(isNeonAuthEnabled).mockReturnValue(true);
  });

  it('rejects when Neon Auth verification fails', async () => {
    vi.mocked(verifyNeonAuthToken).mockRejectedValue(new Error('expired'));
    const next = makeNext();
    await authMiddleware(makeReq('bad-token'), makeRes(), next);
    const err = (next as unknown as { mock: { calls: AppError[][] } }).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('accepts signed Neon session tokens when no JWT header is available', async () => {
    vi.mocked(verifyNeonAuthToken).mockRejectedValue(new Error('not a jwt'));
    vi.mocked(verifyNeonAuthSessionToken).mockResolvedValue({
      sub: 'neon-session-123',
      email: 'session@example.com',
      email_verified: true,
      name: 'Session User',
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'session-user-id',
      email: 'session@example.com',
      role: Role.USER,
    } as never);

    const req = makeReq('signed-session-token.signature');
    const next = makeNext();
    await authMiddleware(req, makeRes(), next);

    expect(verifyNeonAuthSessionToken).toHaveBeenCalledWith('signed-session-token.signature');
    expect(next).toHaveBeenCalledWith();
    expect((req as unknown as { user: unknown }).user).toEqual({
      id: 'session-user-id',
      email: 'session@example.com',
      role: 'USER',
    });
  });

  it('attaches req.user when an existing local profile is linked by stackUserId', async () => {
    vi.mocked(verifyNeonAuthToken).mockResolvedValue({
      sub: 'neon-user-123',
      email: 'jane@example.com',
      name: 'Jane',
    });
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
      where: { stackUserId: 'neon-user-123' },
      select: { id: true, email: true, role: true },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rebinds an existing local user matched by verified email when stackUserId is missing', async () => {
    vi.mocked(verifyNeonAuthToken).mockResolvedValue({
      sub: 'neon-user-456',
      email: 'admin@example.com',
      email_verified: true,
    });
    // First lookup by stackUserId → null, second by email → existing admin with no Neon link yet
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
      data: { stackUserId: 'neon-user-456' },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses to overwrite an existing stackUserId binding (account takeover guard)', async () => {
    vi.mocked(verifyNeonAuthToken).mockResolvedValue({
      sub: 'attacker-neon-id',
      email: 'victim@example.com',
      email_verified: true,
    });
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'victim-id',
        email: 'victim@example.com',
        role: Role.USER,
        stackUserId: 'legit-neon-id',
      } as never);

    const next = makeNext();
    await authMiddleware(makeReq('valid-token'), makeRes(), next);

    const err = (next as unknown as { mock: { calls: AppError[][] } }).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(409);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses to link by email when the IdP has not verified it (account takeover guard)', async () => {
    vi.mocked(verifyNeonAuthToken).mockResolvedValue({
      sub: 'unverified-neon-id',
      email: 'victim@example.com',
      email_verified: false,
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null); // by stackUserId

    const next = makeNext();
    await authMiddleware(makeReq('valid-token'), makeRes(), next);

    const err = (next as unknown as { mock: { calls: AppError[][] } }).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    // Must never even look up by email when email is unverified.
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses to provision a fresh user with an unverified email', async () => {
    vi.mocked(verifyNeonAuthToken).mockResolvedValue({
      sub: 'unverified-neon-id',
      email: 'someone@example.com',
      // email_verified omitted → treated as false
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const next = makeNext();
    await authMiddleware(makeReq('valid-token'), makeRes(), next);

    const err = (next as unknown as { mock: { calls: AppError[][] } }).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates a fresh local user when no local profile exists and email is verified', async () => {
    vi.mocked(verifyNeonAuthToken).mockResolvedValue({
      sub: 'neon-user-789',
      email: 'newbie@example.com',
      email_verified: true,
      name: 'Newbie',
    });
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null) // by stackUserId
      .mockResolvedValueOnce(null); // by email
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
    expect(prisma.user.create).toHaveBeenCalledOnce();
  });
});

describe('authMiddleware — Legacy JWT path', () => {
  beforeEach(() => {
    vi.mocked(isNeonAuthEnabled).mockReturnValue(false);
  });

  it('rejects an invalid signature with 401', async () => {
    // Token signed with a different secret
    const badToken = jwt.sign({ userId: 'u1', role: 'USER' }, 'other-secret');
    const next = makeNext();
    await authMiddleware(makeReq(badToken), makeRes(), next);
    const err = (next as unknown as { mock: { calls: AppError[][] } }).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('attaches req.user for a valid legacy JWT', async () => {
    const goodToken = jwt.sign({ userId: 'u1', role: 'USER' }, 'test-secret');
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      email: 'legacy@example.com',
      role: Role.USER,
    } as never);

    const req = makeReq(goodToken);
    const next = makeNext();
    await authMiddleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect((req as unknown as { user: unknown }).user).toEqual({
      id: 'u1',
      email: 'legacy@example.com',
      role: 'USER',
    });
    expect(verifyNeonAuthToken).not.toHaveBeenCalled();
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
    const err = (next as unknown as { mock: { calls: AppError[][] } }).mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it('rejects when no user is attached (missing auth)', () => {
    const req = {} as Request;
    const next = makeNext();
    requireAdmin(req, makeRes(), next);
    const err = (next as unknown as { mock: { calls: AppError[][] } }).mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });
});
