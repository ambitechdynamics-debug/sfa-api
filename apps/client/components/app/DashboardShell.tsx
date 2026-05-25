"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

/**
 * Connected-app shell. Sidebar is no longer rendered — the new Dashboard /
 * Workspace components provide their own chrome. This shell only sets the
 * full-viewport layout for the dashboard routes and lets other routes
 * (settings, profile, etc.) flow naturally with their default padding.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/")

  if (isDashboard) {
    return (
      <div style={{ height: "100vh", minHeight: "100vh", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", padding: "28px clamp(16px, 4vw, 48px) 48px" }}>
      <div style={{ width: "100%", maxWidth: 1440 }}>{children}</div>
    </div>
  )
}
