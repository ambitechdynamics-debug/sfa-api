export const AUTH_EXPIRED_EVENT = "client-auth-expired"
export const SESSION_EXPIRED_MESSAGE = "Votre session a expiré. Veuillez vous reconnecter."

export type AuthExpiredDetail = {
  message?: string
  status?: number
}

const PROTECTED_ROOTS = [
  "/dashboard",
  "/ai-settings",
  "/billing",
  "/create",
  "/metrics",
  "/notifications",
  "/profile",
  "/projects",
  "/settings",
  "/support",
]

const AUTH_ROOTS = ["/login", "/register", "/check-email", "/forgot-password", "/reset-password"]

export function looksLikeJwt(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)
}

export function findJwt(value: unknown, seen = new Set<unknown>()): string {
  if (looksLikeJwt(value)) return value
  if (!value || typeof value !== "object" || seen.has(value)) return ""
  seen.add(value)

  if (Array.isArray(value)) {
    for (const item of value) {
      const token = findJwt(item, seen)
      if (token) return token
    }
    return ""
  }

  const record = value as Record<string, unknown>
  for (const key of ["jwt", "idToken", "id_token", "accessToken", "access_token", "token"]) {
    const token = findJwt(record[key], seen)
    if (token) return token
  }

  for (const item of Object.values(record)) {
    const token = findJwt(item, seen)
    if (token) return token
  }

  return ""
}

export function emitAuthExpired(detail: AuthExpiredDetail = {}) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<AuthExpiredDetail>(AUTH_EXPIRED_EVENT, { detail }))
}

export function readAuthExpiredDetail(event: Event): AuthExpiredDetail {
  return event instanceof CustomEvent && event.detail && typeof event.detail === "object"
    ? (event.detail as AuthExpiredDetail)
    : {}
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}

export function isAuthPath(pathname: string) {
  return AUTH_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}

export function sanitizeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard"
  if (value.startsWith("/api/") || isAuthPath(value)) return "/dashboard"
  return value
}

export function buildLoginPath(nextPath: string, reason?: "expired") {
  const params = new URLSearchParams()
  if (isProtectedPath(nextPath)) params.set("next", nextPath)
  if (reason) params.set("reason", reason)
  const query = params.toString()
  return `/login${query ? `?${query}` : ""}`
}
