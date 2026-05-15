"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/lib/authClient"
import {
  AUTH_EXPIRED_EVENT,
  buildLoginPath,
  isAuthPath,
  isProtectedPath,
  readAuthExpiredDetail,
  sanitizeNextPath,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session-token"
import {
  registerWithEmail as registerWithEmailService,
  signInWithEmail,
  signInWithGoogle,
  signOutSession,
} from "@/services/auth.service"
import { getCurrentUser } from "@/services/user.service"
import { ApiError } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"
import { useChatStore } from "@/store/chat-store"
import { useProjectStore } from "@/store/project-store"
import type { User } from "@/types/user"

type AuthStatus = "loading" | "authenticated" | "anonymous" | "expired" | "error"

type LoginInput = {
  email: string
  password: string
  nextPath?: string | null
}

type RegisterInput = {
  fullName: string
  email: string
  password: string
  nextPath?: string | null
}

type AuthActionResult =
  | { success: true }
  | { success: true; verificationRequired: true; email: string }
  | { success: false; message: string }

type AuthContextValue = {
  user: User | null
  status: AuthStatus
  sessionLoading: boolean
  profileLoading: boolean
  isAuthenticated: boolean
  isExpired: boolean
  error: string
  loginWithEmail: (input: LoginInput) => Promise<AuthActionResult>
  loginWithGoogle: (nextPath?: string | null) => Promise<AuthActionResult>
  registerWithEmail: (input: RegisterInput) => Promise<AuthActionResult>
  refreshSession: () => Promise<User | null>
  logout: (reason?: string) => Promise<void>
  requireAuth: (nextPath?: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)
const PUBLIC_AUTH_PENDING_TIMEOUT_MS = 2_500

function debugAuthTransition(phase: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[client-auth]", phase, details ?? {})
  }
}

function getSessionSignature(data: unknown) {
  if (!data || typeof data !== "object") return ""
  const record = data as { user?: { id?: string; email?: string }; session?: { id?: string } }
  return [record.session?.id, record.user?.id, record.user?.email].filter(Boolean).join(":")
}

function loadingScreen(message = "Chargement de la session...") {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg-0)", color: "var(--ink-2)" }}>
      <div style={{ display: "grid", gap: 12, justifyItems: "center", fontSize: 14 }}>
        <span className="anim-spin" style={{ width: 28, height: 28, borderRadius: 999, border: "2px solid var(--line-3)", borderTopColor: "var(--acc)" }} />
        {message}
      </div>
    </div>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const betterSession = authClient.useSession()
  const { user, setUser, clearProfile } = useAuthStore()
  const resetProjects = useProjectStore((state) => state.reset)
  const resetChat = useChatStore((state) => state.reset)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [profileLoading, setProfileLoading] = useState(false)
  const [sessionPendingTimedOut, setSessionPendingTimedOut] = useState(false)
  const [error, setError] = useState("")
  const validatedSignatureRef = useRef("")
  const lastRefreshErrorRef = useRef("")
  const isCurrentAuthPath = isAuthPath(pathname)
  const ignoreStalledPublicAuthSession = isCurrentAuthPath && sessionPendingTimedOut

  const clearWorkspaceState = useCallback(() => {
    clearProfile()
    resetProjects()
    resetChat()
    validatedSignatureRef.current = ""
  }, [clearProfile, resetChat, resetProjects])

  const expireSession = useCallback(async (message = SESSION_EXPIRED_MESSAGE) => {
    clearWorkspaceState()
    setStatus("expired")
    setError(message)
    toast.error(message)
    await signOutSession()
    if (isProtectedPath(pathname)) {
      router.replace(buildLoginPath(pathname, "expired"))
    }
  }, [clearWorkspaceState, pathname, router])

  const refreshSession = useCallback(async () => {
    setError("")
    lastRefreshErrorRef.current = ""
    setProfileLoading(true)
    debugAuthTransition("profile loading")
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setStatus("authenticated")
      lastRefreshErrorRef.current = ""
      validatedSignatureRef.current = getSessionSignature(betterSession.data)
      debugAuthTransition("authenticated", { userId: currentUser.id })
      return currentUser
    } catch (reason) {
      if (reason instanceof ApiError && (reason.status === 401 || reason.status === 403)) {
        debugAuthTransition("expired", { status: reason.status })
        await expireSession()
        return null
      }

      const message = reason instanceof Error ? reason.message : "Impossible de vérifier votre session."
      lastRefreshErrorRef.current = message
      setError(message)
      setStatus("error")
      debugAuthTransition("error", { message })
      return null
    } finally {
      setProfileLoading(false)
    }
  }, [betterSession.data, expireSession, setUser])

  useEffect(() => {
    function onAuthExpired(event: Event) {
      const detail = readAuthExpiredDetail(event)
      void expireSession(detail.message || SESSION_EXPIRED_MESSAGE)
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired)
  }, [expireSession])

  useEffect(() => {
    if (!betterSession.isPending || !isCurrentAuthPath) {
      setSessionPendingTimedOut(false)
      return
    }

    const timeout = window.setTimeout(() => {
      setSessionPendingTimedOut(true)
    }, PUBLIC_AUTH_PENDING_TIMEOUT_MS)

    return () => window.clearTimeout(timeout)
  }, [betterSession.isPending, isCurrentAuthPath])

  useEffect(() => {
    if (betterSession.isPending) {
      debugAuthTransition("session pending", { authPath: isCurrentAuthPath })
      if (ignoreStalledPublicAuthSession) {
        if (status !== "authenticated" && status !== "expired") {
          clearWorkspaceState()
          setStatus("anonymous")
          debugAuthTransition("anonymous", { reason: "public auth pending timeout" })
        }
        return
      }

      setStatus("loading")
      return
    }

    if (!betterSession.data) {
      if (status !== "expired") {
        clearWorkspaceState()
        setStatus("anonymous")
        debugAuthTransition("anonymous", { reason: "no better-auth session" })
      }
      return
    }

    const signature = getSessionSignature(betterSession.data)
    if (signature && signature === validatedSignatureRef.current && user) return
    void refreshSession()
  }, [
    betterSession.data,
    betterSession.isPending,
    clearWorkspaceState,
    isCurrentAuthPath,
    ignoreStalledPublicAuthSession,
    refreshSession,
    status,
    user,
  ])

  // Better Auth owns session refetching. Keep profile loading single-shot to avoid dashboard loader loops.

  const logout = useCallback(async () => {
    clearWorkspaceState()
    setStatus("anonymous")
    setError("")
    await signOutSession()
    router.replace("/login")
  }, [clearWorkspaceState, router])

  const requireAuth = useCallback((nextPath = pathname) => {
    if (status === "authenticated") return true
    if (status === "loading") return false
    router.replace(buildLoginPath(nextPath))
    return false
  }, [pathname, router, status])

  const loginWithEmail = useCallback(async (input: LoginInput): Promise<AuthActionResult> => {
    setStatus("loading")
    setError("")
    const result = await signInWithEmail(input.email.trim(), input.password)
    if (!result.success) {
      setStatus("anonymous")
      setError(result.message)
      return result
    }

    const currentUser = await refreshSession()
    if (!currentUser) {
      return {
        success: false,
        message: lastRefreshErrorRef.current || error || "Connexion acceptée, mais la session API n'a pas pu être vérifiée. Réessayez dans quelques instants.",
      }
    }

    router.replace(sanitizeNextPath(input.nextPath))
    return { success: true }
  }, [error, refreshSession, router])

  const loginWithGoogle = useCallback(async (nextPath?: string | null): Promise<AuthActionResult> => {
    setError("")
    const target = sanitizeNextPath(nextPath)
    return signInWithGoogle(`${window.location.origin}${target}`)
  }, [])

  const registerWithEmail = useCallback(async (input: RegisterInput): Promise<AuthActionResult> => {
    setError("")
    const target = sanitizeNextPath(input.nextPath)
    const result = await registerWithEmailService({
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      password: input.password,
      callbackURL: `${window.location.origin}${target}`,
    })

    if (!result.success) {
      setError(result.message)
      return result
    }

    if ("verificationRequired" in result && result.verificationRequired) return result

    const currentUser = await refreshSession()
    if (!currentUser) return { success: false, message: error || "Compte créé, mais la session n'a pas pu être validée." }

    router.replace(target)
    return { success: true }
  }, [error, refreshSession, router])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    sessionLoading: (betterSession.isPending && !ignoreStalledPublicAuthSession) || status === "loading",
    profileLoading,
    isAuthenticated: status === "authenticated" && Boolean(user),
    isExpired: status === "expired",
    error,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    refreshSession,
    logout,
    requireAuth,
  }), [
    betterSession.isPending,
    error,
    ignoreStalledPublicAuthSession,
    loginWithEmail,
    loginWithGoogle,
    logout,
    profileLoading,
    refreshSession,
    registerWithEmail,
    requireAuth,
    status,
    user,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider")
  return value
}

export { loadingScreen }
