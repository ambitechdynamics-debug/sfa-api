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
import { ConsiliumPrismLogo } from "@/components/brand/ConsiliumPrismLogo"
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

// Strategies Clerk supportées. Pour en ajouter, vérifier qu'elle est aussi
// activée dans /apps → User & Authentication → Social Connections sur le
// dashboard Clerk, sinon `authenticateWithRedirect` retourne
// `oauth_provider_unavailable`.
export type OAuthStrategy = "oauth_google" | "oauth_apple" | "oauth_github" | "oauth_facebook"

type AuthContextValue = {
  user: User | null
  status: AuthStatus
  signInReady: boolean
  signUpReady: boolean
  sessionLoading: boolean
  profileLoading: boolean
  isAuthenticated: boolean
  isExpired: boolean
  error: string
  loginWithEmail: (input: LoginInput) => Promise<AuthActionResult>
  loginWithOAuth: (strategy: OAuthStrategy, nextPath?: string | null) => Promise<AuthActionResult>
  /** @deprecated utiliser loginWithOAuth("oauth_google") */
  loginWithGoogle: (nextPath?: string | null) => Promise<AuthActionResult>
  /** @deprecated utiliser loginWithOAuth("oauth_apple") */
  loginWithApple: (nextPath?: string | null) => Promise<AuthActionResult>
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
    // ─── OAuth-specific Clerk error codes ───────────────────────────────
    case "oauth_provider_not_enabled":
    case "oauth_provider_unavailable":
      return "Ce mode de connexion n'est pas activé. Contactez le support."
    case "oauth_access_denied":
      return "Connexion annulée par le fournisseur."
    case "oauth_email_domain_reserved_by_saml":
      return "Cette adresse est gérée par votre organisation. Utilisez la connexion SSO."
    case "external_account_not_found":
      return "Aucun compte associé. Inscrivez-vous d'abord avec cette adresse."
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

function loadingScreen(_message = "Setting up your Consilium workspace...") {
  // Minimal, calm loader: just the brand mark centered on a dark canvas
  // with a hairline progress bar. Intentionally no copy, no step list.
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#0B0B0F",
        zIndex: 9999,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <ConsiliumPrismLogo size={72} className="csl-loader-logo" label="Consilium" />
        <div
          aria-hidden="true"
          style={{
            width: 96,
            height: 2,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
            position: "relative",
            borderRadius: 1,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: "40%",
              background: "linear-gradient(90deg, #8B5CF6, #EC4899, #22D3EE)",
              animation: "csl-loader-slide 1.4s ease-in-out infinite",
              borderRadius: 1,
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes csl-loader-slide {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
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

  const expireSession = useCallback(async (_message = SESSION_EXPIRED_MESSAGE) => {
    clearWorkspaceState()
    setStatus("anonymous")
    setError("")
    await signOutSession()
    try {
      await clerkSignOut()
    } catch {
      // Clerk may already be signed out — ignore.
    }
    // Quietly send the user back to /login. The login page strips the
    // `reason=expired` param on mount so they see a clean form and no
    // "session expired" banner; no toast is shown on public pages either.
    if (isProtectedPath(pathname)) {
      router.replace("/login")
    }
  }, [clearWorkspaceState, clerkSignOut, pathname, router])

  const handleBackendAuthRejection = useCallback(async (reason?: unknown) => {
    const message =
      reason instanceof Error && reason.message
        ? reason.message
        : "La session Clerk est active, mais l'API n'a pas encore pu la valider. Réessayez dans un instant."

    if (clerkIsSignedIn) {
      debugAuthTransition("backend auth rejected while Clerk is signed in, clearing session", { message })
      await expireSession(message || SESSION_EXPIRED_MESSAGE)
      return
    }

    await expireSession(message || SESSION_EXPIRED_MESSAGE)
  }, [clerkIsSignedIn, expireSession])

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
        debugAuthTransition("backend auth rejected", { status: reason.status })
        lastRefreshErrorRef.current = reason.message || SESSION_EXPIRED_MESSAGE
        await handleBackendAuthRejection(reason)
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
  }, [handleBackendAuthRejection, setUser])

  useEffect(() => {
    function onAuthExpired(event: Event) {
      const detail = readAuthExpiredDetail(event)
      if (clerkIsSignedIn) {
        void refreshSession()
        return
      }
      void expireSession(detail.message || SESSION_EXPIRED_MESSAGE)
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired)
  }, [clerkIsSignedIn, expireSession, refreshSession])

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
      // Clerk throws `session_exists` when the user is already signed in on
      // this device. Treat that existing Clerk cookie as untrusted until the
      // backend profile check confirms it; otherwise the dashboard can land on
      // a half-valid session and show the recovery screen indefinitely.
      const code = (err as { errors?: Array<{ code?: string }> })?.errors?.[0]?.code
      if (code === "session_exists") {
        const currentUser = await refreshSession()
        if (!currentUser) {
          return {
            success: false,
            message: lastRefreshErrorRef.current || "Session existante invalide. Reconnectez-vous.",
          }
        }
        router.replace(sanitizeNextPath(input.nextPath))
        return { success: true }
      }
      const message = mapClerkSignInError(err)
      setStatus("anonymous")
      setError(message)
      return { success: false, message }
    }
  }, [signInLoaded, signIn, setActiveSignIn, refreshSession, router])

  const loginWithOAuth = useCallback(async (strategy: OAuthStrategy, nextPath?: string | null): Promise<AuthActionResult> => {
    if (!signInLoaded || !signIn) {
      return { success: false, message: "Service d'authentification non prêt. Réessayez dans une seconde." }
    }
    setError("")
    const target = sanitizeNextPath(nextPath)
    try {
      await signIn.authenticateWithRedirect({
        strategy,
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

  const loginWithGoogle = useCallback(
    (nextPath?: string | null) => loginWithOAuth("oauth_google", nextPath),
    [loginWithOAuth],
  )
  const loginWithApple = useCallback(
    (nextPath?: string | null) => loginWithOAuth("oauth_apple", nextPath),
    [loginWithOAuth],
  )

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
      // setActiveSignUp is consumed by /check-email after the user submits the
      // 6-digit code, not here. `target` is forwarded via the URL of /check-email.
      void setActiveSignUp
      void target
      return { success: true, verificationRequired: true, email: input.email.trim() }
    } catch (err) {
      const message = mapClerkSignUpError(err)
      setError(message)
      return { success: false, message }
    }
  }, [signUpLoaded, signUp, setActiveSignUp])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    signInReady: Boolean(signInLoaded && signIn),
    signUpReady: Boolean(signUpLoaded && signUp),
    sessionLoading: !clerkUserLoaded || status === "loading",
    profileLoading,
    isAuthenticated: status === "authenticated" && Boolean(user),
    isExpired: status === "expired",
    error,
    loginWithEmail,
    loginWithOAuth,
    loginWithGoogle,
    loginWithApple,
    registerWithEmail,
    refreshSession,
    logout,
    requireAuth,
  }), [
    clerkUserLoaded,
    error,
    loginWithEmail,
    loginWithOAuth,
    loginWithGoogle,
    loginWithApple,
    logout,
    profileLoading,
    refreshSession,
    registerWithEmail,
    requireAuth,
    signIn,
    signInLoaded,
    signUp,
    signUpLoaded,
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
