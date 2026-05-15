import type { ApiResponse } from "@/types/api"
import { getSessionToken, refreshSessionToken } from "@/services/auth.service"
import { emitAuthExpired, SESSION_EXPIRED_MESSAGE } from "@/lib/session-token"

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV !== "production" ? "http://localhost:5000" : "")
).replace(/\/+$/, "")

type ApiEnvelope<T> = ApiResponse<T> & {
  error?: string
  code?: string
}

export type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean
  suppressAuthRedirect?: boolean
}

export class ApiError extends Error {
  status: number
  code?: string
  errors: unknown[]

  constructor(message: string, status: number, errors: unknown[] = [], code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errors = errors
    this.code = code
  }
}

function normalizeApiPath(path: string) {
  if (path.startsWith("/api/")) return path
  if (path === "/api") return path
  return `/api${path.startsWith("/") ? path : `/${path}`}`
}

function readErrorMessage(data: ApiEnvelope<unknown>, status: number, suppressAuthRedirect?: boolean) {
  if ((status === 401 || status === 403) && !suppressAuthRedirect) return SESSION_EXPIRED_MESSAGE
  return data.message || data.error || "Une erreur est survenue. Veuillez réessayer."
}

function shouldExpireAuth(status: number) {
  return status === 401 || status === 403
}

function notifyAuthFailure(status: number, suppressAuthRedirect?: boolean) {
  if (!suppressAuthRedirect && shouldExpireAuth(status)) {
    emitAuthExpired({ status, message: SESSION_EXPIRED_MESSAGE })
  }
}

async function parseJson<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as ApiEnvelope<T>
}

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const { skipAuth, suppressAuthRedirect, headers, ...fetchOptions } = options ?? {}
  if (!API_URL) {
    throw new ApiError("URL API manquante. Configurez NEXT_PUBLIC_API_URL.", 0)
  }

  const url = `${API_URL}${path}`
  const initialToken = skipAuth ? "" : await getSessionToken()

  const request = (token: string) => {
    return fetch(url, {
      ...fetchOptions,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  }

  let response: Response
  try {
    response = await request(initialToken)
  } catch {
    throw new ApiError("API indisponible. Vérifiez votre connexion.", 0)
  }

  let data = await parseJson<T>(response)
  if (!skipAuth && shouldExpireAuth(response.status)) {
    const refreshedToken = await refreshSessionToken()
    if (refreshedToken && refreshedToken !== initialToken) {
      try {
        response = await request(refreshedToken)
        data = await parseJson<T>(response)
      } catch {
        throw new ApiError("API indisponible. Vérifiez votre connexion.", 0)
      }
    }
  }

  if (!response.ok || data.success === false) {
    notifyAuthFailure(response.status, suppressAuthRedirect)
    throw new ApiError(readErrorMessage(data, response.status, suppressAuthRedirect), response.status, data.errors || [], data.code)
  }

  return data.data as T
}

export const api = {
  get<T>(path: string, options?: ApiFetchOptions) {
    return apiFetch<T>(normalizeApiPath(path), options)
  },

  post<T>(path: string, body?: unknown, options?: ApiFetchOptions) {
    return apiFetch<T>(normalizeApiPath(path), {
      ...options,
      method: "POST",
      body: JSON.stringify(body ?? {}),
    })
  },

  patch<T>(path: string, body?: unknown, options?: ApiFetchOptions) {
    return apiFetch<T>(normalizeApiPath(path), {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body ?? {}),
    })
  },

  delete<T = void>(path: string, options?: ApiFetchOptions) {
    return apiFetch<T>(normalizeApiPath(path), { ...options, method: "DELETE" })
  },
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  onProgress?: (pct: number) => void,
): Promise<T> {
  if (!API_URL) {
    throw new ApiError("URL API manquante. Configurez NEXT_PUBLIC_API_URL.", 0)
  }

  const send = (token: string, retried: boolean): Promise<T> => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${API_URL}${path}`)
    xhr.withCredentials = true
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      let data: ApiEnvelope<T>
      try {
        data = JSON.parse(xhr.responseText || "{}") as ApiEnvelope<T>
      } catch {
        reject(new ApiError("Réponse invalide du serveur.", xhr.status))
        return
      }

      if (xhr.status >= 400 || data.success === false) {
        if (!retried && shouldExpireAuth(xhr.status)) {
          refreshSessionToken()
            .then((refreshedToken) => {
              if (refreshedToken && refreshedToken !== token) {
                send(refreshedToken, true).then(resolve).catch(reject)
                return
              }
              notifyAuthFailure(xhr.status)
              reject(new ApiError(readErrorMessage(data, xhr.status), xhr.status, data.errors || [], data.code))
            })
            .catch(() => {
              notifyAuthFailure(xhr.status)
              reject(new ApiError(readErrorMessage(data, xhr.status), xhr.status, data.errors || [], data.code))
            })
          return
        }

        notifyAuthFailure(xhr.status)
        reject(new ApiError(readErrorMessage(data, xhr.status), xhr.status, data.errors || [], data.code))
        return
      }

      resolve(data.data as T)
    }

    xhr.onerror = () => reject(new ApiError("API indisponible. Vérifiez votre connexion.", 0))
    xhr.send(formData)
  })

  return send(await getSessionToken(), false)
}
