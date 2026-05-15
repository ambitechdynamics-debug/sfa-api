"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar } from "@/components/ui/Avatar"
import { Icon } from "@/components/ui/Icon"
import { getRouteMeta } from "@/components/app/nav-config"
import { trackEvent } from "@/lib/ux-metrics"
import { useAuthStore } from "@/store/auth-store"

interface AppHeaderProps {
  sidebarCollapsed?: boolean
  onOpenMobileNav?: () => void
  onToggleSidebar?: () => void
}

export function AppHeader({ sidebarCollapsed, onOpenMobileNav, onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname()
  const meta = getRouteMeta(pathname)
  const user = useAuthStore((state) => state.user)

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "color-mix(in srgb, var(--bg-0) 88%, transparent)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid var(--line-1)",
        padding: "14px clamp(16px, 4vw, 48px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1440,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <span className="md:hidden">
            <button
              type="button"
              aria-label="Ouvrir la navigation"
              onClick={onOpenMobileNav}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "1px solid var(--line-2)",
                background: "var(--bg-2)",
                color: "var(--ink-1)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Icon name="list" size={17} />
            </button>
          </span>
          <span className="max-md:hidden">
            <button
              type="button"
              aria-label={sidebarCollapsed ? "Agrandir la sidebar" : "Réduire la sidebar"}
              title={sidebarCollapsed ? "Agrandir la sidebar" : "Réduire la sidebar"}
              onClick={onToggleSidebar}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "1px solid var(--line-1)",
                background: "var(--bg-1)",
                color: "var(--ink-2)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Icon name={sidebarCollapsed ? "chevronR" : "chevronL"} size={16} />
            </button>
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 className="display" style={{ fontSize: 21, margin: 0, letterSpacing: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.title}</h1>
            {meta.sub && <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "3px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.sub}</p>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link
            href="/dashboard/support"
            aria-label="Support"
            title="Support"
            onClick={() => trackEvent("support_opened", { source: "header" })}
            style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--line-2)", background: pathname === "/dashboard/support" ? "var(--acc-soft)" : "var(--bg-2)", color: pathname === "/dashboard/support" ? "var(--acc-bright)" : "var(--ink-1)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="help" size={16} />
          </Link>
          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => trackEvent("notifications_opened", { source: "header" })}
            style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--line-2)", background: pathname === "/dashboard/notifications" ? "var(--acc-soft)" : "var(--bg-2)", color: pathname === "/dashboard/notifications" ? "var(--acc-bright)" : "var(--ink-1)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="bell" size={16} />
          </Link>
          {user && (
            <Link href="/dashboard/profile" aria-label="Profil" title="Profil" style={{ display: "inline-flex" }}>
              <Avatar name={user.fullName} size={34} />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
