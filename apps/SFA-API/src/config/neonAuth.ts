/**
 * Neon Auth — JWT verification using JWKS (OIDC).
 *
 * The frontend signs users in via Neon Auth's hosted UI (or a Stack-Auth-style
 * SDK). Tokens reach this backend in the `Authorization: Bearer …` header. We
 * verify them by:
 *   1. Fetching Neon's public keys from the JWKS URL (cached internally by `jose`)
 *   2. Verifying the JWT signature + standard claims (iss, exp, optional aud)
 *
 * No SDK / project keys required — only the issuer + JWKS URL exposed by Neon.
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { env } from './env';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export function isNeonAuthEnabled(): boolean {
  return Boolean(env.NEON_AUTH_ENABLED && env.NEON_AUTH_ISSUER && env.NEON_AUTH_JWKS_URL);
}

function getJwks() {
  if (jwks) return jwks;
  if (!env.NEON_AUTH_JWKS_URL) {
    throw new Error('NEON_AUTH_JWKS_URL is not configured');
  }
  jwks = createRemoteJWKSet(new URL(env.NEON_AUTH_JWKS_URL), {
    // Cache the JWKS for 10 min, refresh on rotation.
    cacheMaxAge: 10 * 60 * 1000,
    cooldownDuration: 30 * 1000,
  });
  return jwks;
}

export interface NeonAuthClaims extends JWTPayload {
  /** Stable user identifier (sub) returned by Neon Auth. */
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

type NeonSessionResponse = {
  session?: {
    userId?: string;
    token?: string;
    expiresAt?: string | Date;
  };
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string | null;
    emailVerified?: boolean;
  };
} | null;

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, '');
}

/**
 * Verify a Neon-Auth-issued JWT. Throws if invalid.
 * Returns the decoded payload (claims).
 *
 * The JWKS URL is already scoped to the Neon Auth project. Neon/Better Auth can
 * emit JWTs whose `iss`/`aud` reflect the hosted auth URL, the app proxy URL, or
 * a custom base URL, so we only enforce `aud` when explicitly configured.
 */
export async function verifyNeonAuthToken(accessToken: string): Promise<NeonAuthClaims> {
  if (!isNeonAuthEnabled()) {
    throw new Error('Neon Auth is not enabled. Set NEON_AUTH_ENABLED=true and provide NEON_AUTH_ISSUER + NEON_AUTH_JWKS_URL.');
  }
  const { payload } = await jwtVerify(accessToken, getJwks(), {
    ...(env.NEON_AUTH_AUDIENCE ? { audience: env.NEON_AUTH_AUDIENCE } : {}),
  });
  if (!payload.sub) {
    throw new Error('Token missing required `sub` claim');
  }

  return payload as NeonAuthClaims;
}

export async function verifyNeonAuthSessionToken(sessionToken: string): Promise<NeonAuthClaims> {
  if (!isNeonAuthEnabled() || !env.NEON_AUTH_ISSUER) {
    throw new Error('Neon Auth is not enabled. Set NEON_AUTH_ENABLED=true and provide NEON_AUTH_ISSUER.');
  }

  const response = await fetch(`${normalizeUrl(env.NEON_AUTH_ISSUER)}/get-session`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Neon Auth session lookup failed with ${response.status}`);
  }

  const data = (await response.json().catch(() => null)) as NeonSessionResponse;
  const userId = data?.user?.id ?? data?.session?.userId;
  if (!userId) {
    throw new Error('Neon Auth session lookup returned no user');
  }

  return {
    sub: userId,
    email: data?.user?.email,
    email_verified: data?.user?.emailVerified,
    name: data?.user?.name,
    picture: data?.user?.image ?? undefined,
  };
}
