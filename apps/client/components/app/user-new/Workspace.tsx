"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { useChatStore, type Message } from "@/store/chat-store"
import {
  fetchGeneratedPosters,
  generateFinalPrompt,
  generateImages,
  uploadProjectFile,
} from "@/lib/projects"
import { ApiError } from "@/lib/api"
import { fetchChatOpening } from "@/lib/chat"
import type { GeneratedPoster } from "@/types/project"
import { ConsiliumPrismLogo } from "@/components/brand/ConsiliumPrismLogo"
import { WorkspaceAssetPanel } from "./WorkspaceAssetPanel"

/**
 * Cloudinary URL helper: rewrites a Cloudinary `/upload/` URL so the browser
 * downloads instead of opening inline. Falls back to the original URL when
 * the host isn't a Cloudinary `res.cloudinary.com` URL.
 */
function downloadVariantUrl(url: string, transform = "fl_attachment"): string {
  if (!url.includes("res.cloudinary.com")) return url
  return url.replace("/upload/", `/upload/${transform}/`)
}

async function triggerDownload(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" })
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    // Falls back to opening the URL in a new tab, browser will choose to render
    // or download depending on Content-Disposition / mime.
    window.open(url, "_blank", "noopener,noreferrer")
  }
}

/** Compute a wrap-around grid starting position for a poster, in canvas px. */
function gridPosition(index: number, cols = 3, tile = 200, gap = 16) {
  const col = index % cols
  const row = Math.floor(index / cols)
  return { x: col * (tile + gap), y: row * (Math.round(tile * 4 / 3) + gap) }
}

/* ── Tiny icons ── */
const Ico = {
  palette: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a10 10 0 1 1 10-10 4 4 0 0 1-4 4h-1.5a2.5 2.5 0 0 0-2 4 2.5 2.5 0 0 1-2.5 2Z" />
    </svg>
  ),
  bell: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  file: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
    </svg>
  ),
  arrowUp: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  refresh: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" />
    </svg>
  ),
  paperclip: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 12-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" />
    </svg>
  ),
  clipboard: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  ),
  imagePlus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" />
    </svg>
  ),
  code: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  ),
  figma: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.5 2A2.5 2.5 0 0 0 6 4.5 2.5 2.5 0 0 0 8.5 7H11V2H8.5Zm0 5A2.5 2.5 0 0 0 6 9.5a2.5 2.5 0 0 0 2.5 2.5H11V7H8.5Zm5-5v5H16a2.5 2.5 0 0 0 0-5h-2.5Zm0 5a2.5 2.5 0 0 0 0 5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 13.5 7Zm-5 5A2.5 2.5 0 0 0 6 14.5 2.5 2.5 0 0 0 8.5 17a2.5 2.5 0 0 0 2.5-2.5V12H8.5Zm0 5A2.5 2.5 0 0 0 6 19.5 2.5 2.5 0 0 0 8.5 22 2.5 2.5 0 0 0 11 19.5V17H8.5Z" />
    </svg>
  ),
  send: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="m3 11 18-8-8 18-2-8z" /></svg>
  ),
  upload: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" />
    </svg>
  ),
  x: () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
}

function parseChoices(content: string): { text: string; choices: string[] } {
  const lines = content.split("\n")
  const choices: string[] = []
  const filtered: string[] = []
  for (const line of lines) {
    const m = line.trim().match(/^(?:[-*\d.]+\s*)?\[(.*?)\]$/)
    if (m) {
      const c = m[1].trim()
      if (c) choices.push(c)
    } else {
      filtered.push(line)
    }
  }
  return { text: filtered.join("\n").trim(), choices }
}

const VISUAL_TYPE_LABELS: Record<string, string> = {
  flyer: "Flyer",
  poster: "Poster",
  social_post: "Social post",
  story: "Story Instagram / Reel",
  business_card: "Business card",
  banner: "Web banner",
  menu: "Restaurant menu",
}

const FORMAT_SHAPES: Record<string, { name: string; hint: string }> = {
  "3:4": { name: "Portrait — 3:4", hint: "Flyer · Poster · A4" },
  "1:1": { name: "Square — 1:1", hint: "Instagram · Facebook" },
  "9:16": { name: "Story — 9:16", hint: "Story · Reels · TikTok" },
  "16:9": { name: "Banner — 16:9", hint: "YouTube · Web banner" },
  "4:3": { name: "Landscape — 4:3", hint: "Presentation · Ad" },
}

type WorkspaceVisualSource = {
  title?: string | null
  posterType?: string | null
  category?: string | null
  format?: string | null
  style?: string | null
  project?: { title?: string | null; brandDescription?: string | null } | null
}

type WorkspaceVisualConfig = Record<string, unknown> & {
  creationType?: string
  posterType?: string
  posterTypeLabel?: string
  format?: string
  formatLabel?: string
  formatHint?: string
  workspaceSidebar?: Record<string, unknown>
}

function titleizeSlug(slug: string) {
  return slug
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function buildWorkspaceVisualConfig(travail: WorkspaceVisualSource | null): WorkspaceVisualConfig {
  const posterType = travail?.posterType?.trim() || undefined
  const format = travail?.format?.trim() || undefined
  const formatShape = format ? FORMAT_SHAPES[format] : undefined
  const posterTypeLabel = posterType
    ? VISUAL_TYPE_LABELS[posterType] ?? titleizeSlug(posterType)
    : undefined

  return {
    ...(travail?.title ? { travailTitle: travail.title } : {}),
    ...(travail?.project?.title ? { projectTitle: travail.project.title } : {}),
    ...(travail?.project?.brandDescription ? { brandDescription: travail.project.brandDescription } : {}),
    ...(posterType ? { creationType: posterType, posterType } : {}),
    ...(posterTypeLabel ? { posterTypeLabel } : {}),
    ...(format ? { format } : {}),
    ...(formatShape ? { formatLabel: formatShape.name, formatHint: formatShape.hint } : {}),
    ...(travail?.category ? { category: travail.category } : {}),
    ...(travail?.style ? { style: travail.style } : {}),
    workspaceSidebar: {
      ...(posterType ? { posterType } : {}),
      ...(posterTypeLabel ? { posterTypeLabel } : {}),
      ...(format ? { format } : {}),
      ...(formatShape ? { formatLabel: formatShape.name, formatHint: formatShape.hint } : {}),
    },
  }
}

export function UserNewWorkspace({ travailId }: { travailId: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const {
    activeTravail,
    error,
    isSending,
    loadTravail,
    sendMessage,
    injectAssistantMessage,
  } = useChatStore()

  const [prompt, setPrompt] = useState("")
  const [loadingConv, setLoadingConv] = useState(true)
  const [posters, setPosters] = useState<GeneratedPoster[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  // Canvas bounding box for draggable posters — used as dragConstraints so each
  // generated visual can be moved freely but stays inside the workspace area.
  const canvasRef = useRef<HTMLDivElement>(null)
  const [assetRefreshKey, setAssetRefreshKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingUsageTypeRef = useRef<string>("REFERENCE_IMAGE")
  const openingFetchedRef = useRef<string | null>(null)
  const visualTravailTitle = activeTravail?.title
  const visualPosterType = activeTravail?.posterType
  const visualCategory = activeTravail?.category
  const visualFormat = activeTravail?.format
  const visualStyle = activeTravail?.style
  const visualProjectTitle = activeTravail?.project?.title
  const visualBrandDescription = activeTravail?.project?.brandDescription
  const workspaceVisualConfig = useMemo(
    () => buildWorkspaceVisualConfig({
      title: visualTravailTitle,
      posterType: visualPosterType,
      category: visualCategory,
      format: visualFormat,
      style: visualStyle,
      project: {
        title: visualProjectTitle,
        brandDescription: visualBrandDescription,
      },
    }),
    [
      visualTravailTitle,
      visualPosterType,
      visualCategory,
      visualFormat,
      visualStyle,
      visualProjectTitle,
      visualBrandDescription,
    ],
  )

  // Load travail on mount
  useEffect(() => {
    let cancelled = false
    setLoadingConv(true)
    void loadTravail(travailId, user?.id ?? "").then((status) => {
      if (cancelled) return
      setLoadingConv(false)
      if (status === "not-found" || status === "error") {
        router.push("/dashboard")
      }
    })
    return () => { cancelled = true }
  }, [travailId, user?.id, loadTravail, router])

  // Fetch initial opening message if no messages yet
  useEffect(() => {
    if (!activeTravail || activeTravail.id !== travailId) return
    if (openingFetchedRef.current === travailId) return
    if ((activeTravail.messages?.length ?? 0) > 0) return
    openingFetchedRef.current = travailId
    void fetchChatOpening(travailId, workspaceVisualConfig)
      .then((opening) => {
        if (opening?.message) {
          const msg: Message = {
            id: opening.message.id,
            role: "assistant",
            content: opening.message.content,
            createdAt: opening.message.createdAt,
          }
          injectAssistantMessage(msg, {
            travailId,
            projectId: opening.projectId,
            title: activeTravail.title,
          })
        }
      })
      .catch(() => {})
  }, [activeTravail, travailId, injectAssistantMessage, workspaceVisualConfig])

  // Sync generated posters
  useEffect(() => {
    if (!travailId) return
    void fetchGeneratedPosters(travailId).then((list) => {
      if (Array.isArray(list)) setPosters(list)
    }).catch(() => {})
  }, [travailId, isGenerating])

  const messages = (activeTravail?.messages ?? []).filter((m) => m.role !== "system")
  const projectId = activeTravail?.projectId
  const title = activeTravail?.title || "New project"
  const sidebarBriefItems = [
    {
      label: "Visual type",
      value: workspaceVisualConfig.posterTypeLabel || "To define",
      detail: workspaceVisualConfig.posterType || "The provider will ask if needed",
    },
    {
      label: "Poster shape",
      value: workspaceVisualConfig.formatLabel || "To define",
      detail: workspaceVisualConfig.formatHint || workspaceVisualConfig.format || "No format selected",
    },
  ]
  const sidebarBriefPanel = (
    <div className="csl-ctx-list" style={{ marginBottom: messages.length === 0 ? 22 : 14 }}>
      {sidebarBriefItems.map((item) => (
        <div key={item.label} className="csl-ctx-card" style={{ cursor: "default" }}>
          <span
            className="csl-ctx-icon"
            style={{ background: "rgba(139,92,246,0.16)", color: "#8B5CF6" }}
          >
            <Ico.file />
          </span>
          <span style={{ minWidth: 0 }}>
            <span className="csl-ctx-label" style={{ display: "block" }}>{item.label}</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--csl-ink-0)", marginTop: 2 }}>
              {item.value}
            </span>
            <span style={{ display: "block", fontSize: 10.5, color: "var(--csl-ink-2)", marginTop: 1 }}>
              {item.detail}
            </span>
          </span>
        </div>
      ))}
    </div>
  )

  async function handleSend(content = prompt) {
    const clean = content.trim()
    if (!clean || !user?.id || isSending) return
    setPrompt("")

    const isVisualTrigger = /g[eé]r[eé]r.*visuel|g[eé]n[eé]r[eé]r.*visuel|generate.*visual|create.*visual/i.test(clean)
    await sendMessage(clean, user.id, travailId, workspaceVisualConfig)

    if (isVisualTrigger) {
      void triggerGeneration()
    }
  }

  async function triggerGeneration() {
    if (isGenerating) return
    setIsGenerating(true)
    setGenError(null)

    // Retry transient 503/502/504 (DB cold start, provider overload) with
    // exponential backoff because orchestration can take several minutes.
    const isTransient = (e: unknown) =>
      e instanceof ApiError && (e.status === 503 || e.status === 502 || e.status === 504)
    const retry = async <T,>(fn: () => Promise<T>, label: string): Promise<T> => {
      const delays = [2_000, 5_000, 12_000]
      let lastErr: unknown
      for (let i = 0; i <= delays.length; i++) {
        try {
          return await fn()
        } catch (err) {
          lastErr = err
          if (!isTransient(err) || i === delays.length) throw err
          console.warn(`[gen] ${label} retry ${i + 1}/${delays.length} after`, (err as ApiError).status)
          await new Promise((r) => setTimeout(r, delays[i]))
        }
      }
      throw lastErr
    }

    try {
      const result = await retry(() => generateFinalPrompt(travailId, { force: true }), 'generateFinalPrompt')
      if (!result?.data?.ready_for_generation) {
        setGenError("The prompt is not ready yet. Continue the chat to clarify the brief.")
        return
      }
      await retry(() => generateImages(travailId, { variations: 3 }), 'generateImages')
      const fresh = await retry(() => fetchGeneratedPosters(travailId), 'fetchGeneratedPosters')
      if (Array.isArray(fresh)) setPosters(fresh)
    } catch (err) {
      console.error("[user-new workspace] generation failed", err)
      const msg =
        isTransient(err)
          ? "Service temporarily unavailable (database or image provider). Try again in a moment."
          : err instanceof Error ? err.message : "Generation unavailable."
      setGenError(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  function openFilePicker(usageType: string) {
    pendingUsageTypeRef.current = usageType
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !projectId) return
    e.target.value = ""
    const usage = pendingUsageTypeRef.current
    let uploaded = false
    for (const file of Array.from(files)) {
      try {
        await uploadProjectFile(projectId, file, usage)
        uploaded = true
      } catch (err) {
        console.error("[user-new workspace] upload failed", err)
      }
    }
    if (uploaded) setAssetRefreshKey((key) => key + 1)
  }

  function handleChoiceClick(choice: string) {
    void handleSend(choice)
  }

  const userInitials = (user?.fullName ?? "AD")
    .split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()

  return (
    <div className="csl-app-workspace">
      {/* TOP BAR */}
      <header className="csl-ws-top">
        <div className="csl-ws-brand">
          <ConsiliumPrismLogo size={26} className="csl-ws-brand-logo" />
          <span className="csl-ws-title">{title}</span>
          <button
            type="button"
            style={{ marginLeft: "auto", background: "transparent", border: 0, color: "var(--csl-ink-2)", cursor: "pointer", padding: 4 }}
            aria-label="Notifications"
          >
            <Ico.bell />
          </button>
        </div>

        <div className="csl-ws-tabbar">
          <div className="csl-ws-tab">
            <Ico.file />
            Design files
          </div>
        </div>

        <div className="csl-ws-actions">
          <button className="csl-ws-share">Share</button>
          <div className="csl-ws-avatar">{userInitials}</div>
        </div>
      </header>

      {/* BODY */}
      <div className="csl-ws-body">
        {/* LEFT PANEL */}
        <aside className="csl-ws-left">
          <div className="csl-ws-left-top">
            {messages.length === 0 ? (
              <>
                <h1 className="csl-ws-h1">Start with context</h1>
                <p className="csl-ws-h1-sub">
                  Describe your project below and upload key assets in the canvas panel.
                </p>
                {sidebarBriefPanel}
              </>
            ) : (
              <>
                {sidebarBriefPanel}
                <div className="csl-msgs">
                  {messages.map((m) => {
                    if (m.role === "user") {
                      return (
                        <div key={m.id} className="csl-msg user">
                          {m.content}
                        </div>
                      )
                    }
                    const { text, choices } = parseChoices(m.content)
                    return (
                      <div key={m.id} className="csl-msg assistant">
                        <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
                        {choices.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                            {choices.map((c, k) => (
                              <button
                                key={k}
                                type="button"
                                className="csl-ws-chip"
                                onClick={() => handleChoiceClick(c)}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {isSending && (
                    <div className="csl-msg assistant" style={{ padding: "16px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="anim-dot-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--csl-ink-2)", display: "inline-block", animationDelay: `${i * 0.18}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="csl-error" style={{ width: "100%", maxWidth: 360, marginTop: 16, marginLeft: 0, marginRight: 0 }}>
                {error}
              </div>
            )}
          </div>

          {/* CHAT INPUT */}
          <div className="csl-ws-chatbox">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              placeholder="Describe what you want to create..."
              className="csl-ws-chat-textarea"
              disabled={loadingConv || isSending}
            />
            <div className="csl-ws-chat-foot">
              <div className="csl-ws-chat-tools">
                <button
                  type="button"
                  className="csl-icon-btn"
                  onClick={() => openFilePicker("REFERENCE_IMAGE")}
                  aria-label="Attach a file"
                >
                  <Ico.paperclip />
                </button>
              </div>
              <button
                type="button"
                className="csl-ws-send"
                onClick={() => void handleSend()}
                disabled={!prompt.trim() || isSending || loadingConv}
              >
                <Ico.send />
                Send
              </button>
            </div>
          </div>
        </aside>

        {/* CANVAS */}
        <section className="csl-canvas">
          <div className="csl-canvas-tools">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button type="button" className="csl-icon-btn" aria-label="Previous">
                <Ico.arrowUp />
              </button>
              <button type="button" className="csl-icon-btn" aria-label="Reload">
                <Ico.refresh />
              </button>
              <span style={{ color: "var(--csl-ink-0)", marginLeft: 4 }}>{title}</span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <button
                type="button"
                onClick={() => void triggerGeneration()}
                disabled={isGenerating || isSending}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "transparent", border: 0, color: "var(--csl-ink-1)",
                  cursor: isGenerating ? "not-allowed" : "pointer",
                  fontFamily: "inherit", fontSize: 12.5,
                  opacity: isGenerating ? .5 : 1,
                }}
              >
                <Ico.paperclip />
                {isGenerating ? "Generating..." : "Generate visual"}
              </button>
            </div>
          </div>

          <div className="csl-canvas-area" ref={canvasRef}>
            {posters.length === 0 ? (
              <div className="csl-canvas-empty">
                {isGenerating && (
                  <ConsiliumPrismLogo size={58} className="csl-generation-logo" />
                )}
                <div className="csl-canvas-empty-title">
                  {isGenerating ? "Generating..." : "Your creations will appear here"}
                </div>
              </div>
            ) : (
              <div className="csl-posters">
                {posters.map((p, i) => {
                  const pos = gridPosition(i)
                  const safeName = `consilium-variant-${p.variationNumber || i + 1}`
                  return (
                    <motion.div
                      key={p.id}
                      className="csl-poster"
                      style={{ left: pos.x, top: pos.y }}
                      drag
                      dragConstraints={canvasRef}
                      dragElastic={0}
                      dragMomentum={false}
                      whileDrag={{ scale: 1.03, zIndex: 50, cursor: "grabbing" }}
                      whileHover={{ zIndex: 20 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.imageUrl}
                        alt={`Variante ${p.variationNumber}`}
                        draggable={false}
                      />

                      {/* Download menu — appears on hover, click bubbles disabled so
                          the drag handler doesn't fight with the buttons. */}
                      <div
                        className="csl-poster-actions"
                        onPointerDownCapture={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="csl-poster-action"
                          title="Download HD (original)"
                          onClick={() =>
                            triggerDownload(downloadVariantUrl(p.imageUrl), `${safeName}-hd.png`)
                          }
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>HD</span>
                        </button>
                        <button
                          type="button"
                          className="csl-poster-action"
                          title="Download web (1280px, optimised)"
                          onClick={() =>
                            triggerDownload(
                              downloadVariantUrl(p.imageUrl, "fl_attachment,q_auto:eco,w_1280"),
                              `${safeName}-web.jpg`,
                            )
                          }
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>Web</span>
                        </button>
                        <button
                          type="button"
                          className="csl-poster-action"
                          title="Copy image URL"
                          onClick={() => {
                            void navigator.clipboard.writeText(p.imageUrl)
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
                {isGenerating && Array.from({ length: 3 }).map((_, i) => {
                  const pos = gridPosition(posters.length + i)
                  return (
                    <div
                      key={`loading-${i}`}
                      className="csl-poster csl-poster-loading"
                      style={{ left: pos.x, top: pos.y }}
                    >
                      <ConsiliumPrismLogo size={34} className="csl-poster-loading-logo" />
                      <span>Generating...</span>
                    </div>
                  )
                })}
              </div>
            )}

            {genError && (
              <div
                className="csl-error"
                style={{ position: "absolute", left: 24, right: 24, top: 24, margin: 0 }}
              >
                {genError}
              </div>
            )}
          </div>

          <WorkspaceAssetPanel projectId={projectId} refreshKey={assetRefreshKey} />
        </section>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  )
}
