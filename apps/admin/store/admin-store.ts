'use client'

import { create } from 'zustand'
import { AdminUser } from '@/types/user'
import { getMe, logoutAdmin } from '@/lib/auth'

/**
 * Admin profile cache.
 *
 * Authentication is handled by a backend-issued JWT stored in localStorage
 * (see lib/auth.ts). This store mirrors the resolved profile (role, fullName,
 * email…) coming back from GET /api/auth/admin/me.
 */
interface AdminStore {
  user: AdminUser | null
  isAuthenticated: boolean
  sidebarOpen: boolean
  isLoading: boolean

  setUser: (user: AdminUser) => void
  fetchProfile: () => Promise<void>
  logout: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
}

export const useAdminStore = create<AdminStore>((set) => ({
  user: null,
  isAuthenticated: false,
  sidebarOpen: true,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  fetchProfile: async () => {
    set({ isLoading: true })
    try {
      const profile = await getMe()
      if (profile.role !== 'ADMIN') {
        await logoutAdmin()
        set({ user: null, isAuthenticated: false, isLoading: false })
        return
      }
      set({ user: profile, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  logout: () => {
    void logoutAdmin()
    set({ user: null, isAuthenticated: false })
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
