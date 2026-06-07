'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster } from 'sonner'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminLoadingScreen } from '@/components/admin/AdminLoadingScreen'
import { useAdminStore } from '@/store/admin-store'
import { getToken } from '@/lib/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user: profile, isAuthenticated, fetchProfile, logout, isLoading: isProfileLoading } = useAdminStore()
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return saved === 'dark' || (!saved && prefersDark)
  })
  const [authChecked] = useState(() => Boolean(getToken()))

  // ─── Theme bootstrap ──────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // ─── Auth gate: no token → /login, otherwise hydrate profile once ─────────
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }
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

  // ─── Loading screen ────────────────────────────────────────────────────────
  if (!authChecked || (authChecked && !profile && isProfileLoading)) {
    return <AdminLoadingScreen />
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
