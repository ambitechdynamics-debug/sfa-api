"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSignUp } from "@clerk/nextjs"
import { AuthShell, AuthLeftPitch } from "@/components/auth/AuthShell"
import { BrandMark } from "@/components/ui/BrandMark"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { Input } from "@/components/ui/Input"
import { useAuth } from "@/hooks/useAuth"

function normalizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6)
}

function otpErrorMessage(code?: string): string {
  switch (code) {
    case "form_code_incorrect":
    case "verification_failed":
      return "Code incorrect. Vérifiez les 6 chiffres reçus par e-mail."
    case "verification_expired":
      return "Ce code a expiré. Demandez un nouveau code."
    case "too_many_requests":
      return "Trop de tentatives. Patientez quelques minutes puis réessayez."
    default:
      return "Impossible de vérifier ce code. Veuillez réessayer."
  }
}

export function CheckEmailForm({ email }: { email: string }) {
  const router = useRouter()
  const { refreshSession } = useAuth()
  const { signUp, setActive, isLoaded } = useSignUp()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const otp = normalizeCode(code)
    if (!email) {
      setError("Adresse e-mail manquante. Reprenez l'inscription.")
      return
    }
    if (otp.length !== 6) {
      setError("Saisissez le code à 6 chiffres.")
      return
    }
    if (!isLoaded || !signUp) {
      setError("Service d'authentification non prêt. Réessayez dans une seconde.")
      return
    }

    setIsVerifying(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: otp })

      if (result.status !== "complete" || !result.createdSessionId) {
        setError("Code incorrect. Vérifiez les 6 chiffres reçus par e-mail.")
        return
      }

      await setActive({ session: result.createdSessionId })
      toast.success("Adresse e-mail confirmée.")
      await refreshSession()
      router.push("/dashboard")
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ code?: string }> } | undefined
      setError(otpErrorMessage(e?.errors?.[0]?.code))
    } finally {
      setIsVerifying(false)
    }
  }

  async function resendCode() {
    setError(null)
    if (!email) {
      setError("Adresse e-mail manquante. Reprenez l'inscription.")
      return
    }
    if (!isLoaded || !signUp) {
      setError("Service d'authentification non prêt.")
      return
    }

    setIsResending(true)
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      toast.success("Nouveau code envoyé.")
    } catch {
      setError("Impossible de renvoyer le code maintenant.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthShell
      left={<AuthLeftPitch />}
      right={
        <div className="anim-fade-up">
          <div style={{ marginBottom: 28 }}>
            <BrandMark size={26} />
          </div>

          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--acc-deep)",
              background: "rgba(224, 138, 100, 0.14)",
              border: "1px solid rgba(224, 138, 100, 0.28)",
              marginBottom: 24,
            }}
          >
            <Icon name="message" size={24} />
          </div>

          <h1 className="display" style={{ fontSize: 34, marginBottom: 12 }}>
            Entrez le code reçu.
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            Nous avons envoyé un code de 6 chiffres
            {email ? (
              <>
                {" "}
                à <strong style={{ color: "var(--ink-0)", fontWeight: 600 }}>{email}</strong>
              </>
            ) : null}
            .
          </p>

          <form onSubmit={verifyCode} style={{ display: "grid", gap: 16 }}>
            <Input
              label="Code de confirmation"
              value={code}
              onChange={(e) => setCode(normalizeCode(e.target.value))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              icon="lock"
              required
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 22,
                letterSpacing: "0.28em",
                textAlign: "center",
              }}
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

            <Button type="submit" size="lg" full disabled={isVerifying || code.length !== 6}>
              {isVerifying ? "Vérification…" : "Confirmer mon compte"}
            </Button>
          </form>

          <div style={{ display: "grid", gap: 10, marginTop: 20, textAlign: "center" }}>
            <button
              type="button"
              onClick={resendCode}
              disabled={isResending}
              style={{
                background: "transparent",
                border: 0,
                color: "var(--acc)",
                cursor: isResending ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                opacity: isResending ? 0.55 : 1,
              }}
            >
              {isResending ? "Envoi du code…" : "Renvoyer un code"}
            </button>
            <Link href="/register" style={{ color: "var(--ink-3)", textDecoration: "none", fontSize: 13 }}>
              Utiliser une autre adresse
            </Link>
          </div>
        </div>
      }
    />
  )
}
