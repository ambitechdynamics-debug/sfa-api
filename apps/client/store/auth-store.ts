"use client"

import { create } from "zustand"
import type { User } from "@/types/user"
import { apiFetch } from "@/lib/api"
import { authClient } from "@/lib/authClient"

/**
 * Local profile cache.
 *
 * Authentication itself is owned by Better Auth (`authClient.useSession()`).
 * This store holds the **business profile** retrieved from our backend
 * (`GET /api/users/me`) — fields like `role`, `credits`, `fullName` that live
 * in our `User` Postgres table, not in Neon Auth.
 */
interface ProfileState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  fetchProfile: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<ProfileState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user, isLoading: false }),
  fetchProfile: async () => {
    set({ isLoading: true })
    try {
      const user = await apiFetch<User>("/api/users/me")
      set({ user, isLoading: false })
    } catch {
      set({ user: null, isLoading: false })
    }
  },
  logout: async () => {
    try {
      await authClient.signOut()
    } catch {
      /* noop */
    }
    set({ user: null })
  },
}))
