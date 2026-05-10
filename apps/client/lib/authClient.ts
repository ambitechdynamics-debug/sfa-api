/**
 * Neon Auth client (Better Auth).
 *
 * Connects to Neon's hosted Better Auth endpoint for sign-in/sign-up/session.
 * The actual JWT used to authenticate API calls is fetched from
 * `authClient.getSession()` and forwarded as Bearer to our Express backend
 * (which validates it via the JWKS endpoint).
 *
 * The base URL is fixed to the project's Neon Auth endpoint and exposed via
 * NEXT_PUBLIC_NEON_AUTH_URL so it's tweakable per-environment without rebuild.
 */

import { createAuthClient } from "better-auth/react"

export const NEON_AUTH_URL =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ||
  "https://ep-blue-night-akk7bv95.neonauth.c-3.us-west-2.aws.neon.tech/neondb/auth"

export const authClient = createAuthClient({
  baseURL: NEON_AUTH_URL,
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
