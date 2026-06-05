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
  const { isAuthenticated } = useAuth()
  // Trust Clerk's session cookie as the "already signed in" signal even
  // before our backend `/users/me` has resolved. This prevents the login
  // form from briefly flashing when the user opens /login with an active
  // session, and avoids the "Une session est déjà active" round-trip
  // when they submit the form.
  const { isLoaded: clerkLoaded, isSignedIn } = useUser()
  const hasSession = isAuthenticated || (clerkLoaded && isSignedIn === true)

  useEffect(() => {
    if (hasSession) {
      router.replace(sanitizeNextPath(nextPath))
    }
  }, [hasSession, nextPath, router])

  if (hasSession) return null

  return children
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={loadingScreen()}>
      <AuthLayoutGate>{children}</AuthLayoutGate>
    </Suspense>
  )
}
