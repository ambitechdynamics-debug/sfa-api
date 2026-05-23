"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/app/dashboard-ui"
import { useProjectStore } from "@/store/project-store"
import { useAuthStore } from "@/store/auth-store"
import { createProject, uploadProjectFile, upsertProjectMemory } from "@/lib/projects"
import type { Project, ProjectStatus } from "@/types/project"

import { useCreationOptionsStore } from "@/store/creation-options-store"
import { useChatStore } from "@/store/chat-store"

// ─── Home asset zone (horizontal) ───────────────────────────────────────────
// Permet à l'utilisateur d'attacher logo / produit / inspiration / affiche /
// personnage AVANT même de taper son brief. Le projet est créé paresseusement
// à la 1ère upload, et le projectId est passé à sendMessage pour que le chat
// opening + l'orchestrateur voient les fichiers et puissent poser des
// questions adaptées (chat multimodal côté API depuis le dernier deploy).
type HomeAssetType = "logo" | "product" | "reference" | "poster" | "character" | "other"
interface HomeAsset {
  id: string
  name: string
  type: HomeAssetType
  url: string
  status: "uploading" | "success" | "error"
}
const HOME_ASSET_LABELS: Record<HomeAssetType, string> = {
  logo: "Logo",
  product: "Produit",
  reference: "Inspiration",
  poster: "Affiche",
  character: "Personnage",
  other: "Autre",
}
const HOME_USAGE_MAP: Record<HomeAssetType, string> = {
  logo: "LOGO",
  product: "PRODUCT_IMAGE",
  reference: "REFERENCE_IMAGE",
  poster: "GENERATED_POSTER",
  character: "PERSON_IMAGE",
  other: "OTHER",
}
const HOME_ASSET_TYPES: HomeAssetType[] = ["logo", "product", "reference", "poster", "character", "other"]

// Fallback legacy icons si besoin
const FALLBACK_ICONS: Record<string, string> = {
  flyer: "flyer",
  social_post: "message",
  poster: "layers",
  banner: "layout",
  business_card: "user",
  menu: "list",
  story: "image",
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; color: string; border: string }> = {
  DRAFT:            { label: "Brouillon", bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.1)" },
  QUESTIONING:      { label: "Dialogue",  bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)", border: "rgba(255,255,255,0.2)" },
  ANALYZING:        { label: "Analyse",   bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)", border: "rgba(255,255,255,0.2)" },
  READY_FOR_PROMPT: { label: "Prêt",      bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)", border: "rgba(255,255,255,0.2)" },
  PROMPT_READY:     { label: "Prêt",      bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)", border: "rgba(255,255,255,0.2)" },
  GENERATING:       { label: "En cours",  bg: "rgba(255,255,255,0.1)",  color: "#fff", border: "rgba(255,255,255,0.3)" },
  GENERATED:        { label: "Terminé",   bg: "rgba(255,255,255,0.15)", color: "#fff", border: "rgba(255,255,255,0.4)" },
  FAILED:           { label: "Erreur",    bg: "rgba(255,50,50,0.1)",    color: "rgba(255,100,100,0.9)", border: "rgba(255,50,50,0.2)" },
}

function getTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `${diffMins} m`
  if (diffHours < 24) return `${diffHours} h`
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `${diffDays} j`
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function getProjectIcon(posterType?: string | null) {
  if (!posterType) return "image"
  const icon = FALLBACK_ICONS[posterType.toLowerCase()]
  return icon || "image"
}

function ProjectCard({ project, onOpen, onRename, onDelete }: {
  project: Project
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const statusCfg = STATUS_CONFIG[project.status]

  return (
    <div
      onClick={onOpen}
      onMouseEnter={(e) => {
        setHovered(true)
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)"
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)"
        e.currentTarget.style.background = "rgba(255,255,255,0.035)"
      }}
      onMouseLeave={(e) => {
        setHovered(false)
        setMenuOpen(false)
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"
        e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)"
        e.currentTarget.style.background = "rgba(255,255,255,0.02)"
      }}
      style={{
        borderRadius: 16,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
        position: "relative",
      }}
    >
      <div style={{ height: 120, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Icon name={getProjectIcon(project.posterType)} size={28} style={{ opacity: 0.4, color: "#fff" }} />
        
        {/* Status indicator */}
        <div style={{
          position: "absolute", top: 8, left: 8,
          padding: "2px 8px", borderRadius: 12,
          background: statusCfg.bg, color: statusCfg.color,
          border: `1px solid ${statusCfg.border}`,
          fontSize: 10, fontWeight: 500, backdropFilter: "blur(4px)",
        }}>
          {statusCfg.label}
        </div>

        {/* Context Menu Button */}
        <div style={{ position: "absolute", top: 6, right: 6, opacity: hovered || menuOpen ? 1 : 0, transition: "opacity 0.2s ease" }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: menuOpen ? "rgba(255,255,255,0.1)" : "transparent",
              border: 0, color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "background 0.15s ease"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => { if(!menuOpen) e.currentTarget.style.background = "transparent" }}
          >
            <Icon name="more" size={14} />
          </button>
          
          {menuOpen && (
            <div style={{
              position: "absolute", top: 30, right: 0,
              background: "#1e1f22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)", zIndex: 20, minWidth: 130, overflow: "hidden",
            }}>
              {([
                { icon: "edit",  label: "Renommer", action: onRename },
                { icon: "trash", label: "Supprimer", action: () => {
                  if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
                    onDelete();
                  }
                }, danger: true as const },
              ] as const).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => { setMenuOpen(false); item.action() }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", width: "100%", background: "transparent", border: 0,
                    color: ("danger" in item) ? "#f87171" : "#fff",
                    fontSize: 13, cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name={item.icon} size={13} />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {project.title}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
          {getTimeAgo(project.updatedAt)}
        </div>
      </div>
    </div>
  )
}

function ProjectListRow({ project, onOpen, onRename, onDelete }: {
  project: Project
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const statusCfg = STATUS_CONFIG[project.status]
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "10px 14px", borderRadius: 10,
        background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.08)" : "transparent"}`,
        cursor: "pointer", transition: "all 0.15s ease",
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.05)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={getProjectIcon(project.posterType)} size={16} style={{ opacity: 0.6, color: "#fff" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.title}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{getTimeAgo(project.updatedAt)}</div>
      </div>
      <div style={{ padding: "2px 8px", borderRadius: 12, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, fontSize: 10, fontWeight: 500, flexShrink: 0 }}>
        {statusCfg.label}
      </div>
      <div style={{ display: "flex", gap: 4, opacity: hovered ? 1 : 0, transition: "opacity 0.15s ease" }} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onRename} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: 0, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Icon name="edit" size={13} />
        </button>
        <button type="button" onClick={onDelete} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: 0, color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <Icon name="trash" size={13} />
        </button>
      </div>
    </div>
  )
}

export function DashboardHome() {
  const router = useRouter()
  const { projects, isLoading, loadProjects, renameProject, removeProject } = useProjectStore()
  const { user } = useAuthStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [promptInput, setPromptInput] = useState("")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const { options, isLoading: isLoadingOptions, fetchOptions } = useCreationOptionsStore()
  const { sendMessage, isSending, error } = useChatStore()

  // ─── Asset zone (horizontale) ──────────────────────────────────────────
  const [homeAssets, setHomeAssets] = useState<HomeAsset[]>([])
  const [activeHomeAssetType, setActiveHomeAssetType] = useState<HomeAssetType>("logo")
  const [lazyProjectId, setLazyProjectId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /** Crée (si besoin) un projet brouillon pour rattacher les fichiers uploadés. */
  async function ensureLazyProject(): Promise<string | null> {
    if (lazyProjectId) return lazyProjectId
    try {
      const draftTitle = promptInput.trim().slice(0, 60) || "Brouillon"
      const project = await createProject({ title: draftTitle })
      const id = (project as { id?: string })?.id ?? null
      if (id) setLazyProjectId(id)
      return id
    } catch (err) {
      console.error("[home] createProject failed", err)
      return null
    }
  }

  async function processHomeFiles(files: File[], type: HomeAssetType) {
    if (files.length === 0) return
    const projectId = await ensureLazyProject()
    if (!projectId) return

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) continue
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!["jpg", "jpeg", "png", "webp", "svg"].includes(ext || "")) continue

      const tempId = `home-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const objectUrl = URL.createObjectURL(file)
      setHomeAssets((prev) => [...prev, { id: tempId, name: file.name, type, url: objectUrl, status: "uploading" }])

      try {
        const result = await uploadProjectFile(projectId, file, HOME_USAGE_MAP[type] ?? "OTHER")
        setHomeAssets((prev) => prev.map((a) => (a.id === tempId ? { ...a, url: result.fileUrl, status: "success" } : a)))
      } catch (err) {
        console.error("[home] upload failed", err)
        setHomeAssets((prev) => prev.map((a) => (a.id === tempId ? { ...a, status: "error" } : a)))
      }
    }

    // Met à jour la mémoire M-ASSETS pour que l'orchestrateur la voie
    setHomeAssets((prev) => {
      const success = prev.filter((a) => a.status === "success" && !a.url.startsWith("blob:"))
      if (success.length > 0) {
        upsertProjectMemory(projectId, "M-ASSETS", {
          assets: success.map((a) => ({ type: a.type, url: a.url, name: a.name })),
          updatedAt: new Date().toISOString(),
        }).catch(() => {})
      }
      return prev
    })
  }

  function removeHomeAsset(id: string) {
    setHomeAssets((prev) => prev.filter((a) => a.id !== id))
  }

  useEffect(() => {
    loadProjects()
    fetchOptions()
  }, [loadProjects, fetchOptions])

  // Garde défensif : projects/options/title peuvent être undefined transitoirement
  // (boot du store, réponse API malformée) — éviter "Cannot read .length on undefined".
  const safeProjects = Array.isArray(projects) ? projects : []
  const filtered = safeProjects
    .filter((p) => (p?.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((p) => filterType === "all" || p?.posterType === filterType)
    .sort((a, b) => new Date(b?.updatedAt ?? 0).getTime() - new Date(a?.updatedAt ?? 0).getTime())

  async function handleGenerate() {
    if (!promptInput.trim() || !user?.id || isSending) return
    // On crée TOUJOURS le projet avant le premier message, même sans
    // fichiers attachés. Sans projectId, la conversation est créée orpheline
    // et toute la chaîne orchestrateur / image-gen est désactivée.
    const projectId = await ensureLazyProject()
    const successAssets = homeAssets
      .filter((a) => a.status === "success" && !a.url.startsWith("blob:"))
      .map((a) => ({ type: a.type, url: a.url, name: a.name }))
    const visualConfig = successAssets.length > 0 ? { assets: successAssets } : undefined
    const conversationId = await sendMessage(promptInput.trim(), user.id, projectId ?? undefined, visualConfig)
    if (conversationId) {
      router.push(`/dashboard/c/${conversationId}`)
    }
  }

  function handleShortcut(type: string) {
    router.push(`/dashboard/chat?type=${type}`)
  }

  function startRename(project: Project) {
    setRenamingId(project.id)
    setRenameValue(project.title)
  }

  async function confirmRename() {
    if (renamingId && renameValue.trim()) {
      await renameProject(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  const greeting = user?.fullName ? `Bonjour, ${user.fullName.split(" ")[0]}` : "Bonjour"

  return (
    <div style={{ flex: 1, height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", background: "#0a0a0c", color: "#fff" }}>
      {/* Rename modal */}
      {renamingId && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setRenamingId(null)}
        >
          <div
            style={{ background: "#1e1f22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 24, width: 340 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: "#fff" }}>Renommer le projet</div>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename()
                if (e.key === "Escape") setRenamingId(null)
              }}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 14, outline: 0, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
              <Button variant="ghost" size="sm" onClick={() => setRenamingId(null)}>Annuler</Button>
              <Button size="sm" onClick={confirmRename}>Renommer</Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 860, width: "100%", margin: "0 auto", padding: "0 24px 100px", display: "flex", flexDirection: "column", flex: 1 }}>
        
        {/* TOP SECTION: Greeting & Creation Prompt (Centered vertically) */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          textAlign: "center",
          minHeight: "50vh",
          paddingTop: "2vh",
          paddingBottom: "4vh",
        }}>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 500, marginBottom: 32, color: "#fff" }}>
            <span style={{ background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.6))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {greeting}
            </span>
          </h1>

          {/* Unified Prompt Input with Integrated Attachments */}
          <div 
            style={{ 
              position: "relative", 
              width: "100%", 
              maxWidth: 680,
              background: dragOver ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${dragOver ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 24, 
              padding: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              transition: "border-color 0.2s ease, background 0.2s ease",
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false)
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processHomeFiles(Array.from(e.dataTransfer.files), activeHomeAssetType)
              }
            }}
          >
            {/* Attached Assets Row */}
            {homeAssets.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 8px" }}>
                {homeAssets.map((a) => (
                  <div
                    key={a.id}
                    title={`${HOME_ASSET_LABELS[a.type]} — ${a.name}`}
                    style={{
                      position: "relative", width: 56, height: 56, borderRadius: 12, overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.1)", background: "#1a1a1d",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{
                      position: "absolute", bottom: 2, left: 2,
                      padding: "1px 4px", borderRadius: 4,
                      background: "rgba(0,0,0,0.7)", color: "#fff",
                      fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>{HOME_ASSET_LABELS[a.type].slice(0, 4)}</span>
                    {a.status === "uploading" && (
                      <div style={{
                        position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <div className="anim-spin" style={{ width: 14, height: 14, borderRadius: 999, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                      </div>
                    )}
                    {a.status === "error" && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(255,50,50,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10 }}>!</div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeHomeAsset(a.id)}
                      title="Retirer"
                      style={{
                        position: "absolute", top: 2, right: 2,
                        width: 16, height: 16, borderRadius: "50%",
                        background: "rgba(0,0,0,0.7)", color: "#fff",
                        border: 0, cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 10, padding: 0,
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
              <div style={{ position: "relative" }}>
                {/* Asset Add Button (Paperclip) */}
                <button
                  type="button"
                  onClick={() => {
                    const menu = document.getElementById("asset-menu")
                    if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none"
                  }}
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)", border: 0,
                    color: "rgba(255,255,255,0.7)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                  title="Joindre un fichier"
                >
                  <Icon name="plus" size={18} />
                </button>
                
                {/* Asset Menu Popover */}
                <div 
                  id="asset-menu"
                  style={{
                    display: "none", position: "absolute", bottom: "100%", left: 0, marginBottom: 8,
                    background: "#1e1f22", border: "1px solid rgba(255,255,255,0.1)", 
                    borderRadius: 12, padding: 8, width: 180, zIndex: 10,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
                  }}
                >
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, padding: "0 6px", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Type de fichier</div>
                  {HOME_ASSET_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setActiveHomeAssetType(t)
                        document.getElementById("asset-menu")!.style.display = "none"
                        fileInputRef.current?.click()
                      }}
                      style={{
                        display: "flex", alignItems: "center", width: "100%",
                        padding: "8px 10px", borderRadius: 8, border: 0,
                        background: "transparent", color: "#fff", fontSize: 13,
                        textAlign: "left", cursor: "pointer",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      {HOME_ASSET_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                style={{ display: "none" }}
                onChange={(e) => {
                  const files = e.target.files
                  if (files && files.length > 0) {
                    processHomeFiles(Array.from(files), activeHomeAssetType)
                    e.target.value = ""
                  }
                }}
              />

              <input
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleGenerate() }}
                placeholder="Décrivez ce que vous souhaitez créer..."
                style={{
                  flex: 1, background: "transparent", border: 0,
                  color: "#fff", fontSize: 16, outline: 0,
                  fontFamily: "inherit",
                }}
              />

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!promptInput.trim() || isSending}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: promptInput.trim() ? "#fff" : "rgba(255,255,255,0.06)",
                  color: promptInput.trim() ? "#000" : "rgba(255,255,255,0.2)",
                  border: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: promptInput.trim() && !isSending ? "pointer" : "default",
                  transition: "all 0.2s ease",
                  transform: promptInput.trim() && !isSending ? "scale(1)" : "scale(0.95)",
                  opacity: isSending ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (promptInput.trim() && !isSending) e.currentTarget.style.transform = "scale(1.05)" }}
                onMouseLeave={(e) => { if (promptInput.trim() && !isSending) e.currentTarget.style.transform = "scale(1)" }}
              >
                {isSending ? (
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000",
                    animation: "spin 1s linear infinite"
                  }} />
                ) : (
                  <Icon name="arrowUp" size={16} />
                )}
              </button>
            </div>
            
            {error && (
              <div style={{ color: "#ff4a4a", fontSize: 13, textAlign: "center", padding: "4px 0" }}>
                <Icon name="warn" size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                {error}
              </div>
            )}
          </div>

          {/* Shortcut Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 24, maxWidth: 700 }}>
            {isLoadingOptions ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="anim-skeleton" style={{ width: 100, height: 32, borderRadius: 100, background: "rgba(255,255,255,0.03)" }} />
              ))
            ) : (options?.length ?? 0) > 0 ? (
              (options ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleShortcut(s.slug)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 100,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <Icon name={s.icon} size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                  {s.name}
                </button>
              ))
            ) : null}
          </div>
        </div>

        {/* BOTTOM SECTION: Recent Projects */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: "#fff", margin: 0 }}>Projets récents</h2>
            
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <Icon name="search" size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  style={{
                    width: 140, height: 32, padding: "0 10px 0 30px", borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                    color: "#fff", fontSize: 13, outline: 0,
                  }}
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  height: 32, padding: "0 10px", borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#0a0a0c", color: "rgba(255,255,255,0.8)",
                  fontSize: 13, cursor: "pointer", outline: 0,
                }}
              >
                <option value="all">Tout</option>
                {(options ?? []).map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent", color: "rgba(255,255,255,0.8)",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                <Icon name={viewMode === "grid" ? "list" : "grid"} size={14} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="anim-shimmer" style={{ borderRadius: 12, height: 175, background: "rgba(255,255,255,0.03)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="folder"
              title={searchQuery ? "Aucun projet trouvé" : "Aucun projet récent"}
              body={searchQuery ? "Modifiez votre recherche." : "Vos créations apparaîtront ici."}
            />
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {filtered.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={() => router.push(`/dashboard/projects/${p.id}`)}
                  onRename={() => startRename(p)}
                  onDelete={() => removeProject(p.id)}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {filtered.map((p) => (
                <ProjectListRow
                  key={p.id}
                  project={p}
                  onOpen={() => router.push(`/dashboard/projects/${p.id}`)}
                  onRename={() => startRename(p)}
                  onDelete={() => removeProject(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
