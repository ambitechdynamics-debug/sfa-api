import { create } from "zustand"
import { ApiError } from "@/lib/api"
import { sendChatMessage } from "@/lib/chat"
import {
  deleteTravail as apiDeleteTravail,
  fetchTravail,
  fetchTravaux,
  updateTravail as apiUpdateTravail,
  type ApiMessage,
  type ApiTravail,
} from "@/services/travail.service"
import type { Travail } from "@/types/project"

const CHAT_ERROR_MESSAGE = "Une erreur est survenue. Veuillez réessayer."
const TRAVAIL_LOAD_ERROR = "Travail introuvable ou indisponible."
const LOCAL_TRAVAUX_KEY = "studio-flyer-chat-travaux"

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
}

/**
 * Travail enrichi côté client avec sa liste de messages (chargée à la demande).
 * Compatible avec `ApiTravail` (qui peut contenir `messages?: ApiMessage[]`).
 */
export interface TravailWithMessages extends Travail {
  messages?: Message[]
}

interface ChatState {
  /** Liste plate des travaux pour le sidebar (toutes marques confondues). */
  travaux: TravailWithMessages[]
  activeTravail: TravailWithMessages | null
  isLoadingHistory: boolean
  isSending: boolean
  error: string
  failedMessage: string
  failedMessageId: string

  fetchHistory: (userId: string) => Promise<void>
  loadTravail: (travailId: string, userId: string) => Promise<"ok" | "not-found" | "error">
  sendMessage: (
    content: string,
    userId: string,
    travailId: string,
    visualConfig?: Record<string, unknown>,
  ) => Promise<string | undefined>
  injectAssistantMessage: (
    message: Message,
    options: { travailId: string; projectId?: string; title?: string },
  ) => void
  retryFailedMessage: (userId: string) => Promise<string | undefined>
  clearActive: () => void
  renameTravail: (id: string, title: string, userId?: string) => Promise<void>
  deleteTravail: (id: string, userId?: string) => Promise<void>
  reset: () => void
}

function now() {
  return new Date().toISOString()
}

function tempId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isLocalTravail(id?: string) {
  return Boolean(id?.startsWith("local-"))
}

function toChatHistory(messages: Message[] = []) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }))
}

function normalizeMessageRole(role: ApiMessage["role"]): Message["role"] {
  if (role === "USER") return "user"
  if (role === "ASSISTANT") return "assistant"
  if (role === "SYSTEM") return "system"
  return role as Message["role"]
}

function normalizeTravail(travail: ApiTravail): TravailWithMessages {
  return {
    ...travail,
    messages: travail.messages?.map((message) => ({
      id: message.id,
      role: normalizeMessageRole(message.role),
      content: message.content,
      createdAt: message.createdAt,
    })),
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window
}

function localTravauxKey(userId: string) {
  return `${LOCAL_TRAVAUX_KEY}:${userId}`
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

function isTravail(value: unknown): value is TravailWithMessages {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.projectId === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string" &&
    (record.messages === undefined || (Array.isArray(record.messages) && record.messages.every(isMessage)))
  )
}

function readLocalTravaux(userId: string): TravailWithMessages[] {
  if (!canUseStorage()) return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(localTravauxKey(userId)) || "[]") as unknown
    return Array.isArray(parsed) ? parsed.filter(isTravail) : []
  } catch {
    return []
  }
}

function writeLocalTravaux(userId: string, travaux: TravailWithMessages[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(localTravauxKey(userId), JSON.stringify(travaux.slice(0, 50)))
}

function sortByLastMessage(travaux: TravailWithMessages[]) {
  return [...travaux].sort(
    (a, b) =>
      new Date(b.lastMessageAt || b.updatedAt).getTime() -
      new Date(a.lastMessageAt || a.updatedAt).getTime(),
  )
}

function upsertHistory(history: TravailWithMessages[], travail: TravailWithMessages) {
  const existing = history.filter((item) => item.id !== travail.id)
  return [travail, ...existing]
}

function mergeTravaux(primary: TravailWithMessages[], secondary: TravailWithMessages[]) {
  const byId = new Map<string, TravailWithMessages>()
  for (const t of [...primary, ...secondary]) {
    byId.set(t.id, t)
  }
  return sortByLastMessage([...byId.values()])
}

function persistLocalTravail(userId: string, travail: TravailWithMessages) {
  if (!isLocalTravail(travail.id)) return
  writeLocalTravaux(userId, sortByLastMessage(upsertHistory(readLocalTravaux(userId), travail)))
}

function removeLocalTravail(userId: string, id: string) {
  writeLocalTravaux(
    userId,
    readLocalTravaux(userId).filter((travail) => travail.id !== id),
  )
}

function readableChatError(error: unknown) {
  if (error instanceof ApiError && error.message) return error.message
  return CHAT_ERROR_MESSAGE
}

export const useChatStore = create<ChatState>((set, get) => ({
  travaux: [],
  activeTravail: null,
  isLoadingHistory: false,
  isSending: false,
  error: "",
  failedMessage: "",
  failedMessageId: "",

  fetchHistory: async (userId: string) => {
    if (!userId) return
    set({ isLoadingHistory: true })
    const localTravaux = readLocalTravaux(userId)
    try {
      const travaux = await fetchTravaux()
      set({ travaux: mergeTravaux(travaux.map(normalizeTravail), localTravaux) })
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        set({ travaux: [], error: "" })
        return
      }
      set({ travaux: localTravaux })
    } finally {
      set({ isLoadingHistory: false })
    }
  },

  loadTravail: async (travailId: string, userId: string) => {
    if (!userId) return "error"
    if (isLocalTravail(travailId)) {
      const travail = readLocalTravaux(userId).find((item) => item.id === travailId)
      set({
        activeTravail: travail ?? null,
        error: travail ? "" : TRAVAIL_LOAD_ERROR,
        failedMessage: "",
        failedMessageId: "",
      })
      return travail ? "ok" : "not-found"
    }

    try {
      const travail = await fetchTravail(travailId)
      set({
        activeTravail: normalizeTravail(travail),
        error: "",
        failedMessage: "",
        failedMessageId: "",
      })
      return "ok"
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        set({ activeTravail: null, error: "", failedMessage: "", failedMessageId: "" })
        return "error"
      }
      if (error instanceof ApiError && error.status === 404) {
        removeLocalTravail(userId, travailId)
        set((state) => ({
          activeTravail: null,
          travaux: state.travaux.filter((t) => t.id !== travailId),
          error: TRAVAIL_LOAD_ERROR,
          failedMessage: "",
          failedMessageId: "",
        }))
        return "not-found"
      }
      const localTravail = readLocalTravaux(userId).find((item) => item.id === travailId)
      set({
        activeTravail: localTravail ?? null,
        error: localTravail ? "" : TRAVAIL_LOAD_ERROR,
        failedMessage: "",
        failedMessageId: "",
      })
      return localTravail ? "ok" : "error"
    }
  },

  injectAssistantMessage: (message, { travailId, projectId, title }) => {
    const { activeTravail, travaux } = get()
    const createdAt = message.createdAt || now()

    // Idempotent : si l'active travail correspond et possède déjà ce message, no-op.
    if (activeTravail && activeTravail.id === travailId) {
      const existing = (activeTravail.messages ?? []).some((m) => m.id === message.id)
      if (existing) return
      const updated: TravailWithMessages = {
        ...activeTravail,
        title: title || activeTravail.title,
        lastMessageAt: createdAt,
        updatedAt: createdAt,
        messages: [...(activeTravail.messages ?? []), message],
      }
      set({
        activeTravail: updated,
        travaux: mergeTravaux([updated], travaux),
      })
      return
    }

    // Pas de match : on en crée un nouveau localement (souvent suite à un fetchOpening).
    const fresh: TravailWithMessages = {
      id: travailId,
      projectId: projectId ?? "",
      userId: "",
      title: title || "Nouveau travail",
      status: "DRAFT",
      lastMessageAt: createdAt,
      createdAt,
      updatedAt: createdAt,
      messages: [message],
    }
    set({
      activeTravail: fresh,
      travaux: mergeTravaux([fresh], travaux),
    })
  },

  sendMessage: async (
    content: string,
    userId: string,
    travailId: string,
    visualConfig?: Record<string, unknown>,
  ) => {
    const clean = content.trim()
    if (!clean || !userId || !travailId || get().isSending) return undefined

    const { activeTravail, travaux } = get()
    const createdAt = now()
    const userMessage: Message = {
      id: tempId("user"),
      role: "user",
      content: clean,
      createdAt,
    }

    const baseTravail: TravailWithMessages =
      activeTravail && activeTravail.id === travailId
        ? activeTravail
        : {
            id: travailId,
            projectId: activeTravail?.projectId ?? "",
            userId,
            title: clean.slice(0, 50),
            status: "DRAFT",
            lastMessageAt: createdAt,
            createdAt,
            updatedAt: createdAt,
            messages: [],
          }

    const travailBeforeSend: TravailWithMessages = {
      ...baseTravail,
      updatedAt: createdAt,
      lastMessageAt: createdAt,
      messages: [...(baseTravail.messages ?? []), userMessage],
    }

    set({
      activeTravail: travailBeforeSend,
      isSending: true,
      error: "",
      failedMessage: "",
      failedMessageId: "",
    })

    try {
      const result = await sendChatMessage({
        message: clean,
        travailId,
        history: toChatHistory(baseTravail.messages),
        visualConfig,
      })

      const assistantMessage: Message = {
        id: tempId("assistant"),
        role: "assistant",
        content: result.reply,
        createdAt: now(),
      }

      const persistedTravail: TravailWithMessages = {
        ...travailBeforeSend,
        id: result.travailId || travailBeforeSend.id,
        projectId: result.projectId || travailBeforeSend.projectId,
        updatedAt: assistantMessage.createdAt,
        lastMessageAt: assistantMessage.createdAt,
        messages: [...(travailBeforeSend.messages ?? []), assistantMessage],
      }

      if (isLocalTravail(travailBeforeSend.id) && !isLocalTravail(persistedTravail.id)) {
        removeLocalTravail(userId, travailBeforeSend.id)
      }
      persistLocalTravail(userId, persistedTravail)

      set((state) => ({
        activeTravail: persistedTravail,
        travaux: upsertHistory(state.travaux.length ? state.travaux : travaux, persistedTravail),
        failedMessage: "",
        failedMessageId: "",
        error: "",
      }))
      return persistedTravail.id
    } catch (error) {
      set({
        error: readableChatError(error),
        failedMessage: clean,
        failedMessageId: userMessage.id,
      })
      return undefined
    } finally {
      set({ isSending: false })
    }
  },

  retryFailedMessage: async (userId: string) => {
    const { activeTravail, failedMessage, failedMessageId, sendMessage } = get()
    if (!activeTravail) return undefined
    if (
      failedMessageId &&
      activeTravail.messages?.some((message) => message.id === failedMessageId)
    ) {
      set({
        activeTravail: {
          ...activeTravail,
          messages: activeTravail.messages.filter((message) => message.id !== failedMessageId),
        },
      })
    }
    if (failedMessage) return sendMessage(failedMessage, userId, activeTravail.id)
    return undefined
  },

  clearActive: () =>
    set({ activeTravail: null, error: "", failedMessage: "", failedMessageId: "" }),

  renameTravail: async (id: string, title: string, userId?: string) => {
    const clean = title.trim()
    if (!clean) return

    if (isLocalTravail(id)) {
      if (userId) {
        const updatedLocal = readLocalTravaux(userId).map((travail) =>
          travail.id === id ? { ...travail, title: clean, updatedAt: now() } : travail,
        )
        writeLocalTravaux(userId, sortByLastMessage(updatedLocal))
      }
      set((state) => ({
        travaux: state.travaux.map((travail) =>
          travail.id === id ? { ...travail, title: clean, updatedAt: now() } : travail,
        ),
        activeTravail:
          state.activeTravail?.id === id
            ? { ...state.activeTravail, title: clean, updatedAt: now() }
            : state.activeTravail,
      }))
      return
    }

    try {
      const travail = normalizeTravail(await apiUpdateTravail(id, { title: clean }))
      set((state) => ({
        travaux: state.travaux.map((item) => (item.id === id ? { ...item, ...travail } : item)),
        activeTravail:
          state.activeTravail?.id === id
            ? { ...state.activeTravail, ...travail }
            : state.activeTravail,
        error: "",
      }))
    } catch {
      set({ error: CHAT_ERROR_MESSAGE })
    }
  },

  deleteTravail: async (id: string, userId?: string) => {
    if (isLocalTravail(id)) {
      if (userId) removeLocalTravail(userId, id)
      set((state) => ({
        travaux: state.travaux.filter((travail) => travail.id !== id),
        activeTravail: state.activeTravail?.id === id ? null : state.activeTravail,
      }))
      return
    }

    try {
      await apiDeleteTravail(id)
      set((state) => ({
        travaux: state.travaux.filter((travail) => travail.id !== id),
        activeTravail: state.activeTravail?.id === id ? null : state.activeTravail,
      }))
    } catch {
      set({ error: CHAT_ERROR_MESSAGE })
    }
  },

  reset: () =>
    set({
      travaux: [],
      activeTravail: null,
      isLoadingHistory: false,
      isSending: false,
      error: "",
      failedMessage: "",
      failedMessageId: "",
    }),
}))
