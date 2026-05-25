import { ApiError } from "./api"
import { emitAuthExpired, SESSION_EXPIRED_MESSAGE } from "@/lib/session-token"
import { getSessionToken, refreshSessionToken } from "@/services/auth.service"

export type ChatRole = "user" | "assistant"

export interface ChatHistoryMessage {
  role: ChatRole
  content: string
}

export interface SendChatMessageInput {
  message: string
  travailId: string
  history?: ChatHistoryMessage[]
  visualConfig?: Record<string, unknown>
}

export interface SendChatMessageResult {
  reply: string
  travailId: string
  projectId: string
  fallback?: boolean
}

type ChatEndpointResponse = {
  success?: boolean
  reply?: string
  travailId?: string
  projectId?: string
  error?: string
  message?: string | {
    role?: string
    content?: string
  }
  fallback?: boolean
  data?: {
    reply?: string
    travailId?: string
    projectId?: string
    message?: {
      role?: string
      content?: string
    }
  }
}

function getResponseError(data: ChatEndpointResponse, status: number) {
  if (status === 401) {
    return data.error || SESSION_EXPIRED_MESSAGE
  }
  return data.error || (typeof data.message === "string" ? data.message : "") || "Une erreur est survenue. Veuillez réessayer."
}

function getReply(data: ChatEndpointResponse) {
  if (typeof data.message === "object" && data.message?.content) return data.message.content
  if (data.reply) return data.reply
  if (data.data?.message?.content) return data.data.message.content
  return data.data?.reply
}

export async function sendChatMessage(input: SendChatMessageInput): Promise<SendChatMessageResult> {
  const token = await getSessionToken()
  let response: Response

  const request = (authToken: string) => fetch("/api/chat", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(input),
  })

  try {
    response = await request(token)
  } catch {
    throw new ApiError("Une erreur est survenue. Veuillez réessayer.", 0)
  }

  if (response.status === 401) {
    const refreshedToken = await refreshSessionToken()
    if (refreshedToken) {
      try {
        response = await request(refreshedToken)
      } catch {
        throw new ApiError("Une erreur est survenue. Veuillez réessayer.", 0)
      }
    }
  }

  const data = (await response.json().catch(() => ({}))) as ChatEndpointResponse
  if (!response.ok || data.success !== true) {
    if (response.status === 401 || response.status === 403) {
      emitAuthExpired({ status: response.status, message: SESSION_EXPIRED_MESSAGE })
    }
    throw new ApiError(getResponseError(data, response.status), response.status)
  }

  const reply = getReply(data)
  if (!reply) {
    throw new ApiError("La réponse de l'agent est vide. Veuillez réessayer.", response.status)
  }

  const travailId = data.travailId ?? data.data?.travailId ?? input.travailId
  const projectId = data.projectId ?? data.data?.projectId ?? ""

  return {
    reply,
    travailId,
    projectId,
    fallback: data.fallback,
  }
}

export interface FetchChatOpeningResult {
  opening: string
  message: {
    id: string
    role: "assistant"
    content: string
    createdAt: string
  }
  travailId: string
  projectId: string
  hasAssets: boolean
  assetSummary: Record<string, number>
  reused: boolean
}

type ChatOpeningResponse = {
  success?: boolean
  opening?: string
  message?: {
    id?: string
    role?: string
    content?: string
    createdAt?: string
  }
  travailId?: string
  projectId?: string
  hasAssets?: boolean
  assetSummary?: Record<string, number>
  reused?: boolean
  error?: string
}

export async function fetchChatOpening(
  travailId: string,
  visualConfig?: Record<string, unknown>,
): Promise<FetchChatOpeningResult> {
  const token = await getSessionToken()

  const request = (authToken: string) => fetch("/api/chat/opening", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ travailId, visualConfig }),
  })

  let response: Response
  try {
    response = await request(token)
  } catch {
    throw new ApiError("Une erreur est survenue. Veuillez réessayer.", 0)
  }

  if (response.status === 401) {
    const refreshedToken = await refreshSessionToken()
    if (refreshedToken) {
      try {
        response = await request(refreshedToken)
      } catch {
        throw new ApiError("Une erreur est survenue. Veuillez réessayer.", 0)
      }
    }
  }

  const data = (await response.json().catch(() => ({}))) as ChatOpeningResponse
  if (!response.ok || data.success !== true) {
    if (response.status === 401 || response.status === 403) {
      emitAuthExpired({ status: response.status, message: SESSION_EXPIRED_MESSAGE })
    }
    throw new ApiError(data.error || "Impossible de générer le message d'ouverture.", response.status)
  }

  if (!data.opening || !data.message?.content || !data.travailId) {
    throw new ApiError("Réponse d'ouverture incomplète.", response.status)
  }

  return {
    opening: data.opening,
    message: {
      id: data.message.id ?? `opening-${Date.now()}`,
      role: "assistant",
      content: data.message.content,
      createdAt: data.message.createdAt ?? new Date().toISOString(),
    },
    travailId: data.travailId,
    projectId: data.projectId ?? "",
    hasAssets: Boolean(data.hasAssets),
    assetSummary: data.assetSummary ?? {},
    reused: Boolean(data.reused),
  }
}
