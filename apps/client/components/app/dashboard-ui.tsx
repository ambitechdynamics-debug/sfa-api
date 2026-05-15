"use client"

import type { CSSProperties, ReactNode } from "react"
import { Icon } from "@/components/ui/Icon"
import { useUiStore } from "@/store/ui-store"

export function PageContainer({ children, width = 1120, style }: { children: ReactNode; width?: number; style?: CSSProperties }) {
  return (
    <div style={{ width: "100%", maxWidth: width, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22, ...style }}>
      {children}
    </div>
  )
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Décrivez le visuel à créer...",
  disabled,
  loading,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}) {
  const sendDisabled = disabled || loading || !value.trim()

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: 10,
        alignItems: "end",
        padding: 12,
        background: "var(--bg-2)",
        border: "1px solid var(--line-2)",
        borderRadius: 16,
        boxShadow: "var(--sh-2)",
      }}
      className="max-sm:!grid-cols-1"
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            if (!sendDisabled) onSubmit()
          }
        }}
        rows={1}
        placeholder={placeholder}
        disabled={disabled || loading}
        aria-label="Message à envoyer à l'agent"
        style={{
          width: "100%",
          minHeight: 44,
          maxHeight: 180,
          resize: "none",
          overflowY: "auto",
          border: 0,
          outline: 0,
          background: "transparent",
          color: "var(--ink-0)",
          opacity: disabled || loading ? 0.62 : 1,
          fontSize: 15,
          lineHeight: 1.5,
          fontFamily: "var(--font-sans)",
          padding: "4px 2px",
        }}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={sendDisabled}
        aria-label="Envoyer"
        aria-busy={loading ? "true" : undefined}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "1px solid var(--acc-line)",
          background: sendDisabled ? "var(--bg-3)" : "linear-gradient(180deg, var(--acc-bright), var(--acc-deep))",
          color: sendDisabled ? "var(--ink-3)" : "var(--acc-ink)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: sendDisabled ? "not-allowed" : "pointer",
          justifySelf: "end",
        }}
      >
        {loading ? <span style={{ fontSize: 18, lineHeight: 1, transform: "translateY(-2px)" }}>...</span> : <Icon name="send" size={17} />}
      </button>
    </div>
  )
}

export function PromptChip({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid var(--line-2)",
        background: "var(--bg-2)",
        color: "var(--ink-1)",
        fontSize: 13,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {children}
    </button>
  )
}

export function EmptyState({ icon = "sparkles", title, body, action }: { icon?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div style={{ padding: 36, textAlign: "center", color: "var(--ink-2)" }}>
      <span style={{ width: 42, height: 42, borderRadius: 12, margin: "0 auto 14px", background: "var(--bg-1)", border: "1px solid var(--line-1)", color: "var(--acc-bright)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={18} />
      </span>
      <div style={{ fontSize: 15, fontWeight: 650, color: "var(--ink-0)" }}>{title}</div>
      {body && <p style={{ margin: "7px auto 0", maxWidth: 380, fontSize: 13, lineHeight: 1.5, color: "var(--ink-3)" }}>{body}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

export function MetricCard({ icon, label, value, hint }: { icon: string; label: string; value: ReactNode; hint?: string }) {
  return (
    <div style={{ padding: 18, borderRadius: 12, background: "var(--bg-2)", border: "1px solid var(--line-1)", boxShadow: "var(--sh-1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>{label}</div>
          <div className="display" style={{ fontSize: 26, marginTop: 7, letterSpacing: 0 }}>{value}</div>
          {hint && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>{hint}</div>}
        </div>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--acc-soft)", border: "1px solid var(--acc-line)", color: "var(--acc-bright)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={icon} size={15} />
        </span>
      </div>
    </div>
  )
}

export function ThemeToggle() {
  const { theme, setTheme } = useUiStore()
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Activer le mode clair" : "Activer le mode sombre"}
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
      style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-2)", color: "var(--ink-1)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
    >
      <Icon name={theme === "dark" ? "eye" : "eyeOff"} size={15} />
    </button>
  )
}
