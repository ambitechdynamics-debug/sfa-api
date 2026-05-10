"use client"

import type { CSSProperties, ReactNode } from "react"
import { Icon, type IconName } from "./Icon"

export type BadgeTone = "neutral" | "acc" | "sage" | "plum" | "gold" | "rose" | "sky"
export type BadgeSize = "sm" | "md"

const TONES: Record<BadgeTone, { bg: string; color: string; line: string }> = {
  neutral: { bg: "var(--bg-3)",    color: "var(--ink-1)",    line: "var(--line-2)" },
  acc:     { bg: "var(--acc-soft)",color: "var(--acc-bright)",line: "var(--acc-line)" },
  sage:    { bg: "var(--sage-soft)",color: "var(--sage)",    line: "rgba(138,165,122,0.3)" },
  plum:    { bg: "var(--plum-soft)",color: "var(--plum)",    line: "rgba(176,139,199,0.3)" },
  gold:    { bg: "var(--gold-soft)",color: "var(--gold)",    line: "rgba(216,168,90,0.3)" },
  rose:    { bg: "var(--rose-soft)",color: "var(--rose)",    line: "rgba(217,112,112,0.3)" },
  sky:     { bg: "var(--sky-soft)", color: "var(--sky)",     line: "rgba(122,163,201,0.3)" },
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
