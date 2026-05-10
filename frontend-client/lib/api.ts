import type { ApiResponse } from "@/types/api"
import { getSession } from "./authClient"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export class ApiError extends Error {
  status: number
  errors: unknown[]
  constructor(message: string, status: number, errors: unknown[] = []) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

/**
 * Resolve the Bearer token used for backend API calls.
 *
 * Source of truth: the active Better Auth session. The session is stored as a
 * Neon-Auth-issued JWT that the Express backend validates via the JWKS
 * endpoint (see `src/middlewares/auth.middleware.ts`).
 */
export async function getToken(): Promise<string> {
  if (typeof window === "undefined") return ""
  try {
    const { data } = await getSession()
    // Neon Auth (Better Auth) can expose the token under several keys.
    // Log the session shape in dev to diagnose OAuth token structure.
    if (process.env.NODE_ENV === "development" && data) {
      console.debug("[getToken] session keys:", Object.keys(data))
      console.debug("[getToken] session:", JSON.stringify(data, null, 2))
    }
    // Try every known key where Better Auth / Neon Auth can store the JWT:
    // - data.jwt         → JWT plugin (Neon Auth default)
    // - data.idToken     → OIDC id_token (Google OAuth flow)
    // - data.session.token → cookie-bound session token (email/password flow)
    const session = data as {
      session?: { token?: string }
      jwt?: string
      idToken?: string
    } | null
    return session?.jwt ?? session?.idToken ?? session?.session?.token ?? ""
  } catch {
    return ""
  }
}

function notifyAuthExpired() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event("client-auth-expired"))
}

/**
 * Generic typed fetch wrapper. Throws ApiError on non-2xx.
 * Returns the `data` field of the standard response envelope.
 */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken()
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      // Include cookies so Better Auth's session cookie travels with same-site requests.
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })
  } catch {
    throw new ApiError("API indisponible. Vérifiez votre connexion.", 0)
  }

  const data = (await res.json().catch(() => ({}))) as ApiResponse<T>
  if (!res.ok || data.success === false) {
    const error = new ApiError(data.message || "Erreur API", res.status, data.errors || [])
    if (res.status === 401) notifyAuthExpired()
    throw error
  }
  return data.data as T
}

/**
 * Multipart upload (no Content-Type header — browser sets boundary).
 * Returns parsed `data` field.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  onProgress?: (pct: number) => void,
): Promise<T> {
  const token = await getToken()
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${API_URL}${path}`)
    xhr.withCredentials = true
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as ApiResponse<T>
        if (xhr.status >= 400 || data.success === false) {
          if (xhr.status === 401) notifyAuthExpired()
          return reject(new ApiError(data.message || "Erreur upload", xhr.status, data.errors || []))
        }
        resolve(data.data as T)
      } catch {
        reject(new ApiError("Réponse invalide du serveur", xhr.status))
      }
    }

    xhr.onerror = () => reject(new ApiError("API indisponible.", 0))
    xhr.send(formData)
  })
}
