"use client"

import { useId, type CSSProperties } from "react"

type ConsiliumPrismLogoProps = {
  size?: number | string
  className?: string
  animated?: boolean
  label?: string
}

/**
 * Official Consilium / Ambitech brand mark.
 * Mirrors the client app's logo so admin + client share the same identity.
 */
export function ConsiliumPrismLogo({
  size = 32,
  className = "",
  animated = true,
  label = "Consilium",
}: ConsiliumPrismLogoProps) {
  const gradientId = `consilium-prism-${useId().replace(/:/g, "")}`
  const style: CSSProperties = { width: size, height: size }

  return (
    <span
      className={`consilium-prism-logo ${animated ? "is-animated" : ""} ${className}`.trim()}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <polygon
          points="50,15 85,80 15,80"
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          fill="none"
          className="consilium-prism-logo__triangle"
        />
        <circle
          cx="50"
          cy="53"
          r="10"
          fill="#EC4899"
          className="consilium-prism-logo__pulse"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  )
}
