import type { ReactNode } from "react"
import { BrandMark } from "@/components/ui/BrandMark"

interface AuthShellProps {
  left: ReactNode
  right: ReactNode
}

export function AuthShell({ left, right }: AuthShellProps) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }} className="max-md:!grid-cols-1">
      {/* Left: visual */}
      <div
        className="max-md:hidden"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(160deg, #c66a45 0%, #2a1a10 70%, #1a0e08 100%)",
          padding: 48,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(245,238,226,0.16) 1px, transparent 1.4px)",
            backgroundSize: "14px 14px",
            maskImage: "radial-gradient(80% 80% at 50% 30%, black, transparent)",
            WebkitMaskImage: "radial-gradient(80% 80% at 50% 30%, black, transparent)",
          }}
        />
        <div style={{ position: "relative" }}>
          <BrandMark size={22} color="#f4ecd8" />
        </div>
        <div style={{ position: "relative", color: "#f4ecd8" }}>{left}</div>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "rgba(244,236,216,0.6)",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
          }}
        >
          <span>© 2025 Studio Flyer</span>
          <span>·</span>
          <span>Canada</span>
        </div>
      </div>

      {/* Right: form */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 48,
          background: "var(--bg-0)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420, marginInline: "auto" }}>{right}</div>
      </div>
    </div>
  )
}

export function AuthLeftPitch() {
  return (
    <div>
      <p className="serif" style={{ fontSize: 32, lineHeight: 1.15, color: "#f4ecd8", maxWidth: 420 }}>
        « En 3 minutes, j'ai eu 4 visuels professionnel prêts à publier — du même niveau que mon graphiste. »
      </p>
      <p style={{ marginTop: 24, fontSize: 13, color: "rgba(244,236,216,0.7)", fontFamily: "var(--font-mono)", letterSpacing: "0.03em" }}>
        Emmanuel Francis, Toronto
      </p>
    </div>
  )
}
