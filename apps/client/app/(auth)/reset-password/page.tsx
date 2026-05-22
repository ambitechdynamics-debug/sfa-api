"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { AuthShell, AuthLeftPitch } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Icon } from "@/components/ui/Icon"
import { authClient } from "@/lib/authClient"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      setError("Jeton de réinitialisation manquant ou invalide.")
      return
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    
    setError(null)
    setLoading(true)
    
    try {
      const { error: authError } = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (authError) {
        setError(authError.message || "Une erreur est survenue.")
        return
      }

      toast.success("Mot de passe réinitialisé ! Vous pouvez vous connecter.")
      router.push("/login")
    } catch (err: any) {
      setError("Erreur lors de la réinitialisation du mot de passe.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={{ textAlign: "center" }}>
        <h1 className="display" style={{ fontSize: 32, marginBottom: 16 }}>Lien invalide</h1>
        <p style={{ color: "var(--ink-2)", marginBottom: 32 }}>
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <Link href="/forgot-password" style={{ width: "100%", display: "block" }}>
          <Button full variant="outline">Demander un nouveau lien</Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ position: "relative" }}>
        <Input
          label="Nouveau mot de passe"
          type={showPw ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon="lock"
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
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

      <Input
        label="Confirmer le mot de passe"
        type={showPw ? "text" : "password"}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        icon="lock"
        placeholder="••••••••"
        required
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
        {loading ? "Réinitialisation…" : "Changer le mot de passe"}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      left={<AuthLeftPitch />}
      right={
        <div className="anim-fade-up">
          <h1 className="display" style={{ fontSize: 36, marginBottom: 8 }}>Nouveau mot de passe</h1>
          <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 32 }}>
            Choisissez un mot de passe sécurisé pour votre compte.
          </p>

          <Suspense fallback={<div>Chargement...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      }
    />
  )
}
