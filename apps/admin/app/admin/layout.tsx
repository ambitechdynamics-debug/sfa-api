'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster } from 'sonner'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useAdminStore } from '@/store/admin-store'
import { authClient } from '@/lib/authClient'
import { hasLegacySession } from '@/lib/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = authClient.useSession()
  const { user: profile, isAuthenticated, fetchProfile, logout, isLoading: isProfileLoading } = useAdminStore()
  const [isDark, setIsDark] = useState(false)
  const [hasLegacyAuth, setHasLegacyAuth] = useState(false)
  // Tracks whether fetchProfile() has been initiated at least once — prevents
  // the kick-out effect from firing before the fetch even starts.
  const [profileFetchStarted, setProfileFetchStarted] = useState(false)

  useEffect(() => {
    setHasLegacyAuth(hasLegacySession())
  }, [])

  // ─── Theme bootstrap ──────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved === 'dark' || (!saved && prefersDark)
    setIsDark(dark)
    if (dark) document.documentElement.classList.add('dark')
  }, [])

  // ─── Auth gate: no session → /login ───────────────────────────────────────
  useEffect(() => {
    if (session.isPending && !session.data && !hasLegacyAuth) return
    if (!session.data && !hasLegacyAuth) {
      router.replace('/login')
    }
  }, [hasLegacyAuth, session.isPending, session.data, router])

  // ─── Hydrate local profile (role + name) ─────────────────────────────────
  useEffect(() => {
    if ((session.data || hasLegacyAuth) && !profile && !profileFetchStarted) {
      setProfileFetchStarted(true)
      void fetchProfile()
    }
  }, [hasLegacyAuth, session.data, profile, profileFetchStarted, fetchProfile])

  // ─── Listen for backend-issued 401 events ─────────────────────────────────
  useEffect(() => {
    function handleInvalidAuth() {
      logout()
      setHasLegacyAuth(false)
      router.replace('/login')
    }
    window.addEventListener('admin-auth-invalid', handleInvalidAuth)
    return () => window.removeEventListener('admin-auth-invalid', handleInvalidAuth)
  }, [logout, router])

  // ─── Non-admin kick-out ────────────────────────────────────────────────────
  // All guards must pass before evaluating:
  //   1. Session is settled (not pending, or we already have cached data)
  //   2. We have a session (no session → handled by gate above)
  //   3. fetchProfile() was initiated
  //   4. fetchProfile() finished (isLoading = false)
  useEffect(() => {
    if (session.isPending && !session.data && !hasLegacyAuth) return
    if (!session.data && !hasLegacyAuth) return
    if (!profileFetchStarted) return
    if (isProfileLoading) return

    if (!profile || profile.role !== 'ADMIN') {
      logout()
      setHasLegacyAuth(false)
      router.replace('/login')
    }
  }, [hasLegacyAuth, profile, isProfileLoading, profileFetchStarted, session.isPending, session.data, logout, router])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  // ─── Loading spinner ───────────────────────────────────────────────────────
  const hasAuth = !!(session.data || hasLegacyAuth)
  const profileReady = !!profile || (profileFetchStarted && !isProfileLoading)

  if ((session.isPending && !session.data && !hasLegacyAuth) || (hasAuth && !profileReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-xs text-[var(--text-muted)]">Chargement...</p>
        </div>
      </div>
    )
  }

  // No valid session or non-admin — redirect already in flight, render nothing
  if ((!session.data && !hasLegacyAuth) || !isAuthenticated || profile?.role !== 'ADMIN') return null

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader isDark={isDark} onToggleTheme={toggleTheme} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6 max-w-[1440px] mx-auto">{children}</div>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
