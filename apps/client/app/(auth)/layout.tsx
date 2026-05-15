"use client"

import { Suspense, useEffect, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { loadingScreen } from "@/context/AuthProvider"
import { sanitizeNextPath } from "@/lib/session-token"

function AuthLayoutGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next")
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(sanitizeNextPath(nextPath))
    }
  }, [isAuthenticated, nextPath, router])

  if (isAuthenticated) return null

  return children
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={loadingScreen()}>
      <AuthLayoutGate>{children}</AuthLayoutGate>
    </Suspense>
  )
}
