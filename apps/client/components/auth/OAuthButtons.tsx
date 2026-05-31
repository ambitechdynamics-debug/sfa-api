"use client"

import { useState } from "react"
import { useAuth, type OAuthStrategy } from "@/hooks/useAuth"

type Props = {
  /** URL où renvoyer après authentification réussie (ex: "/dashboard"). */
  nextPath?: string | null
  /** Callback invoqué quand un provider échoue (pour afficher l'erreur). */
  onError?: (message: string) => void
  /** Désactive tous les boutons (ex: pendant la soumission du form e-mail). */
  disabled?: boolean
  /** Strategies à afficher. Défaut: Google + Apple. */
  providers?: OAuthStrategy[]
}

const LABELS: Record<OAuthStrategy, string> = {
  oauth_google: "Continuer avec Google",
  oauth_apple: "Continuer avec Apple",
  oauth_github: "Continuer avec GitHub",
  oauth_facebook: "Continuer avec Facebook",
}

const LOADING_LABEL = "Redirection…"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function AppleIcon() {
  // Apple's official logo, white fill — matches the dark button background.
  // Source: simpleicons.org/icons/apple.svg (CC0).
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        fill="#fff"
      />
    </svg>
  )
}

const ICONS: Partial<Record<OAuthStrategy, () => React.ReactElement>> = {
  oauth_google: GoogleIcon,
  oauth_apple: AppleIcon,
}

// Variantes visuelles par provider — Apple impose un fond noir #000 dans ses
// HIG, Google recommande blanc/gris clair. Ici on garde le style sombre du
// produit mais on accentue Apple en noir pur pour rester proche des guidelines.
const STYLES: Record<OAuthStrategy, { bg: string; border: string; hover: string }> = {
  oauth_google: {
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.1)",
    hover: "rgba(255,255,255,0.08)",
  },
  oauth_apple: {
    bg: "#000",
    border: "rgba(255,255,255,0.25)",
    hover: "#111",
  },
  oauth_github: {
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.1)",
    hover: "rgba(255,255,255,0.08)",
  },
  oauth_facebook: {
    bg: "#1877F2",
    border: "#1877F2",
    hover: "#166FE5",
  },
}

export function OAuthButtons({ nextPath, onError, disabled, providers = ["oauth_google", "oauth_apple"] }: Props) {
  const { loginWithOAuth } = useAuth()
  const [pending, setPending] = useState<OAuthStrategy | null>(null)

  async function handleClick(strategy: OAuthStrategy) {
    if (pending) return
    setPending(strategy)
    try {
      const result = await loginWithOAuth(strategy, nextPath)
      if (!result.success) {
        onError?.(result.message)
        setPending(null)
      }
      // En cas de succès Clerk redirige, donc setPending(null) n'arrivera pas.
    } catch {
      onError?.("Connexion impossible. Veuillez réessayer.")
      setPending(null)
    }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {providers.map((strategy) => {
        const Icon = ICONS[strategy]
        const style = STYLES[strategy]
        const isPending = pending === strategy
        const isDisabled = Boolean(disabled) || (pending !== null && pending !== strategy)

        return (
          <button
            key={strategy}
            type="button"
            onClick={() => handleClick(strategy)}
            disabled={isDisabled || isPending}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "11px 16px",
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: "var(--r-2)",
              fontSize: 14,
              fontWeight: 500,
              color: "#fff",
              cursor: isPending || isDisabled ? "not-allowed" : "pointer",
              opacity: isPending || isDisabled ? 0.7 : 1,
              transition: "background 0.15s, border-color 0.15s",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) => {
              if (!isPending && !isDisabled) (e.currentTarget as HTMLButtonElement).style.background = style.hover
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = style.bg
            }}
            aria-label={LABELS[strategy]}
          >
            {isPending ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ animation: "spin 0.8s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeLinecap="round" />
              </svg>
            ) : Icon ? (
              <Icon />
            ) : null}
            {isPending ? LOADING_LABEL : LABELS[strategy]}
          </button>
        )
      })}
    </div>
  )
}
