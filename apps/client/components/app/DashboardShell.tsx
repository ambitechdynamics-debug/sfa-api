"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/app/Sidebar"
import { Icon } from "@/components/ui/Icon"


export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/")
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div
      style={{
        height: isDashboard ? "100vh" : "auto",
        minHeight: "100vh",
        display: "flex",
        background: "#131314",
        overflow: isDashboard ? "hidden" : "visible",
      }}
    >
      <div className="max-md:hidden" style={{ flexShrink: 0 }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </div>

      {mobileOpen && (
        <div className="md:hidden anim-fade-in" style={{ position: "fixed", inset: 0, zIndex: 80 }}>
          <button
            type="button"
            aria-label="Fermer la navigation"
            onClick={() => setMobileOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              border: 0,
              background: "rgba(0, 0, 0, 0.8)",
              cursor: "pointer",
            }}
          />
          <div style={{ position: "relative", width: "min(88vw, 320px)", height: "100%" }}>
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: isDashboard ? "100%" : "auto", overflow: isDashboard ? "hidden" : "visible" }}>
        <div className="md:hidden" style={{ padding: "12px 16px 0", flexShrink: 0 }}>
          <button
            type="button"
            aria-label="Ouvrir la navigation"
            onClick={() => setMobileOpen(true)}
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
              boxShadow: "var(--sh-1)",
            }}
          >
            <Icon name="list" size={17} />
          </button>
        </div>

        <main
          style={isDashboard ? {
            flex: 1,
            minWidth: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          } : {
            flex: 1,
            minWidth: 0,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            padding: "28px clamp(16px, 4vw, 48px) 48px",
          }}
        >
          <div style={isDashboard ? {
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
          } : {
            width: "100%",
            maxWidth: 1440,
          }}>{children}</div>
        </main>
      </div>
    </div>
  )
}
