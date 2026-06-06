"use client"

import { useCallback, useEffect, useState } from "react"

type DeferredPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "consilium:pwa:install-dismissed-at"
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

/**
 * Tiny PWA UX surface, mounted once in the root layout.
 *
 *   1. Captures `beforeinstallprompt` (Android / desktop Chrome) and shows a
 *      discreet bottom card with an "Install" CTA. Dismissed for 7 days.
 *   2. Listens for `consilium:sw:update` (fired by ServiceWorkerRegister) and shows
 *      an "Update ready — reload" toast. Tapping it tells the waiting SW to
 *      skip waiting; the page reloads automatically via controllerchange.
 *
 * On iOS Safari there is no `beforeinstallprompt` — we don't fake an install
 * banner there; users add via the Share sheet manually.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<DeferredPrompt | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [waitingReg, setWaitingReg] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
      if (Date.now() - dismissedAt < DISMISS_TTL_MS) return
      if (isStandalone()) return
      setDeferred(e as DeferredPrompt)
      setShowInstall(true)
    }
    const onAppInstalled = () => {
      setShowInstall(false)
      setDeferred(null)
    }
    const onSwUpdate = (e: Event) => {
      const reg = (e as CustomEvent<ServiceWorkerRegistration>).detail
      if (reg && reg.waiting) setWaitingReg(reg)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onAppInstalled)
    window.addEventListener("consilium:sw:update", onSwUpdate)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onAppInstalled)
      window.removeEventListener("consilium:sw:update", onSwUpdate)
    }
  }, [])

  const triggerInstall = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setShowInstall(false)
  }, [deferred])

  const dismissInstall = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShowInstall(false)
  }, [])

  const applyUpdate = useCallback(() => {
    if (!waitingReg?.waiting) return
    waitingReg.waiting.postMessage({ type: "SKIP_WAITING" })
    // ServiceWorkerRegister listens for `controllerchange` and reloads the page.
  }, [waitingReg])

  if (!showInstall && !waitingReg) return null

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "12px max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))",
        pointerEvents: "none",
      }}
    >
      {waitingReg ? (
        <div
          role="status"
          style={{
            pointerEvents: "auto",
            margin: "0 auto",
            maxWidth: 460,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 14,
            background: "color-mix(in srgb, var(--bg-2) 92%, transparent)",
            color: "var(--ink-0)",
            border: "1px solid var(--line-2)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            fontSize: 14,
          }}
        >
          <span aria-hidden style={{ fontSize: 18 }}>✦</span>
          <span style={{ flex: 1, minWidth: 0 }}>A new version is ready.</span>
          <button
            type="button"
            onClick={applyUpdate}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid var(--ink-0)",
              background: "var(--ink-0)",
              color: "var(--bg-0)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
              minHeight: 36,
            }}
          >
            Reload
          </button>
        </div>
      ) : null}

      {showInstall ? (
        <div
          style={{
            pointerEvents: "auto",
            margin: "0 auto",
            maxWidth: 460,
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 14,
            background: "color-mix(in srgb, var(--bg-2) 92%, transparent)",
            color: "var(--ink-0)",
            border: "1px solid var(--line-2)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--bg-3)",
              border: "1px solid var(--line-2)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            ▲
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Install Consilium Design</div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>
              Faster launch, works offline.
            </div>
          </div>
          <button
            type="button"
            onClick={dismissInstall}
            aria-label="Dismiss"
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid transparent",
              background: "transparent",
              color: "var(--ink-2)",
              cursor: "pointer",
              fontSize: 13,
              minHeight: 36,
            }}
          >
            Later
          </button>
          <button
            type="button"
            onClick={triggerInstall}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid var(--ink-0)",
              background: "var(--ink-0)",
              color: "var(--bg-0)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
              minHeight: 36,
            }}
          >
            Install
          </button>
        </div>
      ) : null}
    </div>
  )
}

function isStandalone() {
  if (typeof window === "undefined") return false
  const matchStandalone =
    window.matchMedia && window.matchMedia("(display-mode: standalone)").matches
  // iOS exposes `navigator.standalone` instead of display-mode.
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true
  return matchStandalone || iosStandalone
}
