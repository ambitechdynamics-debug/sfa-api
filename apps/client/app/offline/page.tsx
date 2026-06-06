import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Offline — Consilium Design",
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg-0)",
        color: "var(--ink-0)",
        padding: "32px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 420, display: "grid", gap: 16 }}>
        <div
          style={{
            width: 72,
            height: 72,
            margin: "0 auto",
            borderRadius: 18,
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            display: "grid",
            placeItems: "center",
            fontSize: 28,
          }}
          aria-hidden
        >
          ▲
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>
          You are offline
        </h1>
        <p style={{ margin: 0, color: "var(--ink-2)", lineHeight: 1.6, fontSize: 15 }}>
          We cannot reach Consilium Design right now. Check your connection — the app
          will pick up where you left off as soon as you are back online.
        </p>
        <a
          href="/dashboard"
          style={{
            display: "inline-block",
            marginTop: 8,
            padding: "12px 22px",
            borderRadius: 999,
            background: "var(--ink-0)",
            color: "var(--bg-0)",
            fontWeight: 600,
            textDecoration: "none",
            justifySelf: "center",
          }}
        >
          Try again
        </a>
      </div>
    </main>
  )
}
