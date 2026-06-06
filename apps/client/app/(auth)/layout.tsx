"use client"

import { Suspense, useEffect, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useAuth } from "@/hooks/useAuth"
import { loadingScreen } from "@/context/AuthProvider"
import { sanitizeNextPath } from "@/lib/session-token"

function AuthLayoutGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next")
  const { isAuthenticated, profileLoading, sessionLoading, status } = useAuth()
  const { isLoaded: clerkLoaded, isSignedIn } = useUser()
  const isVerifyingExistingSession =
    clerkLoaded && isSignedIn === true && (sessionLoading || profileLoading || status === "loading")

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(sanitizeNextPath(nextPath))
    }
  }, [isAuthenticated, nextPath, router])

  if (isAuthenticated || isVerifyingExistingSession) return loadingScreen()

  return children
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={loadingScreen()}>
      <AuthLayoutGate>{children}</AuthLayoutGate>
    </Suspense>
  )
}
