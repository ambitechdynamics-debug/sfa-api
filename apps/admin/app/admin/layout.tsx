'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster } from 'sonner'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useAdminStore } from '@/store/admin-store'
import { getToken } from '@/lib/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user: profile, isAuthenticated, fetchProfile, logout, isLoading: isProfileLoading } = useAdminStore()
  const [isDark, setIsDark] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // ─── Theme bootstrap ──────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved === 'dark' || (!saved && prefersDark)
    setIsDark(dark)
    if (dark) document.documentElement.classList.add('dark')
  }, [])

  // ─── Auth gate: no token → /login, otherwise hydrate profile once ─────────
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }
    setAuthChecked(true)
    if (!profile) {
      void fetchProfile()
    }
  }, [router, profile, fetchProfile])

  // ─── Listen for backend-issued 401 events ─────────────────────────────────
  useEffect(() => {
    function handleInvalidAuth() {
      logout()
      router.replace('/login')
    }
    window.addEventListener('admin-auth-invalid', handleInvalidAuth)
    return () => window.removeEventListener('admin-auth-invalid', handleInvalidAuth)
  }, [logout, router])

  // ─── Non-admin kick-out ────────────────────────────────────────────────────
  useEffect(() => {
    if (!authChecked) return
    if (isProfileLoading) return
    if (profile && profile.role !== 'ADMIN') {
      logout()
      router.replace('/login')
    }
  }, [authChecked, profile, isProfileLoading, logout, router])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  // ─── Loading spinner ───────────────────────────────────────────────────────
  if (!authChecked || (authChecked && !profile && isProfileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-xs text-[var(--text-muted)]">Chargement...</p>
        </div>
      </div>
    )
  }

  // Profile not yet loaded or non-admin — redirect already in flight
  if (!isAuthenticated || profile?.role !== 'ADMIN') return null

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
