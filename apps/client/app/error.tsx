"use client"

import { useEffect } from "react"
import { ConsiliumPrismLogo } from "@/components/brand/ConsiliumPrismLogo"

const ROUTE_RECOVERY_KEY = "consilium:route-error-recovered-at"
const ROUTE_RECOVERY_WINDOW_MS = 15_000

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error boundary]", error)
    try {
      const last = Number(window.sessionStorage.getItem(ROUTE_RECOVERY_KEY) ?? "0")
      const now = Date.now()
      if (now - last < ROUTE_RECOVERY_WINDOW_MS) return
      window.sessionStorage.setItem(ROUTE_RECOVERY_KEY, String(now))
      reset()
      window.setTimeout(() => window.location.reload(), 80)
    } catch {
      reset()
    }
  }, [error, reset])

  return (
    <main className="csl-session-setup" role="status" aria-live="polite">
      <div className="csl-session-setup-panel">
        <ConsiliumPrismLogo size={62} className="csl-session-setup-logo" />
        <div className="csl-session-setup-copy">
          <p className="csl-session-setup-kicker">CONSILIUM</p>
          <h1>Loading your workspace...</h1>
          <p>Refreshing the page state.</p>
        </div>
        <div className="csl-session-setup-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </main>
  )
}
