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
import { fetchGeneratedPosters, generateImages, generateFinalPrompt, deleteGeneratedPoster, uploadProjectFile, upsertProjectMemory, getProjectMemory, extractColorsFromLogo } from "@/lib/projects"
import type { GeneratedPoster } from "@/types/project"

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface UploadedAsset {
  id: string
  name: string
  type: "logo" | "product" | "reference" | "poster" | "other"
  url: string
  status: "uploading" | "success" | "error"
  isPrimary?: boolean
}

interface VisualConfig {
  format: string
  colors: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
  }
  quality: string
  style: string
  objective: string
}

interface GeneratedVisual {
  id: string
  title: string
  imageUrl: string
  format: string
  createdAt: string
  isMain?: boolean
}

const PROMPTS = [
  "Créer un flyer professionnel pour mon restaurant",
  "Améliorer une affiche existante",
  "Générer un prompt pour un visuel",
  "Créer une publication Instagram",
]

const QUALITY_LEVELS = [
  { value: "Draft", label: "Brouillon rapide", desc: "Génération ultra-rapide pour valider la composition de base." },
  { value: "Standard", label: "Standard", desc: "Qualité optimisée pour les réseaux sociaux et aperçus rapides." },
  { value: "High", label: "Haute qualité", desc: "Résolution accrue, détails précis pour l'affichage écran." },
  { value: "Premium", label: "Premium", desc: "Rendu plus détaillé, meilleure cohérence visuelle, adapté aux supports commerciaux." },
  { value: "Ultra", label: "Ultra réaliste", desc: "Textures ultra-précises, photoréalisme optimisé, éclairage parfait." },
  { value: "Print", label: "Impression professionnelle", desc: "Format vectorisé/HD 300 DPI idéal pour l'impression physique en grand format." },
]

const STYLES = [
  "Moderne", "Minimaliste", "Luxe", "Urbain", "Corporate", "Événementiel", 
  "Commercial", "Mode", "Restauration", "Tech", "Institutionnel", "Artistique", "Futuriste", "Afro-contemporain"
]

const OBJECTIVES = [
  "Vendre un produit", "Promouvoir un événement", "Annoncer une offre",
  "Présenter une marque", "Recruter", "Informer", "Faire connaître un service",
  "Améliorer une affiche existante", "Créer une variante", "Préparer un visuel pour impression"
]

// Formats compatibles Nano Banana (Gemini Imagen 3) — aspect ratios uniquement
const FORMATS = [
  { value: "Carré — 1:1",    hint: "Instagram, Facebook" },
  { value: "Portrait — 9:16", hint: "Stories, Reels, TikTok" },
  { value: "Paysage — 16:9", hint: "YouTube, Bannière web" },
  { value: "Portrait — 3:4", hint: "Flyer, Affiche, A4" },
  { value: "Bannière — 4:3", hint: "Présentation, pub" },
]

const ASSET_TYPE_LABELS: Record<UploadedAsset["type"], string> = {
  logo: "Logo",
  product: "Produit",
  reference: "Référence",
  poster: "Affiche",
  other: "Autre",
}

const REQUIRED_CONFIG_KEYS = ["format", "colors", "quality"]
const CONFIG_KEY_LABELS: Record<string, string> = {
  format: "Format & Style",
  colors: "Palette de couleurs",
  quality: "Qualité & Objectif",
}

function isLocalConversationId(value?: string) {
  return Boolean(value?.startsWith("local-"))
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ChatBubble({
  message,
  isLatest,
  onChoiceClick,
}: {
  message: Message
  isLatest?: boolean
  onChoiceClick?: (choice: string) => void
}) {
  const isUser = message.role === "user"

  // Parse dynamic choices from assistant message
  let textContent = message.content
  const choices: string[] = []

  if (!isUser) {
    const lines = message.content.split("\n")
    const filteredLines: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      // Match brackets at the end/solely: [Choice text]
      // Support prepended bullets like - [Choice] or 1. [Choice]
      const match = trimmed.match(/^(?:[-*\d.]+\s*)?\[(.*?)\]$/)
      if (match) {
        const choiceText = match[1].trim()
        if (choiceText) {
          choices.push(choiceText)
        }
      } else {
        filteredLines.push(line)
      }
    }
    textContent = filteredLines.join("\n").trim()
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap: 12,
        width: "100%",
      }}
    >
      {!isUser && (
        <span
          className="anim-logo-breathe"
          style={{
            width: 34,
            height: 34,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          <BrandMark size={20} withWordmark={false} />
        </span>
      )}
      <article
        style={{
          width: "fit-content",
          maxWidth: "min(720px, 84%)",
          padding: isUser ? "11px 16px" : "14px 18px",
          borderRadius: isUser ? "18px 18px 6px 18px" : "6px 18px 18px 18px",
          border: isUser
            ? "1px solid rgba(224,138,100,0.25)"
            : "1px solid rgba(255,255,255,0.06)",
          background: isUser
            ? "linear-gradient(135deg, rgba(224,138,100,0.14), rgba(180,90,50,0.08))"
            : "rgba(255,255,255,0.04)",
          backdropFilter: isUser ? "none" : "blur(12px)",
          WebkitBackdropFilter: isUser ? "none" : "blur(12px)",
          color: "var(--ink-0)",
          boxShadow: isUser
            ? "0 2px 16px rgba(224,138,100,0.1)"
            : "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <span style={{ fontSize: 11.5, fontWeight: 650, color: isUser ? "var(--acc-bright)" : "rgba(255,255,255,0.45)", letterSpacing: "0.02em" }}>
            {isUser ? "Vous" : "Studio Flyer AI"}
          </span>
          <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.22)" }}>{relativeTime(message.createdAt)}</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.72, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: isUser ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.82)" }}>
          {textContent}
        </p>

        {choices.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 9,
              marginTop: 16,
              width: "100%",
            }}
          >
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => isLatest && onChoiceClick?.(choice)}
                disabled={!isLatest}
                style={{
                  padding: "9px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 14,
                  background: isLatest
                    ? choice === "[Autre]" || choice.toLowerCase().includes("autre")
                      ? "rgba(120,120,130,0.10)"
                      : "linear-gradient(135deg, rgba(224,138,100,0.08), rgba(224,138,100,0.04))"
                    : "var(--bg-2)",
                  border: `1.5px solid ${isLatest ? "var(--acc-line)" : "var(--line-2)"}`,
                  color: isLatest ? "var(--ink-0)" : "var(--ink-3)",
                  cursor: isLatest ? "pointer" : "default",
                  opacity: isLatest ? 1 : 0.5,
                  textAlign: "left",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.3,
                }}
                className={isLatest ? "choice-chip" : ""}
              >
                {choice}
              </button>
            ))}
          </div>
        )}
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
          width: 34, height: 34,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(8px)",
        }}
      >
        <BrandMark size={20} withWordmark={false} />
      </span>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "10px 16px", borderRadius: "6px 18px 18px 18px",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)", minHeight: 44,
        color: "rgba(255,255,255,0.4)", fontSize: 13,
      }}>
        <span style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="anim-dot-bounce" style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.35)", display: "inline-block", animationDelay: `${i * 0.18}s` }} />
          ))}
        </span>
        L'agent orchestre votre visuel...
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

function PanelSection({
  title,
  isOpen,
  onToggle,
  headerRight,
  children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  headerRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        borderRadius: 7,
        border: "1px solid rgba(255,255,255,0.065)",
        background: "rgba(255,255,255,0.016)",
        // iOS 26 liquid glass: top specular + depth shadow
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.065), 0 2px 6px rgba(0,0,0,0.22)",
        overflow: "hidden",
      }}
    >
      {/* Photoshop-style compact header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 28,
          background: isOpen
            ? "linear-gradient(180deg, rgba(255,255,255,0.048) 0%, rgba(255,255,255,0.022) 100%)"
            : "rgba(255,255,255,0.026)",
          borderBottom: isOpen ? "1px solid rgba(255,255,255,0.055)" : "none",
          // Warm left accent when open — Photoshop active-section cue
          boxShadow: isOpen ? "inset 3px 0 0 rgba(200,120,50,0.32)" : "none",
          transition: "background 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        <button
          onClick={onToggle}
          style={{
            flex: 1,
            padding: "0 10px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "transparent",
            border: 0,
            cursor: "pointer",
            color: isOpen ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.42)",
            fontSize: 10.5,
            fontWeight: 650,
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            textAlign: "left",
            transition: "color 0.2s ease",
          }}
        >
          <Icon
            name="chevronR"
            size={9}
            style={{
              color: isOpen ? "var(--acc-bright)" : "rgba(255,255,255,0.28)",
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
              flexShrink: 0,
            }}
          />
          {title}
        </button>
        {headerRight}
      </div>
      <div
        style={{
          maxHeight: isOpen ? "2000px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.32s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ padding: "10px 12px 12px" }}>
          {children}
        </div>
      </div>
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
        padding: "40px 16px",
        textAlign: "center",
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* Center dot accent */}
      <div style={{
        position: "absolute", top: "28%", left: "50%", transform: "translate(-50%,-50%)",
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div
        className="anim-logo-breathe"
        style={{
          width: 64,
          height: 64,
          marginBottom: 24,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          boxShadow: "0 2px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <BrandMark size={32} withWordmark={false} />
      </div>

      <h2
        className="display"
        style={{
          fontSize: "clamp(22px, 2.8vw, 34px)",
          margin: "0 0 10px 0",
          letterSpacing: "-0.02em",
          textAlign: "center",
          color: "var(--ink-0)",
          textShadow: "none",
        }}
      >
        Que voulez-vous créer aujourd'hui ?
      </h2>
      <p style={{ margin: "0 0 32px", maxWidth: 480, color: "var(--ink-3)", fontSize: 13.5, lineHeight: 1.6 }}>
        Configurez vos paramètres à gauche, décrivez votre idée ici — l'IA orchestre le reste.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center", maxWidth: 620 }}>
        {PROMPTS.map((item) => (
          <PromptChip key={item} onClick={() => onPrompt(item)}>
            {item}
          </PromptChip>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ChatConversation({
  conversationId,
  projectId,
  initialTitle,
  initialPrompt,
}: {
  conversationId?: string
  projectId?: string
  initialTitle?: string
  initialPrompt?: string
}) {
  const router = useRouter()
  const { user } = useAuth()

  // --- States ---
  const [prompt, setPrompt] = useState(initialPrompt ?? "")
  const [loadingConversation, setLoadingConversation] = useState(Boolean(conversationId))
  const [hasSubmittedInView, setHasSubmittedInView] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pendingFilesRef = useRef<{ file: File; tempId: string; assetType: UploadedAsset["type"] }[]>([])

  // Responsive state
  const [activeTab, setActiveTab] = useState<"settings" | "chat" | "preview">("chat")
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

  // Creation State - Frame 1
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([])
  const [activeAssetType, setActiveAssetType] = useState<UploadedAsset["type"]>("logo")
  const [dragOver, setDragOver] = useState(false)

  const [config, setConfig] = useState<VisualConfig>({
    format: "Portrait — 3:4",
    colors: {
      primary: "#808080",
      secondary: "#2a2a2a",
      accent: "#a0a0a0",
      background: "#111111",
      text: "#f0f0f0"
    },
    quality: "Premium",
    style: "Moderne",
    objective: "Vendre un produit"
  })
  // Visuals State - Frame 3
  const [visuals, setVisuals] = useState<GeneratedVisual[]>([])
  const [selectedVisualId, setSelectedVisualId] = useState<string>("")
  const [zoomOpen, setZoomOpen] = useState(false)
  const [activeExportFormat, setActiveExportFormat] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExtractingColors, setIsExtractingColors] = useState(false)
  const [awaitingOther, setAwaitingOther] = useState(false)
  const [sweepActive, setSweepActive] = useState(false)
  const sweepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [touchedSections, setTouchedSections] = useState<Set<string>>(new Set())
  const [libreFields, setLibreFields] = useState<Set<string>>(new Set())
  const [configAttached, setConfigAttached] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const isSectionOpen = (key: string) => !collapsedSections.has(key)
  const toggleSection = (key: string) =>
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const markTouched = (key: string) =>
    setTouchedSections((prev) => { const s = new Set(prev); s.add(key); return s })
  const toggleLibre = (key: string) =>
    setLibreFields((prev) => { const s = new Set(prev); if (s.has(key)) s.delete(key); else s.add(key); return s })
  const isSectionFilled = (key: string) => touchedSections.has(key) || libreFields.has(key)

  const validateCreativeConfig = () => {
    const missing = REQUIRED_CONFIG_KEYS.filter((k) => !isSectionFilled(k))
    return { valid: missing.length === 0, missing }
  }

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
  const currentProjectId = activeConversation?.projectId || projectId
  const conversationStarted = messages.length > 0 || Boolean(conversationId)

  // Auto-apply brown border when latest assistant message asks an open question (no choices)
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastAssistant) return
    const lines = lastAssistant.content.split("\n")
    const hasChoices = lines.some((l) => l.trim().match(/^(?:[-*\d.]+\s*)?\[.+\]$/))
    const hasQuestion = lastAssistant.content.includes("?")
    setAwaitingOther(!hasChoices && hasQuestion)
  }, [messages])

  // --- Dynamic Layout Init ---
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      if (!conversationStarted) {
        setLeftOpen(false)
        setRightOpen(false)
        return
      }
      if (w < 768) {
        // Mobile — tabs will control display
      } else if (w < 1200) {
        // Tablet
        setLeftOpen(false)
        setRightOpen(false)
      } else {
        // Desktop
        setLeftOpen(true)
        setRightOpen(true)
      }
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [conversationStarted])

  // Open panels when conversation starts on desktop
  useEffect(() => {
    if (conversationStarted && window.innerWidth >= 1200) {
      setLeftOpen(true)
      setRightOpen(true)
    }
  }, [conversationStarted])

  // --- Sync Generated Posters from active project ---
  useEffect(() => {
    if (currentProjectId) {
      fetchGeneratedPosters(currentProjectId)
        .then((posters) => {
          if (posters && posters.length > 0) {
            const mapped: GeneratedVisual[] = posters.map((p) => ({
              id: p.id,
              title: `Variante ${p.variationNumber}`,
              imageUrl: p.imageUrl,
              format: config.format,
              createdAt: p.createdAt || new Date().toISOString()
            }))
            setVisuals(mapped)
            setSelectedVisualId(mapped[0].id)
          }
        })
        .catch(() => {})
    } else {
      setVisuals([])
      setSelectedVisualId("")
    }
  }, [currentProjectId, config.format])

  // --- Conversation Lifecycle ---
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

  // Restore creative config and assets from backend memory when project loads
  useEffect(() => {
    if (!currentProjectId) return

    getProjectMemory(currentProjectId, "M-CREATIVE-BRIEF")
      .then((entry) => {
        if (!entry?.content) return
        const saved = entry.content as Record<string, unknown>
        setConfig((prev) => ({
          ...prev,
          ...(saved.quality ? { quality: saved.quality as string } : {}),
          ...(saved.style ? { style: saved.style as string } : {}),
          ...(saved.objective ? { objective: saved.objective as string } : {}),
          ...(saved.colors ? { colors: saved.colors as typeof prev.colors } : {}),
          ...(saved.format && FORMATS.some((f) => f.value === saved.format) ? { format: saved.format as string } : {}),
        }))
      })
      .catch(() => {})

    getProjectMemory(currentProjectId, "M-ASSETS")
      .then((entry) => {
        if (!entry?.content) return
        const saved = entry.content as Record<string, unknown>
        const assets = saved.assets as Array<{ type: string; url: string; name: string; isPrimary?: boolean }> | undefined
        if (assets?.length) {
          setUploadedAssets(
            assets.map((a, i) => ({
              id: `restored-${i}-${Date.now()}`,
              name: a.name,
              type: a.type as UploadedAsset["type"],
              url: a.url,
              status: "success" as const,
              isPrimary: a.isPrimary,
            }))
          )
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId])

  // Drain pending file uploads once a projectId is available
  useEffect(() => {
    if (!currentProjectId || pendingFilesRef.current.length === 0) return
    const pending = [...pendingFilesRef.current]
    pendingFilesRef.current = []
    Promise.all(
      pending.map(({ file, tempId, assetType }) =>
        uploadToCloudinary(file, tempId, assetType, currentProjectId)
      )
    ).then((urls) => {
      if (urls.some(Boolean)) saveAssetsToMemory(currentProjectId)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId])

  function shouldNavigateToConversation(nextConversationId?: string) {
    if (!nextConversationId || projectId || nextConversationId === conversationId) return false
    if (isLocalConversationId(nextConversationId)) return false
    return !conversationId || isLocalConversationId(conversationId)
  }

  function buildVisualConfigPayload(): Record<string, unknown> {
    return {
      format: config.format,
      colors: config.colors,
      quality: config.quality,
      style: config.style,
      objective: config.objective,
      assets: uploadedAssets
        .filter((a) => a.status === "success" && !a.url.startsWith("blob:"))
        .map((a) => ({ type: a.type, url: a.url, name: a.name, isPrimary: a.isPrimary })),
    }
  }

  async function saveCreativeBriefToMemory(projectId: string) {
    await upsertProjectMemory(projectId, "M-CREATIVE-BRIEF", {
      ...buildVisualConfigPayload(),
      conversationHistory: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }))
        .slice(-20),
      savedAt: new Date().toISOString(),
    }).catch(() => {})
  }

  async function triggerOrchestratedGeneration(projectId: string) {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const result = await generateFinalPrompt(projectId)
      if (result?.data?.ready_for_generation) {
        await triggerGeneration(3)
      } else {
        setIsGenerating(false)
      }
    } catch {
      setIsGenerating(false)
    }
  }

  async function handleSend(content = prompt) {
    const clean = content.trim()
    if (!clean || !user?.id || isSending || loadingConversation) return

    const isVisualTrigger = /g[eé]r[eé]r.*visuel|g[eé]n[eé]r[eé]r.*visuel/i.test(clean)

    if (isVisualTrigger) {
      const { valid } = validateCreativeConfig()
      if (!valid) {
        setLeftOpen(true)
        return
      }
    }

    setPrompt("")
    setConfigAttached(false)
    setAwaitingOther(false)
    setHasSubmittedInView(true)
    const nextConversationId = await sendMessage(clean, user.id, projectId, buildVisualConfigPayload())

    const resolvedProjectId = currentProjectId || activeConversation?.projectId
    if (isVisualTrigger && resolvedProjectId) {
      await saveCreativeBriefToMemory(resolvedProjectId)
      triggerOrchestratedGeneration(resolvedProjectId)
    }

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

  function handleChoiceClick(choice: string) {
    const isAutre = /^autre$/i.test(choice.trim()) || /autre/i.test(choice)
    if (isAutre) {
      setAwaitingOther(true)
      return
    }
    setAwaitingOther(false)
    void handleSend(choice)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    processFiles(Array.from(files))
  }

  const USAGE_TYPE_MAP: Record<UploadedAsset["type"], string> = {
    logo: "LOGO",
    product: "PRODUCT_IMAGE",
    reference: "REFERENCE_IMAGE",
    poster: "GENERATED_POSTER",
    other: "OTHER",
  }

  async function uploadToCloudinary(
    file: File,
    tempId: string,
    assetType: UploadedAsset["type"],
    projectId: string
  ): Promise<string | null> {
    try {
      const result = await uploadProjectFile(projectId, file, USAGE_TYPE_MAP[assetType] ?? "OTHER")
      setUploadedAssets((prev) =>
        prev.map((a) => (a.id === tempId ? { ...a, url: result.fileUrl, status: "success" } : a))
      )
      return result.fileUrl
    } catch {
      setUploadedAssets((prev) =>
        prev.map((a) => (a.id === tempId ? { ...a, status: "error" } : a))
      )
      return null
    }
  }

  async function saveAssetsToMemory(projectId: string) {
    setUploadedAssets((currentAssets) => {
      const successAssets = currentAssets
        .filter((a) => a.status === "success" && !a.url.startsWith("blob:"))
        .map((a) => ({ type: a.type, url: a.url, name: a.name, isPrimary: a.isPrimary }))
      if (successAssets.length > 0) {
        upsertProjectMemory(projectId, "M-ASSETS", {
          assets: successAssets,
          updatedAt: new Date().toISOString(),
        }).catch(() => {})
      }
      return currentAssets
    })
  }

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) return
      const fileType = file.name.split(".").pop()?.toLowerCase()
      if (!["jpg", "jpeg", "png", "webp", "svg"].includes(fileType || "")) return

      const tempAssetId = `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const objectUrl = URL.createObjectURL(file)
      const newAsset: UploadedAsset = {
        id: tempAssetId,
        name: file.name,
        type: activeAssetType,
        url: objectUrl,
        status: "uploading",
      }
      setUploadedAssets((prev) => [...prev, newAsset])

      if (currentProjectId) {
        uploadToCloudinary(file, tempAssetId, activeAssetType, currentProjectId).then((url) => {
          if (url) saveAssetsToMemory(currentProjectId)
        })
      } else {
        pendingFilesRef.current.push({ file, tempId: tempAssetId, assetType: activeAssetType })
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const deleteAsset = (id: string) => {
    setUploadedAssets((prev) => prev.filter((a) => a.id !== id))
  }

  const setPrimaryAsset = (id: string) => {
    setUploadedAssets((prev) =>
      prev.map((a) => ({ ...a, isPrimary: a.id === id }))
    )
    if (currentProjectId) saveAssetsToMemory(currentProjectId)
  }

  const ASSET_TYPES_ORDER: UploadedAsset["type"][] = ["logo", "product", "reference", "poster", "other"]

  const cycleAssetType = (id: string) => {
    setUploadedAssets((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const idx = ASSET_TYPES_ORDER.indexOf(a.type)
        const nextType = ASSET_TYPES_ORDER[(idx + 1) % ASSET_TYPES_ORDER.length]
        return { ...a, type: nextType }
      })
    )
  }

  const extractColors = async () => {
    if (isExtractingColors) return
    const succeededAssets = uploadedAssets.filter((a) => a.status === "success" && !a.url.startsWith("blob:"))
    if (succeededAssets.length === 0 || !currentProjectId) return
    // Use primary asset (any type), fallback to first available
    const sourceAsset = succeededAssets.find((a) => a.isPrimary) ?? succeededAssets[0]
    setIsExtractingColors(true)
    try {
      const colors = await extractColorsFromLogo(currentProjectId, sourceAsset.url)
      setConfig((prev) => ({ ...prev, colors }))
      markTouched("colors")
    } catch {
      // silent — isExtractingColors returns to false via finally
    } finally {
      setIsExtractingColors(false)
    }
  }

  const applyToChatContext = () => {
    setConfigAttached(true)
    setActiveTab("chat")
    // Trigger light sweep animation
    if (sweepTimerRef.current) clearTimeout(sweepTimerRef.current)
    setSweepActive(true)
    sweepTimerRef.current = setTimeout(() => setSweepActive(false), 700)
    if (currentProjectId) {
      upsertProjectMemory(currentProjectId, "M-CREATIVE-BRIEF", buildVisualConfigPayload()).catch(() => {})
    }
  }

  function buildCloudinaryUrl(imageUrl: string, format: string): string {
    if (!imageUrl.includes("/upload/")) return imageUrl
    const transformMap: Record<string, string> = {
      "PNG": "f_png,q_100",
      "JPG": "f_jpg,q_92",
      "PDF": "f_pdf",
      "WebP": "f_webp,q_90",
      "HD Print": "f_png,dpr_3.0,q_100",
    }
    const transform = transformMap[format] ?? "f_auto"
    return imageUrl.replace("/upload/", `/upload/${transform},fl_attachment/`)
  }

  const downloadWithFormat = (format: string) => {
    const activeVisual = visuals.find((v) => v.id === selectedVisualId)
    if (!activeVisual) return
    setActiveExportFormat(null)
    window.open(buildCloudinaryUrl(activeVisual.imageUrl, format), "_blank")
  }

  const downloadActiveVisual = () => downloadWithFormat("PNG")

  async function triggerGeneration(variations = 1) {
    if (!currentProjectId || isGenerating) return
    setIsGenerating(true)
    try {
      const result = await generateImages(currentProjectId, { variations })
      if (result.posters?.length > 0) {
        const mapped: GeneratedVisual[] = result.posters.map((p) => ({
          id: p.id,
          title: `Variante ${p.variationNumber}`,
          imageUrl: p.imageUrl,
          format: config.format,
          createdAt: p.createdAt || new Date().toISOString(),
        }))
        setVisuals((prev) => {
          const existingIds = new Set(prev.map((v) => v.id))
          const newOnes = mapped.filter((v) => !existingIds.has(v.id))
          return [...prev, ...newOnes]
        })
        setSelectedVisualId(mapped[0].id)
      }
    } catch {
      // silent — isGenerating returns to false via finally
    } finally {
      setIsGenerating(false)
    }
  }

  const requestVariant = () => triggerGeneration(1)

  const requestImprovement = () => triggerGeneration(1)

  const deleteActiveVisual = async () => {
    if (visuals.length <= 1 || !currentProjectId) return
    const toDelete = selectedVisualId
    const remaining = visuals.filter((v) => v.id !== toDelete)
    setVisuals(remaining)
    setSelectedVisualId(remaining[0].id)
    try {
      await deleteGeneratedPoster(currentProjectId, toDelete)
    } catch {
      setVisuals((prev) => {
        const deleted = visuals.find((v) => v.id === toDelete)
        if (!deleted) return prev
        return [...prev, deleted].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      })
    }
  }

  const activeVisual = visuals.find((v) => v.id === selectedVisualId)
  const qualityDetails = QUALITY_LEVELS.find((q) => q.value === config.quality)

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", background: "var(--bg-0)", position: "relative" }}>
      {/* 3-Frame Grid Content Wrapper */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative", width: "100%" }}>

        {/* ─── FRAME 1 — LEFT CREATION PANEL ─── */}
        <aside
          style={{
            width: conversationStarted ? (leftOpen ? "clamp(340px, 30%, 480px)" : "28px") : "0px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            borderRight: conversationStarted ? "1px solid rgba(255,255,255,0.07)" : "none",
            background: "rgba(10,10,12,0.78)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
            zIndex: 10,
          }}
          className="frame-left-panel max-md:!w-full max-md:!min-w-0"
        >
          {/* Content column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* Internal scroll wrapper */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 5 }}>

            {/* Header */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 10, fontWeight: 650, margin: 0, color: "rgba(255,255,255,0.5)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Configuration Créative</h2>
              </div>
            </div>

            {/* Format & Style */}
            <PanelSection
              title="Format & Style"
              isOpen={isSectionOpen("format")}
              onToggle={() => toggleSection("format")}
              headerRight={
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLibre("format") }}
                  style={{
                    padding: "3px 8px", marginRight: 8, fontSize: 9, borderRadius: 5, cursor: "pointer",
                    background: isSectionFilled("format") ? "rgba(30,110,55,0.38)" : "rgba(110,30,30,0.38)",
                    border: `1px solid ${isSectionFilled("format") ? "rgba(50,180,80,0.5)" : "rgba(200,50,50,0.5)"}`,
                    color: isSectionFilled("format") ? "rgba(100,230,130,1)" : "rgba(230,100,100,1)",
                    fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const,
                  }}
                >Libre</button>
              }
            >

              {/* Sub-title: Format */}
              <div style={{ fontSize: 9.5, fontWeight: 650, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Format
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => { setConfig((prev) => ({ ...prev, format: f.value })); markTouched("format") }}
                    className="panel-chip"
                    style={{
                      padding: "5px 10px", fontSize: 11, borderRadius: 8, cursor: "pointer",
                      background: config.format === f.value ? "rgba(80,42,12,0.48)" : "var(--bg-2)",
                      border: `1px solid ${config.format === f.value ? "rgba(139,90,43,0.45)" : "var(--line-2)"}`,
                      color: config.format === f.value ? "var(--ink-0)" : "var(--ink-2)",
                      fontWeight: config.format === f.value ? 600 : 400,
                    }}
                  >
                    {f.value}
                  </button>
                ))}
              </div>

              {/* Sub-title: Style visuel */}
              <div style={{ fontSize: 9.5, fontWeight: 650, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Style visuel
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => { setConfig((prev) => ({ ...prev, style })); markTouched("format") }}
                    className="panel-chip"
                    style={{
                      padding: "5px 10px", fontSize: 11, borderRadius: 8, cursor: "pointer",
                      background: config.style === style ? "rgba(80,42,12,0.48)" : "var(--bg-2)",
                      border: `1px solid ${config.style === style ? "rgba(139,90,43,0.45)" : "var(--line-2)"}`,
                      color: config.style === style ? "var(--ink-0)" : "var(--ink-2)",
                      fontWeight: config.style === style ? 600 : 400,
                    }}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </PanelSection>

            {/* C. Palette de couleurs */}
            <PanelSection
              title="Palette de couleurs"
              isOpen={isSectionOpen("colors")}
              onToggle={() => toggleSection("colors")}
              headerRight={
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLibre("colors") }}
                  style={{
                    padding: "3px 8px", marginRight: 8, fontSize: 9, borderRadius: 5, cursor: "pointer",
                    background: isSectionFilled("colors") ? "rgba(30,110,55,0.38)" : "rgba(110,30,30,0.38)",
                    border: `1px solid ${isSectionFilled("colors") ? "rgba(50,180,80,0.5)" : "rgba(200,50,50,0.5)"}`,
                    color: isSectionFilled("colors") ? "rgba(100,230,130,1)" : "rgba(230,100,100,1)",
                    fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const,
                  }}
                >Libre</button>
              }
            >
              
              {/* Color pickers grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 12 }}>
                {[
                  { key: "primary", label: "Prim." },
                  { key: "secondary", label: "Sec." },
                  { key: "accent", label: "Accent" },
                  { key: "background", label: "Fond" },
                  { key: "text", label: "Texte" },
                ].map((col) => (
                  <div key={col.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      position: "relative", width: 28, height: 28, borderRadius: "50%",
                      border: "1px solid var(--line-3)", overflow: "hidden", cursor: "pointer",
                      background: (config.colors as any)[col.key] || "#ffffff"
                    }}>
                      <input
                        type="color"
                        value={(config.colors as any)[col.key] || "#ffffff"}
                        onChange={(e) => { setConfig((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, [col.key]: e.target.value }
                        })); markTouched("colors") }}
                        style={{
                          position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer"
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 9.5, color: "var(--ink-3)" }}>{col.label}</span>
                  </div>
                ))}
              </div>

              {/* Extract from logo */}
              <button
                onClick={extractColors}
                disabled={isExtractingColors}
                style={{
                  width: "100%", padding: "7px 10px", fontSize: 11, borderRadius: 8,
                  background: isExtractingColors ? "rgba(60,35,12,0.55)" : "var(--bg-2)",
                  border: "1px solid rgba(139,90,43,0.35)",
                  color: isExtractingColors ? "var(--ink-3)" : "var(--ink-1)",
                  cursor: isExtractingColors ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                {isExtractingColors
                  ? <><span className="anim-shimmer" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--acc-bright)", display: "inline-block" }} /> Analyse en cours...</>
                  : <><Icon name="image" size={11} /> Extraire de l&apos;élément ★</>
                }
              </button>
            </PanelSection>

            {/* D. Qualité & Objectif */}
            <PanelSection
              title="Qualité & Objectif"
              isOpen={isSectionOpen("quality")}
              onToggle={() => toggleSection("quality")}
              headerRight={
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLibre("quality") }}
                  style={{
                    padding: "3px 8px", marginRight: 8, fontSize: 9, borderRadius: 5, cursor: "pointer",
                    background: isSectionFilled("quality") ? "rgba(30,110,55,0.38)" : "rgba(110,30,30,0.38)",
                    border: `1px solid ${isSectionFilled("quality") ? "rgba(50,180,80,0.5)" : "rgba(200,50,50,0.5)"}`,
                    color: isSectionFilled("quality") ? "rgba(100,230,130,1)" : "rgba(230,100,100,1)",
                    fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const,
                  }}
                >Libre</button>
              }
            >

              {/* Sub-title: Qualité */}
              <div style={{ fontSize: 9.5, fontWeight: 650, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Niveau de qualité
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                {QUALITY_LEVELS.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => { setConfig((prev) => ({ ...prev, quality: q.value })); markTouched("quality") }}
                    className="panel-chip"
                    style={{
                      padding: "5px 10px", fontSize: 11, borderRadius: 8, cursor: "pointer",
                      background: config.quality === q.value ? "rgba(80,42,12,0.48)" : "var(--bg-2)",
                      border: `1px solid ${config.quality === q.value ? "rgba(139,90,43,0.45)" : "var(--line-2)"}`,
                      color: config.quality === q.value ? "var(--ink-0)" : "var(--ink-2)",
                      fontWeight: config.quality === q.value ? 600 : 400,
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Sub-title: Objectif */}
              <div style={{ fontSize: 9.5, fontWeight: 650, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                Objectif de l&apos;affiche
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {OBJECTIVES.map((obj) => (
                  <button
                    key={obj}
                    onClick={() => { setConfig((prev) => ({ ...prev, objective: obj })); markTouched("quality") }}
                    className="panel-chip"
                    style={{
                      padding: "5px 10px", fontSize: 11, borderRadius: 8, cursor: "pointer",
                      background: config.objective === obj ? "rgba(80,42,12,0.48)" : "var(--bg-2)",
                      border: `1px solid ${config.objective === obj ? "rgba(139,90,43,0.45)" : "var(--line-2)"}`,
                      color: config.objective === obj ? "var(--ink-0)" : "var(--ink-2)",
                      fontWeight: config.objective === obj ? 600 : 400,
                    }}
                  >
                    {obj}
                  </button>
                ))}
              </div>
            </PanelSection>

          </div>

          {/* H. Action button at bottom */}
          <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.065)", background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.012) 100%)", backdropFilter: "blur(8px)" }}>
            <Button
              onClick={applyToChatContext}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "linear-gradient(135deg, rgba(224,138,100,0.92), rgba(180,100,70,0.8))",
                backdropFilter: "blur(8px)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 4px 16px rgba(224,138,100,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
                color: "#fff",
              }}
            >
              <Icon name="wand" size={15} /> Appliquer
            </Button>
          </div>
          </div>{/* end content column */}

          {/* Left panel toggle — always 28px, right edge */}
          {conversationStarted && (
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              title={leftOpen ? "Réduire" : "Configuration Créative"}
              style={{
                width: 28, flexShrink: 0,
                background: "rgba(255,255,255,0.02)",
                border: 0, borderLeft: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 10, color: "var(--ink-4)",
                padding: "16px 0",
              }}
            >
              {!leftOpen && (
                <>
                  <Icon name="palette" size={13} style={{ color: "var(--acc-bright)" }} />
                  <span style={{
                    fontSize: 8.5, fontWeight: 600, letterSpacing: "0.12em",
                    writingMode: "vertical-rl", transform: "rotate(180deg)",
                    color: "var(--ink-3)", textTransform: "uppercase",
                  }}>Config</span>
                </>
              )}
              <Icon name={leftOpen ? "chevronL" : "chevronR"} size={11} />
            </button>
          )}
        </aside>

        {/* ─── FRAME 2 — CENTER CONVERSATIONAL CHAT ─── */}
        <section
          style={{
            flex: 1,
            display: activeTab === "chat" ? "flex" : "none",
            flexDirection: "column",
            minWidth: 0,
            height: "100%",
            backgroundColor: "#080809",
            backgroundImage: [
              "linear-gradient(rgba(255,255,255,0.032) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(255,255,255,0.032) 1px, transparent 1px)",
              "linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)",
            ].join(", "),
            backgroundSize: "64px 64px, 64px 64px, 16px 16px, 16px 16px",
            position: "relative",
          }}
          className="frame-center-panel max-md:!w-full"
        >
          {/* Top vignette for legibility */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 60,
            background: "linear-gradient(to bottom, rgba(8,8,9,0.85), transparent)",
            pointerEvents: "none", zIndex: 1,
          }} />

          {/* Scrollable messages box */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: showWelcome ? 0 : "28px 16px 8px", position: "relative", zIndex: 2 }}>
            {showWelcome ? (
              <EmptyConversationState onPrompt={(val) => { setPrompt(val) }} />
            ) : (
              <div style={{ maxWidth: 820, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
                {loadingConversation ? (
                  <>
                    <div className="anim-skeleton" style={{ height: 84, borderRadius: 14 }} />
                    <div className="anim-skeleton" style={{ width: "72%", height: 72, borderRadius: 14 }} />
                  </>
                ) : (
                  (() => {
                    const assistantMessages = messages.filter((m) => m.role === "assistant")
                    const latestAssistantId = assistantMessages[assistantMessages.length - 1]?.id
                    return messages.map((message) => (
                      <ChatBubble
                        key={message.id}
                        message={message}
                        isLatest={message.id === latestAssistantId}
                        onChoiceClick={handleChoiceClick}
                      />
                    ))
                  })()
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

          {/* Bottom vignette above input */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 110,
            background: configAttached
              ? "linear-gradient(to top, rgba(20,9,2,0.97) 50%, transparent)"
              : "linear-gradient(to top, rgba(8,8,9,0.96) 45%, transparent)",
            transition: "background 0.35s ease",
            pointerEvents: "none", zIndex: 2,
          }} />

          {/* Input area */}
          <div style={{
            padding: "0 16px 20px", flexShrink: 0, position: "relative", zIndex: 3,
          }}>
            {/* Light sweep animation on Appliquer */}
            {sweepActive && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 10 }}>
                <div className="sweep-light-bar" />
              </div>
            )}
            <div style={{ maxWidth: 820, width: "100%", margin: "0 auto" }}>
              <ChatInput
                value={prompt}
                onChange={(v) => { setPrompt(v); if (awaitingOther && v) setAwaitingOther(false) }}
                onSubmit={() => handleSend()}
                disabled={!user?.id || isSending || loadingConversation}
                loading={isSending}
                highlighted={awaitingOther}
                active={configAttached}
              />
              <div style={{ textAlign: "center", fontSize: 10.5, color: "rgba(255,255,255,0.2)", marginTop: 10 }}>
                L'IA peut faire des erreurs · Vérifiez les résultats générés
              </div>
            </div>
          </div>
        </section>

        {/* ─── FRAME 3 — RIGHT VISUALIZER PANEL ─── */}
        <aside
          style={{
            width: conversationStarted ? (rightOpen ? "clamp(340px, 30%, 480px)" : "28px") : "0px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            borderLeft: conversationStarted ? "1px solid rgba(255,255,255,0.07)" : "none",
            background: "rgba(10,10,12,0.78)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
            zIndex: 10,
          }}
          className="frame-right-panel max-md:!w-full max-md:!min-w-0"
        >
          {/* Right panel toggle — always 28px, left edge */}
          {conversationStarted && (
            <button
              onClick={() => setRightOpen(!rightOpen)}
              title={rightOpen ? "Réduire" : "Aperçu du visuel"}
              style={{
                width: 28, flexShrink: 0,
                background: "rgba(255,255,255,0.02)",
                border: 0, borderRight: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 10, color: "var(--ink-4)",
                padding: "16px 0",
              }}
            >
              {!rightOpen && (
                <>
                  <Icon name="image" size={13} style={{ color: "var(--acc-bright)" }} />
                  <span style={{
                    fontSize: 8.5, fontWeight: 600, letterSpacing: "0.12em",
                    writingMode: "vertical-rl",
                    color: "var(--ink-3)", textTransform: "uppercase",
                  }}>Aperçu</span>
                </>
              )}
              <Icon name={rightOpen ? "chevronR" : "chevronL"} size={11} />
            </button>
          )}

          {/* Content column */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>

            {/* Header */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 10, fontWeight: 650, margin: 0, color: "rgba(255,255,255,0.5)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Aperçu du visuel</h2>
              </div>
            </div>

            {/* Éléments importés */}
            <PanelSection title="Éléments importés" isOpen={isSectionOpen("assets")} onToggle={() => toggleSection("assets")}>
              {/* Card grid: uploaded assets + "+" add card */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}
              >
                {uploadedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    style={{
                      borderRadius: 8, overflow: "hidden",
                      border: `1px solid ${asset.isPrimary ? "var(--acc-line)" : "var(--line-2)"}`,
                      background: "var(--bg-2)",
                      display: "flex", flexDirection: "column",
                    }}
                  >
                    {/* Pure thumbnail — no overlays */}
                    <div style={{ aspectRatio: "1", overflow: "hidden", position: "relative", background: "var(--bg-3)" }}>
                      {asset.url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={asset.url} alt={asset.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="warn" size={14} style={{ color: "var(--rose)" }} />
                        </div>
                      )}
                      {asset.status === "uploading" && (
                        <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)" }}>
                          <span className="anim-shimmer" style={{ display: "block", width: 20, height: 3, borderRadius: 2, background: "var(--acc-bright)" }} />
                        </div>
                      )}
                    </div>

                    {/* Footer controls */}
                    <div style={{
                      display: "flex", alignItems: "center",
                      borderTop: `1px solid ${asset.isPrimary ? "rgba(224,138,100,0.3)" : "var(--line-2)"}`,
                      background: asset.isPrimary ? "rgba(224,138,100,0.08)" : "var(--bg-3)",
                      height: 26,
                      transition: "background 0.2s ease, border-color 0.2s ease",
                    }}>
                      {/* Star — all types */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setPrimaryAsset(asset.id) }}
                        title={asset.isPrimary ? "Élément principal ★" : "Définir comme élément principal"}
                        className="asset-star-btn"
                        style={{
                          border: 0, borderRight: `1px solid ${asset.isPrimary ? "rgba(224,138,100,0.3)" : "var(--line-2)"}`,
                          background: "transparent",
                          color: asset.isPrimary ? "var(--acc-bright)" : "rgba(255,255,255,0.22)",
                          width: 26, height: "100%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", fontSize: 12,
                          transition: "color 0.15s ease, background 0.15s ease",
                        }}
                      >{asset.isPrimary ? "★" : "☆"}</button>
                      {/* Type badge — click to cycle */}
                      <button
                        onClick={() => cycleAssetType(asset.id)}
                        title="Changer le type"
                        style={{
                          border: 0, background: "transparent",
                          color: "var(--ink-3)", fontSize: 9, fontWeight: 600,
                          flex: 1, height: "100%", cursor: "pointer",
                          letterSpacing: "0.04em", textTransform: "uppercase",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          padding: "0 4px",
                        }}
                      >
                        {ASSET_TYPE_LABELS[asset.type]}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        aria-label="Supprimer"
                        className="asset-del-btn"
                        style={{
                          border: 0, borderLeft: "1px solid var(--line-2)",
                          background: "transparent",
                          color: "var(--ink-4)",
                          width: 24, height: "100%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                          transition: "color 0.15s ease, background 0.15s ease",
                        }}
                      >
                        <Icon name="x" size={9} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* "+" add card */}
                <div
                  style={{
                    position: "relative", borderRadius: 10, overflow: "hidden",
                    border: `1.5px dashed ${dragOver ? "var(--acc)" : "var(--line-3)"}`,
                    background: dragOver ? "var(--acc-soft)" : "var(--bg-2)",
                    aspectRatio: "1", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                  />
                  <Icon name="upload" size={18} style={{ color: "var(--acc-bright)", marginBottom: 4 }} />
                  <span style={{ fontSize: 9.5, color: "var(--ink-3)", textAlign: "center", lineHeight: 1.3 }}>
                    Ajouter
                  </span>
                </div>
              </div>

              {/* Asset type selector for next upload */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginTop: 8 }}>
                {(["logo", "product", "reference", "poster", "other"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveAssetType(type)}
                    title={`Uploader en tant que: ${ASSET_TYPE_LABELS[type]}`}
                    style={{
                      padding: "4px 2px", fontSize: 9.5, borderRadius: 6,
                      background: activeAssetType === type ? "rgba(80,42,12,0.48)" : "rgba(60,35,12,0.55)",
                      border: `1px solid ${activeAssetType === type ? "rgba(139,90,43,0.45)" : "rgba(139,90,43,0.3)"}`,
                      color: activeAssetType === type ? "var(--ink-0)" : "var(--ink-3)",
                      cursor: "pointer",
                    }}
                  >
                    {type === "reference" ? "Insp." : type === "product" ? "Prod." : ASSET_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </PanelSection>

            {/* A. Large Preview Area */}
            <PanelSection title="Aperçu du visuel" isOpen={isSectionOpen("preview")} onToggle={() => toggleSection("preview")}>
            {activeVisual ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  onClick={() => setZoomOpen(true)}
                  style={{
                    position: "relative", width: "100%",
                    borderRadius: 16, overflow: "hidden", cursor: "zoom-in",
                    border: "1px solid rgba(255,255,255,0.07)", background: "var(--bg-0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeVisual.imageUrl}
                    alt={activeVisual.title}
                    style={{
                      maxWidth: "100%", maxHeight: 380, objectFit: "contain",
                      transition: "transform 0.3s ease"
                    }}
                    className="hover:scale-102"
                  />
                  <div style={{
                    position: "absolute", right: 10, bottom: 10,
                    width: 28, height: 28, borderRadius: 6, background: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff"
                  }}>
                    <Icon name="expand" size={12} />
                  </div>
                </div>

                {/* Visual Details label */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 650, color: "var(--ink-0)" }}>{activeVisual.title}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                    {activeVisual.format} · {relativeTime(activeVisual.createdAt)}
                  </div>
                </div>

                {/* C. Action buttons under visual */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <button
                      onClick={downloadActiveVisual}
                      style={{
                        padding: "8px 10px", fontSize: 12, borderRadius: 8,
                        background: "var(--bg-3)", border: "1px solid var(--line-3)",
                        color: "var(--ink-1)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center"
                      }}
                    >
                      <Icon name="download" size={12} /> Télécharger
                    </button>
                    
                    <button
                      onClick={requestVariant}
                      disabled={isGenerating}
                      style={{
                        padding: "8px 10px", fontSize: 12, borderRadius: 8,
                        background: "var(--bg-3)", border: "1px solid var(--line-3)",
                        color: isGenerating ? "var(--ink-3)" : "var(--ink-1)",
                        cursor: isGenerating ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6, justifyContent: "center"
                      }}
                    >
                      <Icon name={isGenerating ? "loader" : "wand"} size={12} />
                      {isGenerating ? "Génération..." : "Variantes"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <button
                      onClick={requestImprovement}
                      disabled={isGenerating}
                      style={{
                        padding: "8px 10px", fontSize: 12, borderRadius: 8,
                        background: "var(--acc-soft)", border: "1px solid var(--acc-line)",
                        color: isGenerating ? "var(--ink-3)" : "var(--acc-bright)",
                        cursor: isGenerating ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6, justifyContent: "center"
                      }}
                    >
                      <Icon name={isGenerating ? "loader" : "sparkles"} size={12} />
                      {isGenerating ? "Génération..." : "Améliorer"}
                    </button>

                    <button
                      onClick={deleteActiveVisual}
                      style={{
                        padding: "8px 10px", fontSize: 12, borderRadius: 8,
                        background: "var(--bg-3)", border: "1px solid var(--line-3)",
                        color: "var(--rose)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center"
                      }}
                    >
                      <Icon name="trash" size={12} /> Supprimer
                    </button>
                  </div>

                  {/* Multiple format export */}
                  <div style={{ position: "relative", marginTop: 4 }}>
                    <button
                      onClick={() => setActiveExportFormat(activeExportFormat ? null : "show")}
                      style={{
                        width: "100%", padding: "8px 10px", fontSize: 12, borderRadius: 8,
                        background: "var(--bg-2)", border: "1px solid var(--line-3)",
                        color: "var(--ink-1)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center"
                      }}
                    >
                      <Icon name="plus" size={12} /> Formats d'export HD...
                    </button>

                    {activeExportFormat && (
                      <div style={{
                        position: "absolute", bottom: "100%", left: 0, right: 0,
                        background: "var(--bg-2)", border: "1px solid var(--line-2)",
                        borderRadius: 8, padding: 6, zIndex: 100, marginBottom: 4,
                        boxShadow: "var(--sh-3)", display: "flex", flexDirection: "column", gap: 4
                      }}>
                        {[
                          { label: "PNG (Standard)", key: "PNG" },
                          { label: "JPG (Compressé)", key: "JPG" },
                          { label: "PDF (Impression)", key: "PDF" },
                          { label: "WebP (Ultra léger)", key: "WebP" },
                          { label: "HD Print (300 DPI)", key: "HD Print" },
                        ].map(({ label, key }) => (
                          <button
                            key={key}
                            onClick={() => downloadWithFormat(key)}
                            style={{
                              padding: "6px 10px", fontSize: 11, border: 0, borderRadius: 6,
                              background: "transparent", color: "var(--ink-1)", cursor: "pointer",
                              textAlign: "left"
                            }}
                            className="hover:!bg-bg-3 hover:!color-ink-0"
                          >
                            ✓ {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", border: "1px dashed var(--line-3)", borderRadius: 12,
                padding: 28, textAlign: "center", minHeight: 280, gap: 10
              }}>
                <Icon name="image" size={36} style={{ color: "var(--ink-4)", opacity: 0.35 }} />
                <div style={{ fontSize: 13, fontWeight: 650, color: "var(--ink-2)", marginTop: 4 }}>
                  Aucun visuel généré
                </div>
                <p style={{ fontSize: 11.5, color: "var(--ink-3)", margin: 0, lineHeight: 1.5 }}>
                  Complétez la conversation puis dites<br />
                  <strong style={{ color: "var(--acc-bright)" }}>&ldquo;gérer le visuel&rdquo;</strong> pour lancer la génération.
                </p>
              </div>
            )}
            </PanelSection>

            {/* B. Miniatures gallery at bottom */}
            {visuals.length > 0 && (
              <PanelSection title="Galerie de variantes" isOpen={isSectionOpen("gallery")} onToggle={() => toggleSection("gallery")}>
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
                  maxHeight: 200, overflowY: "auto", padding: 2
                }}>
                  {visuals.map((visual) => {
                    const isSelected = selectedVisualId === visual.id
                    return (
                      <button
                        key={visual.id}
                        onClick={() => setSelectedVisualId(visual.id)}
                        style={{
                          border: `2px solid ${isSelected ? "var(--acc)" : "var(--line-1)"}`,
                          padding: 4, background: "var(--bg-2)", borderRadius: 8,
                          cursor: "pointer", display: "flex", flexDirection: "column", gap: 4,
                          position: "relative", overflow: "hidden"
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={visual.imageUrl}
                          alt={visual.title}
                          style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", borderRadius: 4 }}
                        />
                        <span style={{
                          fontSize: 9.5, fontWeight: isSelected ? 650 : 500,
                          color: isSelected ? "var(--acc-bright)" : "var(--ink-2)",
                          textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", width: "100%"
                        }}>
                          {visual.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </PanelSection>
            )}

          </div>{/* end content column */}
        </aside>

      </div>

      {/* ─── FULL SCREEN ZOOM MODAL ─── */}
      {zoomOpen && activeVisual && (
        <div
          onClick={() => setZoomOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(16, 12, 8, 0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1100, padding: 24, backdropFilter: "blur(6px)"
          }}
          className="anim-fade-in"
        >
          <button
            onClick={() => setZoomOpen(false)}
            aria-label="Fermer le plein écran"
            style={{
              position: "absolute", top: 20, right: 20,
              width: 40, height: 40, borderRadius: "50%",
              background: "var(--bg-2)", border: "1px solid var(--line-3)",
              color: "var(--ink-0)", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", zIndex: 10
            }}
          >
            <Icon name="x" size={18} />
          </button>
          
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative", maxWidth: "90%", maxHeight: "90%",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 14
            }}
            className="anim-pop-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeVisual.imageUrl}
              alt={activeVisual.title}
              style={{
                maxWidth: "100%", maxHeight: "80vh", objectFit: "contain",
                borderRadius: 12, boxShadow: "var(--sh-3)", border: "1px solid var(--line-2)"
              }}
            />
            <div style={{ textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: 16, fontWeight: 650 }}>{activeVisual.title}</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 4 }}>
                {activeVisual.format} · Visualisation Haute Résolution
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Inject Local CSS Rules ─── */}
      <style>{`
        .hover\\:scale-102:hover {
          transform: scale(1.025);
        }
        .hover\\:color-rose:hover {
          color: var(--rose) !important;
        }
        .hover\\:bg-bg-3:hover {
          background: var(--bg-3) !important;
        }
        .hover\\:color-ink-0:hover {
          color: var(--ink-0) !important;
        }

        .panel-chip {
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .panel-chip:hover {
          background: rgba(80,42,12,0.48) !important;
          color: var(--ink-0) !important;
          border-color: rgba(139,90,43,0.45) !important;
        }

        .asset-star-btn:hover {
          color: var(--acc-bright) !important;
          background: rgba(119,119,119,0.12) !important;
        }
        .asset-del-btn:hover {
          color: var(--rose) !important;
          background: rgba(217,112,112,0.10) !important;
        }

        .choice-chip {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .choice-chip:hover {
          background: linear-gradient(135deg, var(--acc), rgba(224,138,100,0.85)) !important;
          color: #fff !important;
          border-color: var(--acc) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(224, 138, 100, 0.3);
        }
        .choice-chip:active {
          transform: translateY(0) scale(0.98);
        }

        /* Responsive Layout Overrides */
        @media (max-width: 1024px) {
          .frame-left-panel {
            width: 320px !important;
          }
          .frame-right-panel {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .frame-left-panel, .frame-right-panel {
            display: none !important;
          }
          .frame-left-panel.max-md\\:\\!w-full {
            display: ${activeTab === "settings" ? "flex" : "none"} !important;
          }
          .frame-center-panel.max-md\\:\\!w-full {
            display: ${activeTab === "chat" ? "flex" : "none"} !important;
          }
          .frame-right-panel.max-md\\:\\!w-full {
            display: ${activeTab === "preview" ? "flex" : "none"} !important;
          }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .anim-dot-bounce {
          animation: dotBounce 1.2s ease-in-out infinite;
        }

        @keyframes sweepLight {
          0%   { left: -60%; opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          100% { left: 160%; opacity: 0; }
        }
        .sweep-light-bar {
          position: absolute;
          top: -20px; bottom: -20px;
          left: -60%;
          width: 55%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(160,85,25,0.08) 15%,
            rgba(210,120,40,0.22) 40%,
            rgba(255,165,60,0.32) 50%,
            rgba(210,120,40,0.22) 60%,
            rgba(160,85,25,0.08) 85%,
            transparent 100%
          );
          animation: sweepLight 0.68s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          pointer-events: none;
        }

        /* scrollbar — center panel */
        .frame-center-panel ::-webkit-scrollbar { width: 4px; }
        .frame-center-panel ::-webkit-scrollbar-track { background: transparent; }
        .frame-center-panel ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .frame-center-panel ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  )
}
