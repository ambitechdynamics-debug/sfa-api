import { api } from "@/lib/api"
import type { Conversation } from "@/store/chat-store"

type ApiMessage = Omit<NonNullable<Conversation["messages"]>[number], "role"> & {
  role: "user" | "assistant" | "system" | "USER" | "ASSISTANT" | "SYSTEM"
}

export type ApiConversation = Omit<Conversation, "messages"> & {
  messages?: ApiMessage[]
}

export function fetchConversations() {
  return api.get<ApiConversation[]>("/conversations")
}

export function fetchConversation(id: string) {
  return api.get<ApiConversation>(`/conversations/${id}`)
}

export function updateConversation(id: string, body: { title?: string; archived?: boolean }) {
  return api.patch<ApiConversation>(`/conversations/${id}`, body)
}

export function deleteConversation(id: string) {
  return api.delete<void>(`/conversations/${id}`)
}
