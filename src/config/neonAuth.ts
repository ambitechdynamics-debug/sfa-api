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

/**
 * Verify a Neon-Auth-issued JWT. Throws if invalid.
 * Returns the decoded payload (claims).
 */
export async function verifyNeonAuthToken(accessToken: string): Promise<NeonAuthClaims> {
  if (!isNeonAuthEnabled()) {
    throw new Error('Neon Auth is not enabled. Set NEON_AUTH_ENABLED=true and provide NEON_AUTH_ISSUER + NEON_AUTH_JWKS_URL.');
  }
  const { payload } = await jwtVerify(accessToken, getJwks(), {
    issuer: env.NEON_AUTH_ISSUER,
    ...(env.NEON_AUTH_AUDIENCE ? { audience: env.NEON_AUTH_AUDIENCE } : {}),
  });
  if (!payload.sub) {
    throw new Error('Token missing required `sub` claim');
  }
  return payload as NeonAuthClaims;
}
