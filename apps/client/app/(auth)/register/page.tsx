"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { AuthShell, AuthLeftPitch } from "@/components/auth/AuthShell"
import { OAuthButtons } from "@/components/auth/OAuthButtons"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuth } from "@/hooks/useAuth"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { registerWithEmail } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextPath = searchParams.get("next")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError("Le mot de passe doit faire 8 caractères minimum.")
      return
    }
    setLoading(true)
    try {
      const result = await registerWithEmail({ fullName, email, password, nextPath })
      if (!result.success) {
        setError(result.message)
        return
      }

      toast.success(`Compte créé. Bienvenue ${fullName.split(" ")[0]}`)
      if ("verificationRequired" in result && result.verificationRequired) {
        router.push(`/check-email?email=${encodeURIComponent(result.email)}`)
        return
      }
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
          <h1 className="display" style={{ fontSize: 36, marginBottom: 8 }}>
            Créez votre compte.
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 32 }}>
            3 générations gratuites pour découvrir l&apos;outil. Aucune carte requise.
          </p>

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
              label="Nom complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon="user"
              placeholder="Saisissez votre nom complet"
              required
              autoFocus
              autoComplete="name"
            />
            <Input
              label="Adresse e-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon="message"
              placeholder="Saisissez votre adresse e-mail"
              required
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon="lock"
              placeholder="Saisissez le mot de passe"
              required
              hint="8 caractères minimum"
              minLength={8}
              autoComplete="new-password"
            />

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
              {loading ? "Création du compte…" : "Créer mon compte"}
            </Button>
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
            Déjà un compte ?{" "}
            <Link href="/login" style={{ color: "var(--acc)", fontWeight: 500 }}>
              Se connecter
            </Link>
          </div>
        </div>
      }
    />
  )
}
