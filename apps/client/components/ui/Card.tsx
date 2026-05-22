"use client"

import type { CSSProperties, HTMLAttributes } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: number | string
  hover?: boolean
}

export function Card({ children, padding, hover, style, ...rest }: CardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: padding === undefined ? "var(--pad-card)" : padding,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
        ...(hover && { cursor: "pointer" }),
        ...(style as CSSProperties),
      }}
      onMouseEnter={
        hover
          ? (e) => {
              e.currentTarget.style.transform = "translateY(-4px)"
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)"
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)"
              e.currentTarget.style.background = "rgba(255,255,255,0.035)"
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)"
              e.currentTarget.style.background = "rgba(255,255,255,0.02)"
            }
          : undefined
      }
      {...rest}
    >
      {children}
    </div>
  )
}
