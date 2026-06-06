"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { DashboardShell } from "@/components/app/DashboardShell"
import { RouteMetricsTracker } from "@/components/app/RouteMetricsTracker"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/hooks/useAuth"
import { useUiStore } from "@/store/ui-store"
import { loadingScreen } from "@/context/AuthProvider"

// Covers realistic slow paths: Clerk activation, Render/API cold start,
// local profile creation/linking, and transient getCurrentUser retry.
const DASHBOARD_SESSION_TIMEOUT_MS = 120_000

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const hydrateUi = useUiStore((state) => state.hydrateUi)
  const { error, isAuthenticated, profileLoading, refreshSession, requireAuth, sessionLoading, status, logout } = useAuth()
  const isCheckingSession = sessionLoading || profileLoading
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)

  useEffect(() => {
    hydrateUi()
  }, [hydrateUi])

  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      requireAuth(pathname)
    }
  }, [isAuthenticated, pathname, requireAuth, sessionLoading])

  useEffect(() => {
    if (!isCheckingSession) {
      setLoadingTimedOut(false)
      return
    }

    const timeout = window.setTimeout(() => {
      setLoadingTimedOut(true)
    }, DASHBOARD_SESSION_TIMEOUT_MS)

    return () => window.clearTimeout(timeout)
  }, [isCheckingSession, pathname])

  const retrySession = () => {
    setLoadingTimedOut(false)
    void refreshSession()
  }

  const sessionUnavailable = (message: string) => (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg-0)", color: "var(--ink-0)", padding: 24 }}>
      <div style={{ maxWidth: 420, display: "grid", gap: 16, textAlign: "center" }}>
        <h1 className="display" style={{ margin: 0, fontSize: 28 }}>Session à vérifier</h1>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Button onClick={retrySession} icon="refresh">Try again</Button>
          <Button variant="outline" onClick={() => void logout()} icon="logout">Sign in again</Button>
        </div>
      </div>
    </div>
  )

  if (status === "error") {
    return sessionUnavailable(error || "Impossible de vérifier votre session. Vérifiez votre connexion et réessayez.")
  }

  if (loadingTimedOut) {
    return sessionUnavailable("La préparation de votre session prend trop de temps. Réessayez ou reconnectez-vous.")
  }

  if (isCheckingSession) return loadingScreen("Setting up your Consilium workspace...")
  if (!isAuthenticated) return null

  return (
    <DashboardShell>
      <RouteMetricsTracker />
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
        {children}
      </div>
    </DashboardShell>
  )
}
