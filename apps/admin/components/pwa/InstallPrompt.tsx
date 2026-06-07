"use client"

import { useEffect, useState } from "react"

type DeferredPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "consilium-admin:pwa:install-dismissed-at"
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<DeferredPrompt | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [waitingReg, setWaitingReg] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
      if (Date.now() - dismissedAt < DISMISS_TTL_MS) return
      if (isStandalone()) return
      setDeferred(event as DeferredPrompt)
      setShowInstall(true)
    }
    const onAppInstalled = () => {
      setShowInstall(false)
      setDeferred(null)
    }
    const onSwUpdate = (event: Event) => {
      const reg = (event as CustomEvent<ServiceWorkerRegistration>).detail
      if (reg?.waiting) setWaitingReg(reg)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onAppInstalled)
    window.addEventListener("consilium-admin:sw:update", onSwUpdate)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onAppInstalled)
      window.removeEventListener("consilium-admin:sw:update", onSwUpdate)
    }
  }, [])

  async function triggerInstall() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setShowInstall(false)
  }

  function dismissInstall() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShowInstall(false)
  }

  function applyUpdate() {
    if (!waitingReg?.waiting) return
    waitingReg.waiting.postMessage({ type: "SKIP_WAITING" })
  }

  if (!showInstall && !waitingReg) return null

  return (
    <div className="admin-pwa-toast-stack">
      {waitingReg ? (
        <div className="admin-pwa-toast" role="status">
          <span className="admin-pwa-mark" aria-hidden>▲</span>
          <span className="admin-pwa-copy">A new admin version is ready.</span>
          <button type="button" className="admin-pwa-primary" onClick={applyUpdate}>
            Reload
          </button>
        </div>
      ) : null}

      {showInstall ? (
        <div className="admin-pwa-toast">
          <span className="admin-pwa-mark" aria-hidden>▲</span>
          <span className="admin-pwa-copy">
            <strong>Install Consilium Admin</strong>
            <small>Open faster and keep the admin shell available offline.</small>
          </span>
          <button type="button" className="admin-pwa-ghost" onClick={dismissInstall}>
            Later
          </button>
          <button type="button" className="admin-pwa-primary" onClick={() => void triggerInstall()}>
            Install
          </button>
        </div>
      ) : null}
    </div>
  )
}

function isStandalone() {
  if (typeof window === "undefined") return false
  const matchStandalone = window.matchMedia("(display-mode: standalone)").matches
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true
  return matchStandalone || iosStandalone
}
