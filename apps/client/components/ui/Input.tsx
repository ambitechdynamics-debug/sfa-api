"use client"

import { useState, type CSSProperties, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react"
import { Icon, type IconName } from "./Icon"

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string
  hint?: string
  error?: string
  icon?: IconName | string
  prefix?: string
  suffix?: string
  containerStyle?: CSSProperties
}

export function Input({ label, hint, error, icon, prefix, suffix, type = "text", style, containerStyle, ...rest }: InputProps) {
  const [focus, setFocus] = useState(false)
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...containerStyle }}>
      {label && <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)" }}>{label}</span>}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: "var(--row-h)",
          padding: "0 12px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${error ? "rgba(255,50,50,0.5)" : focus ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "var(--r-2)",
          boxShadow: focus ? "0 0 0 3px rgba(255,255,255,0.05)" : "none",
          transition: "border-color 150ms, box-shadow 150ms",
        }}
      >
        {icon && <Icon name={icon} size={15} style={{ color: "var(--ink-3)" }} />}
        {prefix && <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{prefix}</span>}
        <input
          type={type}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            background: "transparent",
            border: 0,
            outline: 0,
            color: "var(--ink-0)",
            fontSize: 14,
            fontFamily: "var(--font-sans)",
            ...(style as CSSProperties),
          }}
          {...rest}
        />
        {suffix && <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{suffix}</span>}
      </span>
      {hint && !error && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: "var(--err)" }}>{error}</span>}
    </label>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, rows = 4, style, ...rest }: TextareaProps) {
  const [focus, setFocus] = useState(false)
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)" }}>{label}</span>}
      <textarea
        rows={rows}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${error ? "rgba(255,50,50,0.5)" : focus ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: "var(--r-2)",
          boxShadow: focus ? "0 0 0 3px rgba(255,255,255,0.05)" : "none",
          color: "var(--ink-0)",
          fontSize: 14,
          fontFamily: "var(--font-sans)",
          resize: "vertical",
          outline: 0,
          transition: "border-color 150ms, box-shadow 150ms",
          ...(style as CSSProperties),
        }}
        {...rest}
      />
      {hint && !error && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: "var(--err)" }}>{error}</span>}
    </label>
  )
}
