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
      onClick={!isEditing ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      style={{
        display: "flex",
        alignItems: "center",
        padding: indent ? "8px 10px 8px 34px" : "8px 10px",
        borderRadius: 8,
        cursor: isEditing ? "default" : "pointer",
        background: active || menuOpen ? "rgba(255,255,255,0.08)" : hovered ? "rgba(255,255,255,0.04)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.7)",
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        gap: 12,
        minHeight: 36,
        transition: "background 100ms ease, color 100ms ease",
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
                  <Icon name="edit" size={13} /> Renommer
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
                    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
                      onDelete();
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", width: "100%", background: "transparent", border: 0, color: "#f87171", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon name="trash" size={13} /> Supprimer
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
  const { history, fetchHistory, clearActive, renameConversation, archiveConversation, deleteConversation } = useChatStore()

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      void loadProjects()
      void fetchHistory(user.id)
    }
  }, [isAuthenticated, user?.id, loadProjects, fetchHistory])

  // Dictionnaire pour gérer l'ouverture de chaque dossier de projet
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }))
  }

  const handleNewConversation = () => {
    clearActive()
    router.push("/dashboard")
    if (mobile && onClose) onClose()
  }

  const handleConversationClick = (id: string) => {
    router.push(`/dashboard/c/${id}`)
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
    background: "#131314",
    color: "#fff",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
    overflow: "hidden",
    position: mobile ? "relative" : "sticky",
    top: 0,
    alignSelf: "start",
  }

  // Filtrage des conversations
  const standaloneConversations = history.filter(c => !c.projectId)

  return (
    <aside style={asideStyle}>
      <style>{`
        .sb-scroll::-webkit-scrollbar { width: 4px; }
        .sb-scroll::-webkit-scrollbar-track { background: transparent; }
        .sb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .sb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>

      {/* Header */}
      <div style={{ padding: "12px", display: "flex", alignItems: "center", gap: 12 }}>
        {onToggle && !mobile && (
          <button
            onClick={onToggle}
            style={{
              background: "transparent",
              border: 0,
              color: "#fff",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
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
              padding: "8px",
              borderRadius: "50%",
              display: "flex",
              transition: "background 150ms ease",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Icon name="x" size={18} />
          </button>
        )}
        <button
          onClick={handleNewConversation}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 20,
            padding: collapsed ? "8px" : "8px 12px",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
            transition: "background 150ms ease",
            justifyContent: collapsed ? "center" : "flex-start"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <Icon name="plus" size={16} />
          {!collapsed && "New Conversation"}
        </button>
      </div>

      {/* Scrollable Nav Area */}
      <div className="sb-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 12px" }}>
        {!collapsed && (
          <>
            <NavItem icon="history" label="Conversation History" onClick={() => router.push("/dashboard")} />
            <NavItem icon="clock" label="Scheduled Tasks" onClick={() => router.push("/dashboard")} />

            {/* Projects Group */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span style={{ flex: 1 }}>Projects</span>
                <Icon name="filter" size={14} style={{ cursor: "pointer", marginRight: 12 }} />
                <Icon name="folderPlus" size={14} style={{ cursor: "pointer" }} onClick={() => router.push("/dashboard/projects")} />
              </div>

              {projects.map((project) => {
                // Par défaut ouvert sauf si expressément fermé dans l'état
                const isExpanded = expandedProjects[project.id] !== false
                const projectConversations = history.filter((c) => c.projectId === project.id)

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
                      <Icon name="folder" size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
                      <span style={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} onClick={(e) => { e.stopPropagation(); handleProjectClick(project.id); }}>
                        {project.title}
                      </span>
                    </div>
                    
                    {isExpanded && projectConversations.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {projectConversations.map((conv) => (
                          <NavItem
                            key={conv.id}
                            label={conv.title}
                            rightText={formatTimeAgo(conv.updatedAt || conv.lastMessageAt || conv.createdAt)}
                            rightIcon={conv.status === "ACTIVE" ? "arrowUpRight" : undefined}
                            active={pathname === `/dashboard/c/${conv.id}`}
                            indent
                            onClick={() => handleConversationClick(conv.id)}
                            onRename={(newLabel) => {
                              if (user?.id) renameConversation(conv.id, newLabel, user.id)
                            }}
                            onArchive={() => {
                              if (user?.id) archiveConversation(conv.id, user.id)
                            }}
                            onDelete={() => {
                              if (user?.id) deleteConversation(conv.id, user.id)
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Conversations Group */}
            {standaloneConversations.length > 0 && (
              <div style={{ marginTop: 24, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <span style={{ flex: 1 }}>Conversations</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {standaloneConversations.map((conv) => (
                    <NavItem
                      key={conv.id}
                      label={conv.title}
                      rightText={formatTimeAgo(conv.updatedAt || conv.lastMessageAt || conv.createdAt)}
                      active={pathname === `/dashboard/c/${conv.id}`}
                      onClick={() => handleConversationClick(conv.id)}
                      onRename={(newLabel) => {
                        if (user?.id) renameConversation(conv.id, newLabel, user.id)
                      }}
                      onArchive={() => {
                        if (user?.id) archiveConversation(conv.id, user.id)
                      }}
                      onDelete={() => {
                        if (user?.id) deleteConversation(conv.id, user.id)
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
        <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <NavItem icon="settings" label="Settings" onClick={() => router.push("/dashboard/settings")} />
        </div>
      )}
    </aside>
  )
}
