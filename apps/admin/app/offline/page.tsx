import type { Metadata } from "next"
import { ConsiliumPrismLogo } from "@/components/brand/ConsiliumPrismLogo"

export const metadata: Metadata = {
  title: "Offline - Consilium Admin",
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main className="admin-offline-page">
      <div className="admin-offline-panel">
        <ConsiliumPrismLogo size={72} className="csl-admin-loader-logo" />
        <h1>Console offline</h1>
        <p>
          Consilium Admin cannot reach the network right now. Reconnect and retry
          from the dashboard.
        </p>
        <a href="/admin">Try again</a>
      </div>
    </main>
  )
}
