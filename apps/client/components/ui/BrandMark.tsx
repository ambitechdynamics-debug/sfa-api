import Image from "next/image"

interface BrandMarkProps {
  size?: number
  withWordmark?: boolean
  color?: string
  animate?: boolean
}

export function BrandMark({ size = 20, withWordmark = true, color, animate = false }: BrandMarkProps) {
  return (
    <span className={animate ? "anim-brand-master" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 9, color: color || "var(--ink-0)", position: "relative" }}>
      <span
        className={animate ? "anim-pen" : ""}
        style={{
          width: size + 5,
          height: size + 5,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        <img
          src="/logo.png"
          alt="Studio Flyer AI Logo"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </span>
      {withWordmark && (
        <span
          className={animate ? "anim-writing-text" : ""}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: size * 1.10,
            letterSpacing: "-0.04em",
            display: "inline-flex",
            alignItems: "baseline",
            gap: 10,
            whiteSpace: "nowrap",
          }}
        >
          <span>Studio</span>
          <span style={{ color: "var(--acc)" }}>Flyer</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: size * 0.5,
              color: "var(--ink-2)",
              letterSpacing: "0.04em",
            }}
          >
          </span>
        </span>
      )}
    </span>
  )
}
