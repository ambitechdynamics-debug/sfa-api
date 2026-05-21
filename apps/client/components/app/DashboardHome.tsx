"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { EmptyState, PromptChip } from "@/components/app/dashboard-ui"
import { useProjectStore } from "@/store/project-store"
import { useAuthStore } from "@/store/auth-store"
import type { Project, ProjectStatus } from "@/types/project"

const SHORTCUTS = [
  { id: "flyer",    label: "Flyer",           icon: "flyer",   badge: "Populaire", type: "FLYER" },
  { id: "post",     label: "Post social",     icon: "message", badge: "Populaire", type: "SOCIAL_POST" },
  { id: "affiche",  label: "Affiche",         icon: "layers",  badge: null,        type: "POSTER" },
  { id: "banniere", label: "Bannière",        icon: "layout",  badge: "IA",        type: "BANNER" },
  { id: "carte",    label: "Carte de visite", icon: "user",    badge: null,        type: "BUSINESS_CARD" },
  { id: "menu",     label: "Menu",            icon: "list",    badge: "Nouveau",   type: "MENU" },
  { id: "story",    label: "Story",           icon: "image",   badge: null,        type: "STORY" },
  { id: "ecom",     label: "E-commerce",      icon: "zap",     badge: "IA",        type: "ECOMMERCE" },
  { id: "doc",      label: "Document",        icon: "type",    badge: null,        type: "DOCUMENT" },
  { id: "import",   label: "Importer",        icon: "upload",  badge: null,        type: null },
  { id: "custom",   label: "Personnalisé",    icon: "settings",badge: null,        type: "CUSTOM" },
  { id: "more",     label: "Plus",            icon: "grid",    badge: null,        type: null },
]

const QUICK_SUGGESTIONS = [
  "Flyer promotion vêtements",
  "Affiche soirée",
  "Post Instagram restaurant",
  "Bannière boutique en ligne",
]

const PROJECT_GRADIENTS: Record<string, string> = {
  FLYER:         "linear-gradient(135deg, #2a1a08, #4a2e10)",
  SOCIAL_POST:   "linear-gradient(135deg, #0a1a2a, #1a3a4a)",
  POSTER:        "linear-gradient(135deg, #1a0a2a, #3a1a4a)",
  BANNER:        "linear-gradient(135deg, #0a2a1a, #1a4a2a)",
  STORY:         "linear-gradient(135deg, #2a0a1a, #4a1a2a)",
  BUSINESS_CARD: "linear-gradient(135deg, #1a1a0a, #3a3a1a)",
  MENU:          "linear-gradient(135deg, #0a1a1a, #1a3a3a)",
  ECOMMERCE:     "linear-gradient(135deg, #2a1a00, #4a3000)",
  default:       "linear-gradient(135deg, #141414, #1f1f1f)",
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; color: string; border: string }> = {
  DRAFT:            { label: "Brouillon", bg: "rgba(40,40,40,0.8)",  color: "rgba(160,160,160,1)", border: "rgba(100,100,100,0.4)" },
  QUESTIONING:      { label: "Dialogue",  bg: "rgba(60,40,0,0.8)",   color: "rgba(210,170,80,1)",  border: "rgba(180,130,40,0.4)" },
  ANALYZING:        { label: "Analyse",   bg: "rgba(60,40,0,0.8)",   color: "rgba(210,170,80,1)",  border: "rgba(180,130,40,0.4)" },
  READY_FOR_PROMPT: { label: "Prêt",      bg: "rgba(60,40,0,0.8)",   color: "rgba(210,170,80,1)",  border: "rgba(180,130,40,0.4)" },
  PROMPT_READY:     { label: "Prêt",      bg: "rgba(60,40,0,0.8)",   color: "rgba(210,170,80,1)",  border: "rgba(180,130,40,0.4)" },
  GENERATING:       { label: "En cours",  bg: "rgba(50,30,0,0.8)",   color: "rgba(230,160,60,1)",  border: "rgba(200,120,40,0.4)" },
  GENERATED:        { label: "Terminé",   bg: "rgba(10,45,20,0.8)",  color: "rgba(80,200,110,1)",  border: "rgba(50,160,80,0.4)" },
  FAILED:           { label: "Erreur",    bg: "rgba(50,10,10,0.8)",  color: "rgba(230,90,90,1)",   border: "rgba(180,50,50,0.4)" },
}

function getTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `il y a ${diffMins} min`
  if (diffHours < 24) return `il y a ${diffHours}h`
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `il y a ${diffDays} j`
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function getProjectIcon(posterType?: string | null) {
  return SHORTCUTS.find((s) => s.type === posterType)?.icon ?? "image"
}

function ProjectCard({ project, onOpen, onRename, onDelete }: {
  project: Project
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const gradient = PROJECT_GRADIENTS[project.posterType ?? "default"] ?? PROJECT_GRADIENTS.default
  const statusCfg = STATUS_CONFIG[project.status]

  return (
    <div
      onClick={onOpen}
      style={{
        borderRadius: 12,
        background: "var(--bg-2)",
        border: "1px solid var(--line-1)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = "translateY(-2px)"
        el.style.boxShadow = "0 8px 28px rgba(0,0,0,0.35)"
        el.style.borderColor = "rgba(139,90,43,0.35)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = ""
        el.style.boxShadow = ""
        el.style.borderColor = "var(--line-1)"
      }}
    >
      <div style={{ height: 130, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Icon name={getProjectIcon(project.posterType)} size={32} style={{ opacity: 0.3, color: "rgba(255,255,255,0.7)" }} />
        <div style={{
          position: "absolute", top: 8, left: 8,
          padding: "3px 8px", borderRadius: 99,
          background: statusCfg.bg, color: statusCfg.color,
          border: `1px solid ${statusCfg.border}`,
          fontSize: 11, fontWeight: 600, backdropFilter: "blur(4px)",
        }}>
          {statusCfg.label}
        </div>
        <div style={{ position: "absolute", top: 7, right: 7 }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.8)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon name="more" size={14} />
          </button>
          {menuOpen && (
            <div style={{
              position: "absolute", top: 32, right: 0,
              background: "rgba(18,10,3,0.97)",
              border: "1px solid rgba(139,90,43,0.35)",
              borderRadius: 10,
              boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
              zIndex: 20, minWidth: 140, overflow: "hidden",
              backdropFilter: "blur(8px)",
            }}>
              {([
                { icon: "edit",  label: "Renommer", action: onRename },
                { icon: "copy",  label: "Dupliquer", action: () => {} },
                { icon: "trash", label: "Supprimer", action: onDelete, danger: true as const },
              ] as const).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => { setMenuOpen(false); item.action() }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 14px", width: "100%",
                    background: "transparent",
                    border: 0, color: ("danger" in item) ? "rgba(230,90,90,1)" : "var(--ink-1)",
                    fontSize: 13, cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,90,43,0.12)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                >
                  <Icon name={item.icon} size={13} />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "10px 12px 11px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-0)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {project.title}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 3 }}>
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
  const gradient = PROJECT_GRADIENTS[project.posterType ?? "default"] ?? PROJECT_GRADIENTS.default

  return (
    <div
      onClick={onOpen}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "10px 14px",
        borderRadius: 10,
        background: "var(--bg-2)",
        border: "1px solid var(--line-1)",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139,90,43,0.35)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--line-1)" }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 8, background: gradient, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={getProjectIcon(project.posterType)} size={16} style={{ opacity: 0.6, color: "rgba(255,255,255,0.8)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-0)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.title}</div>
        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{getTimeAgo(project.updatedAt)}</div>
      </div>
      <div style={{ padding: "3px 8px", borderRadius: 99, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
        {statusCfg.label}
      </div>
      <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onRename} style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Icon name="edit" size={12} />
        </button>
        <button type="button" onClick={onDelete} style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid var(--line-2)", color: "rgba(210,80,80,0.8)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Icon name="trash" size={12} />
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
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [quickPrompt, setQuickPrompt] = useState("")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const filtered = projects
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((p) => filterType === "all" || p.posterType === filterType)
    .sort((a, b) =>
      sortBy === "name"
        ? a.title.localeCompare(b.title)
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

  function handleShortcut(type: string | null) {
    if (!type) return
    router.push(`/dashboard/chat?type=${type}`)
  }

  function handleGenerate() {
    if (!quickPrompt.trim()) return
    router.push(`/dashboard/chat?q=${encodeURIComponent(quickPrompt.trim())}`)
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
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Rename modal */}
      {renamingId && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setRenamingId(null)}
        >
          <div
            style={{ background: "rgba(18,10,3,0.97)", border: "1px solid rgba(139,90,43,0.4)", borderRadius: 14, padding: 24, width: 340 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 15, fontWeight: 650, marginBottom: 14, color: "var(--ink-0)" }}>Renommer le projet</div>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename()
                if (e.key === "Escape") setRenamingId(null)
              }}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(139,90,43,0.4)", background: "rgba(40,20,5,0.6)", color: "var(--ink-0)", fontSize: 14, outline: 0, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
              <Button variant="ghost" size="sm" onClick={() => setRenamingId(null)}>Annuler</Button>
              <Button size="sm" onClick={confirmRename}>Renommer</Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", padding: "32px 28px 100px" }}>

        {/* HERO */}
        <section style={{ padding: "40px 0 32px", background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(80,42,12,0.22) 0%, transparent 70%)", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, color: "var(--acc-bright)", opacity: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
            Studio Flyer AI
          </div>
          <h1 className="display" style={{ fontSize: "clamp(24px, 4vw, 44px)", fontWeight: 750, lineHeight: 1.1, marginBottom: 12, color: "var(--ink-0)" }}>
            {greeting} — que voulez-vous{" "}
            <span style={{ background: "linear-gradient(90deg, rgba(224,138,60,1), rgba(180,100,30,1))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              créer aujourd'hui ?
            </span>
          </h1>
          <p style={{ color: "var(--ink-3)", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
            Flyers, affiches, posts, bannières — générés par IA en quelques secondes.
          </p>
        </section>

        {/* SEARCH */}
        <div style={{ position: "relative", maxWidth: 620, margin: "0 auto 36px" }}>
          <Icon
            name="search"
            size={16}
            style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", pointerEvents: "none" }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans vos projets et créations..."
            style={{
              width: "100%",
              padding: "12px 40px 12px 42px",
              borderRadius: 12,
              border: searchQuery ? "1.5px solid rgba(139,90,43,0.5)" : "1px solid var(--line-2)",
              background: "var(--bg-2)",
              color: "var(--ink-0)",
              fontSize: 14, outline: 0,
              boxShadow: searchQuery ? "0 0 0 3px rgba(139,90,43,0.12)" : "var(--sh-1)",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              boxSizing: "border-box",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, color: "var(--ink-3)", cursor: "pointer", padding: 4, display: "flex" }}
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* SHORTCUTS */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {SHORTCUTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleShortcut(s.type)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "12px 14px", borderRadius: 12, minWidth: 72, flexShrink: 0,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  color: "var(--ink-1)",
                  cursor: "pointer",
                  transition: "background 0.15s ease, border-color 0.15s ease, transform 0.1s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = "rgba(80,42,12,0.48)"
                  el.style.borderColor = "rgba(139,90,43,0.45)"
                  el.style.transform = "translateY(-1px)"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = "var(--bg-2)"
                  el.style.borderColor = "var(--line-2)"
                  el.style.transform = ""
                }}
              >
                <span style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(80,42,12,0.25)", border: "1px solid rgba(139,90,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc-bright)" }}>
                  <Icon name={s.icon} size={15} />
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{s.label}</span>
                {s.badge && (
                  <span style={{
                    position: "absolute", top: -5, right: -5,
                    padding: "1px 6px", borderRadius: 99,
                    fontSize: 9, fontWeight: 700,
                    background: s.badge === "Populaire" ? "rgba(200,120,40,0.25)" : s.badge === "Nouveau" ? "rgba(50,100,200,0.25)" : "rgba(80,160,80,0.25)",
                    color: s.badge === "Populaire" ? "rgba(230,150,60,1)" : s.badge === "Nouveau" ? "rgba(100,150,250,1)" : "rgba(80,220,100,1)",
                    border: `1px solid ${s.badge === "Populaire" ? "rgba(200,120,40,0.35)" : s.badge === "Nouveau" ? "rgba(50,100,200,0.35)" : "rgba(50,180,80,0.35)"}`,
                  }}>
                    {s.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* AI QUICK CREATE */}
        <div style={{
          padding: 22, borderRadius: 16,
          background: "rgba(80,42,12,0.13)",
          border: "1px solid rgba(139,90,43,0.22)",
          marginBottom: 42,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(139,90,43,0.2)", border: "1px solid rgba(139,90,43,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc-bright)", flexShrink: 0 }}>
              <Icon name="sparkles" size={13} />
            </span>
            <div style={{ fontSize: 14, fontWeight: 650, color: "var(--ink-0)" }}>Créer avec l'IA</div>
          </div>
          <textarea
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate() } }}
            placeholder="Décrivez le visuel que vous voulez créer…"
            rows={2}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: quickPrompt ? "1.5px solid rgba(139,90,43,0.5)" : "1px solid rgba(139,90,43,0.2)",
              background: "rgba(18,8,2,0.6)",
              color: "var(--ink-0)", fontSize: 14, lineHeight: 1.5,
              outline: 0, resize: "none", fontFamily: "var(--font-sans)",
              transition: "border-color 0.2s ease",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {QUICK_SUGGESTIONS.map((s) => (
              <PromptChip key={s} onClick={() => setQuickPrompt(s)}>{s}</PromptChip>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <Button onClick={handleGenerate} disabled={!quickPrompt.trim()} icon="sparkles">
              Générer un visuel
            </Button>
          </div>
        </div>

        {/* RÉCENTS HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-0)", margin: 0 }}>
            {searchQuery ? `Résultats pour "${searchQuery}"` : "Récents"}
            {!isLoading && (
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-3)", marginLeft: 8 }}>{filtered.length}</span>
            )}
          </h2>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                height: 32, padding: "0 10px", borderRadius: 8,
                border: "1px solid var(--line-2)",
                background: "var(--bg-2)", color: "var(--ink-1)",
                fontSize: 12, cursor: "pointer", outline: 0,
              }}
            >
              <option value="all">Tout type</option>
              <option value="FLYER">Flyer</option>
              <option value="SOCIAL_POST">Post social</option>
              <option value="POSTER">Affiche</option>
              <option value="BANNER">Bannière</option>
              <option value="BUSINESS_CARD">Carte de visite</option>
              <option value="MENU">Menu</option>
              <option value="STORY">Story</option>
            </select>
            <button
              type="button"
              onClick={() => setSortBy((v) => (v === "recent" ? "name" : "recent"))}
              style={{
                height: 32, padding: "0 10px", borderRadius: 8,
                border: "1px solid var(--line-2)",
                background: "var(--bg-2)", color: "var(--ink-1)",
                fontSize: 12, display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
              }}
            >
              <Icon name="calendar" size={12} />
              {sortBy === "recent" ? "Récent" : "Nom"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: "1px solid var(--line-2)",
                background: "var(--bg-2)", color: "var(--ink-1)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <Icon name={viewMode === "grid" ? "list" : "grid"} size={14} />
            </button>
          </div>
        </div>

        {/* PROJECT GRID / LIST / SKELETON / EMPTY */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="anim-shimmer" style={{ borderRadius: 12, height: 200 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="sparkles"
            title={searchQuery ? "Aucun résultat" : "Aucune création récente"}
            body={
              searchQuery
                ? `Aucun projet ne correspond à "${searchQuery}".`
                : "Commencez par décrire votre besoin ou choisissez un format de création."
            }
            action={
              !searchQuery ? (
                <Button onClick={() => router.push("/dashboard/chat")}>Créer mon premier visuel</Button>
              ) : undefined
            }
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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

      {/* FAB */}
      <button
        type="button"
        onClick={() => router.push("/dashboard/chat")}
        aria-label="Nouveau visuel"
        style={{
          position: "fixed", bottom: 28, right: 28,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(200,120,50,0.92), rgba(160,90,30,0.8))",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 32px rgba(180,90,30,0.42)",
          color: "rgba(255,255,255,0.95)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 50,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.transform = "scale(1.08)"
          el.style.boxShadow = "0 12px 40px rgba(180,90,30,0.55)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.transform = ""
          el.style.boxShadow = "0 8px 32px rgba(180,90,30,0.42)"
        }}
      >
        <Icon name="plus" size={22} />
      </button>
    </div>
  )
}
