"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { trackUxEvent } from "@/lib/ux-metrics"

export function RouteMetricsTracker() {
  const pathname = usePathname()
  const previousPath = useRef<string | null>(null)
  const enteredAt = useRef(Date.now())

  useEffect(() => {
    const now = Date.now()

    if (!previousPath.current) {
      previousPath.current = pathname
      enteredAt.current = now
      void trackUxEvent({
        eventType: "PAGE_VIEW",
        path: pathname,
        metadata: { source: "app-shell" },
      })
      return
    }

    if (previousPath.current === pathname) return

    const fromPath = previousPath.current
    const durationMs = Math.max(0, now - enteredAt.current)
    previousPath.current = pathname
    enteredAt.current = now

    void trackUxEvent({
      eventType: "NAVIGATION",
      path: pathname,
      fromPath,
      toPath: pathname,
      durationMs,
      metadata: { source: "app-shell" },
    })
    void trackUxEvent({
      eventType: "PAGE_VIEW",
      path: pathname,
      fromPath,
      metadata: { source: "app-shell" },
    })
  }, [pathname])

  return null
}
