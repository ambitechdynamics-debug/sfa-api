"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export function useRequireAuth() {
  const pathname = usePathname()
  const auth = useAuth()

  useEffect(() => {
    auth.requireAuth(pathname)
  }, [auth, pathname])

  return auth
}
