/**
 * Neon Auth client (Better Auth) for the admin dashboard.
 *
 * Same backend (Express + JWKS verification) as the public client, but the
 * admin layout enforces an additional `role === 'ADMIN'` check after the
 * profile is fetched from `/api/users/me`. Non-admin sessions are routed to
 * `/no-access`.
 */

import { createAuthClient } from 'better-auth/react'

export const NEON_AUTH_URL =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ||
  'https://ep-blue-night-akk7bv95.neonauth.c-3.us-west-2.aws.neon.tech/neondb/auth'

export const authClient = createAuthClient({
  baseURL: NEON_AUTH_URL,
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
