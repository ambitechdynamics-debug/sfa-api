"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type CSSProperties } from "react"
import { Icon } from "@/components/ui/Icon"
import { useAuth } from "@/hooks/useAuth"
import { useProjectStore } from "@/store/project-store"
import { useChatStore } from "@/store/chat-store"

interface SidebarProps {
  collapsed?: boolean
  mobile?: boolean
  onClose?: () => void
  onToggle?: () => void
}

function formatTimeAgo(dateString?: string) {
  if (!dateString) return ""
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return "now"
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "now"
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}

function NavItem({
  icon,
  label,
  rightText,
  rightIcon,
  active,
  indent,
  onClick,
  onRename,
  onArchive,
  onDelete,
}: {
  icon?: string
  label: string
  rightText?: string
  rightIcon?: string
  active?: boolean
  indent?: boolean
  onClick?: () => void
  onRename?: (newLabel: string) => void
  onArchive?: () => void
  onDelete?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(label)
  
  const handleRenameSubmit = () => {
    if (editValue.trim() && editValue !== label && onRename) {
      onRename(editValue.trim())
    }
    setIsEditing(false)
  }

  return (
    <div
      className="sidebar-btn-metallic"
      onClick={!isEditing ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      style={{
        display: "flex",
        alignItems: "center",
        padding: indent ? "8px 10px 8px 34px" : "8px 10px",
        cursor: isEditing ? "default" : "pointer",
        color: active ? "#fff" : "rgba(255,255,255,0.7)",
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        gap: 12,
        minHeight: 36,
        marginBottom: 6,
        position: "relative",
      }}
    >
      {icon && <Icon name={icon} size={16} style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />}
      
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit()
            if (e.key === "Escape") { setIsEditing(false); setEditValue(label); }
          }}
          onBlur={handleRenameSubmit}
          onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 13, outline: "none", padding: "2px 6px", borderRadius: 4, minWidth: 0 }}
        />
      ) : (
        <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </span>
      )}
      
      {!isEditing && rightIcon && !menuOpen && !hovered && <Icon name={rightIcon} size={14} style={{ color: "rgba(255,255,255,0.4)" }} />}
      {!isEditing && rightText && !menuOpen && !hovered && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{rightText}</span>}

      {!isEditing && (onRename || onArchive || onDelete) && (hovered || menuOpen) && (
        <div style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: menuOpen ? "rgba(255,255,255,0.15)" : "transparent",
              border: 0,
              color: "#fff",
              cursor: "pointer",
              padding: "4px",
              borderRadius: 4,
              display: "flex",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            onMouseLeave={e => { if(!menuOpen) e.currentTarget.style.background = "transparent" }}
          >
            <Icon name="more" size={14} />
          </button>
          
          {menuOpen && (
            <div style={{
              position: "absolute",
              right: 0,
              top: 24,
              background: "#1e1f22",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              zIndex: 50,
              minWidth: 140,
              overflow: "hidden",
            }}>
              {onRename && (
                <button
                  onClick={() => { setMenuOpen(false); setIsEditing(true); setEditValue(label); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", width: "100%", background: "transparent", border: 0, color: "#fff", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name="edit" size={13} /> Rename
                </button>
              )}
              {onArchive && (
                <button
                  onClick={() => { setMenuOpen(false); onArchive(); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", width: "100%", background: "transparent", border: 0, color: "#fff", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name="archive" size={13} /> Archiver
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { 
                    setMenuOpen(false);
                    if (window.confirm("Are you sure you want to delete this conversation?")) {
                      onDelete();
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", width: "100%", background: "transparent", border: 0, color: "#f87171", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name="trash" size={13} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ collapsed = false, mobile = false, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { projects, loadProjects } = useProjectStore()
  const { travaux, fetchHistory, clearActive, renameTravail, deleteTravail } = useChatStore()

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      void loadProjects()
      void fetchHistory(user.id)
    }
  }, [isAuthenticated, user?.id, loadProjects, fetchHistory])

  // Dictionnaire pour gérer l'ouverture de chaque dossier de projet
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }))
  }

  const handleNewProject = () => {
    clearActive()
    router.push("/dashboard")
    if (mobile && onClose) onClose()
  }

  const handleTravailClick = (id: string) => {
    router.push(`/dashboard/t/${id}`)
    if (mobile && onClose) onClose()
  }

  const handleProjectClick = (id: string) => {
    router.push(`/dashboard/projects/${id}`)
    if (mobile && onClose) onClose()
  }

  const asideStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: collapsed ? 60 : 260,
    height: "100vh",
    background: "#1a2127",
    color: "#fff",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
    overflow: "hidden",
    position: mobile ? "relative" : "sticky",
    top: 0,
    alignSelf: "start",
  }

  // Garde défensif sur travaux/projects (peuvent être undefined transitoirement)
  const safeTravaux = Array.isArray(travaux) ? travaux : []
  const safeProjects = Array.isArray(projects) ? projects : []
  // Source de vérité : travaux nested du Project (chargés via /api/projects),
  // complétés par les travaux flat du chat-store (chargés via /api/travaux).
  // Cas où un projectId apparaît dans les travaux mais pas dans projects =
  // race au montage : on les liste sous "Sans projet" en attendant.
  const projectsById = new Map(safeProjects.map((p) => [p.id, p]))
  const orphanTravaux = safeTravaux.filter((t) => !projectsById.has(t.projectId))

  return (
    <aside style={asideStyle}>
      <style>{`
        .sb-scroll::-webkit-scrollbar { width: 4px; }
        .sb-scroll::-webkit-scrollbar-track { background: transparent; }
        .sb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .sb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        @keyframes slideUpSettings {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Line 1: Logo + Dépliant */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 24 }}>
          {(!collapsed) && (
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", display: "flex", alignItems: "center", gap: 8, paddingLeft: 4 }}>
              <img src="/logo.png" alt="Studio Flyer AI Logo" style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 4 }} />
              Studio Flyer AI
            </div>
          )}
          
          <div style={{ display: "flex", gap: 8, marginLeft: collapsed ? "auto" : 0, marginRight: collapsed ? "auto" : 0 }}>
            {onToggle && !mobile && (
              <button
                onClick={onToggle}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#fff",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <Icon name="layoutSidebar" size={18} />
              </button>
            )}
            {mobile && onClose && (
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#fff",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Line 2: New Project (marque) button */}
        <button
          className="sidebar-btn-metallic"
          onClick={handleNewProject}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: collapsed ? "8px" : "8px 12px",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
            justifyContent: collapsed ? "center" : "flex-start",
            width: "100%",
            marginBottom: 16
          }}
        >
          <Icon name="plus" size={16} />
          {!collapsed && "Nouveau projet"}
        </button>
      </div>

      {/* Scrollable Nav Area */}
      <div className="sb-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 12px" }}>
        {!collapsed && (
          <>
            {/* Projects Group */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span style={{ flex: 1 }}>Projects</span>
                <Icon name="filter" size={14} style={{ cursor: "pointer" }} />
              </div>

              {safeProjects.map((project) => {
                // Par défaut ouvert sauf si expressément fermé dans l'état
                const isExpanded = expandedProjects[project.id] !== false
                // Privilégie les travaux nested du Project (frais), fallback sur les travaux flat
                const projectTravaux =
                  project.travaux && project.travaux.length > 0
                    ? project.travaux
                    : safeTravaux.filter((t) => t.projectId === project.id)

                return (
                  <div key={project.id}>
                    <div
                      onClick={() => toggleProject(project.id)}
                      style={{
                        display: "flex", alignItems: "center", padding: "8px 10px",
                        cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 13, gap: 8,
                        transition: "color 150ms ease"
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                    >
                      <Icon name={isExpanded ? "chevronDown" : "chevronR"} size={12} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                      <Icon name="folder" size={16} style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} onClick={(e) => { e.stopPropagation(); handleProjectClick(project.id); }}>
                        {project.title}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{projectTravaux.length}</span>
                    </div>

                    {isExpanded && projectTravaux.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {projectTravaux.map((travail) => (
                          <NavItem
                            key={travail.id}
                            label={travail.title}
                            rightText={formatTimeAgo(travail.updatedAt || travail.lastMessageAt || travail.createdAt)}
                            rightIcon={travail.status === "GENERATED" ? "check" : travail.status === "GENERATING" ? "loader" : undefined}
                            active={pathname === `/dashboard/t/${travail.id}`}
                            indent
                            onClick={() => handleTravailClick(travail.id)}
                            onRename={(newLabel) => {
                              if (user?.id) renameTravail(travail.id, newLabel, user.id)
                            }}
                            onDelete={() => {
                              if (user?.id) deleteTravail(travail.id, user.id)
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Travaux orphelins (race au chargement, pas de project parent connu) */}
            {orphanTravaux.length > 0 && (
              <div style={{ marginTop: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <span style={{ flex: 1 }}>Sans projet</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {orphanTravaux.map((travail) => (
                    <NavItem
                      key={travail.id}
                      label={travail.title}
                      rightText={formatTimeAgo(travail.updatedAt || travail.lastMessageAt || travail.createdAt)}
                      active={pathname === `/dashboard/t/${travail.id}`}
                      onClick={() => handleTravailClick(travail.id)}
                      onRename={(newLabel) => {
                        if (user?.id) renameTravail(travail.id, newLabel, user.id)
                      }}
                      onDelete={() => {
                        if (user?.id) deleteTravail(travail.id, user.id)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Section */}
      {!collapsed && (
        <div style={{ padding: "12px", position: "relative", flexShrink: 0 }}>
          {/* Popup Menu */}
          {userMenuOpen && (
            <div style={{
              position: "absolute",
              bottom: "100%",
              left: 12,
              right: 12,
              marginBottom: 8,
              background: "#2b2d31",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "8px 0",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              animation: "slideUpSettings 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            }}>
              {/* Header profile */}
              <div 
                style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                 <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                    {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "AD"}
                 </div>
                 <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{user?.fullName || "Ambitech Dynamics"}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>More</div>
                 </div>
                 <Icon name="chevronR" size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 12px" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", cursor: "pointer", color: "#fff", fontSize: 13, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name="sparkles" size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
                  Upgrade Plan
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", cursor: "pointer", color: "#fff", fontSize: 13, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name="palette" size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
                  Customization
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", cursor: "pointer", color: "#fff", fontSize: 13, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name="user" size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
                  Profile
                </div>
                <div 
                  onClick={() => { router.push("/dashboard/settings"); setUserMenuOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", cursor: "pointer", color: "#fff", fontSize: 13, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name="settings" size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
                  Settings
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 12px" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", cursor: "pointer", color: "#fff", fontSize: 13, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name="lifebuoy" size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
                  <span style={{ flex: 1 }}>Help</span>
                  <Icon name="chevronR" size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", cursor: "pointer", color: "#fff", fontSize: 13, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name="logout" size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
                  Log out
                </div>
              </div>
            </div>
          )}

          {/* Trigger Button */}
          <button
            className="sidebar-btn-metallic"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
               display: "flex", alignItems: "center", gap: 12,
               width: "100%", padding: "8px 12px",
               border: 0, cursor: "pointer"
            }}
          >
             <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : "AD"}
             </div>
             <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                   {user?.fullName || "Ambitech Dynamics"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>More</div>
             </div>
             <Icon name="grid" size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        </div>
      )}
    </aside>
  )
}
