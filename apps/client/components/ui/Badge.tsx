"use client"

import type { CSSProperties, ReactNode } from "react"
import { Icon, type IconName } from "./Icon"

export type BadgeTone = "neutral" | "acc" | "sage" | "plum" | "gold" | "rose" | "sky"
export type BadgeSize = "sm" | "md"

const TONES: Record<BadgeTone, { bg: string; color: string; line: string }> = {
  neutral: { bg: "rgba(255,255,255,0.03)",    color: "rgba(255,255,255,0.5)",    line: "rgba(255,255,255,0.06)" },
  acc:     { bg: "rgba(255,255,255,0.08)",    color: "rgba(255,255,255,0.9)",    line: "rgba(255,255,255,0.15)" },
  sage:    { bg: "rgba(255,255,255,0.04)",    color: "rgba(255,255,255,0.7)",    line: "rgba(255,255,255,0.1)" },
  plum:    { bg: "rgba(255,255,255,0.04)",    color: "rgba(255,255,255,0.7)",    line: "rgba(255,255,255,0.1)" },
  gold:    { bg: "rgba(255,255,255,0.06)",    color: "rgba(255,255,255,0.8)",    line: "rgba(255,255,255,0.12)" },
  rose:    { bg: "rgba(255,50,50,0.1)",       color: "rgba(255,100,100,0.9)",    line: "rgba(255,50,50,0.2)" },
  sky:     { bg: "rgba(255,255,255,0.06)",    color: "rgba(255,255,255,0.8)",    line: "rgba(255,255,255,0.12)" },
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  icon?: IconName | string
  dot?: boolean
  size?: BadgeSize
  style?: CSSProperties
}

export function Badge({ children, tone = "neutral", icon, dot, size = "md", style }: BadgeProps) {
  const t = TONES[tone] || TONES.neutral
  const dim = size === "sm"
    ? { font: 11, h: 20, px: 7, gap: 4, iconSz: 11 }
    : { font: 12, h: 24, px: 10, gap: 5, iconSz: 12 }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: dim.gap,
        height: dim.h,
        padding: `0 ${dim.px}px`,
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.line}`,
        borderRadius: "var(--r-pill)",
        fontSize: dim.font,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, background: t.color, borderRadius: "50%" }} />}
      {icon && <Icon name={icon} size={dim.iconSz} />}
      {children}
    </span>
  )
}
