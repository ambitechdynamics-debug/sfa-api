import { AdminUser } from '@/types/user'
import { AdminApiError } from './api-error'
import { getSession, signOut } from './authClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

/**
 * Resolve the Bearer token used to authenticate API calls.
 *
 * Source of truth: the active Better Auth session. The session token is the
 * Neon-Auth-issued JWT verified by the Express backend via JWKS.
 */
export async function getToken(): Promise<string> {
  if (typeof window === 'undefined') return ''
  try {
    const { data } = await getSession()
    const session = data as { session?: { token?: string }; jwt?: string } | null
    return session?.jwt ?? session?.session?.token ?? ''
  } catch {
    return ''
  }
}

async function requestApi<T>(path: string, options?: RequestInit): Promise<T> {
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
  localStorage.removeItem('admin_user')
}
