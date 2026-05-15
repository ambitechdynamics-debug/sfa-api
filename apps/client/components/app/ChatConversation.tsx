"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { BrandMark } from "@/components/ui/BrandMark"
import { Icon } from "@/components/ui/Icon"
import { ChatInput, PromptChip } from "@/components/app/dashboard-ui"
import { useChatStore, type Message } from "@/store/chat-store"
import { relativeTime } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

const PROMPTS = [
  "Créer un flyer professionnel pour mon restaurant",
  "Améliorer une affiche existante",
  "Générer un prompt pour un visuel",
  "Créer une publication Instagram",
]

function isLocalConversationId(value?: string) {
  return Boolean(value?.startsWith("local-"))
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap: 12,
      }}
    >
      {!isUser && (
        <span
          className="anim-logo-breathe"
          style={{
            width: 32,
            height: 32,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BrandMark size={20} withWordmark={false} />
        </span>
      )}
      <article
        style={{
          width: "fit-content",
          maxWidth: "min(760px, 82%)",
          padding: isUser ? "12px 14px" : "10px 0",
          borderRadius: isUser ? "16px 16px 5px 16px" : 0,
          border: isUser ? "1px solid var(--acc-line)" : 0,
          background: isUser ? "var(--acc-soft)" : "transparent",
          color: "var(--ink-0)",
          boxShadow: isUser ? "var(--sh-1)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 650, color: isUser ? "var(--acc-bright)" : "var(--ink-1)" }}>
            {isUser ? "Vous" : "Studio Flyer AI"}
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{relativeTime(message.createdAt)}</span>
        </div>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.68, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {message.content}
        </p>
      </article>
    </div>
  )
}

function LoadingBubble() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", gap: 12 }}>
      <span
        className="anim-logo-breathe"
        style={{
          width: 32,
          height: 32,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <BrandMark size={20} withWordmark={false} />
      </span>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          minHeight: 32,
          color: "var(--ink-2)",
          fontSize: 13,
        }}
      >
        <span
          aria-hidden="true"
          className="anim-shimmer"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "var(--acc-bright)",
            boxShadow: "0 0 0 4px var(--acc-soft)",
          }}
        />
        L'agent réfléchit...
      </div>
    </div>
  )
}

function ErrorNotice({
  message,
  canRetry,
  isSending,
  onRetry,
}: {
  message: string
  canRetry: boolean
  isSending: boolean
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(217, 112, 112, 0.32)",
        background: "var(--rose-soft)",
        color: "var(--rose)",
        fontSize: 13,
      }}
      className="max-sm:!items-start max-sm:!flex-col"
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Icon name="warn" size={15} />
        {message}
      </span>
      {canRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isSending}>
          Réessayer
        </Button>
      )}
    </div>
  )
}

function EmptyConversationState({ onPrompt }: { onPrompt: (value: string) => void }) {
  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 0",
        textAlign: "center",
      }}
    >
      <div
        className="anim-logo-breathe"
        style={{
          width: 54,
          height: 54,
          marginBottom: 20,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BrandMark size={28} withWordmark={false} />
      </div>
      <h2
        className="display"
        style={{ fontSize: "clamp(25px, 3vw, 38px)", margin: "0 0 12px 0", letterSpacing: 0, textAlign: "center" }}
      >
        Que voulez-vous créer aujourd'hui ?
      </h2>
      <p style={{ margin: "0 0 28px", maxWidth: 560, color: "var(--ink-3)", fontSize: 14, lineHeight: 1.55 }}>
        Décrivez votre affiche, flyer ou visuel social. L'agent vous aide à structurer le brief, le texte et la direction créative.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 660 }}>
        {PROMPTS.map((item) => (
          <PromptChip key={item} onClick={() => onPrompt(item)}>
            {item}
          </PromptChip>
        ))}
      </div>
    </div>
  )
}

export function ChatConversation({
  conversationId,
  projectId,
  initialTitle,
}: {
  conversationId?: string
  projectId?: string
  initialTitle?: string
}) {
  const router = useRouter()
  const { user } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [loadingConversation, setLoadingConversation] = useState(Boolean(conversationId))
  const [hasSubmittedInView, setHasSubmittedInView] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const {
    activeConversation,
    clearActive,
    error,
    failedMessage,
    isSending,
    loadConversation,
    retryFailedMessage,
    sendMessage,
  } = useChatStore()

  const messages = (activeConversation?.messages ?? []).filter((message) => message.role !== "system")
  const showWelcome = !conversationId && messages.length === 0 && !loadingConversation
  const showRetryError = Boolean(hasSubmittedInView && error && failedMessage)
  const showPassiveError = Boolean(error && !failedMessage && !loadingConversation)
  const activeId = activeConversation?.id || conversationId

  useEffect(() => {
    let cancelled = false
    setHasSubmittedInView(false)

    if (!conversationId) {
      clearActive()
      setLoadingConversation(false)
      return
    }

    setLoadingConversation(true)
    loadConversation(conversationId, user?.id ?? "").finally(() => {
      if (!cancelled) setLoadingConversation(false)
    })

    return () => {
      cancelled = true
    }
  }, [clearActive, conversationId, loadConversation, user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, isSending, showRetryError, showPassiveError])

  function shouldNavigateToConversation(nextConversationId?: string) {
    if (!nextConversationId || projectId || nextConversationId === conversationId) return false
    if (isLocalConversationId(nextConversationId)) return false
    return !conversationId || isLocalConversationId(conversationId)
  }

  async function handleSend(content = prompt) {
    const clean = content.trim()
    if (!clean || !user?.id || isSending || loadingConversation) return

    setPrompt("")
    setHasSubmittedInView(true)
    const nextConversationId = await sendMessage(clean, user.id, projectId)
    if (shouldNavigateToConversation(nextConversationId)) {
      router.push(`/dashboard/c/${nextConversationId}`)
    }
  }

  async function handleRetry() {
    if (!failedMessage || isSending) return
    setHasSubmittedInView(true)
    const nextConversationId = await retryFailedMessage(user?.id ?? "")
    if (shouldNavigateToConversation(nextConversationId)) {
      router.push(`/dashboard/c/${nextConversationId}`)
    }
  }

  return (
    <div style={{ height: "calc(100vh - 28px)", minHeight: 560, display: "flex", flexDirection: "column", padding: "0 clamp(8px, 2vw, 16px)" }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: showWelcome ? 0 : "12px 0 24px" }}>
        {showWelcome ? (
          <EmptyConversationState onPrompt={setPrompt} />
        ) : (
          <div style={{ maxWidth: 900, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
            {loadingConversation ? (
              <>
                <div className="anim-skeleton" style={{ height: 84, borderRadius: 14 }} />
                <div className="anim-skeleton" style={{ width: "72%", height: 72, borderRadius: 14 }} />
              </>
            ) : (
              messages.map((message) => <ChatBubble key={message.id} message={message} />)
            )}

            {isSending && <LoadingBubble />}

            {showRetryError && (
              <ErrorNotice message={error} canRetry isSending={isSending} onRetry={handleRetry} />
            )}

            {showPassiveError && (
              <ErrorNotice message={error} canRetry={false} isSending={isSending} onRetry={handleRetry} />
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div
        style={{
          padding: "0 0 24px",
          maxWidth: 820,
          width: "100%",
          margin: "0 auto",
          background: "var(--bg-0)",
        }}
      >
        <ChatInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={() => handleSend()}
          disabled={!user?.id || isSending || loadingConversation}
          loading={isSending}
        />
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-3)", marginTop: 12 }}>
          L'IA peut faire des erreurs. Vérifiez les informations générées.
        </div>
      </div>
    </div>
  )
}
