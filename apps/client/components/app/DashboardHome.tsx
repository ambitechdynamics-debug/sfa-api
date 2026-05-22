"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/app/dashboard-ui"
import { useProjectStore } from "@/store/project-store"
import { useAuthStore } from "@/store/auth-store"
import type { Project, ProjectStatus } from "@/types/project"

import { useCreationOptionsStore } from "@/store/creation-options-store"

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      style={{
        borderRadius: 12,
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
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

  useEffect(() => {
    loadProjects()
    fetchOptions()
  }, [loadProjects, fetchOptions])

  const filtered = projects
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((p) => filterType === "all" || p.posterType === filterType)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  function handleGenerate() {
    if (!promptInput.trim()) return
    router.push(`/dashboard/chat?q=${encodeURIComponent(promptInput.trim())}`)
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
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", background: "#0a0a0c", color: "#fff" }}>
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

      <div style={{ maxWidth: 860, width: "100%", margin: "0 auto", padding: "48px 24px 100px", display: "flex", flexDirection: "column", gap: 56 }}>
        
        {/* TOP SECTION: Greeting & Creation Prompt */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 500, marginBottom: 32, color: "#fff" }}>
            <span style={{ background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.6))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {greeting}
            </span>
          </h1>

          {/* Unified Prompt Input */}
          <div style={{ position: "relative", width: "100%", maxWidth: 640 }}>
            <div style={{
              display: "flex", alignItems: "center",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 32, padding: "8px 8px 8px 24px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}>
              <Icon name="sparkles" size={18} style={{ color: "rgba(255,255,255,0.4)", marginRight: 16 }} />
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
                disabled={!promptInput.trim()}
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: promptInput.trim() ? "#fff" : "rgba(255,255,255,0.06)",
                  color: promptInput.trim() ? "#000" : "rgba(255,255,255,0.2)",
                  border: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: promptInput.trim() ? "pointer" : "default",
                  transition: "all 0.2s ease",
                  transform: promptInput.trim() ? "scale(1)" : "scale(0.95)",
                }}
                onMouseEnter={(e) => { if (promptInput.trim()) e.currentTarget.style.transform = "scale(1.05)" }}
                onMouseLeave={(e) => { if (promptInput.trim()) e.currentTarget.style.transform = "scale(1)" }}
              >
                <Icon name="arrowUp" size={18} />
              </button>
            </div>
          </div>

          {/* Shortcut Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 24, maxWidth: 700 }}>
            {isLoadingOptions ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="anim-skeleton" style={{ width: 100, height: 32, borderRadius: 100, background: "rgba(255,255,255,0.03)" }} />
              ))
            ) : options.length > 0 ? (
              options.map((s) => (
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
                {options.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
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
