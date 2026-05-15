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
import { emailOTPClient } from "better-auth/client/plugins"

export const NEON_AUTH_URL =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ||
  "https://ep-blue-night-akk7bv95.neonauth.c-3.us-west-2.aws.neon.tech/neondb/auth"

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth`
  }
  return process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/auth`
      : "http://localhost:3001/api/auth"
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  sessionOptions: {
    refetchInterval: 60,
    refetchOnWindowFocus: true,
    refetchWhenOffline: false,
  },
  plugins: [emailOTPClient()],
})

export const { signIn, signUp, signOut, useSession, getSession } = authClient
