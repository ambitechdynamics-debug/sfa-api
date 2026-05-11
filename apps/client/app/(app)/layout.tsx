"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/app/Sidebar"
import { AppHeader } from "@/components/app/AppHeader"
import { useAuthStore } from "@/store/auth-store"
import { useUiStore } from "@/store/ui-store"
import { authClient } from "@/lib/authClient"

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const session = authClient.useSession()
  const { user: profile, fetchProfile } = useAuthStore()
  const hydrateUi = useUiStore((s) => s.hydrateUi)

  // ─── UI tokens (theme/density/accent) ──────────────────────────────────────
  useEffect(() => {
    hydrateUi()
  }, [hydrateUi])

  // ─── Auth gate: redirect anonymous users ──────────────────────────────────
  useEffect(() => {
    if (session.isPending) return
    if (!session.data) {
      if (session.error) {
        console.error("Session error:", session.error)
      }
      router.replace("/login")
    }
  }, [session.isPending, session.data, session.error, router])

  // ─── Hydrate local profile from backend whenever a session is active ──────
  // Retry up to 3 times with delay — needed after OAuth redirect where the
  // token may not be immediately available in the first render cycle.
  const fetchAttempts = useRef(0)
  useEffect(() => {
    if (!session.data || profile) return
    if (fetchAttempts.current >= 3) return
    fetchAttempts.current += 1
    const delay = fetchAttempts.current === 1 ? 0 : 800 * fetchAttempts.current
    const t = setTimeout(() => fetchProfile(), delay)
    return () => clearTimeout(t)
  }, [session.data, profile, fetchProfile])

  // ─── Listen for backend-issued 401 events ─────────────────────────────────
  useEffect(() => {
    const onExpired = () => router.replace("/login")
    window.addEventListener("client-auth-expired", onExpired)
    return () => window.removeEventListener("client-auth-expired", onExpired)
  }, [router])

  // Loading state — session resolving
  if (session.isPending) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "var(--ink-3)",
          fontSize: 14,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeLinecap="round" />
        </svg>
        <span>Chargement…</span>
      </div>
    )
  }

  // No session → redirect already triggered, render nothing while it happens
  if (!session.data) return null

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        minHeight: "100vh",
        background: "var(--bg-0)",
      }}
    >
      <Sidebar />
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AppHeader />
        <main style={{ flex: 1, padding: "32px 36px", minWidth: 0 }}>{children}</main>
      </div>
    </div>
  )
}
