"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { BrandMark } from "@/components/marketing/csl/icons"

interface AuthShellProps {
  /** Legacy split-pane prop — kept for compatibility, ignored in the new design. */
  left?: ReactNode
  /** Form content rendered in the centered Studio Flyer AI glass card. */
  right: ReactNode
}

/**
 * Studio Flyer AI auth shell (Win11-inspired chrome).
 * - Top bar with brand + secondary nav (← back home, support)
 * - Centered glass card (Win11 sign-in feel)
 * - Bottom legal row
 *
 * Existing auth pages keep their forms unchanged; only the wrapper changes.
 * The `left` prop is accepted but ignored (single-column layout now).
 */
export function AuthShell({ right }: AuthShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-top">
        <Link href="/" className="brand">
          <BrandMark size={28} />
          <span>Studio Flyer AI</span>
        </Link>
        <div className="top-right">
          <Link href="/">← Retour à l&apos;accueil</Link>
        </div>
      </div>

      <div className="auth-body">
        <div className="auth-card">
          <div className="auth-card-brand">
            <BrandMark size={44} />
          </div>
          {right}
        </div>
      </div>

      <div className="auth-legal">
        <span>© 2026 Studio Flyer AI · Ambitech Dynamics</span>
        <div className="auth-legal-links">
          <a href="#">Mentions</a>
          <a href="#">Confidentialité</a>
          <a href="#">Aide</a>
        </div>
      </div>
    </div>
  )
}

/**
 * Legacy pitch component — still exported so existing pages compile, but
 * returns null since the new shell is single-column.
 */
export function AuthLeftPitch() {
  return null
}
