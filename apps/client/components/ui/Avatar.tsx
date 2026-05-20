"use client"

import type { CSSProperties } from "react"

const AVATAR_GRADS: Array<[string, string]> = [
  ["#777777", "#555555"],
  ["#8aa57a", "#5d7a4d"],
  ["#b08bc7", "#8861a3"],
  ["#7aa3c9", "#4d7da8"],
  ["#d8a85a", "#a8803a"],
]

interface AvatarProps {
  name?: string
  src?: string
  size?: number
  style?: CSSProperties
}

export function Avatar({ name = "?", src, size = 32, style }: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
  const idx = (name.charCodeAt(0) || 0) % AVATAR_GRADS.length
  const [a, b] = AVATAR_GRADS[idx]
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: src ? `url(${src}) center/cover` : `linear-gradient(135deg, ${a}, ${b})`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.95)",
        fontSize: size * 0.4,
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        flexShrink: 0,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
        ...style,
      }}
    >
      {!src && initials}
    </div>
  )
}
