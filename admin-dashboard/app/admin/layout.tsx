'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster } from 'sonner'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useAdminStore } from '@/store/admin-store'
import { authClient } from '@/lib/authClient'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = authClient.useSession()
  const { user: profile, isAuthenticated, fetchProfile, logout } = useAdminStore()
  const [isDark, setIsDark] = useState(false)

  // ─── Theme bootstrap ──────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved === 'dark' || (!saved && prefersDark)
    setIsDark(dark)
    if (dark) document.documentElement.classList.add('dark')
  }, [])

  // ─── Auth gate driven by Better Auth ──────────────────────────────────────
  useEffect(() => {
    if (session.isPending) return
    if (!session.data) {
      router.replace('/login')
    }
  }, [session.isPending, session.data, router])

  // ─── Hydrate local profile (role + name) ─────────────────────────────────
  useEffect(() => {
    if (session.data && !profile) {
      void fetchProfile()
    }
  }, [session.data, profile, fetchProfile])

  // ─── Listen for backend-issued 401 events ─────────────────────────────────
  useEffect(() => {
    function handleInvalidAuth() {
      logout()
      router.replace('/login')
    }
    window.addEventListener('admin-auth-invalid', handleInvalidAuth)
    return () => window.removeEventListener('admin-auth-invalid', handleInvalidAuth)
  }, [logout, router])

  // ─── Non-admin sessions: kick out ─────────────────────────────────────────
  useEffect(() => {
    if (profile && profile.role !== 'ADMIN') {
      logout()
      router.replace('/login')
    }
  }, [profile, logout, router])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  // Loading state — session resolving OR session valid but profile not yet loaded
  if (session.isPending || (session.data && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-xs text-[var(--text-muted)]">Chargement...</p>
        </div>
      </div>
    )
  }

  // No session, or non-admin profile — redirect already triggered, render nothing
  if (!session.data || !isAuthenticated || profile?.role !== 'ADMIN') return null

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
