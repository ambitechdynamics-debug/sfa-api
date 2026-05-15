import { AdminUser } from '@/types/user'
import { AdminApiError } from './api-error'
import { getSession, signOut } from './authClient'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:5000' : '')
).replace(/\/+$/, '')

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

type LoginResponse = {
  user: AdminUser
  token: string
}

/**
 * Resolve the Bearer token used to authenticate API calls.
 *
 * Source of truth: the active Better Auth session. The session token is the
 * Neon-Auth-issued JWT verified by the Express backend via JWKS.
 */
export async function getToken(): Promise<string> {
  if (typeof window === 'undefined') return ''
  const authEndpointToken = await fetchAuthJwt()
  if (authEndpointToken) return authEndpointToken

  try {
    const { data } = await getSession()
    const sessionToken = findAuthToken(data)
    if (sessionToken) return sessionToken
  } catch {
    // Fall through to legacy admin token.
  }

  return localStorage.getItem('admin_token') || ''
}

async function fetchAuthJwt(): Promise<string> {
  for (const path of ['/api/auth/token', '/api/auth/get-session']) {
    try {
      const response = await fetch(path, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })

      const headerToken = response.headers.get('set-auth-jwt') || response.headers.get('set-auth-token')
      if (headerToken?.trim()) return headerToken.trim()

      const data = (await response.json().catch(() => null)) as unknown
      const bodyToken = findAuthToken(data)
      if (bodyToken) return bodyToken
    } catch {
      // Try the next auth endpoint.
    }
  }

  return ''
}

function findAuthToken(value: unknown, seen = new Set<unknown>(), acceptString = true): string {
  if (typeof value === 'string') return acceptString && value.trim() ? value.trim() : ''
  if (!value || typeof value !== 'object' || seen.has(value)) return ''
  seen.add(value)

  if (Array.isArray(value)) {
    for (const item of value) {
      const token = findAuthToken(item, seen, acceptString)
      if (token) return token
    }
    return ''
  }

  const record = value as Record<string, unknown>
  const preferredKeys = ['jwt', 'idToken', 'id_token', 'accessToken', 'access_token', 'token']
  for (const key of preferredKeys) {
    const token = findAuthToken(record[key], seen, true)
    if (token) return token
  }

  for (const item of Object.values(record)) {
    const token = findAuthToken(item, seen, false)
    if (token) return token
  }

  return ''
}

async function requestApi<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new AdminApiError('URL API manquante. Configurez NEXT_PUBLIC_API_URL.', 0)
  }

  const token = await getToken()
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new AdminApiError('API indisponible. Vérifiez que le serveur backend est lancé.', 0)
  }

  const data = await res.json().catch(() => ({} as ApiResponse<T>))
  if (!res.ok || !data.success || data.data === undefined) {
    throw new AdminApiError(data.message || 'Erreur API', res.status)
  }

  return data.data
}

/**
 * Fetch the local profile (with role + credits) from the backend.
 * Authentication itself is handled by Better Auth — this just enriches the
 * session with our business-data User row.
 */
export async function getMe(): Promise<AdminUser> {
  return requestApi<AdminUser>('/api/users/me')
}

export function hasLegacySession(): boolean {
  return typeof window !== 'undefined' && Boolean(localStorage.getItem('admin_token'))
}

export async function loginWithLegacyAdmin(email: string, password: string): Promise<AdminUser> {
  if (!API_URL) {
    throw new AdminApiError('URL API manquante. Configurez NEXT_PUBLIC_API_URL.', 0)
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new AdminApiError('API indisponible. Vérifiez que le serveur backend est lancé.', 0)
  }

  const data = await res.json().catch(() => ({} as ApiResponse<LoginResponse>))
  if (!res.ok || !data.success || !data.data?.token || !data.data.user) {
    throw new AdminApiError(data.message || 'Invalid email or password', res.status)
  }

  if (data.data.user.role !== 'ADMIN') {
    throw new AdminApiError("Ce compte n'a pas les droits administrateur.", 403)
  }

  localStorage.setItem('admin_token', data.data.token)
  localStorage.setItem('admin_user', JSON.stringify(data.data.user))
  return data.data.user
}

/**
 * Sign out: clears the Better Auth session cookie + local cache.
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await signOut()
  } catch {
    /* noop */
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user') // Legacy cache from old JWT flow
  }
}

export function isAdmin(user: AdminUser | null): boolean {
  return user?.role === 'ADMIN'
}

/**
 * @deprecated retained only for old call sites; new code should rely on the
 * Better Auth session cookie. No-op outside the browser.
 */
export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
}
