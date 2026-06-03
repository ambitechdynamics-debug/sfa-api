"use client"

import { useEffect } from "react"

const GLOBAL_RECOVERY_KEY = "consilium:global-error-recovered-at"
const GLOBAL_RECOVERY_WINDOW_MS = 15_000

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("[global error boundary]", error)
    try {
      const last = Number(window.sessionStorage.getItem(GLOBAL_RECOVERY_KEY) ?? "0")
      const now = Date.now()
      if (now - last >= GLOBAL_RECOVERY_WINDOW_MS) {
        window.sessionStorage.setItem(GLOBAL_RECOVERY_KEY, String(now))
        window.location.reload()
      }
    } catch {
      window.location.reload()
    }
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#08080c", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <main
          role="status"
          aria-live="polite"
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 32,
            background:
              "radial-gradient(760px 520px at 50% 20%, rgba(139,92,246,.18), transparent 64%), #08080c",
          }}
        >
          <div style={{ width: "min(100%, 420px)", display: "grid", gap: 16, textAlign: "center" }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,.48)", font: "700 10px/1 ui-monospace, Menlo, monospace", letterSpacing: ".18em" }}>
              CONSILIUM
            </p>
            <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1 }}>Loading...</h1>
            <div style={{ height: 4, overflow: "hidden", background: "rgba(255,255,255,.10)", borderRadius: 999 }}>
              <span
                style={{
                  display: "block",
                  width: "45%",
                  height: "100%",
                  borderRadius: "inherit",
                  background: "linear-gradient(90deg, #8B5CF6, #EC4899 55%, #22D3EE)",
                }}
              />
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
