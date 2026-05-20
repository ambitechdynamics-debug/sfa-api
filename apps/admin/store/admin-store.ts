'use client'

import { create } from 'zustand'
import { AdminUser } from '@/types/user'
import { getMe, logoutAdmin } from '@/lib/auth'
import { isAuthError } from '@/lib/api-error'

/**
 * Admin profile cache.
 *
 * Authentication itself is owned by Better Auth (`authClient.useSession()` in
 * the layout). This store holds the local admin profile retrieved from
 * `GET /api/users/me` — fields like `role`, `fullName` that live in our
 * Postgres `User` table and aren't part of the Neon Auth session.
 *
 * Backward-compat note: the older API surface (`token`, `login`, `setToken`,
 * `initFromStorage`) is preserved as no-ops or thin wrappers so existing call
 * sites don't break during the migration window.
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

  /** @deprecated kept for legacy call sites. Use {@link fetchProfile}. */
  initFromStorage: () => Promise<void>
  /** @deprecated kept for legacy call sites. Better Auth manages tokens internally. */
  token: string | null
  /** @deprecated kept for legacy call sites. Better Auth handles login. */
  login: (token: string, user: AdminUser) => void
  /** @deprecated. */
  setToken: (token: string) => void
}

export const useAdminStore = create<AdminStore>((set) => ({
  user: null,
  isAuthenticated: false,
  sidebarOpen: true,
  isLoading: false,
  token: null,

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
    } catch (error) {
      if (isAuthError(error)) {
        set({ user: null, isAuthenticated: false, isLoading: false })
        return
      }
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

  // ─── Legacy shims ─────────────────────────────────────────────────────────
  initFromStorage: async () => {
    // Map to the new fetchProfile to keep existing callers working.
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
  login: (_token, user) => set({ user, isAuthenticated: !!user }),
  setToken: () => {
    /* noop: Better Auth manages tokens via cookies + getSession(). */
  },
}))
