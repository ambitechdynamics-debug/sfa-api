/**
 * Auth token + sign-out facade backed by Clerk's global JS SDK.
 *
 * The actual sign-in / sign-up / OAuth flows are wired in components via
 * Clerk's React hooks (useSignIn, useSignUp). This module exposes only what
 * the global `api.ts` needs to attach Authorization headers and clear the
 * session on demand.
 */

export type AuthActionResult =
  | { success: true; verificationRequired?: false }
  | { success: true; verificationRequired: true; email: string }
  | { success: false; message: string }

type ClerkLike = {
  session?: {
    getToken: (options?: { skipCache?: boolean }) => Promise<string | null>
  } | null
  signOut?: () => Promise<unknown>
}

function getClerk(): ClerkLike | undefined {
  if (typeof window === "undefined") return undefined
  return (window as unknown as { Clerk?: ClerkLike }).Clerk
}

export async function getSessionToken(): Promise<string> {
  const clerk = getClerk()
  if (!clerk?.session) return ""
  try {
    const token = await clerk.session.getToken()
    return token ?? ""
  } catch {
    return ""
  }
}

export async function refreshSessionToken(): Promise<string> {
  const clerk = getClerk()
  if (!clerk?.session) return ""
  try {
    const token = await clerk.session.getToken({ skipCache: true })
    return token ?? ""
  } catch {
    return ""
  }
}

export async function signOutSession(): Promise<void> {
  const clerk = getClerk()
  if (!clerk?.signOut) return
  try {
    await clerk.signOut()
  } catch {
    // ignored — Clerk may already be in signed-out state
  }
}
