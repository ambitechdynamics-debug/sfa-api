import { AdminUser } from '@/types/user'
import { AdminApiError } from './api-error'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:5000' : '')
).replace(/\/+$/, '')

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

type ClerkLike = {
  session?: {
    getToken: (options?: { skipCache?: boolean }) => Promise<string | null>
  } | null
  signOut?: () => Promise<unknown>
}

function getClerk(): ClerkLike | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { Clerk?: ClerkLike }).Clerk
}

export async function getToken(options?: { skipCache?: boolean }): Promise<string> {
  const clerk = getClerk()
  if (!clerk?.session) return ''

  try {
    return (await clerk.session.getToken(options)) ?? ''
  } catch {
    return ''
  }
}

async function requestApi<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new AdminApiError('URL API manquante. Configurez NEXT_PUBLIC_API_URL.', 0)
  }

  const send = async (token: string) => fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  let res: Response
  try {
    const token = await getToken()
    res = await send(token)

    if (res.status === 401 || res.status === 403) {
      const refreshedToken = await getToken({ skipCache: true })
      if (refreshedToken && refreshedToken !== token) {
        res = await send(refreshedToken)
      }
    }
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
  return requestApi<AdminUser>('/api/users/me')
}

export async function logoutAdmin(): Promise<void> {
  const clerk = getClerk()
  try {
    await clerk?.signOut?.()
  } catch {
    /* noop */
  }
}

export function isAdmin(user: AdminUser | null): boolean {
  return user?.role === 'ADMIN'
}

export function clearSession() {
  // Clerk owns the browser session; this function is retained for existing
  // invalid-auth call sites.
}
