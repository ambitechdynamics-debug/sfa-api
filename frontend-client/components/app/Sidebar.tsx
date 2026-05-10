"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { CSSProperties, ReactNode } from "react"
import { Icon, type IconName } from "@/components/ui/Icon"
import { BrandMark } from "@/components/ui/BrandMark"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: IconName | string
  count?: number
}

const PRIMARY_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: "home" },
  { label: "Créer un visuel", href: "/create", icon: "sparkles" },
  { label: "Mes projets", href: "/projects", icon: "folder" },
]

const LIBRARY_NAV: NavItem[] = [
  { label: "Mémoires de marque", href: "/ai-settings", icon: "palette" },
]

const ACCOUNT_NAV: NavItem[] = [
  { label: "Abonnement & crédits", href: "/billing", icon: "credit" },
  { label: "Profil", href: "/profile", icon: "user" },
  { label: "Paramètres", href: "/settings", icon: "settings" },
  { label: "Support", href: "/support", icon: "help" },
]

function SidebarLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ padding: "10px 8px 6px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", ...style }}>
      {children}
    </div>
  )
}

function SidebarItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn("group transition-colors")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 8,
        color: active ? "var(--acc-bright)" : "var(--ink-1)",
        background: active ? "var(--acc-soft)" : "transparent",
        border: active ? "1px solid var(--acc-line)" : "1px solid transparent",
        fontSize: 13,
        fontWeight: active ? 500 : 400,
      }}
    >
      <Icon name={item.icon} size={16} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.count !== undefined && (
        <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{item.count}</span>
      )}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <aside
      style={{
        position: "sticky",
        top: 0,
        alignSelf: "start",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-1)",
        borderRight: "1px solid var(--line-1)",
        padding: "20px 14px",
        width: 260,
      }}
    >
      <div style={{ padding: "0 8px", marginBottom: 24 }}>
        <Link href="/dashboard"><BrandMark size={20} /></Link>
      </div>

      <Link href="/create" style={{ marginBottom: 20 }}>
        <Button size="md" full icon="sparkles">Créer un visuel</Button>
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
        <SidebarLabel>Workspace</SidebarLabel>
        {PRIMARY_NAV.map((item) => <SidebarItem key={item.href} item={item} active={isActive(item.href)} />)}

        <SidebarLabel style={{ marginTop: 18 }}>Bibliothèque</SidebarLabel>
        {LIBRARY_NAV.map((item) => <SidebarItem key={item.href} item={item} active={isActive(item.href)} />)}

        <SidebarLabel style={{ marginTop: 18 }}>Compte</SidebarLabel>
        {ACCOUNT_NAV.map((item) => <SidebarItem key={item.href} item={item} active={isActive(item.href)} />)}
      </nav>

      {/* Credits widget */}
      {user && (
        <div style={{ padding: 14, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>Crédits IA</span>
            <Badge size="sm" tone="acc">{user.role === "ADMIN" ? "Admin" : "Pro"}</Badge>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="display" style={{ fontSize: 22, fontWeight: 600 }}>{user.credits}</span>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>/ {Math.max(100, user.credits)}</span>
          </div>
          <div style={{ height: 4, background: "var(--bg-1)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (user.credits / Math.max(100, user.credits)) * 100)}%`, height: "100%", background: "linear-gradient(90deg, var(--acc-bright), var(--acc-deep))" }} />
          </div>
          <Link href="/billing">
            <Button size="sm" variant="outline" full iconRight="arrowR">Recharger</Button>
          </Link>
        </div>
      )}

      {/* User row */}
      {user && (
        <div style={{ marginTop: 14, padding: "10px 8px", display: "flex", alignItems: "center", gap: 10, borderRadius: 10 }}>
          <Avatar name={user.fullName} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.fullName}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
          </div>
          <button
            onClick={logout}
            title="Se déconnecter"
            style={{ background: "transparent", border: 0, color: "var(--ink-3)", padding: 6, borderRadius: 6, cursor: "pointer" }}
          >
            <Icon name="logout" size={14} />
          </button>
        </div>
      )}
    </aside>
  )
}
