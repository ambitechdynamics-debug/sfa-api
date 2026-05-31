"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

/**
 * Endpoint de retour OAuth pour Clerk (Google, Apple, etc.).
 * `<AuthenticateWithRedirectCallback />` consomme l'URL et redirige vers
 * `redirectUrlComplete` passé à `signIn.authenticateWithRedirect`.
 *
 * Si Clerk ne parvient pas à finaliser (provider down, refus utilisateur,
 * cookie tiers bloqué, etc.), il dépose les paramètres d'erreur dans l'URL
 * sans naviguer. On les détecte ici pour afficher un fallback explicite
 * plutôt qu'un écran blanc.
 */
export default function SSOCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [timedOut, setTimedOut] = useState(false)

  const errorCode = searchParams.get("error_code") ?? searchParams.get("__clerk_error_code")
  const errorMessage = searchParams.get("error_description") ?? searchParams.get("error")
  const nextPath = searchParams.get("next") ?? "/dashboard"

  // Filet de sécurité : si après 15s on est toujours sur cette page sans
  // redirection ni paramètre d'erreur, on bascule sur le fallback. Sans ça,
  // l'utilisateur voit une page vide.
  useEffect(() => {
    if (errorCode || errorMessage) return
    const t = window.setTimeout(() => setTimedOut(true), 15_000)
    return () => window.clearTimeout(t)
  }, [errorCode, errorMessage])

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
      <AuthenticateWithRedirectCallback />
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
        "La vérification a pris trop de temps ou a échoué. Vérifiez que les cookies tiers sont activés puis recommencez."
      )
  }
}
