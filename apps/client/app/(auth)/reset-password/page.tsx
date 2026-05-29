"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useSignIn } from "@clerk/nextjs"
import { AuthShell, AuthLeftPitch } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Icon } from "@/components/ui/Icon"

function ResetPasswordForm() {
  const router = useRouter()
  const { signIn, setActive, isLoaded } = useSignIn()

  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const email = window.sessionStorage.getItem("sfa.reset.email")
    if (email) setHint(`Code envoyé à ${email}.`)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded || !signIn) {
      setError("Service d'authentification non prêt. Réessayez dans une seconde.")
      return
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    setError(null)
    setLoading(true)

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password,
      })

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId })
        if (typeof window !== "undefined") window.sessionStorage.removeItem("sfa.reset.email")
        toast.success("Mot de passe réinitialisé !")
        router.push("/dashboard")
        return
      }

      setError("Code invalide ou expiré. Demandez un nouveau lien.")
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ code?: string; message?: string }> } | undefined
      const first = e?.errors?.[0]
      const code = first?.code
      if (code === "form_code_incorrect" || code === "verification_failed") {
        setError("Code invalide. Vérifiez votre email.")
      } else if (code === "form_password_pwned") {
        setError("Ce mot de passe a été compromis dans une fuite. Choisissez-en un autre.")
      } else if (code === "form_password_length_too_short") {
        setError("Mot de passe trop court (8 caractères minimum).")
      } else {
        setError(first?.message || "Erreur lors de la réinitialisation du mot de passe.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Input
        label="Code reçu par email"
        type="text"
        inputMode="numeric"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        icon="lock"
        placeholder="123456"
        required
        autoFocus
        autoComplete="one-time-code"
      />

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

      {hint && (
        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{hint}</div>
      )}

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

      <div style={{ textAlign: "center", marginTop: 8 }}>
        <Link
          href="/forgot-password"
          style={{ fontSize: 13, color: "var(--ink-3)", textDecoration: "none" }}
        >
          Renvoyer un code
        </Link>
      </div>
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
            Entrez le code reçu par email puis choisissez un mot de passe sécurisé.
          </p>

          <Suspense fallback={<div>Chargement...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      }
    />
  )
}
