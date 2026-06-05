'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { loginAdmin } from '@/lib/auth'
import { ConsiliumPrismLogo } from '@/components/brand/ConsiliumPrismLogo'

/**
 * Admin sign-in page — Consilium identity (mirrors the client auth shell).
 * Authenticates against POST /api/auth/admin/login (email + password JWT).
 */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await loginAdmin(email.trim(), password)
      router.replace('/admin')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="csl-auth-page">
      <div className="csl-auth-bg-prism" aria-hidden="true">
        <ConsiliumPrismLogo size={360} label="" />
      </div>

      <div className="csl-auth-top">
        <Link href="/login" className="brand">
          <ConsiliumPrismLogo size={28} />
          <span>CONSILIUM</span>
        </Link>
        <div className="top-right">
          <span style={{ letterSpacing: '0.12em', fontSize: 11, textTransform: 'uppercase' }}>
            Administration
          </span>
        </div>
      </div>

      <div className="csl-auth-body">
        <div className="csl-auth-card">
          <div className="csl-auth-card-brand">
            <ConsiliumPrismLogo size={64} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>
                Administrator sign-in
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                Email and password are required.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                background: 'rgba(255,76,76,0.10)',
                border: '1px solid rgba(255,76,76,0.30)',
                fontSize: 13,
                color: '#ff9b9b',
                marginBottom: 18,
              }}
            >
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Email address</span>
              <span style={{ position: 'relative' }}>
                <Mail
                  style={{
                    width: 16,
                    height: 16,
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="you@studio-flyer.ai"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </span>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Password</span>
              <span style={{ position: 'relative' }}>
                <Lock
                  style={{
                    width: 16,
                    height: 16,
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 38px',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 28,
                    height: 28,
                    background: 'transparent',
                    border: 0,
                    color: 'rgba(255,255,255,0.45)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 8,
                padding: '12px 16px',
                background: '#4cc2ff',
                color: '#000',
                fontSize: 14,
                fontWeight: 600,
                border: 0,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.65 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background .2s ease',
              }}
            >
              {isLoading && (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(0,0,0,0.25)',
                    borderTopColor: '#000',
                    borderRadius: '50%',
                    animation: 'csl-spin 0.7s linear infinite',
                  }}
                />
              )}
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      <div className="csl-auth-legal">
        <span>© 2026 Consilium · Ambitech Dynamics</span>
        <div style={{ display: 'inline-flex', gap: 18 }}>
          <a href="#">Legal</a>
          <a href="#">Privacy</a>
          <a href="#">Help</a>
        </div>
      </div>

    </div>
  )
}
