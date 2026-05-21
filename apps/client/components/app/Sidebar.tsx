"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Avatar } from "@/components/ui/Avatar"
import { BrandMark } from "@/components/ui/BrandMark"
import { Icon } from "@/components/ui/Icon"
import { useAuth } from "@/hooks/useAuth"
import { type Conversation, useChatStore } from "@/store/chat-store"
import { useProjectStore } from "@/store/project-store"
import { CreateProjectModal } from "./CreateProjectModal"

interface SidebarProps {
  collapsed?: boolean
  mobile?: boolean
  onClose?: () => void
  onToggle?: () => void
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      padding: "14px 12px 5px",
      fontSize: 10,
      fontWeight: 700,
      color: "rgba(255,255,255,0.28)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    }}>
      {children}
    </div>
  )
}

function NavItem({
  icon,
  label,
  href,
  active,
  collapsed,
  onClick,
  rightAction,
  indent,
}: {
  icon: string
  label: string
  href?: string
  active?: boolean
  collapsed?: boolean
  onClick?: () => void
  rightAction?: ReactNode
  indent?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-start",
    gap: 9,
    minHeight: 34,
    width: "100%",
    padding: collapsed ? "8px 0" : indent ? "6px 10px 6px 28px" : "6px 10px",
    borderRadius: 8,
    border: 0,
    position: "relative",
    background: active
      ? "rgba(80,42,12,0.38)"
      : hovered
      ? "rgba(255,255,255,0.05)"
      : "transparent",
    color: active ? "rgba(255,210,170,1)" : hovered ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.48)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 600 : 450,
    textDecoration: "none",
    transition: "background 160ms ease, color 160ms ease",
    boxShadow: active ? "inset 2px 0 0 rgba(200,120,50,0.75)" : "none",
  }

  const content = (
    <>
      <Icon name={icon} size={15} style={{ flexShrink: 0, opacity: active ? 1 : hovered ? 0.85 : 0.6 }} />
      {!collapsed && (
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
      )}
      {!collapsed && rightAction}
    </>
  )

  if (href) {
    return (
      <Link href={href} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={style} title={collapsed ? label : undefined}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={style} title={collapsed ? label : undefined}>
      {content}
    </button>
  )
}

function SidebarMessage({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: "6px 12px", fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
      {children}
    </div>
  )
}

// ─── Conversation actions menu ─────────────────────────────────────────────────

function ConversationActionsMenu({
  position,
  onArchive,
  onDelete,
  onRename,
}: {
  position: { top: number; left: number }
  onArchive: () => void
  onDelete: () => void
  onRename: () => void
}) {
  const itemStyle: CSSProperties = {
    width: "100%",
    minHeight: 32,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    border: 0,
    borderRadius: 6,
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    textAlign: "left",
    transition: "background 130ms ease, color 130ms ease",
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: position.left,
        top: position.top,
        zIndex: 9999,
        width: 168,
        padding: 5,
        display: "grid",
        gap: 1,
        background: "rgba(18,12,8,0.96)",
        border: "1px solid rgba(139,90,43,0.3)",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
        backdropFilter: "blur(16px)",
      }}
    >
      <button type="button" onClick={onRename} style={itemStyle} className="sb-menu-item">
        <Icon name="edit" size={13} />
        Renommer
      </button>
      <button type="button" onClick={onArchive} style={itemStyle} className="sb-menu-item">
        <Icon name="archive" size={13} />
        Archiver
      </button>
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "2px 0" }} />
      <button type="button" onClick={onDelete} style={{ ...itemStyle, color: "rgba(230,100,100,0.85)" }} className="sb-menu-item-danger">
        <Icon name="trash" size={13} />
        Supprimer
      </button>
    </div>
  )
}

// ─── Conversation item ─────────────────────────────────────────────────────────

function RecentConversationItem({
  active,
  conversation,
  editing,
  menuOpen,
  onArchive,
  onCloseMobile,
  onDelete,
  onMenuToggle,
  onRenameCancel,
  onRenameStart,
  onRenameSubmit,
}: {
  active: boolean
  conversation: Conversation
  editing: boolean
  menuOpen: boolean
  onArchive: () => void
  onCloseMobile: () => void
  onDelete: () => void
  onMenuToggle: () => void
  onRenameCancel: () => void
  onRenameStart: () => void
  onRenameSubmit: (title: string) => void
}) {
  const [draftTitle, setDraftTitle] = useState(conversation.title)
  const [hovered, setHovered] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (editing) setDraftTitle(conversation.title)
  }, [conversation.title, editing])

  useEffect(() => {
    if (!menuOpen) setMenuPosition(null)
  }, [menuOpen])

  function submitRename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const clean = draftTitle.trim()
    if (!clean) return
    onRenameSubmit(clean)
  }

  if (editing) {
    return (
      <form onSubmit={submitRename} style={{ padding: "3px 6px" }}>
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={() => {
            const clean = draftTitle.trim()
            if (!clean || clean === conversation.title) { onRenameCancel(); return }
            onRenameSubmit(clean)
          }}
          onKeyDown={(e) => { if (e.key === "Escape") onRenameCancel() }}
          style={{
            width: "100%",
            height: 30,
            border: "1px solid rgba(139,90,43,0.5)",
            borderRadius: 7,
            background: "rgba(20,10,4,0.8)",
            color: "rgba(255,255,255,0.88)",
            padding: "0 9px",
            fontSize: 12,
            outline: "none",
          }}
        />
      </form>
    )
  }

  return (
    <div
      className={`sb-conv-item ${active ? "active" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="sb-conv-dot" />
      <Link
        href={`/dashboard/c/${conversation.id}`}
        onClick={onCloseMobile}
        className="sb-conv-title"
      >
        {conversation.title}
      </Link>
      <button
        type="button"
        aria-label={`Actions pour ${conversation.title}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (menuOpen) {
            onMenuToggle()
            setMenuPosition(null)
          } else {
            const rect = e.currentTarget.getBoundingClientRect()
            setMenuPosition({ top: rect.bottom + 4, left: rect.right - 168 })
            onMenuToggle()
          }
        }}
        className={`sb-conv-actions ${menuOpen ? "open" : ""}`}
      >
        <Icon name="moreH" size={13} />
      </button>

      {menuOpen && menuPosition && typeof window !== "undefined" && createPortal(
        <ConversationActionsMenu
          position={menuPosition}
          onRename={onRenameStart}
          onArchive={onArchive}
          onDelete={onDelete}
        />,
        document.body
      )}
    </div>
  )
}

// ─── Main Sidebar ──────────────────────────────────────────────────────────────

export function Sidebar({ collapsed = false, mobile = false, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout, user } = useAuth()
  const { error: projectsError, isLoading: projectsLoading, loadProjects, projects } = useProjectStore()
  const { archiveConversation, clearActive, deleteConversation, fetchHistory, history, isLoadingHistory, renameConversation } = useChatStore()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isCreateModalOpen, setCreateModalOpen] = useState(false)
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(true)
  const [conversationMenuId, setConversationMenuId] = useState<string | null>(null)
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    void loadProjects()
    void fetchHistory(user.id)
  }, [fetchHistory, isAuthenticated, loadProjects, user?.id])

  useEffect(() => {
    if (!conversationMenuId) return
    function closeMenu() { setConversationMenuId(null) }
    window.addEventListener("click", closeMenu)
    return () => window.removeEventListener("click", closeMenu)
  }, [conversationMenuId])

  useEffect(() => {
    if (!profileMenuOpen) return
    function closeProfile() { setProfileMenuOpen(false) }
    window.addEventListener("click", closeProfile)
    return () => window.removeEventListener("click", closeProfile)
  }, [profileMenuOpen])

  const recentConversations = history.slice(0, 14)

  function closeMobile() { if (mobile) onClose?.() }

  function handleNewChat() {
    clearActive()
    router.push("/dashboard")
    closeMobile()
  }

  async function handleRenameConversation(id: string, title: string) {
    await renameConversation(id, title, user?.id)
    setRenamingConversationId(null)
    setConversationMenuId(null)
  }

  async function handleArchiveConversation(id: string) {
    await archiveConversation(id, user?.id)
    setConversationMenuId(null)
    if (pathname === `/dashboard/c/${id}`) { clearActive(); router.push("/dashboard") }
  }

  async function handleDeleteConversation(id: string) {
    const confirmed = window.confirm("Supprimer définitivement cette conversation ?")
    if (!confirmed) return
    await deleteConversation(id, user?.id)
    setConversationMenuId(null)
    if (pathname === `/dashboard/c/${id}`) { clearActive(); router.push("/dashboard") }
  }

  const asideStyle: CSSProperties = {
    position: mobile ? "relative" : "sticky",
    top: 0,
    alignSelf: "start",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    width: mobile ? "min(88vw, 300px)" : collapsed ? 60 : 272,
    overflow: "hidden",
    background: "rgba(10,10,12,0.97)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
  }

  return (
    <aside style={asideStyle}>
      <style>{`
        /* ── Conversation items ── */
        .sb-conv-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0 6px 0 10px;
          min-height: 32px;
          border-radius: 7px;
          position: relative;
          color: rgba(255,255,255,0.42);
          cursor: pointer;
          transition: background 140ms ease, color 140ms ease;
        }
        .sb-conv-item:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.78);
        }
        .sb-conv-item.active {
          background: rgba(80,42,12,0.38) !important;
          color: rgba(255,210,170,1) !important;
          box-shadow: inset 2px 0 0 rgba(200,120,50,0.75);
        }
        .sb-conv-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          flex-shrink: 0;
          margin-right: 8px;
          transition: background 140ms ease;
        }
        .sb-conv-item.active .sb-conv-dot {
          background: rgba(200,120,50,0.8);
        }
        .sb-conv-item:hover .sb-conv-dot {
          background: rgba(255,255,255,0.3);
        }
        .sb-conv-title {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-size: 12.5px;
          font-weight: 450;
          color: inherit;
          text-decoration: none;
          padding: 6px 0;
        }
        .sb-conv-actions {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: opacity 140ms ease, background 140ms ease, color 140ms ease;
        }
        .sb-conv-item:hover .sb-conv-actions,
        .sb-conv-actions.open {
          opacity: 1;
        }
        .sb-conv-actions:hover,
        .sb-conv-actions.open {
          background: rgba(255,255,255,0.08) !important;
          color: rgba(255,255,255,0.8) !important;
        }
        @media (hover: none) { .sb-conv-actions { opacity: 1; } }

        /* ── Context menu items ── */
        .sb-menu-item:hover {
          background: rgba(255,255,255,0.07) !important;
          color: rgba(255,255,255,0.88) !important;
        }
        .sb-menu-item-danger:hover {
          background: rgba(180,40,40,0.18) !important;
          color: rgba(250,110,110,1) !important;
        }

        /* ── Scrollbar ── */
        .sb-scroll::-webkit-scrollbar { width: 3px; }
        .sb-scroll::-webkit-scrollbar-track { background: transparent; }
        .sb-scroll::-webkit-scrollbar-thumb { background: rgba(139,90,43,0.2); border-radius: 4px; }
        .sb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(139,90,43,0.4); }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
        gap: 8, padding: collapsed ? "16px 0 12px" : "14px 14px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}>
        <Link href="/dashboard" onClick={handleNewChat} style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, textDecoration: "none" }}>
          <BrandMark size={22} withWordmark={!collapsed} />
        </Link>
        {!collapsed && (
          <div style={{ display: "flex", gap: 4 }}>
            {onToggle && (
              <button type="button" onClick={onToggle} className="max-md:hidden" aria-label="Réduire" style={{
                width: 28, height: 28, borderRadius: 7, border: 0,
                background: "transparent", color: "rgba(255,255,255,0.3)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 140ms ease, color 140ms ease",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.3)" }}
              >
                <Icon name="layoutSidebar" size={16} />
              </button>
            )}
            {mobile && (
              <button type="button" onClick={onClose} aria-label="Fermer" style={{
                width: 28, height: 28, borderRadius: 7, border: 0,
                background: "transparent", color: "rgba(255,255,255,0.3)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── New Visual CTA ── */}
      <div style={{ padding: collapsed ? "10px 8px" : "10px 10px 6px", flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleNewChat}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
            gap: 8,
            height: collapsed ? 36 : 34,
            padding: collapsed ? "0" : "0 12px",
            borderRadius: 9,
            border: "1px solid rgba(200,120,50,0.35)",
            background: "linear-gradient(135deg, rgba(100,55,15,0.55), rgba(70,35,8,0.45))",
            color: "rgba(255,200,140,0.92)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 550,
            letterSpacing: "-0.01em",
            transition: "background 180ms ease, border-color 180ms ease",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(120,65,15,0.7), rgba(85,42,8,0.6))"
            e.currentTarget.style.borderColor = "rgba(200,120,50,0.55)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(100,55,15,0.55), rgba(70,35,8,0.45))"
            e.currentTarget.style.borderColor = "rgba(200,120,50,0.35)"
          }}
          title={collapsed ? "Nouveau visuel" : undefined}
        >
          <Icon name="edit" size={14} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Nouveau visuel</span>}
        </button>
      </div>

      {/* ── Primary nav ── */}
      <div style={{ padding: collapsed ? "4px 8px" : "4px 10px", flexShrink: 0 }}>
        <NavItem
          icon="palette"
          label="Mémoires de marque"
          href="/dashboard/projects"
          active={pathname.startsWith("/dashboard/projects")}
          collapsed={collapsed}
          onClick={closeMobile}
        />

        {/* Projects accordion */}
        {!collapsed && (
          <div style={{ marginTop: 2 }}>
            <button
              type="button"
              onClick={() => setProjectsMenuOpen((v) => !v)}
              aria-expanded={projectsMenuOpen}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                minHeight: 34, width: "100%",
                padding: "6px 10px",
                borderRadius: 8, border: 0,
                background: pathname.startsWith("/dashboard/projects") ? "rgba(80,42,12,0.38)" : "transparent",
                color: pathname.startsWith("/dashboard/projects") ? "rgba(255,210,170,1)" : "rgba(255,255,255,0.48)",
                cursor: "pointer", fontSize: 13, fontWeight: 450, textAlign: "left",
                transition: "background 160ms ease, color 160ms ease",
                boxShadow: pathname.startsWith("/dashboard/projects") ? "inset 2px 0 0 rgba(200,120,50,0.75)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!pathname.startsWith("/dashboard/projects")) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                  e.currentTarget.style.color = "rgba(255,255,255,0.82)"
                }
              }}
              onMouseLeave={(e) => {
                if (!pathname.startsWith("/dashboard/projects")) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "rgba(255,255,255,0.48)"
                }
              }}
            >
              <Icon name="folder" size={15} style={{ flexShrink: 0, opacity: 0.65 }} />
              <span style={{ flex: 1, minWidth: 0 }}>Projets</span>
              <Icon
                name={projectsMenuOpen ? "chevronD" : "chevronR"}
                size={11}
                style={{ color: "rgba(255,255,255,0.25)", transition: "transform 180ms ease", flexShrink: 0 }}
              />
            </button>

            {projectsMenuOpen && (
              <div style={{ display: "grid", gap: 1, paddingLeft: 4, marginTop: 1 }}>
                <NavItem
                  icon="folderPlus"
                  label="Nouveau projet"
                  onClick={() => setCreateModalOpen(true)}
                  indent
                />
                {projectsLoading ? (
                  <SidebarMessage>Chargement...</SidebarMessage>
                ) : projectsError ? (
                  <SidebarMessage>{projectsError}</SidebarMessage>
                ) : projects.length > 0 ? (
                  projects.map((project) => (
                    <NavItem
                      key={project.id}
                      icon="folder"
                      label={project.title}
                      href={`/dashboard/projects/${project.id}`}
                      active={pathname === `/dashboard/projects/${project.id}`}
                      onClick={closeMobile}
                      indent
                    />
                  ))
                ) : null}
              </div>
            )}
          </div>
        )}

        {collapsed && (
          <NavItem icon="folder" label="Projets" href="/dashboard/projects" collapsed={collapsed} onClick={closeMobile} />
        )}
      </div>

      {/* ── Divider ── */}
      {!collapsed && (
        <div style={{ margin: "4px 10px 0", height: 1, background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
      )}

      {/* ── Conversations ── */}
      <nav className="sb-scroll" style={{
        flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
        padding: collapsed ? "8px 8px" : "0 10px 8px",
      }}>
        {!collapsed && (
          <>
            <SectionLabel>Récents</SectionLabel>
            {isLoadingHistory ? (
              <SidebarMessage>Chargement...</SidebarMessage>
            ) : recentConversations.length === 0 ? (
              <SidebarMessage>Aucune conversation pour l'instant.</SidebarMessage>
            ) : (
              <div style={{ display: "grid", gap: 1 }}>
                {recentConversations.map((conversation) => (
                  <RecentConversationItem
                    key={conversation.id}
                    active={pathname === `/dashboard/c/${conversation.id}`}
                    conversation={conversation}
                    editing={renamingConversationId === conversation.id}
                    menuOpen={conversationMenuId === conversation.id}
                    onArchive={() => void handleArchiveConversation(conversation.id)}
                    onCloseMobile={closeMobile}
                    onDelete={() => void handleDeleteConversation(conversation.id)}
                    onMenuToggle={() => setConversationMenuId((v) => v === conversation.id ? null : conversation.id)}
                    onRenameCancel={() => setRenamingConversationId(null)}
                    onRenameStart={() => { setConversationMenuId(null); setRenamingConversationId(conversation.id) }}
                    onRenameSubmit={(title) => void handleRenameConversation(conversation.id, title)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </nav>

      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />

      {/* ── Profile ── */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)", padding: collapsed ? "10px 8px" : "8px 10px", position: "relative" }}>

        {/* Profile flyout menu */}
        {profileMenuOpen && !collapsed && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: 10, right: 10,
            padding: 6, zIndex: 60,
            display: "grid", gap: 1,
            background: "rgba(14,9,5,0.97)",
            border: "1px solid rgba(139,90,43,0.3)",
            borderRadius: 11,
            boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
            backdropFilter: "blur(16px)",
          }}>
            <NavItem icon="user" label="Profil" href="/dashboard/profile" onClick={closeMobile} />
            <NavItem icon="credit" label="Abonnement" href="/dashboard/billing" onClick={closeMobile} />
            <NavItem icon="bell" label="Notifications" href="/dashboard/notifications" onClick={closeMobile} />
            <NavItem icon="settings" label="Paramètres" href="/dashboard/settings" onClick={closeMobile} />
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "2px 0" }} />
            <NavItem icon="help" label="Support" href="/dashboard/support" onClick={closeMobile} />
            <NavItem icon="logout" label="Se déconnecter" onClick={() => void logout()} />
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setProfileMenuOpen((v) => !v) }}
          style={{
            width: "100%",
            display: "flex", alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 9,
            padding: collapsed ? "4px 0" : "7px 8px",
            borderRadius: 9, border: 0,
            background: profileMenuOpen ? "rgba(80,42,12,0.35)" : "transparent",
            cursor: "pointer", textAlign: "left",
            transition: "background 160ms ease",
          }}
          onMouseEnter={(e) => { if (!profileMenuOpen) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseLeave={(e) => { if (!profileMenuOpen) e.currentTarget.style.background = "transparent" }}
        >
          <Avatar name={user?.fullName || user?.email || "U"} size={collapsed ? 32 : 30} />
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.fullName || "Utilisateur"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </div>
            </div>
          )}
          {!collapsed && (
            <Icon name={profileMenuOpen ? "chevronD" : "chevronU"} size={11} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
          )}
        </button>
      </div>
    </aside>
  )
}
