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
import {
  useUser as useClerkUser,
  useAuth as useClerkAuth,
  useSignIn,
  useSignUp,
} from "@clerk/nextjs"
import {
  AUTH_EXPIRED_EVENT,
  buildLoginPath,
  isAuthPath,
  isProtectedPath,
  readAuthExpiredDetail,
  sanitizeNextPath,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session-token"
import { signOutSession } from "@/services/auth.service"
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

function debugAuthTransition(phase: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[client-auth]", phase, details ?? {})
  }
}

function mapClerkSignInError(err: unknown): string {
  const error = err as { errors?: Array<{ code?: string; message?: string }>; message?: string } | undefined
  const first = error?.errors?.[0]
  const code = first?.code
  switch (code) {
    case "form_identifier_not_found":
      return "Aucun compte n'est associé à cette adresse."
    case "form_password_incorrect":
    case "form_password_pwned":
      return "Email ou mot de passe incorrect."
    case "form_identifier_exists":
      return "Un compte existe déjà avec cet email."
    case "form_password_length_too_short":
      return "Mot de passe trop court (8 caractères minimum)."
    case "form_param_format_invalid":
    case "form_param_nil":
      return "Format d'email ou de mot de passe invalide."
    case "session_exists":
      return "Une session est déjà active. Rechargez la page."
    default:
      return first?.message || error?.message || "Connexion impossible. Veuillez réessayer."
  }
}

function mapClerkSignUpError(err: unknown): string {
  const error = err as { errors?: Array<{ code?: string; message?: string }>; message?: string } | undefined
  const first = error?.errors?.[0]
  const code = first?.code
  switch (code) {
    case "form_identifier_exists":
      return "Un compte existe déjà avec cet email."
    case "form_password_length_too_short":
      return "Mot de passe trop court (8 caractères minimum)."
    case "form_password_pwned":
      return "Ce mot de passe a été compromis dans une fuite. Choisissez-en un autre."
    case "form_param_format_invalid":
      return "Format d'email invalide."
    default:
      return first?.message || error?.message || "Inscription impossible. Veuillez réessayer."
  }
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

  const { isLoaded: clerkUserLoaded, isSignedIn: clerkIsSignedIn } = useClerkUser()
  const { signOut: clerkSignOut } = useClerkAuth()
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn()
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp()

  const { user, setUser, clearProfile } = useAuthStore()
  const resetProjects = useProjectStore((state) => state.reset)
  const resetChat = useChatStore((state) => state.reset)

  const [status, setStatus] = useState<AuthStatus>("loading")
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState("")
  const lastSyncedClerkUserRef = useRef<string | null>(null)
  const lastRefreshErrorRef = useRef("")

  const clearWorkspaceState = useCallback(() => {
    clearProfile()
    resetProjects()
    resetChat()
    lastSyncedClerkUserRef.current = null
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
  }, [expireSession, setUser])

  useEffect(() => {
    function onAuthExpired(event: Event) {
      const detail = readAuthExpiredDetail(event)
      void expireSession(detail.message || SESSION_EXPIRED_MESSAGE)
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired)
  }, [expireSession])

  // Sync Clerk session state → backend profile.
  useEffect(() => {
    if (!clerkUserLoaded) {
      setStatus("loading")
      return
    }
    if (!clerkIsSignedIn) {
      if (status !== "expired") {
        clearWorkspaceState()
        setStatus("anonymous")
        debugAuthTransition("anonymous", { reason: "clerk reports signed-out" })
      }
      return
    }
    // Already loaded the backend profile for this Clerk session — no-op.
    if (status === "authenticated" && user && lastSyncedClerkUserRef.current === user.id) return
    void refreshSession().then((u) => {
      if (u) lastSyncedClerkUserRef.current = u.id
    })
  }, [clerkUserLoaded, clerkIsSignedIn, status, user, clearWorkspaceState, refreshSession])

  const logout = useCallback(async () => {
    clearWorkspaceState()
    setStatus("anonymous")
    setError("")
    try {
      await clerkSignOut()
    } catch {
      // ignore — Clerk may already be signed out
    }
    await signOutSession()
    router.replace("/login")
  }, [clearWorkspaceState, clerkSignOut, router])

  const requireAuth = useCallback((nextPath = pathname) => {
    if (status === "authenticated") return true
    if (status === "loading") return false
    router.replace(buildLoginPath(nextPath))
    return false
  }, [pathname, router, status])

  const loginWithEmail = useCallback(async (input: LoginInput): Promise<AuthActionResult> => {
    if (!signInLoaded || !signIn) {
      return { success: false, message: "Service d'authentification non prêt. Réessayez dans une seconde." }
    }
    setStatus("loading")
    setError("")
    try {
      const result = await signIn.create({ identifier: input.email.trim(), password: input.password })
      if (result.status !== "complete" || !result.createdSessionId) {
        setStatus("anonymous")
        const message = "Authentification incomplète. Vérification supplémentaire requise."
        setError(message)
        return { success: false, message }
      }
      await setActiveSignIn({ session: result.createdSessionId })
      const currentUser = await refreshSession()
      if (!currentUser) {
        return {
          success: false,
          message: lastRefreshErrorRef.current || "Connexion acceptée, mais la session API n'a pas pu être vérifiée.",
        }
      }
      router.replace(sanitizeNextPath(input.nextPath))
      return { success: true }
    } catch (err) {
      const message = mapClerkSignInError(err)
      setStatus("anonymous")
      setError(message)
      return { success: false, message }
    }
  }, [signInLoaded, signIn, setActiveSignIn, refreshSession, router])

  const loginWithGoogle = useCallback(async (nextPath?: string | null): Promise<AuthActionResult> => {
    if (!signInLoaded || !signIn) {
      return { success: false, message: "Service d'authentification non prêt. Réessayez dans une seconde." }
    }
    setError("")
    const target = sanitizeNextPath(nextPath)
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback?next=${encodeURIComponent(target)}`,
        redirectUrlComplete: `${window.location.origin}${target}`,
      })
      // authenticateWithRedirect navigates away — this return won't usually run.
      return { success: true }
    } catch (err) {
      const message = mapClerkSignInError(err)
      setError(message)
      return { success: false, message }
    }
  }, [signInLoaded, signIn])

  const registerWithEmail = useCallback(async (input: RegisterInput): Promise<AuthActionResult> => {
    if (!signUpLoaded || !signUp) {
      return { success: false, message: "Service d'authentification non prêt. Réessayez dans une seconde." }
    }
    setError("")
    const target = sanitizeNextPath(input.nextPath)
    try {
      const parts = input.fullName.trim().split(/\s+/)
      const firstName = parts[0] || undefined
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined
      await signUp.create({
        emailAddress: input.email.trim(),
        password: input.password,
        firstName,
        lastName,
      })
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      // Verification continues on /verify-email — caller handles the redirect.
      return { success: true, verificationRequired: true, email: input.email.trim() }
    } catch (err) {
      const message = mapClerkSignUpError(err)
      setError(message)
      return { success: false, message }
    }
    // setActiveSignUp is consumed by the verify-email page after the user
    // submits the code, not here.
    void setActiveSignUp
    void target
  }, [signUpLoaded, signUp, setActiveSignUp])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    sessionLoading: !clerkUserLoaded || status === "loading",
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
    clerkUserLoaded,
    error,
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
