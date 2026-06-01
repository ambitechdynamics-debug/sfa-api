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
  loaded?: boolean
  session?: {
    getToken: (options?: { skipCache?: boolean }) => Promise<string | null>
  } | null
  signOut?: () => Promise<unknown>
}

type WaitForSessionTokenOptions = {
  timeoutMs?: number
  skipCache?: boolean
}

const TOKEN_WAIT_STEP_MS = 250

function getClerk(): ClerkLike | undefined {
  if (typeof window === "undefined") return undefined
  return (window as unknown as { Clerk?: ClerkLike }).Clerk
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function waitForSessionToken(options: WaitForSessionTokenOptions = {}): Promise<string> {
  if (typeof window === "undefined") return ""

  const timeoutMs = options.timeoutMs ?? 0
  const deadline = Date.now() + timeoutMs

  while (true) {
    const token = await getSessionToken({ skipCache: options.skipCache })
    if (token) return token
    if (Date.now() >= deadline) return ""
    await delay(Math.min(TOKEN_WAIT_STEP_MS, Math.max(0, deadline - Date.now())))
  }
}

export async function getSessionToken(options?: { skipCache?: boolean }): Promise<string> {
  const clerk = getClerk()
  if (!clerk?.session) return ""
  try {
    const token = await clerk.session.getToken(options)
    return token ?? ""
  } catch {
    return ""
  }
}

export async function refreshSessionToken(): Promise<string> {
  return getSessionToken({ skipCache: true })
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
