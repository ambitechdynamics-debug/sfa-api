import { authClient } from "@/lib/authClient"

type AuthErrorLike = {
  code?: string
  message?: string
}

export type AuthActionResult =
  | { success: true; verificationRequired?: false }
  | { success: true; verificationRequired: true; email: string }
  | { success: false; message: string }

type RegisterInput = {
  fullName: string
  email: string
  password: string
  callbackURL: string
}

let refreshTokenPromise: Promise<string> | null = null
const AUTH_FETCH_TIMEOUT_MS = 4_000
const SESSION_TOKEN_STORAGE_KEY = "sfa.auth.session-token"

function mapEmailAuthError(error?: AuthErrorLike | null) {
  if (!error) return "Connexion impossible. Veuillez réessayer."
  const code = error.code ?? ""
  const message = error.message?.toLowerCase() ?? ""
  if (code === "INVALID_EMAIL_OR_PASSWORD" || message.includes("invalid email or password")) {
    return "Email ou mot de passe incorrect."
  }
  if (error.code === "EMAIL_NOT_VERIFIED") return "Veuillez vérifier votre adresse email avant de vous connecter."
  if (error.code === "INVALID_EMAIL") return "Format d'email invalide."
  if (error.code === "USER_NOT_FOUND") return "Aucun compte n'est associé à cette adresse."
  return "Connexion impossible. Veuillez réessayer."
}

function mapRegisterError(error?: AuthErrorLike | null) {
  if (!error) return "Inscription impossible. Veuillez réessayer."
  if (error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return "Un compte existe déjà avec cet email."
  }
  if (error.code === "PASSWORD_TOO_SHORT") return "Mot de passe trop court (8 caractères minimum)."
  if (error.code === "INVALID_EMAIL") return "Format d'email invalide."
  if (error.code === "INVALID_ORIGIN" || error.code === "INVALID_CALLBACK_URL" || error.code === "MISSING_ORIGIN") {
    return "La demande a expiré. Rechargez la page puis réessayez."
  }
  return "Inscription impossible. Veuillez réessayer."
}

function mapSocialAuthError(error?: AuthErrorLike | null) {
  if (!error) return "Connexion Google impossible. Veuillez réessayer."
  if (error.code === "INVALID_ORIGIN" || error.code === "INVALID_CALLBACK_URL" || error.code === "MISSING_ORIGIN") {
    return "La redirection de connexion a expiré. Rechargez la page puis réessayez."
  }
  return "Connexion Google impossible. Veuillez réessayer."
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function fetchAuthJwt(path: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS)

  const response = await fetch(path, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeout)
  })

  const headerToken = response.headers.get("set-auth-jwt") || response.headers.get("set-auth-token")
  if (typeof headerToken === "string" && headerToken.trim()) return headerToken.trim()

  const data = (await response.json().catch(() => null)) as unknown
  return findAuthToken(data)
}

function findAuthToken(value: unknown, seen = new Set<unknown>(), acceptString = true): string {
  if (typeof value === "string") return acceptString && value.trim() ? value.trim() : ""
  if (!value || typeof value !== "object" || seen.has(value)) return ""
  seen.add(value)

  if (Array.isArray(value)) {
    for (const item of value) {
      const token = findAuthToken(item, seen, acceptString)
      if (token) return token
    }
    return ""
  }

  const record = value as Record<string, unknown>
  for (const key of ["jwt", "idToken", "id_token", "accessToken", "access_token", "token"]) {
    const token = findAuthToken(record[key], seen, true)
    if (token) return token
  }

  for (const item of Object.values(record)) {
    const token = findAuthToken(item, seen, false)
    if (token) return token
  }

  return ""
}

function getStoredSessionToken() {
  if (typeof window === "undefined") return ""
  return window.sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY) || ""
}

function setStoredSessionToken(token: string) {
  if (typeof window === "undefined" || !token) return
  window.sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token)
}

function clearStoredSessionToken() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(SESSION_TOKEN_STORAGE_KEY)
}

async function resolveSessionToken() {
  const endpoints = ["/api/auth/token", "/api/auth/get-session"]

  for (const path of endpoints) {
    try {
      const token = await fetchAuthJwt(path)
      if (token) return token
    } catch {
      // Try the next Better Auth endpoint.
    }
  }

  try {
    const { data } = await withTimeout(authClient.getSession(), AUTH_FETCH_TIMEOUT_MS, "authClient.getSession")
    const token = findAuthToken(data)
    if (token) return token
  } catch {
    // Fall back to the token returned by sign-in for this tab.
  }

  return getStoredSessionToken()
}

export async function getSessionToken() {
  if (typeof window === "undefined") return ""
  return resolveSessionToken()
}

export async function refreshSessionToken() {
  if (typeof window === "undefined") return ""
  if (!refreshTokenPromise) {
    refreshTokenPromise = resolveSessionToken().finally(() => {
      refreshTokenPromise = null
    })
  }
  return refreshTokenPromise
}

export async function signInWithEmail(email: string, password: string): Promise<AuthActionResult> {
  try {
    const { data, error } = await authClient.signIn.email({ email, password })
    if (error) return { success: false, message: mapEmailAuthError(error) }
    const token = findAuthToken(data)
    if (token) setStoredSessionToken(token)
    return { success: true }
  } catch {
    return { success: false, message: "Erreur de connexion au service d'authentification." }
  }
}

export async function signInWithGoogle(callbackURL: string): Promise<AuthActionResult> {
  try {
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL })
    if (error) return { success: false, message: mapSocialAuthError(error) }
    return { success: true }
  } catch {
    return { success: false, message: "Connexion Google impossible. Veuillez réessayer." }
  }
}

export async function registerWithEmail(input: RegisterInput): Promise<AuthActionResult> {
  try {
    const { data, error } = await authClient.signUp.email({
      email: input.email,
      password: input.password,
      name: input.fullName,
      callbackURL: input.callbackURL,
    })

    if (error) return { success: false, message: mapRegisterError(error) }

    const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
      email: input.email,
      type: "email-verification",
    })

    const signUpData = data as { token?: string | null } | null
    if (signUpData?.token) return { success: true }

    if (otpError) {
      return { success: false, message: "Compte créé, mais l'envoi du code de vérification a échoué." }
    }

    return { success: true, verificationRequired: true, email: input.email }
  } catch {
    return { success: false, message: "Erreur de connexion au service d'authentification." }
  }
}

export async function signOutSession() {
  clearStoredSessionToken()
  try {
    await authClient.signOut()
  } catch {
    // Better Auth may already have cleared the cookie.
  }
}
