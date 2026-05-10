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
        background: "var(--bg-2)",
        border: "1px solid var(--line-1)",
        borderRadius: "var(--r-3)",
        padding: padding === undefined ? "var(--pad-card)" : padding,
        boxShadow: "var(--sh-1)",
        transition: "border-color 200ms, transform 200ms, box-shadow 200ms",
        ...(hover && { cursor: "pointer" }),
        ...(style as CSSProperties),
      }}
      onMouseEnter={
        hover
          ? (e) => {
              e.currentTarget.style.borderColor = "var(--line-3)"
              e.currentTarget.style.transform = "translateY(-1px)"
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              e.currentTarget.style.borderColor = "var(--line-1)"
              e.currentTarget.style.transform = ""
            }
          : undefined
      }
      {...rest}
    >
      {children}
    </div>
  )
}
