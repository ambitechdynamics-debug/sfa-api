'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useClerk, useSignIn } from '@clerk/nextjs'
import { getMe } from '@/lib/auth'
import { cn } from '@/lib/utils'

/**
 * Admin sign-in page.
 * Authentication is handled by Clerk. The backend only accepts Clerk session
 * tokens, then checks the local User row for ADMIN privileges.
 */
export default function LoginPage() {
  const router = useRouter()
  const { signOut } = useClerk()
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function getErrorMessage(value: unknown) {
    return value instanceof Error ? value.message : String(value)
  }

  function mapClerkError(value: unknown) {
    const error = value as { errors?: Array<{ code?: string; message?: string }>; message?: string } | undefined
    const first = error?.errors?.[0]
    switch (first?.code) {
      case 'form_identifier_not_found':
      case 'form_password_incorrect':
        return 'Email ou mot de passe incorrect.'
      case 'form_param_format_invalid':
      case 'form_param_nil':
        return "Format d'email ou de mot de passe invalide."
      case 'session_exists':
        return 'Une session est déjà active. Rechargez la page.'
      default:
        return first?.message || error?.message || getErrorMessage(value)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      if (!signInLoaded || !signIn || !setActive) {
        setError("Service d'authentification non prêt. Réessayez dans une seconde.")
        return
      }

      const result = await signIn.create({
        identifier: email.trim(),
        password,
      })

      if (result.status !== 'complete' || !result.createdSessionId) {
        setError('Authentification incomplète. Vérification supplémentaire requise.')
        return
      }

      await setActive({ session: result.createdSessionId })

      const profile = await getMe()
      if (profile.role !== 'ADMIN') {
        await signOut()
        setError("Ce compte n'a pas les droits administrateur.")
        return
      }

      router.replace('/admin')
    } catch (e: unknown) {
      setError(mapClerkError(e))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0F172A]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--accent)] opacity-10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-800 opacity-10 blur-3xl" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-7 shadow-2xl">
          {error && (
            <div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[var(--accent)] focus:outline-none transition-colors"
                  placeholder="Saisissez votre adresse e-mail"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[var(--accent)] focus:outline-none transition-colors"
                  placeholder="Saisissez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full mt-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200',
                'bg-[var(--accent)] hover:bg-[var(--accent-hover)]',
                'shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2',
              )}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
