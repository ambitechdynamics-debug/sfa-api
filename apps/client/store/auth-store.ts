"use client"

import { create } from "zustand"
import type { User } from "@/types/user"
import { getCurrentUser } from "@/services/user.service"
import { signOutSession } from "@/services/auth.service"

interface ProfileState {
  user: User | null
  isLoading: boolean
  error: string
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string) => void
  fetchProfile: () => Promise<User | null>
  clearProfile: () => void
  logout: () => Promise<void>
}

export const useAuthStore = create<ProfileState>((set) => ({
  user: null,
  isLoading: false,
  error: "",

  setUser: (user) => set({ user, isLoading: false, error: "" }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearProfile: () => set({ user: null, isLoading: false, error: "" }),

  fetchProfile: async () => {
    set({ isLoading: true, error: "" })
    try {
      const user = await getCurrentUser()
      set({ user, isLoading: false, error: "" })
      return user
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger le profil utilisateur."
      set({ user: null, isLoading: false, error: message })
      return null
    }
  },

  logout: async () => {
    await signOutSession()
    set({ user: null, isLoading: false, error: "" })
  },
}))
