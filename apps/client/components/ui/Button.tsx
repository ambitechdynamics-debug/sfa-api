"use client"

import type { ButtonHTMLAttributes, CSSProperties } from "react"
import { Icon, type IconName } from "./Icon"

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger"
type Size = "sm" | "md" | "lg" | "xl"

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: Variant
  size?: Size
  icon?: IconName | string
  iconRight?: IconName | string
  full?: boolean
}

const SIZES: Record<Size, { h: number; px: number; font: number; gap: number; iconSize: number; radius: number }> = {
  sm: { h: 32, px: 12, font: 13, gap: 6, iconSize: 14, radius: 8 },
  md: { h: 38, px: 16, font: 14, gap: 8, iconSize: 16, radius: 10 },
  lg: { h: 48, px: 22, font: 15, gap: 10, iconSize: 18, radius: 12 },
  xl: { h: 56, px: 28, font: 16, gap: 12, iconSize: 20, radius: 14 },
}

const VARIANTS: Record<Variant, CSSProperties> = {
  primary: {
    background: "linear-gradient(180deg, var(--acc-bright), var(--acc-deep))",
    color: "var(--acc-ink)",
    border: "1px solid var(--acc-deep)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 18px rgba(224,138,100,0.28)",
  },
  secondary: {
    background: "var(--bg-3)",
    color: "var(--ink-0)",
    border: "1px solid var(--line-2)",
    boxShadow: "var(--sh-1)",
  },
  ghost: {
    background: "transparent",
    color: "var(--ink-1)",
    border: "1px solid transparent",
  },
  outline: {
    background: "transparent",
    color: "var(--ink-0)",
    border: "1px solid var(--line-3)",
  },
  danger: {
    background: "var(--rose-soft)",
    color: "var(--rose)",
    border: "1px solid rgba(217, 112, 112, 0.3)",
  },
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  full,
  type = "button",
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const sizes = SIZES[size]
  const variantStyle = VARIANTS[variant]
  return (
    <button
      type={type}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: sizes.gap,
        height: sizes.h,
        padding: `0 ${sizes.px}px`,
        fontFamily: "var(--font-sans)",
        fontSize: sizes.font,
        fontWeight: 500,
        letterSpacing: "-0.005em",
        borderRadius: sizes.radius,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        width: full ? "100%" : "auto",
        transition: "transform 80ms ease, box-shadow 200ms ease, background 200ms ease",
        ...variantStyle,
        ...style,
      }}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "translateY(1px)"
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = ""
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ""
      }}
      {...rest}
    >
      {icon && <Icon name={icon} size={sizes.iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sizes.iconSize} />}
    </button>
  )
}
