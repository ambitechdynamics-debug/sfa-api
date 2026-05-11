"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthShell, AuthLeftPitch } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Icon } from "@/components/ui/Icon"
import { authClient } from "@/lib/authClient"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: authError } = await authClient.signIn.email({
        email,
        password,
      })

      if (authError) {
        // Map known errors to user-friendly French messages without leaking details
        const msg = authError.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "Email ou mot de passe incorrect."
          : authError.code === "EMAIL_NOT_VERIFIED"
            ? "Veuillez vérifier votre adresse email avant de vous connecter."
            : "Connexion impossible. Veuillez réessayer."
        setError(msg)
        return
      }

      toast.success("Connexion réussie 👋")
      router.push("/dashboard")
    } catch {
      setError("Erreur de connexion au service d'authentification.")
    } finally {
      setLoading(false)
    }
  }

  async function signInWithGoogle() {
    setLoadingGoogle(true)
    try {
      const { error: authError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
      })
      if (authError) {
        setError(`Erreur Auth: ${authError.message || JSON.stringify(authError)}`)
        setLoadingGoogle(false)
      }
    } catch (e: any) {
      setError(`Erreur Catch: ${e.message || String(e)}`)
      setLoadingGoogle(false)
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

          {/* ── Google OAuth ── */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loadingGoogle || loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "11px 16px",
              background: "var(--bg-1)",
              border: "1px solid var(--line-1)",
              borderRadius: "var(--r-2)",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--ink-1)",
              cursor: loadingGoogle ? "not-allowed" : "pointer",
              opacity: loadingGoogle ? 0.7 : 1,
              transition: "background 0.15s, border-color 0.15s",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) => { if (!loadingGoogle) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-2)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-1)" }}
          >
            {loadingGoogle ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loadingGoogle ? "Redirection…" : "Continuer avec Google"}
          </button>

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
                  background: "var(--rose-soft)",
                  border: "1px solid rgba(217,112,112,0.3)",
                  borderRadius: "var(--r-2)",
                  fontSize: 13,
                  color: "var(--rose)",
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
