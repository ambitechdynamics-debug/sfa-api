"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { DashboardShell } from "@/components/app/DashboardShell"
import { RouteMetricsTracker } from "@/components/app/RouteMetricsTracker"
import { Button } from "@/components/ui/Button"
import { useAuth } from "@/hooks/useAuth"
import { useUiStore } from "@/store/ui-store"
import { loadingScreen } from "@/context/AuthProvider"

const DASHBOARD_SESSION_TIMEOUT_MS = 8_000

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
        <h1 className="display" style={{ margin: 0, fontSize: 28 }}>Session indisponible</h1>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Button onClick={retrySession} icon="refresh">Réessayer</Button>
          <Button variant="outline" onClick={() => void logout()} icon="logout">Se reconnecter</Button>
        </div>
      </div>
    </div>
  )

  if (status === "error") {
    return sessionUnavailable(error || "Impossible de vérifier votre session. Vérifiez votre connexion puis réessayez.")
  }

  if (loadingTimedOut) {
    return sessionUnavailable("La vérification de votre session prend trop de temps. Réessayez ou reconnectez-vous.")
  }

  if (isCheckingSession) return loadingScreen("Vérification de votre session...")
  if (!isAuthenticated) return null

  return (
    <DashboardShell>
      <RouteMetricsTracker />
      {children}
    </DashboardShell>
  )
}
