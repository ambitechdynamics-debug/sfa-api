"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { AuthShell, AuthLeftPitch } from "@/components/auth/AuthShell"
import { OAuthButtons } from "@/components/auth/OAuthButtons"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Icon } from "@/components/ui/Icon"
import { useAuth } from "@/hooks/useAuth"
import { SESSION_EXPIRED_MESSAGE } from "@/lib/session-token"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const { loginWithEmail } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextPath = searchParams.get("next")
  const reason = searchParams.get("reason")
  const verified = searchParams.get("verified")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await loginWithEmail({ email, password, nextPath })
      if (!result.success) {
        setError(result.message)
        return
      }

      toast.success("Connexion réussie")
    } catch {
      setError("Erreur de connexion au service d'authentification.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      left={<AuthLeftPitch />}
      right={
        <div className="anim-fade-up">
          <h1 className="display" style={{ fontSize: 36, marginBottom: 8 }}>Bon retour.</h1>
          <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 32 }}>
            Connectez-vous pour accéder à vos projets et continuer à créer.
          </p>

          {(reason === "expired" || verified === "1") && (
            <div
              role="status"
              style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "var(--r-2)",
                fontSize: 13,
                color: "#fff",
                marginBottom: 18,
              }}
            >
              {reason === "expired" ? SESSION_EXPIRED_MESSAGE : "Adresse e-mail confirmée. Vous pouvez vous connecter."}
            </div>
          )}

          {/* ── Social OAuth (Google + Apple via Clerk) ── */}
          <OAuthButtons nextPath={nextPath} onError={setError} disabled={loading} />

          {/* ── Divider ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--line-1)" }} />
            <span style={{ fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>ou par e-mail</span>
            <div style={{ flex: 1, height: 1, background: "var(--line-1)" }} />
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input
              label="Adresse e-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon="user"
              placeholder="Saisissez votre adresse e-mail"
              required
              autoFocus
              autoComplete="email"
            />

            <div style={{ position: "relative" }}>
              <Input
                label="Mot de passe"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon="lock"
                placeholder="Saisissez votre mot de passe"
                required
                minLength={8}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={{
                  position: "absolute",
                  right: 10,
                  bottom: 9,
                  width: 28,
                  height: 28,
                  background: "transparent",
                  border: 0,
                  color: "var(--ink-3)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
              </button>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  padding: "10px 12px",
                  background: "rgba(255,50,50,0.1)",
                  border: "1px solid rgba(255,50,50,0.3)",
                  borderRadius: "var(--r-2)",
                  fontSize: 13,
                  color: "rgba(255,100,100,0.9)",
                }}
              >
                {error}
              </div>
            )}

            <Button type="submit" size="lg" full disabled={loading}>
              {loading ? "Connexion en cours…" : "Se connecter"}
            </Button>

            <Link
              href="/forgot-password"
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Mot de passe oublié ?
            </Link>
          </form>

          <div
            style={{
              marginTop: 24,
              paddingTop: 24,
              borderTop: "1px solid var(--line-1)",
              textAlign: "center",
              fontSize: 13,
              color: "var(--ink-2)",
            }}
          >
            Pas encore de compte ?{" "}
            <Link href="/register" style={{ color: "var(--acc)", fontWeight: 500 }}>
              Créer un compte
            </Link>
          </div>
        </div>
      }
    />
  )
}
