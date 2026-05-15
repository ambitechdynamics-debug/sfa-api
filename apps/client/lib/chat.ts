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
  conversationId?: string
  projectId?: string
  history?: ChatHistoryMessage[]
}

export interface SendChatMessageResult {
  reply: string
  conversationId?: string
  projectId?: string
  title?: string
  fallback?: boolean
}

type ChatEndpointResponse = {
  success?: boolean
  reply?: string
  conversationId?: string
  projectId?: string
  title?: string
  error?: string
  message?: string | {
    role?: string
    content?: string
  }
  fallback?: boolean
  data?: {
    reply?: string
    conversationId?: string
    projectId?: string
    title?: string
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

  return {
    reply,
    conversationId: data.conversationId ?? data.data?.conversationId,
    projectId: data.projectId ?? data.data?.projectId,
    title: data.title ?? data.data?.title,
    fallback: data.fallback,
  }
}
