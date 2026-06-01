'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useAdminStore } from '@/store/admin-store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isLoaded: clerkLoaded, isSignedIn } = useUser()
  const { user: profile, isAuthenticated, fetchProfile, logout, isLoading: isProfileLoading } = useAdminStore()
  const [isDark, setIsDark] = useState(false)
  // Tracks whether fetchProfile() has been initiated at least once — prevents
  // the kick-out effect from firing before the fetch even starts.
  const [profileFetchStarted, setProfileFetchStarted] = useState(false)

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
    if (!clerkLoaded) return
    if (!isSignedIn) {
      router.replace('/login')
    }
  }, [clerkLoaded, isSignedIn, router])

  // ─── Hydrate local profile (role + name) ─────────────────────────────────
  useEffect(() => {
    if (clerkLoaded && isSignedIn && !profile && !profileFetchStarted) {
      setProfileFetchStarted(true)
      void fetchProfile()
    }
  }, [clerkLoaded, isSignedIn, profile, profileFetchStarted, fetchProfile])

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
  // All guards must pass before evaluating:
  //   1. Clerk is loaded
  //   2. We have a session (no session → handled by gate above)
  //   3. fetchProfile() was initiated
  //   4. fetchProfile() finished (isLoading = false)
  useEffect(() => {
    if (!clerkLoaded) return
    if (!isSignedIn) return
    if (!profileFetchStarted) return
    if (isProfileLoading) return

    if (!profile || profile.role !== 'ADMIN') {
      logout()
      router.replace('/login')
    }
  }, [clerkLoaded, isSignedIn, profile, isProfileLoading, profileFetchStarted, logout, router])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  // ─── Loading spinner ───────────────────────────────────────────────────────
  const hasAuth = Boolean(clerkLoaded && isSignedIn)
  const profileReady = !!profile || (profileFetchStarted && !isProfileLoading)

  if (!clerkLoaded || (hasAuth && !profileReady)) {
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
  if (!isSignedIn || !isAuthenticated || profile?.role !== 'ADMIN') return null

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
