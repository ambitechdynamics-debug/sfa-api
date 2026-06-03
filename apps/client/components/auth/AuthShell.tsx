"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ConsiliumPrismLogo } from "@/components/brand/ConsiliumPrismLogo"

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
      <div className="auth-bg-prism" aria-hidden="true">
        <ConsiliumPrismLogo size={360} label="" />
      </div>

      <div className="auth-top">
        <Link href="/" className="brand">
          <ConsiliumPrismLogo size={28} />
          <span>CONSILIUM</span>
        </Link>
        <div className="top-right">
          <Link href="/">Back home</Link>
        </div>
      </div>

      <div className="auth-body">
        <div className="auth-card">
          {right}
        </div>
      </div>

      <div className="auth-legal">
        <span>© 2026 Consilium · Ambitech Dynamics</span>
        <div className="auth-legal-links">
          <a href="#">Legal</a>
          <a href="#">Privacy</a>
          <a href="#">Help</a>
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
