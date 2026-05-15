"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react"
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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: "16px 10px 7px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </div>
  )
}

function SidebarItem({
  icon,
  label,
  href,
  active,
  collapsed,
  onClick,
  rightAction,
  itemPadding,
  itemGap,
  labelStyle,
  fillLabel,
}: {
  icon: string
  label: string
  href?: string
  active?: boolean
  collapsed?: boolean
  onClick?: () => void
  rightAction?: ReactNode
  itemPadding?: string
  itemGap?: number
  labelStyle?: CSSProperties
  fillLabel?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-start",
    gap: itemGap ?? 10,
    minHeight: 36,
    width: "100%",
    padding: collapsed ? "9px 0" : itemPadding ?? "8px 10px",
    borderRadius: 8,
    border: 0,
    background: active ? "var(--bg-2)" : isHovered ? "rgba(255,255,255,0.06)" : "transparent",
    color: active || isHovered ? "var(--ink-0)" : "var(--ink-2)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 650 : 500,
    textDecoration: "none",
    transition: "background-color 200ms ease, color 200ms ease",
  }

  const content = (
    <>
      <Icon name={icon} size={16} />
      {!collapsed && (
        <span
          style={{
            flex: fillLabel === false ? "0 1 auto" : 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            ...labelStyle,
          }}
        >
          {label}
        </span>
      )}
      {!collapsed && rightAction}
    </>
  )

  if (href) {
    return (
      <Link href={href} onClick={onClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={style} title={collapsed ? label : undefined}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={style} title={collapsed ? label : undefined}>
      {content}
    </button>
  )
}

function SidebarMessage({ children }: { children: ReactNode }) {
  return <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--ink-3)", lineHeight: 1.45 }}>{children}</div>
}

function ConversationActionsMenu({
  onArchive,
  onDelete,
  onRename,
}: {
  onArchive: () => void
  onDelete: () => void
  onRename: () => void
}) {
  const itemStyle: CSSProperties = {
    width: "100%",
    minHeight: 34,
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "8px 10px",
    border: 0,
    borderRadius: 7,
    background: "transparent",
    color: "var(--ink-2)",
    cursor: "pointer",
    fontSize: 12,
    textAlign: "left",
  }

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      style={{
        position: "absolute",
        right: 0,
        top: 34,
        zIndex: 80,
        width: 164,
        padding: 6,
        display: "grid",
        gap: 2,
        background: "var(--bg-1)",
        border: "1px solid var(--line-2)",
        borderRadius: 10,
        boxShadow: "var(--sh-2)",
      }}
    >
      <button type="button" onClick={onRename} style={itemStyle} className="hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--ink-0)] transition-colors">
        <Icon name="edit" size={14} />
        Renommer
      </button>
      <button type="button" onClick={onArchive} style={itemStyle} className="hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--ink-0)] transition-colors">
        <Icon name="archive" size={14} />
        Archiver
      </button>
      <button type="button" onClick={onDelete} style={{ ...itemStyle, color: "var(--danger, #ff6b6b)" }} className="hover:bg-[rgba(255,255,255,0.06)] transition-colors">
        <Icon name="trash" size={14} />
        Supprimer
      </button>
    </div>
  )
}

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

  useEffect(() => {
    if (editing) setDraftTitle(conversation.title)
  }, [conversation.title, editing])

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const clean = draftTitle.trim()
    if (!clean) return
    onRenameSubmit(clean)
  }

  const rowStyle: CSSProperties = {
    position: "relative",
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    borderRadius: 8,
    background: active ? "var(--bg-2)" : hovered ? "rgba(255,255,255,0.06)" : "transparent",
    color: active || hovered ? "var(--ink-0)" : "var(--ink-2)",
    transition: "background-color 200ms ease, color 200ms ease",
  }

  if (editing) {
    return (
      <form onSubmit={submitRename} style={{ ...rowStyle, padding: "5px 6px" }}>
        <Icon name="message" size={16} />
        <input
          autoFocus
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onBlur={() => {
            const clean = draftTitle.trim()
            if (!clean || clean === conversation.title) {
              onRenameCancel()
              return
            }
            onRenameSubmit(clean)
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") onRenameCancel()
          }}
          style={{
            flex: 1,
            minWidth: 0,
            height: 28,
            border: "1px solid var(--line-2)",
            borderRadius: 7,
            background: "var(--bg-0)",
            color: "var(--ink-0)",
            padding: "0 8px",
            fontSize: 13,
            outline: "none",
          }}
        />
      </form>
    )
  }

  return (
    <div
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/dashboard/c/${conversation.id}`}
        onClick={onCloseMobile}
        style={{
          flex: "1 1 auto",
          minWidth: 0,
          maxWidth: "calc(100% - 36px)",
          minHeight: 36,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 8px 8px 10px",
          color: "inherit",
          textDecoration: "none",
          fontSize: 13,
          fontWeight: active ? 650 : 500,
        }}
      >
        <Icon name="message" size={16} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {conversation.title}
        </span>
      </Link>
      <button
        type="button"
        aria-label={`Actions pour ${conversation.title}`}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onMenuToggle()
        }}
        style={{
          width: 28,
          height: 28,
          marginRight: 4,
          flexShrink: 0,
          border: 0,
          borderRadius: 7,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: menuOpen ? "rgba(255,255,255,0.08)" : "transparent",
          color: "var(--ink-3)",
          cursor: "pointer",
          opacity: hovered || menuOpen ? 1 : 0.72,
          transition: "opacity 160ms ease, background-color 160ms ease, color 160ms ease",
        }}
        className="hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--ink-0)]"
      >
        <Icon name="moreHorizontal" size={16} />
      </button>

      {menuOpen && (
        <ConversationActionsMenu
          onRename={onRenameStart}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}

export function Sidebar({ collapsed = false, mobile = false, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout, user } = useAuth()
  const { error: projectsError, isLoading: projectsLoading, loadProjects, projects } = useProjectStore()
  const { archiveConversation, clearActive, deleteConversation, fetchHistory, history, isLoadingHistory, renameConversation } = useChatStore()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isCreateModalOpen, setCreateModalOpen] = useState(false)
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(true)
  const [isProjectsButtonHovered, setIsProjectsButtonHovered] = useState(false)
  const [conversationMenuId, setConversationMenuId] = useState<string | null>(null)
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    void loadProjects()
    void fetchHistory(user.id)
  }, [fetchHistory, isAuthenticated, loadProjects, user?.id])

  useEffect(() => {
    if (!conversationMenuId) return
    function closeMenu() {
      setConversationMenuId(null)
    }
    window.addEventListener("click", closeMenu)
    return () => window.removeEventListener("click", closeMenu)
  }, [conversationMenuId])

  const recentConversations = history.slice(0, 12)

  function closeMobile() {
    if (mobile) onClose?.()
  }

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
    if (pathname === `/dashboard/c/${id}`) {
      clearActive()
      router.push("/dashboard")
    }
  }

  async function handleDeleteConversation(id: string) {
    const confirmed = window.confirm("Supprimer définitivement cette conversation ?")
    if (!confirmed) return
    await deleteConversation(id, user?.id)
    setConversationMenuId(null)
    if (pathname === `/dashboard/c/${id}`) {
      clearActive()
      router.push("/dashboard")
    }
  }

  const asideStyle: CSSProperties = {
    position: mobile ? "relative" : "sticky",
    top: 0,
    alignSelf: "start",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    width: mobile ? "min(88vw, 320px)" : collapsed ? 64 : 286,
    padding: collapsed ? "12px 8px" : "12px",
    overflow: "hidden",
    background: "var(--bg-0)",
    borderRight: "1px solid var(--line-1)",
    transition: "width 0.2s ease",
  }

  return (
    <aside style={asideStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "8px 0 16px" }}>
        <Link href="/dashboard" onClick={handleNewChat} style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, padding: collapsed ? 0 : "4px 8px" }}>
          <BrandMark size={20} withWordmark={!collapsed} />
        </Link>
        {!collapsed && (
          <div style={{ display: "flex", gap: 6 }}>
            {onToggle && (
              <button type="button" onClick={onToggle} className="max-md:hidden" style={{ width: 32, height: 32, borderRadius: 8, border: 0, background: "transparent", color: "var(--ink-2)", cursor: "pointer" }} aria-label="Réduire la sidebar">
                <Icon name="layoutSidebar" size={18} />
              </button>
            )}
            {mobile && (
              <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 0, background: "transparent", color: "var(--ink-2)", cursor: "pointer" }} aria-label="Fermer la navigation">
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
        <SidebarItem icon="edit" label="Nouveau visuel" collapsed={collapsed} onClick={handleNewChat} itemPadding="8px 0" itemGap={6} fillLabel={false} />
        {collapsed ? (
          <SidebarItem icon="folder" label="Projets" href="/dashboard/projects" collapsed={collapsed} onClick={closeMobile} />
        ) : (
          <div style={{ display: "grid", gap: 4 }}>
            <button
              type="button"
              onClick={() => setProjectsMenuOpen((value) => !value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: 36,
                width: "100%",
                padding: "8px 0",
                borderRadius: 8,
                border: 0,
                background: pathname.startsWith("/dashboard/projects") ? "var(--bg-2)" : isProjectsButtonHovered ? "rgba(255,255,255,0.06)" : "transparent",
                color: pathname.startsWith("/dashboard/projects") || isProjectsButtonHovered ? "var(--ink-0)" : "var(--ink-2)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: pathname.startsWith("/dashboard/projects") ? 650 : 500,
                textAlign: "left",
                transition: "background-color 200ms ease, color 200ms ease",
              }}
              onMouseEnter={() => setIsProjectsButtonHovered(true)}
              onMouseLeave={() => setIsProjectsButtonHovered(false)}
              aria-expanded={projectsMenuOpen}
              aria-label="Afficher les projets"
            >
              <Icon name="folder" size={16} />
              <span style={{ flex: 1, minWidth: 0 }}>Projets</span>
              <Icon name={projectsMenuOpen ? "chevronD" : "chevronR"} size={12} style={{ color: "var(--ink-3)" }} />
            </button>

            {projectsMenuOpen && (
              <div style={{ display: "grid", gap: 3, paddingLeft: 0 }}>
                <SidebarItem icon="folderPlus" label="Nouveau projet" onClick={() => setCreateModalOpen(true)} itemPadding="8px 0" itemGap={6} fillLabel={false} />
                {projectsLoading ? (
                  <SidebarMessage>Chargement...</SidebarMessage>
                ) : projectsError ? (
                  <SidebarMessage>{projectsError}</SidebarMessage>
                ) : projects.length > 0 ? (
                  projects.map((project) => (
                    <SidebarItem
                      key={project.id}
                      icon="folder"
                      label={project.title}
                      href={`/dashboard/projects/${project.id}`}
                      active={pathname === `/dashboard/projects/${project.id}`}
                      onClick={closeMobile}
                    />
                  ))
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      <nav style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", display: "grid", alignContent: "start", gap: 3, paddingRight: collapsed ? 0 : 4 }}>
        <SidebarItem icon="palette" label="Mémoires de marque" href="/dashboard/projects" active={false} collapsed={collapsed} onClick={closeMobile} />

        {!collapsed && (
          <>
            <SectionLabel>Conversations récentes</SectionLabel>
            {isLoadingHistory ? (
              <SidebarMessage>Chargement...</SidebarMessage>
            ) : recentConversations.length === 0 ? (
              <SidebarMessage>Aucune conversation.</SidebarMessage>
            ) : (
              recentConversations.map((conversation) => (
                <RecentConversationItem
                  key={conversation.id}
                  active={pathname === `/dashboard/c/${conversation.id}`}
                  conversation={conversation}
                  editing={renamingConversationId === conversation.id}
                  menuOpen={conversationMenuId === conversation.id}
                  onArchive={() => void handleArchiveConversation(conversation.id)}
                  onCloseMobile={closeMobile}
                  onDelete={() => void handleDeleteConversation(conversation.id)}
                  onMenuToggle={() => setConversationMenuId((value) => value === conversation.id ? null : conversation.id)}
                  onRenameCancel={() => setRenamingConversationId(null)}
                  onRenameStart={() => {
                    setConversationMenuId(null)
                    setRenamingConversationId(conversation.id)
                  }}
                  onRenameSubmit={(title) => void handleRenameConversation(conversation.id, title)}
                />
              ))
            )}

          </>
        )}
      </nav>

      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />

      <div style={{ position: "relative", borderTop: "1px solid var(--line-1)", paddingTop: 12, marginTop: 12 }}>
        {profileMenuOpen && !collapsed && (
          <div style={{ position: "fixed", bottom: 70, left: 12, width: 262, padding: 8, zIndex: 60, display: "grid", gap: 2, background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 12, boxShadow: "var(--sh-2)" }}>
            <SidebarItem icon="user" label="Profil" href="/dashboard/profile" onClick={closeMobile} />
            <SidebarItem icon="credit" label="Abonnement" href="/dashboard/billing" onClick={closeMobile} />
            <SidebarItem icon="bell" label="Notifications" href="/dashboard/notifications" onClick={closeMobile} />
            <SidebarItem icon="settings" label="Paramètres" href="/dashboard/settings" onClick={closeMobile} />
            <SidebarItem icon="help" label="Support" href="/dashboard/support" onClick={closeMobile} />
            <SidebarItem icon="logout" label="Se déconnecter" onClick={() => void logout()} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setProfileMenuOpen((value) => !value)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, padding: collapsed ? "4px 0" : "8px 10px", borderRadius: 10, border: 0, background: profileMenuOpen ? "var(--bg-2)" : "transparent", cursor: "pointer", textAlign: "left" }}
        >
          <Avatar name={user?.fullName || user?.email || "Utilisateur"} size={collapsed ? 34 : 36} />
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 650, color: "var(--ink-0)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.fullName || "Utilisateur"}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
