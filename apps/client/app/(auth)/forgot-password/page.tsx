"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { AuthShell, AuthLeftPitch } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { authClient } from "@/lib/authClient"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const { error: authError } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      })

      if (authError) {
        // Better Auth errors mapping
        const msg = authError.code === "USER_NOT_FOUND" 
          ? "Aucun compte n'est associé à cette adresse e-mail."
          : authError.message || "Une erreur est survenue."
        setError(msg)
        return
      }

      setSuccess(true)
      toast.success("E-mail de réinitialisation envoyé !")
    } catch (err: any) {
      setError("Erreur lors de l'envoi de l'e-mail de réinitialisation.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      left={<AuthLeftPitch />}
      right={
        <div className="anim-fade-up">
          <h1 className="display" style={{ fontSize: 36, marginBottom: 8 }}>Mot de passe oublié ?</h1>
          <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 32 }}>
            Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
          </p>

          {success ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ 
                background: "rgba(16, 185, 129, 0.1)", 
                color: "#10b981", 
                padding: "16px", 
                borderRadius: "var(--r-2)",
                marginBottom: 24,
                fontSize: 14,
                lineHeight: 1.5
              }}>
                Si un compte existe pour <strong>{email}</strong>, un e-mail a été envoyé avec les instructions pour réinitialiser votre mot de passe.
              </div>
              <Link href="/login" style={{ width: "100%", display: "block" }}>
                <Button full variant="outline" size="lg">Retour à la connexion</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input
                label="Adresse e-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon="user"
                placeholder="vous@exemple.fr"
                required
                autoFocus
                autoComplete="email"
              />

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
                {loading ? "Envoi en cours…" : "Envoyer le lien"}
              </Button>

              <div style={{ textAlign: "center", marginTop: 8 }}>
                <Link
                  href="/login"
                  style={{
                    fontSize: 13,
                    color: "var(--ink-3)",
                    textDecoration: "none"
                  }}
                >
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      }
    />
  )
}
