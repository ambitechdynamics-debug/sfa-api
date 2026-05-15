import { create } from "zustand"
import { ApiError } from "@/lib/api"
import { sendChatMessage } from "@/lib/chat"
import {
  deleteConversation as apiDeleteConversation,
  fetchConversation,
  fetchConversations,
  updateConversation as apiUpdateConversation,
  type ApiConversation,
} from "@/services/conversation.service"

const CHAT_ERROR_MESSAGE = "Une erreur est survenue. Veuillez réessayer."
const CONVERSATION_LOAD_ERROR = "Conversation introuvable ou indisponible."
const LOCAL_CONVERSATIONS_KEY = "studio-flyer-chat-conversations"

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  projectId?: string
  status: "ACTIVE" | "ARCHIVED"
  updatedAt: string
  lastMessageAt: string
  createdAt: string
  messages?: Message[]
}

interface ChatState {
  history: Conversation[]
  activeConversation: Conversation | null
  isLoadingHistory: boolean
  isSending: boolean
  error: string
  failedMessage: string
  failedMessageId: string
  fetchHistory: (userId: string) => Promise<void>
  loadConversation: (id: string, userId: string) => Promise<void>
  sendMessage: (content: string, userId: string, projectId?: string) => Promise<string | undefined>
  retryFailedMessage: (userId: string) => Promise<string | undefined>
  clearActive: () => void
  renameConversation: (id: string, title: string, userId?: string) => Promise<void>
  archiveConversation: (id: string, userId?: string) => Promise<void>
  deleteConversation: (id: string, userId?: string) => Promise<void>
  reset: () => void
}

function now() {
  return new Date().toISOString()
}

function tempId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isRequestableConversation(id?: string) {
  return Boolean(id && !id.startsWith("temp-") && !id.startsWith("local-"))
}

function isLocalConversation(id?: string) {
  return Boolean(id?.startsWith("local-"))
}

function toChatHistory(messages: Message[] = []) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }))
}

function normalizeMessageRole(role: NonNullable<ApiConversation["messages"]>[number]["role"]): Message["role"] {
  if (role === "USER") return "user"
  if (role === "ASSISTANT") return "assistant"
  if (role === "SYSTEM") return "system"
  return role
}

function normalizeConversation(conversation: ApiConversation): Conversation {
  return {
    ...conversation,
    status: (conversation as any).status ?? "ACTIVE",
    lastMessageAt: (conversation as any).lastMessageAt ?? conversation.updatedAt,
    messages: conversation.messages?.map((message) => ({
      ...message,
      role: normalizeMessageRole(message.role),
    })),
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    (record.role === "user" || record.role === "assistant" || record.role === "system") &&
    typeof record.content === "string" &&
    typeof record.createdAt === "string"
  )
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string" &&
    (typeof record.lastMessageAt === "string" || record.lastMessageAt === undefined) &&
    (record.status === "ACTIVE" || record.status === "ARCHIVED" || record.status === undefined) &&
    (record.messages === undefined || (Array.isArray(record.messages) && record.messages.every(isMessage)))
  )
}

function localConversationsKey(userId: string) {
  return `${LOCAL_CONVERSATIONS_KEY}:${userId}`
}

function readLocalConversations(userId: string) {
  if (!canUseStorage()) return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(localConversationsKey(userId)) || "[]") as unknown
    return Array.isArray(parsed) ? parsed.filter(isConversation) : []
  } catch {
    return []
  }
}

function writeLocalConversations(userId: string, conversations: Conversation[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(localConversationsKey(userId), JSON.stringify(conversations.slice(0, 20)))
}

function upsertHistory(history: Conversation[], conversation: Conversation) {
  const existing = history.filter((item) => item.id !== conversation.id)
  return [conversation, ...existing]
}

function sortByUpdatedAt(conversations: Conversation[]) {
  return conversations.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt).getTime() - new Date(a.lastMessageAt || a.updatedAt).getTime())
}

function visibleConversations(conversations: Conversation[]) {
  return conversations.filter((conversation) => conversation.status !== "ARCHIVED")
}

function mergeConversations(primary: Conversation[], secondary: Conversation[]) {
  const byId = new Map<string, Conversation>()
  for (const conversation of [...primary, ...secondary]) {
    byId.set(conversation.id, conversation)
  }
  return sortByUpdatedAt([...byId.values()])
}

function persistLocalConversation(userId: string, conversation: Conversation) {
  if (!isLocalConversation(conversation.id)) return
  writeLocalConversations(userId, sortByUpdatedAt(upsertHistory(readLocalConversations(userId), conversation)))
}

function removeLocalConversation(userId: string, id: string) {
  writeLocalConversations(userId, readLocalConversations(userId).filter((conversation) => conversation.id !== id))
}

function readableChatError(error: unknown) {
  if (error instanceof ApiError && error.message) return error.message
  return CHAT_ERROR_MESSAGE
}

export const useChatStore = create<ChatState>((set, get) => ({
  history: [],
  activeConversation: null,
  isLoadingHistory: false,
  isSending: false,
  error: "",
  failedMessage: "",
  failedMessageId: "",

  fetchHistory: async (userId: string) => {
    if (!userId) return
    set({ isLoadingHistory: true })
    const localConversations = visibleConversations(readLocalConversations(userId))
    try {
      const conversations = await fetchConversations()
      set({ history: mergeConversations(visibleConversations(conversations.map(normalizeConversation)), localConversations) })
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        set({ history: [], error: "" })
        return
      }
      set({ history: localConversations })
    } finally {
      set({ isLoadingHistory: false })
    }
  },

  loadConversation: async (id: string, userId: string) => {
    if (!userId) return
    if (isLocalConversation(id)) {
      const conversation = readLocalConversations(userId).find((item) => item.id === id)
      set({
        activeConversation: conversation ?? null,
        error: conversation ? "" : CONVERSATION_LOAD_ERROR,
        failedMessage: "",
        failedMessageId: "",
      })
      return
    }

    try {
      const conversation = await fetchConversation(id)
      set({ activeConversation: normalizeConversation(conversation), error: "", failedMessage: "", failedMessageId: "" })
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        set({ activeConversation: null, error: "", failedMessage: "", failedMessageId: "" })
        return
      }
      const localConversation = readLocalConversations(userId).find((item) => item.id === id)
      set({
        activeConversation: localConversation ?? null,
        error: localConversation ? "" : CONVERSATION_LOAD_ERROR,
        failedMessage: "",
        failedMessageId: "",
      })
    }
  },

  sendMessage: async (content: string, userId: string, projectId?: string) => {
    const clean = content.trim()
    if (!clean || !userId || get().isSending) return undefined

    const { activeConversation, history } = get()
    const createdAt = now()
    const userMessage: Message = {
      id: tempId("user"),
      role: "user",
      content: clean,
      createdAt,
    }

    const conversationBeforeSend: Conversation = activeConversation
      ? {
          ...activeConversation,
          updatedAt: createdAt,
          lastMessageAt: createdAt,
          messages: [...(activeConversation.messages ?? []), userMessage],
        }
      : {
          id: tempId("conversation"),
          title: clean.slice(0, 50),
          projectId,
          status: "ACTIVE",
          createdAt,
          updatedAt: createdAt,
          lastMessageAt: createdAt,
          messages: [userMessage],
        }

    set({
      activeConversation: conversationBeforeSend,
      isSending: true,
      error: "",
      failedMessage: "",
      failedMessageId: "",
    })

    try {
      const result = await sendChatMessage({
        message: clean,
        conversationId: isRequestableConversation(activeConversation?.id) ? activeConversation?.id : undefined,
        projectId: activeConversation?.projectId || projectId,
        history: toChatHistory(activeConversation?.messages),
      })

      const assistantMessage: Message = {
        id: tempId("assistant"),
        role: "assistant",
        content: result.reply,
        createdAt: now(),
      }

      const persistedConversation: Conversation = {
        ...conversationBeforeSend,
        id: result.conversationId || conversationBeforeSend.id,
        title: result.title || conversationBeforeSend.title,
        projectId: result.projectId || conversationBeforeSend.projectId,
        updatedAt: assistantMessage.createdAt,
        lastMessageAt: assistantMessage.createdAt,
        messages: [...(conversationBeforeSend.messages ?? []), assistantMessage],
      }

      if (activeConversation?.id && isLocalConversation(activeConversation.id) && !isLocalConversation(persistedConversation.id)) {
        removeLocalConversation(userId, activeConversation.id)
      }
      persistLocalConversation(userId, persistedConversation)

      set((state) => ({
        activeConversation: persistedConversation,
        history: upsertHistory(state.history.length ? state.history : history, persistedConversation),
        failedMessage: "",
        failedMessageId: "",
        error: "",
      }))
      return persistedConversation.id
    } catch (error) {
      set({ error: readableChatError(error), failedMessage: clean, failedMessageId: userMessage.id })
      return undefined
    } finally {
      set({ isSending: false })
    }
  },

  retryFailedMessage: async (userId: string) => {
    const { activeConversation, failedMessage, failedMessageId, sendMessage } = get()
    if (failedMessageId && activeConversation?.messages?.some((message) => message.id === failedMessageId)) {
      set({
        activeConversation: {
          ...activeConversation,
          messages: activeConversation.messages.filter((message) => message.id !== failedMessageId),
        },
      })
    }
    if (failedMessage) return sendMessage(failedMessage, userId)
    return undefined
  },

  clearActive: () => set({ activeConversation: null, error: "", failedMessage: "", failedMessageId: "" }),

  renameConversation: async (id: string, title: string, userId?: string) => {
    const clean = title.trim()
    if (!clean) return

    if (isLocalConversation(id)) {
      if (userId) {
        const updatedLocal = readLocalConversations(userId).map((conversation) => (
          conversation.id === id ? { ...conversation, title: clean, updatedAt: now() } : conversation
        ))
        writeLocalConversations(userId, sortByUpdatedAt(updatedLocal))
      }
      set((state) => ({
        history: state.history.map((conversation) => (
          conversation.id === id ? { ...conversation, title: clean, updatedAt: now() } : conversation
        )),
        activeConversation: state.activeConversation?.id === id
          ? { ...state.activeConversation, title: clean, updatedAt: now() }
          : state.activeConversation,
      }))
      return
    }

    try {
      const conversation = normalizeConversation(await apiUpdateConversation(id, { title: clean }))
      set((state) => ({
        history: state.history.map((item) => (item.id === id ? { ...item, ...conversation } : item)),
        activeConversation: state.activeConversation?.id === id
          ? { ...state.activeConversation, ...conversation }
          : state.activeConversation,
        error: "",
      }))
    } catch {
      set({ error: CHAT_ERROR_MESSAGE })
    }
  },

  archiveConversation: async (id: string, userId?: string) => {
    const updatedAt = now()

    if (isLocalConversation(id)) {
      if (userId) {
        const updatedLocal = readLocalConversations(userId).map((conversation) => (
          conversation.id === id ? { ...conversation, status: "ARCHIVED" as const, updatedAt } : conversation
        ))
        writeLocalConversations(userId, sortByUpdatedAt(updatedLocal))
      }
      set((state) => ({
        history: state.history.filter((conversation) => conversation.id !== id),
        activeConversation: state.activeConversation?.id === id
          ? { ...state.activeConversation, status: "ARCHIVED" as const, updatedAt }
          : state.activeConversation,
      }))
      return
    }

    try {
      const conversation = normalizeConversation(await apiUpdateConversation(id, { archived: true }))
      set((state) => ({
        history: state.history.filter((item) => item.id !== id),
        activeConversation: state.activeConversation?.id === id
          ? { ...state.activeConversation, ...conversation }
          : state.activeConversation,
        error: "",
      }))
    } catch {
      set({ error: CHAT_ERROR_MESSAGE })
    }
  },

  deleteConversation: async (id: string, userId?: string) => {
    if (isLocalConversation(id)) {
      if (userId) removeLocalConversation(userId, id)
      set((state) => ({
        history: state.history.filter((conversation) => conversation.id !== id),
        activeConversation: state.activeConversation?.id === id ? null : state.activeConversation,
      }))
      return
    }

    try {
      await apiDeleteConversation(id)
      set((state) => ({
        history: state.history.filter((conversation) => conversation.id !== id),
        activeConversation: state.activeConversation?.id === id ? null : state.activeConversation,
      }))
    } catch {
      set({ error: CHAT_ERROR_MESSAGE })
    }
  },

  reset: () => set({
    history: [],
    activeConversation: null,
    isLoadingHistory: false,
    isSending: false,
    error: "",
    failedMessage: "",
    failedMessageId: "",
  }),
}))
