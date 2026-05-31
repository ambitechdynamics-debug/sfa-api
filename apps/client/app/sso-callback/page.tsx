"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthenticateWithRedirectCallback, useClerk } from "@clerk/nextjs"

/**
 * Endpoint de retour OAuth pour Clerk (Google, Apple, etc.).
 * `<AuthenticateWithRedirectCallback />` consomme l'URL et redirige vers
 * `redirectUrlComplete` passé à `signIn.authenticateWithRedirect`.
 *
 * Si Clerk ne parvient pas à finaliser (provider down, refus utilisateur,
 * cookie tiers bloqué, etc.), il dépose les paramètres d'erreur dans l'URL
 * sans naviguer. On les détecte ici pour afficher un fallback explicite
 * plutôt qu'un écran blanc.
 *
 * Next 15+ exige que `useSearchParams()` soit dans un boundary <Suspense>
 * pour autoriser le pré-rendu statique de la page.
 */
export default function SSOCallbackPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SSOCallbackInner />
    </Suspense>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg-0)", color: "var(--ink-2)" }}>
      <div style={{ display: "grid", gap: 12, justifyItems: "center", fontSize: 14 }}>
        <span className="anim-spin" style={{ width: 28, height: 28, borderRadius: 999, border: "2px solid var(--line-3)", borderTopColor: "var(--acc)" }} />
        Finalisation de la connexion…
      </div>
    </div>
  )
}

// Délai avant d'afficher le fallback "Connexion interrompue".
//
// Un round-trip OAuth complet peut prendre plus de 20 s sur un réseau mobile
// lent ou un cold-start côté Clerk : token Google reçu → POST vers
// clerk.com pour échanger le code → mint d'une session → écriture des
// cookies. On laisse 60 s avant d'abandonner — si on coupe trop tôt, on
// affiche une erreur alors que Clerk était sur le point de finir, et le
// "Réessayer" reproduit le même problème.
const SSO_FALLBACK_TIMEOUT_MS = 60_000

function SSOCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loaded: clerkLoaded } = useClerk()
  const [timedOut, setTimedOut] = useState(false)

  const errorCode = searchParams.get("error_code") ?? searchParams.get("__clerk_error_code")
  const errorMessage = searchParams.get("error_description") ?? searchParams.get("error")
  const nextPath = searchParams.get("next") ?? "/dashboard"

  // Filet de sécurité : si après SSO_FALLBACK_TIMEOUT_MS on est toujours sur
  // cette page sans redirection ni paramètre d'erreur, on bascule sur le
  // fallback pour éviter une page vide.
  //
  // Important : on ne démarre le timer qu'une fois Clerk SDK chargé, sinon
  // on coupe alors que la vérification n'a même pas pu commencer (cas réseau
  // lent où le bundle Clerk met >10 s à arriver).
  useEffect(() => {
    if (errorCode || errorMessage) return
    if (!clerkLoaded) return
    const t = window.setTimeout(() => setTimedOut(true), SSO_FALLBACK_TIMEOUT_MS)
    return () => window.clearTimeout(t)
  }, [errorCode, errorMessage, clerkLoaded])

  if (errorCode || errorMessage || timedOut) {
    return (
      <SsoError
        code={errorCode}
        message={errorMessage}
        nextPath={nextPath}
        onRetry={() => router.push(`/login?next=${encodeURIComponent(nextPath)}`)}
      />
    )
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg-0)", color: "var(--ink-2)" }}>
      <div style={{ display: "grid", gap: 12, justifyItems: "center", fontSize: 14 }}>
        <span className="anim-spin" style={{ width: 28, height: 28, borderRadius: 999, border: "2px solid var(--line-3)", borderTopColor: "var(--acc)" }} />
        Finalisation de la connexion…
      </div>
      {/*
        On passe explicitement les URL de fallback à Clerk pour qu'il sache où
        renvoyer l'utilisateur s'il rencontre une erreur native (compte
        inexistant pour sign-in, sign-up incomplet, etc.) plutôt que de
        rester bloqué sur /sso-callback et déclencher notre timeout.
      */}
      <AuthenticateWithRedirectCallback
        signInUrl="/login"
        signUpUrl="/register"
        signInFallbackRedirectUrl={nextPath}
        signUpFallbackRedirectUrl={nextPath}
        continueSignUpUrl="/register"
      />
    </div>
  )
}


function SsoError({
  code,
  message,
  nextPath,
  onRetry,
}: {
  code: string | null
  message: string | null
  nextPath: string
  onRetry: () => void
}) {
  const display = friendlyMessage(code, message)
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg-0)", color: "var(--ink-0)", padding: 24 }}>
      <div style={{ maxWidth: 460, display: "grid", gap: 16, textAlign: "center" }}>
        <h1 className="display" style={{ margin: 0, fontSize: 28 }}>Connexion interrompue</h1>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6 }}>{display}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: "10px 18px",
              borderRadius: "var(--r-2)",
              background: "var(--acc)",
              color: "#fff",
              border: 0,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            style={{
              padding: "10px 18px",
              borderRadius: "var(--r-2)",
              border: "1px solid var(--line-2)",
              color: "var(--ink-0)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}

function friendlyMessage(code: string | null, raw: string | null): string {
  switch (code) {
    case "oauth_access_denied":
      return "Connexion annulée — vous avez refusé l'autorisation côté fournisseur."
    case "oauth_provider_unavailable":
    case "oauth_provider_not_enabled":
      return "Ce mode de connexion n'est pas disponible pour le moment. Réessayez avec un autre fournisseur."
    case "external_account_not_found":
      return "Aucun compte associé à cette adresse. Inscrivez-vous d'abord avec ce fournisseur."
    case "oauth_callback_invalid":
      return "Lien de connexion expiré ou invalide. Recommencez la connexion."
    default:
      return (
        raw ||
        "La connexion n'a pas abouti. Vérifiez que les cookies tiers sont autorisés pour ce site, puis réessayez. Si le problème persiste, essayez l'inscription par e-mail."
      )
  }
}
