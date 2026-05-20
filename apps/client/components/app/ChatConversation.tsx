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
import { fetchGeneratedPosters } from "@/lib/projects"
import type { GeneratedPoster } from "@/types/project"

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface UploadedAsset {
  id: string
  name: string
  type: "logo" | "product" | "reference" | "poster" | "other"
  url: string
  status: "uploading" | "success" | "error"
}

interface VisualConfig {
  format: string
  customSize?: {
    width: number
    height: number
    unit: "px" | "cm" | "mm"
  }
  colors: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
  }
  fonts: {
    title?: string
    subtitle?: string
    body?: string
    cta?: string
  }
  quality: string
  style: string
  styleDescription?: string
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

// Default elegant visual templates to populate the viewer in absence of API-generated ones
const DEFAULT_VISUALS: GeneratedVisual[] = [
  {
    id: "def-1",
    title: "Maison Café Brunch",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    format: "Portrait — 4:5",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "def-2",
    title: "Soirée Afterwork Lab",
    imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80",
    format: "Carré — 1:1",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "def-3",
    title: "Drop Été Collection",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
    format: "Story — 9:16",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "def-4",
    title: "Grandes Soldes Boutique",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
    format: "Paysage — 16:9",
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  }
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

const FONTS_CATEGORIES = [
  "Moderne", "Luxe", "Minimaliste", "Sportif", "Corporate", "Élégant", "Jeune / dynamique", "Artistique", "Traditionnel"
]

// Predefined harmonious color palettes for the AI color generator
const MOCK_PALETTES = [
  { name: "Terre cuite", primary: "#e08a64", secondary: "#100c08", accent: "#d8a85a", background: "#f5eee2", text: "#1c1108" },
  { name: "Obsidienne dorée", primary: "#ea9b75", secondary: "#211a14", accent: "#ea9b75", background: "#100c08", text: "#e2d8c5" },
  { name: "Sauge sauvage", primary: "#8aa57a", secondary: "#2a2118", accent: "#d8a85a", background: "#f1ead9", text: "#1d1611" },
  { name: "Prune royale", primary: "#b08bc7", secondary: "#181310", accent: "#ea9b75", background: "#181310", text: "#f5eee2" },
  { name: "Crème minimaliste", primary: "#5a4f43", secondary: "#b6a791", accent: "#c66a45", background: "#ffffff", text: "#1d1611" }
]

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
            width: 32,
            height: 32,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 8,
          }}
        >
          <BrandMark size={20} withWordmark={false} />
        </span>
      )}
      <article
        style={{
          width: "fit-content",
          maxWidth: "min(720px, 82%)",
          padding: isUser ? "12px 16px" : "10px 4px",
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
          width: 32,
          height: 32,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: 8,
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
        padding: "40px 16px",
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
          background: "var(--bg-2)",
          border: "1px solid var(--line-2)",
          borderRadius: 14,
        }}
      >
        <BrandMark size={28} withWordmark={false} />
      </div>
      <h2
        className="display"
        style={{ fontSize: "clamp(24px, 3vw, 36px)", margin: "0 0 12px 0", letterSpacing: 0, textAlign: "center", color: "var(--ink-0)" }}
      >
        Que voulez-vous créer aujourd'hui ?
      </h2>
      <p style={{ margin: "0 0 28px", maxWidth: 540, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>
        Préparez vos paramètres créatifs sur la gauche (format, style, couleurs), puis décrivez votre visuel au centre. L'IA générera des affiches magnifiques visibles en temps réel sur la droite.
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

// ─── Main Component ──────────────────────────────────────────────────────────

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

  // --- States ---
  const [prompt, setPrompt] = useState("")
  const [loadingConversation, setLoadingConversation] = useState(Boolean(conversationId))
  const [hasSubmittedInView, setHasSubmittedInView] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Responsive state
  const [activeTab, setActiveTab] = useState<"settings" | "chat" | "preview">("chat")
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  // Creation State - Frame 1
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([])
  const [activeAssetType, setActiveAssetType] = useState<UploadedAsset["type"]>("logo")
  const [dragOver, setDragOver] = useState(false)

  const [config, setConfig] = useState<VisualConfig>({
    format: "Portrait — 4:5",
    colors: {
      primary: "#e08a64",
      secondary: "#100c08",
      accent: "#d8a85a",
      background: "#f5eee2",
      text: "#1c1108"
    },
    fonts: {
      title: "Moderne",
      body: "Moderne"
    },
    quality: "Premium",
    style: "Moderne",
    objective: "Vendre un produit"
  })
  const [customSize, setCustomSize] = useState({ width: 1080, height: 1350, unit: "px" as const })
  const [aiFonts, setAiFonts] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Visuals State - Frame 3
  const [visuals, setVisuals] = useState<GeneratedVisual[]>(DEFAULT_VISUALS)
  const [selectedVisualId, setSelectedVisualId] = useState<string>("def-1")
  const [zoomOpen, setZoomOpen] = useState(false)
  const [activeExportFormat, setActiveExportFormat] = useState<string | null>(null)

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

  // --- Dynamic Layout Init ---
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      if (w < 768) {
        // Mobile
        // Tabs will control display
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
  }, [])

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
        .catch(() => {
          // Fallback silently to mock visuals if request fails or is mock env
        })
    } else {
      // Reset to default mock templates if no project is active
      setVisuals(DEFAULT_VISUALS)
      setSelectedVisualId(DEFAULT_VISUALS[0].id)
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

  // --- Premium Actions & Triggers ---
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    processFiles(Array.from(files))
  }

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      // Max 10 Mo limit
      if (file.size > 10 * 1024 * 1024) {
        triggerToast(`Fichier ${file.name} trop volumineux (> 10 Mo)`)
        return
      }
      const fileType = file.name.split('.').pop()?.toLowerCase()
      if (!["jpg", "jpeg", "png", "webp", "svg"].includes(fileType || "")) {
        triggerToast("Format de fichier non accepté (uniquement JPG, PNG, WebP, SVG)")
        return
      }

      const tempAssetId = `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const objectUrl = URL.createObjectURL(file)

      const newAsset: UploadedAsset = {
        id: tempAssetId,
        name: file.name,
        type: activeAssetType,
        url: objectUrl,
        status: "uploading"
      }

      setUploadedAssets((prev) => [...prev, newAsset])

      // Simulate premium uploading shimmer animation
      setTimeout(() => {
        setUploadedAssets((prev) =>
          prev.map((asset) => (asset.id === tempAssetId ? { ...asset, status: "success" } : asset))
        )
        triggerToast(`${file.name} importé avec succès en tant que ${activeAssetType}`)
      }, 1500)
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
    triggerToast("Fichier supprimé de l'espace de création")
  }

  const generateAIPalette = () => {
    const randomPalette = MOCK_PALETTES[Math.floor(Math.random() * MOCK_PALETTES.length)]
    setConfig((prev) => ({
      ...prev,
      colors: {
        primary: randomPalette.primary,
        secondary: randomPalette.secondary,
        accent: randomPalette.accent,
        background: randomPalette.background,
        text: randomPalette.text
      }
    }))
    triggerToast(`Palette IA « ${randomPalette.name} » appliquée !`)
  }

  const extractColors = () => {
    const succeededAssets = uploadedAssets.filter((a) => a.status === "success")
    if (succeededAssets.length === 0) {
      triggerToast("Veuillez d'abord uploader une image pour y extraire les couleurs.")
      return
    }
    // Simulate beautiful dominant color extraction
    const extractedPalettes = [
      { primary: "#ea9b75", secondary: "#211a14", accent: "#d8a85a", background: "#fbf8f1", text: "#382d23" },
      { primary: "#8aa57a", secondary: "#100c08", accent: "#e08a64", background: "#ffffff", text: "#1d1611" }
    ]
    const chosen = extractedPalettes[Math.floor(Math.random() * extractedPalettes.length)]
    setConfig((prev) => ({
      ...prev,
      colors: chosen
    }))
    triggerToast("Palette extraite de l'image avec succès !")
  }

  const applyToChatContext = () => {
    const formatStr = config.format === "Format personnalisé"
      ? `Personnalisé (${customSize.width}x${customSize.height} ${customSize.unit})`
      : config.format

    const activeAssets = uploadedAssets.filter((a) => a.status === "success")
    const assetsText = activeAssets.length > 0
      ? `\n- 📎 **Fichiers importés :** ${activeAssets.map(a => `${a.name} (${a.type})`).join(', ')}`
      : ""

    const promptPayload = `🎨 **Brief de visuel configuré :**
- 📐 **Format :** ${formatStr}
- 🎨 **Palette de couleurs :** Primaire: \`${config.colors.primary}\`, Secondaire: \`${config.colors.secondary}\`, Accent: \`${config.colors.accent}\`
- 🔤 **Polices :** ${aiFonts ? "Laisser l'IA choisir les meilleures polices" : `Titre: ${config.fonts.title}, Corps: ${config.fonts.body}`}
- ⚡ **Qualité requise :** ${config.quality}
- 🎭 **Style visuel :** ${config.style}${config.styleDescription ? ` (« ${config.styleDescription} »)` : ""}
- 🎯 **Objectif stratégique :** ${config.objective}${assetsText}

*Veuillez utiliser ces paramètres pour générer et améliorer mon visuel.*`

    setPrompt(promptPayload)
    setActiveTab("chat")
    triggerToast("Paramètres injectés avec succès dans le chat central !")
  }

  const downloadActiveVisual = () => {
    const activeVisual = visuals.find((v) => v.id === selectedVisualId)
    if (!activeVisual) return
    triggerToast(`Téléchargement de « ${activeVisual.title} » en cours...`)
    
    const url = activeVisual.imageUrl.includes("/upload/")
      ? activeVisual.imageUrl.replace("/upload/", "/upload/fl_attachment/")
      : activeVisual.imageUrl
    window.open(url, "_blank")
  }

  const requestVariant = () => {
    const activeVisual = visuals.find((v) => v.id === selectedVisualId)
    if (!activeVisual) return
    const text = `Générer une variante créative basée sur le visuel « ${activeVisual.title} ».`
    setPrompt(text)
    setActiveTab("chat")
    handleSend(text)
  }

  const requestImprovement = () => {
    const activeVisual = visuals.find((v) => v.id === selectedVisualId)
    if (!activeVisual) return
    const text = `Améliorer la composition, l'éclairage et la typographie du visuel « ${activeVisual.title} ».`
    setPrompt(text)
    setActiveTab("chat")
    handleSend(text)
  }

  const deleteActiveVisual = () => {
    if (visuals.length <= 1) {
      triggerToast("Impossible de supprimer le dernier visuel.")
      return
    }
    setVisuals((prev) => prev.filter((v) => v.id !== selectedVisualId))
    const remaining = visuals.filter((v) => v.id !== selectedVisualId)
    setSelectedVisualId(remaining[0].id)
    triggerToast("Visuel supprimé de la galerie locale.")
  }

  const activeVisual = visuals.find((v) => v.id === selectedVisualId)
  const qualityDetails = QUALITY_LEVELS.find((q) => q.value === config.quality)

  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", background: "var(--bg-0)", position: "relative" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed", top: 20, right: 20,
          background: "var(--bg-2)", border: "1px solid var(--acc-line)",
          boxShadow: "var(--sh-acc)", borderRadius: 10,
          padding: "12px 18px", zIndex: 1000,
          display: "flex", alignItems: "center", gap: 10,
          color: "var(--ink-0)", fontSize: 13,
          animation: "slideIn 0.3s ease"
        }}>
          <Icon name="sparkles" size={15} style={{ color: "var(--acc-bright)" }} />
          {toastMessage}
        </div>
      )}

      {/* Tabs navigation for mobile displays */}
      <div className="md:hidden" style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        borderBottom: "1px solid var(--line-2)", background: "var(--bg-1)",
        height: 48, flexShrink: 0
      }}>
        {(["settings", "chat", "preview"] as const).map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                border: 0, background: "transparent",
                color: isActive ? "var(--acc-bright)" : "var(--ink-2)",
                fontSize: 13, fontWeight: isActive ? 650 : 500,
                borderBottom: isActive ? "2px solid var(--acc)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, cursor: "pointer"
              }}
            >
              <Icon name={tab === "settings" ? "layoutSidebar" : tab === "chat" ? "message" : "image"} size={14} />
              {tab === "settings" ? "Paramètres" : tab === "chat" ? "Chat IA" : "Aperçu"}
            </button>
          )
        })}
      </div>

      {/* 3-Frame Grid Content Wrapper */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative", width: "100%" }}>

        {/* ─── FRAME 1 — LEFT CREATION PANEL ─── */}
        <aside
          style={{
            width: "25%",
            borderRight: "1px solid var(--line-2)",
            background: "var(--bg-1)",
            display: leftOpen ? "flex" : "none",
            flexDirection: "column",
            minWidth: 280,
            zIndex: 10
          }}
          className="frame-left-panel max-md:!w-full max-md:!min-w-0"
        >
          {/* Internal scroll wrapper */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Header */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Icon name="palette" size={16} style={{ color: "var(--acc-bright)" }} />
                <h2 className="display" style={{ fontSize: 16, margin: 0, color: "var(--ink-0)" }}>Configuration Créative</h2>
              </div>
              <p style={{ fontSize: 11.5, color: "var(--ink-3)", margin: 0 }}>Configurez les contraintes IA pour guider le visuel.</p>
            </div>

            {/* A. User Assets Uploads */}
            <div>
              <h3 style={{ fontSize: 12.5, fontWeight: 650, color: "var(--ink-1)", marginBottom: 8, letterSpacing: "0.02em" }}>ÉLÉMENTS IMPORTÉS</h3>
              
              {/* Type Select */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 8 }}>
                {(["logo", "product", "reference", "poster", "other"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveAssetType(type)}
                    title={`Uploader en tant que: ${type}`}
                    style={{
                      padding: "4px 2px", fontSize: 10, borderRadius: 6,
                      background: activeAssetType === type ? "var(--acc-soft)" : "var(--bg-3)",
                      border: `1px solid ${activeAssetType === type ? "var(--acc-line)" : "var(--line-1)"}`,
                      color: activeAssetType === type ? "var(--acc-bright)" : "var(--ink-3)",
                      cursor: "pointer", textTransform: "capitalize"
                    }}
                  >
                    {type === "reference" ? "insp." : type === "product" ? "prod." : type}
                  </button>
                ))}
              </div>

              {/* Drag Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: `1.5px dashed ${dragOver ? "var(--acc)" : "var(--line-3)"}`,
                  background: dragOver ? "var(--acc-soft)" : "var(--bg-2)",
                  borderRadius: 10, padding: "16px 10px", textAlign: "center",
                  cursor: "pointer", transition: "all 0.2s ease", position: "relative"
                }}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                />
                <Icon name="upload" size={16} style={{ color: "var(--acc-bright)", marginBottom: 6, margin: "0 auto 6px" }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-1)" }}>+ Ajouter un fichier</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>JPG, PNG, WebP, SVG &lt; 10 Mo</div>
              </div>

              {/* Uploads list preview */}
              {uploadedAssets.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                  {uploadedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "var(--bg-2)", border: "1px solid var(--line-2)",
                        borderRadius: 8, padding: 6, position: "relative"
                      }}
                    >
                      {/* Image Preview thumbnail */}
                      <div style={{ width: 28, height: 28, borderRadius: 4, background: "var(--bg-3)", overflow: "hidden", flexShrink: 0 }}>
                        {asset.status === "success" ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={asset.url} alt={asset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 9, color: "var(--ink-3)" }}>...</span>
                          </div>
                        )}
                      </div>

                      {/* Info & Status */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 550, color: "var(--ink-1)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {asset.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{
                            padding: "1px 4px", borderRadius: 4, fontSize: 8, fontWeight: 600,
                            background: "var(--bg-3)", color: "var(--ink-2)", textTransform: "uppercase"
                          }}>
                            {asset.type}
                          </span>
                          <span style={{
                            fontSize: 9,
                            color: asset.status === "uploading" ? "var(--gold)" : asset.status === "success" ? "var(--sage)" : "var(--rose)"
                          }}>
                            {asset.status === "uploading" ? "Chargement..." : asset.status === "success" ? "Prêt" : "Erreur"}
                          </span>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        aria-label="Supprimer l'élément importé"
                        style={{
                          border: 0, background: "transparent", cursor: "pointer",
                          color: "var(--ink-3)", padding: 4, display: "flex", alignItems: "center"
                        }}
                        className="hover:!color-rose"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* B. Format du visuel */}
            <div>
              <h3 style={{ fontSize: 12.5, fontWeight: 650, color: "var(--ink-1)", marginBottom: 8, letterSpacing: "0.02em" }}>FORMAT DU VISUEL</h3>
              <select
                value={config.format}
                onChange={(e) => setConfig((prev) => ({ ...prev, format: e.target.value }))}
                style={{
                  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-3)",
                  borderRadius: 10, padding: 8, color: "var(--ink-1)", fontSize: 13, outline: 0
                }}
              >
                <option value="Carré — 1:1">Carré — 1:1</option>
                <option value="Portrait — 4:5">Portrait — 4:5</option>
                <option value="Story — 9:16">Story — 9:16</option>
                <option value="Paysage — 16:9">Paysage — 16:9</option>
                <option value="Affiche A4">Affiche A4</option>
                <option value="Flyer A5">Flyer A5</option>
                <option value="Bannière web">Bannière web</option>
                <option value="Publication Instagram">Publication Instagram</option>
                <option value="Couverture Facebook">Couverture Facebook</option>
                <option value="Format personnalisé">Format personnalisé</option>
              </select>

              {config.format === "Format personnalisé" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 8 }}>
                  <div>
                    <label htmlFor="custom-width" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>Largeur</label>
                    <input
                      id="custom-width"
                      type="number"
                      value={customSize.width}
                      onChange={(e) => setCustomSize((prev) => ({ ...prev, width: Number(e.target.value) }))}
                      style={{
                        width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-3)",
                        borderRadius: 6, padding: "5px 6px", color: "var(--ink-1)", fontSize: 12, outline: 0
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-height" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>Hauteur</label>
                    <input
                      id="custom-height"
                      type="number"
                      value={customSize.height}
                      onChange={(e) => setCustomSize((prev) => ({ ...prev, height: Number(e.target.value) }))}
                      style={{
                        width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-3)",
                        borderRadius: 6, padding: "5px 6px", color: "var(--ink-1)", fontSize: 12, outline: 0
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="custom-unit" style={{ fontSize: 9.5, color: "var(--ink-3)" }}>Unité</label>
                    <select
                      id="custom-unit"
                      value={customSize.unit}
                      onChange={(e) => setCustomSize((prev) => ({ ...prev, unit: e.target.value as any }))}
                      style={{
                        width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-3)",
                        borderRadius: 6, padding: "4px 4px", color: "var(--ink-1)", fontSize: 12, outline: 0
                      }}
                    >
                      <option value="px">px</option>
                      <option value="cm">cm</option>
                      <option value="mm">mm</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* C. Palette de couleurs */}
            <div>
              <h3 style={{ fontSize: 12.5, fontWeight: 650, color: "var(--ink-1)", marginBottom: 8, letterSpacing: "0.02em" }}>PALETTE DE COULEURS</h3>
              
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
                        onChange={(e) => setConfig((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, [col.key]: e.target.value }
                        }))}
                        style={{
                          position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer"
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 9.5, color: "var(--ink-3)" }}>{col.label}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button
                  onClick={extractColors}
                  style={{
                    padding: "6px 8px", fontSize: 11, borderRadius: 8,
                    background: "var(--bg-3)", border: "1px solid var(--line-3)",
                    color: "var(--ink-1)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, justifyContent: "center"
                  }}
                >
                  <Icon name="image" size={11} /> Extraire
                </button>
                <button
                  onClick={generateAIPalette}
                  style={{
                    padding: "6px 8px", fontSize: 11, borderRadius: 8,
                    background: "var(--acc-soft)", border: "1px solid var(--acc-line)",
                    color: "var(--acc-bright)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, justifyContent: "center"
                  }}
                >
                  <Icon name="sparkles" size={11} /> Palette IA
                </button>
              </div>
            </div>

            {/* D. Typographies */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ fontSize: 12.5, fontWeight: 650, color: "var(--ink-1)", margin: 0, letterSpacing: "0.02em" }}>POLICES À UTILISER</h3>
                
                {/* AI choice toggle */}
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={aiFonts}
                    onChange={(e) => setAiFonts(e.target.checked)}
                    style={{ accentColor: "var(--acc)" }}
                  />
                  <span style={{ fontSize: 10.5, color: "var(--acc-bright)" }}>Choix IA</span>
                </label>
              </div>

              {!aiFonts && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <label htmlFor="font-title" style={{ fontSize: 10, color: "var(--ink-3)" }}>Police du titre</label>
                    <select
                      id="font-title"
                      value={config.fonts.title}
                      onChange={(e) => setConfig((prev) => ({ ...prev, fonts: { ...prev.fonts, title: e.target.value } }))}
                      style={{
                        width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-3)",
                        borderRadius: 8, padding: 6, color: "var(--ink-1)", fontSize: 12, outline: 0
                      }}
                    >
                      {FONTS_CATEGORIES.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="font-body" style={{ fontSize: 10, color: "var(--ink-3)" }}>Police du texte</label>
                    <select
                      id="font-body"
                      value={config.fonts.body}
                      onChange={(e) => setConfig((prev) => ({ ...prev, fonts: { ...prev.fonts, body: e.target.value } }))}
                      style={{
                        width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-3)",
                        borderRadius: 8, padding: 6, color: "var(--ink-1)", fontSize: 12, outline: 0
                      }}
                    >
                      {FONTS_CATEGORIES.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* E. Niveau de qualité */}
            <div>
              <h3 style={{ fontSize: 12.5, fontWeight: 650, color: "var(--ink-1)", marginBottom: 8, letterSpacing: "0.02em" }}>NIVEAU DE QUALITÉ</h3>
              <select
                value={config.quality}
                onChange={(e) => setConfig((prev) => ({ ...prev, quality: e.target.value }))}
                style={{
                  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-3)",
                  borderRadius: 10, padding: 8, color: "var(--ink-1)", fontSize: 13, outline: 0
                }}
              >
                {QUALITY_LEVELS.map((q) => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
              {qualityDetails && (
                <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6, fontStyle: "italic", lineHeight: 1.4 }}>
                  {qualityDetails.desc}
                </div>
              )}
            </div>

            {/* F. Style visuel */}
            <div>
              <h3 style={{ fontSize: 12.5, fontWeight: 650, color: "var(--ink-1)", marginBottom: 8, letterSpacing: "0.02em" }}>STYLE VISUEL</h3>
              <select
                value={config.style}
                onChange={(e) => setConfig((prev) => ({ ...prev, style: e.target.value }))}
                style={{
                  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-3)",
                  borderRadius: 10, padding: 8, color: "var(--ink-1)", fontSize: 13, outline: 0, marginBottom: 8
                }}
              >
                {STYLES.map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
              <textarea
                value={config.styleDescription || ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, styleDescription: e.target.value }))}
                placeholder="Décris le style souhaité (ex: néon violet sombre, vintage années 80, épuré nordique...)"
                rows={2}
                style={{
                  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-3)",
                  borderRadius: 10, padding: 8, color: "var(--ink-0)", fontSize: 12, outline: 0, resize: "none"
                }}
              />
            </div>

            {/* G. Objectif de l'affiche */}
            <div>
              <h3 style={{ fontSize: 12.5, fontWeight: 650, color: "var(--ink-1)", marginBottom: 8, letterSpacing: "0.02em" }}>OBJECTIF DE L'AFFICHE</h3>
              <select
                value={config.objective}
                onChange={(e) => setConfig((prev) => ({ ...prev, objective: e.target.value }))}
                style={{
                  width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-3)",
                  borderRadius: 10, padding: 8, color: "var(--ink-1)", fontSize: 13, outline: 0
                }}
              >
                {OBJECTIVES.map((obj) => (
                  <option key={obj} value={obj}>{obj}</option>
                ))}
              </select>
            </div>

          </div>

          {/* H. Action button at bottom */}
          <div style={{ padding: 16, borderTop: "1px solid var(--line-2)", background: "var(--bg-2)" }}>
            <Button
              onClick={applyToChatContext}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "linear-gradient(180deg, var(--acc-bright), var(--acc-deep))",
                color: "var(--acc-ink)"
              }}
            >
              <Icon name="wand" size={15} /> Appliquer au chat IA
            </Button>
          </div>
        </aside>

        {/* ─── FRAME 2 — CENTER CONVERSATIONAL CHAT ─── */}
        <section
          style={{
            flex: 1,
            display: activeTab === "chat" ? "flex" : "none",
            flexDirection: "column",
            minWidth: 0,
            height: "100%",
            background: "var(--bg-0)",
          }}
          className="frame-center-panel max-md:!w-full"
        >
          {/* Scrollable messages box */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: showWelcome ? 0 : "24px 16px" }}>
            {showWelcome ? (
              <EmptyConversationState onPrompt={(val) => { setPrompt(val) }} />
            ) : (
              // Inner wrapper ensuring messages exact alignment
              <div style={{ maxWidth: 820, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
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
                        onChoiceClick={handleSend}
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

          {/* Saisie text block wrapper - EXACT ALIGNMENT with messages */}
          <div style={{ padding: "0 16px 24px", flexShrink: 0, background: "var(--bg-0)" }}>
            <div style={{ maxWidth: 820, width: "100%", margin: "0 auto" }}>
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
        </section>

        {/* ─── FRAME 3 — RIGHT VISUALIZER PANEL ─── */}
        <aside
          style={{
            width: "25%",
            borderLeft: "1px solid var(--line-2)",
            background: "var(--bg-1)",
            display: rightOpen ? "flex" : "none",
            flexDirection: "column",
            minWidth: 280,
            zIndex: 10
          }}
          className="frame-right-panel max-md:!w-full max-md:!min-w-0"
        >
          <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Header */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Icon name="image" size={16} style={{ color: "var(--acc-bright)" }} />
                <h2 className="display" style={{ fontSize: 16, margin: 0, color: "var(--ink-0)" }}>Aperçu du visuel</h2>
              </div>
              <p style={{ fontSize: 11.5, color: "var(--ink-3)", margin: 0 }}>Visualisez vos créations générées en temps réel.</p>
            </div>

            {/* A. Large Preview Area */}
            {activeVisual ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  onClick={() => setZoomOpen(true)}
                  style={{
                    position: "relative", width: "100%",
                    borderRadius: 12, overflow: "hidden", cursor: "zoom-in",
                    border: "1px solid var(--line-2)", background: "var(--bg-0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "var(--sh-2)"
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
                      style={{
                        padding: "8px 10px", fontSize: 12, borderRadius: 8,
                        background: "var(--bg-3)", border: "1px solid var(--line-3)",
                        color: "var(--ink-1)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center"
                      }}
                    >
                      <Icon name="wand" size={12} /> Variantes
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <button
                      onClick={requestImprovement}
                      style={{
                        padding: "8px 10px", fontSize: 12, borderRadius: 8,
                        background: "var(--acc-soft)", border: "1px solid var(--acc-line)",
                        color: "var(--acc-bright)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center"
                      }}
                    >
                      <Icon name="sparkles" size={12} /> Améliorer
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
                        {["PNG (Standard)", "JPG (Compacter)", "PDF (Impression)", "WebP (Ultra léger)", "Impression HD Pro"].map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => {
                              setActiveExportFormat(null)
                              triggerToast(`Exportation lancée au format ${fmt}`)
                              downloadActiveVisual()
                            }}
                            style={{
                              padding: "6px 10px", fontSize: 11, border: 0, borderRadius: 6,
                              background: "transparent", color: "var(--ink-1)", cursor: "pointer",
                              textAlign: "left"
                            }}
                            className="hover:!bg-bg-3 hover:!color-ink-0"
                          >
                            ✓ {fmt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", border: "1px dashed var(--line-3)", borderRadius: 12,
                padding: 24, textAlign: "center", minHeight: 280, color: "var(--ink-3)"
              }}>
                <Icon name="image" size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
                <div style={{ fontSize: 13, fontWeight: 650, color: "var(--ink-2)" }}>Aucun visuel généré</div>
                <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.4 }}>
                  Les créations apparaîtront ici dès que l'IA aura produit des variantes.
                </p>
              </div>
            )}

            {/* B. Miniatures gallery at bottom */}
            {visuals.length > 0 && (
              <div>
                <h3 style={{ fontSize: 11.5, fontWeight: 650, color: "var(--ink-2)", marginBottom: 8, letterSpacing: "0.02em" }}>GALERIE DE VARIANTES</h3>
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
              </div>
            )}

          </div>
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
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
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
      `}</style>
    </div>
  )
}
