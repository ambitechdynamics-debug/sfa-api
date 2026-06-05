import { AdminUser } from '@/types/user'
import { AdminApiError } from './api-error'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:5000' : '')
).replace(/\/+$/, '')

const TOKEN_STORAGE_KEY = 'admin-jwt-token'

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

/**
 * Admin auth uses a backend-issued JWT (email + password against the User
 * table). The token is stored in localStorage and attached as `Bearer` to
 * every admin API call.
 *
 * NOTE: localStorage is XSS-exposed. The trade-off here matches the existing
 * setup (single-page admin app, no SSR for /admin pages) and the alternative
 * (HttpOnly cookies) requires CORS credentials + SameSite tuning beyond this
 * change set.
 */
export function getToken(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? ''
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

async function requestApi<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new AdminApiError('URL API manquante. Configurez NEXT_PUBLIC_API_URL.', 0)
  }

  const token = getToken()
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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

export async function getMe(): Promise<AdminUser> {
  return requestApi<AdminUser>('/api/auth/admin/me')
}

export interface AdminLoginResponse {
  token: string
  user: AdminUser
}

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
  const result = await requestApi<AdminLoginResponse>('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(result.token)
  return result
}

export async function logoutAdmin(): Promise<void> {
  clearSession()
}

export function isAdmin(user: AdminUser | null): boolean {
  return user?.role === 'ADMIN'
}
