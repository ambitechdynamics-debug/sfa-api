"use client"

import { useEffect } from "react"

/**
 * Register the PWA service worker on first paint.
 *
 * Side effects:
 *   - In production, registers /sw.js with scope "/".
 *   - When a new SW is waiting, dispatches a `sfa:sw:update` window event with
 *     the waiting registration as detail — InstallPrompt listens to it and
 *     shows the "Update ready" toast.
 *   - In development, actively unregisters any previously-registered SW to
 *     avoid serving stale cached pages from a prior `next start` session.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const isProd = process.env.NODE_ENV === "production"

    if (!isProd) {
      // Dev mode: kill any stale SW so HMR / fast refresh aren't masked.
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => void r.unregister())
      })
      return
    }

    let cleanup: (() => void) | undefined

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })

        // If there's already a waiting worker on first load, announce it.
        if (reg.waiting && navigator.serviceWorker.controller) {
          dispatchUpdate(reg)
        }

        const onUpdateFound = () => {
          const sw = reg.installing
          if (!sw) return
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              dispatchUpdate(reg)
            }
          })
        }
        reg.addEventListener("updatefound", onUpdateFound)

        // Reload once the new SW takes over.
        let refreshing = false
        const onControllerChange = () => {
          if (refreshing) return
          refreshing = true
          window.location.reload()
        }
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

        cleanup = () => {
          reg.removeEventListener("updatefound", onUpdateFound)
          navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[sw] registration failed", err)
        }
      }
    }

    // Wait for load to keep TTI clean.
    if (document.readyState === "complete") void register()
    else window.addEventListener("load", () => void register(), { once: true })

    return () => cleanup?.()
  }, [])

  return null
}

function dispatchUpdate(reg: ServiceWorkerRegistration) {
  window.dispatchEvent(new CustomEvent("sfa:sw:update", { detail: reg }))
}
