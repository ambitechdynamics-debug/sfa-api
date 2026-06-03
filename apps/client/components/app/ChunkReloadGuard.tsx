"use client"

import { useEffect } from "react"

const RECOVERY_KEY = "consilium:client-route-reload-at"
const RECOVERY_WINDOW_MS = 15_000

function errorText(reason: unknown) {
  if (reason instanceof Error) return `${reason.name} ${reason.message} ${reason.stack ?? ""}`
  if (typeof reason === "string") return reason
  if (reason && typeof reason === "object" && "message" in reason) {
    return String((reason as { message?: unknown }).message ?? "")
  }
  return String(reason ?? "")
}

function isRecoverablePageLoadError(reason: unknown) {
  const text = errorText(reason)
  return /ChunkLoadError|Loading chunk|failed to fetch dynamically imported module|importing a module script failed|_next\/static|RSC payload|NetworkError when attempting to fetch resource/i.test(text)
}

function reloadOnce() {
  try {
    const last = Number(window.sessionStorage.getItem(RECOVERY_KEY) ?? "0")
    const now = Date.now()
    if (now - last < RECOVERY_WINDOW_MS) return
    window.sessionStorage.setItem(RECOVERY_KEY, String(now))
  } catch {
    // sessionStorage can be unavailable in hardened browsers; reloading is still safe.
  }
  window.location.reload()
}

export function ChunkReloadGuard() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isRecoverablePageLoadError(event.error || event.message || event.filename)) {
        event.preventDefault()
        reloadOnce()
      }
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isRecoverablePageLoadError(event.reason)) {
        event.preventDefault()
        reloadOnce()
      }
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}
