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
  placeholder = "Describe the visual to create...",
  disabled,
  loading,
  highlighted,
  active,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  highlighted?: boolean
  active?: boolean
}) {
  const sendDisabled = disabled || loading || !value.trim()

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: 10,
        alignItems: "end",
        padding: "8px 8px 8px 16px",
        background: active ? "rgba(255,255,255,0.06)" : "var(--bg-2)",
        border: highlighted ? "1.5px solid rgba(255,255,255,0.3)" : "1px solid var(--line-2)",
        borderRadius: 24,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        transition: "background 0.35s ease, border-color 0.2s ease, box-shadow 0.2s ease",
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
        placeholder={highlighted ? "Specify your choice..." : placeholder}
        disabled={disabled || loading}
        aria-label="Message to send"
        style={{
          width: "100%",
          minHeight: 28,
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
          padding: "10px 0",
        }}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={sendDisabled}
        aria-label="Send"
        aria-busy={loading ? "true" : undefined}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: sendDisabled ? "rgba(255,255,255,0.05)" : "#fff",
          color: sendDisabled ? "rgba(255,255,255,0.2)" : "#000",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: sendDisabled ? "not-allowed" : "pointer",
          justifySelf: "end",
          transition: "background 0.2s ease, color 0.2s ease, transform 0.1s ease",
          transform: sendDisabled ? "scale(0.95)" : "scale(1)",
        }}
        onMouseEnter={(e) => { if (!sendDisabled) e.currentTarget.style.transform = "scale(1.05)" }}
        onMouseLeave={(e) => { if (!sendDisabled) e.currentTarget.style.transform = "scale(1)" }}
      >
        {loading ? <span style={{ fontSize: 18, lineHeight: 1, transform: "translateY(-2px)" }}>...</span> : <Icon name="arrowUp" size={18} />}
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
    <div style={{ 
      padding: "64px 32px", 
      textAlign: "center", 
      background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
      border: "1px dashed rgba(255,255,255,0.1)",
      borderRadius: 24,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      marginTop: 20
    }}>
      <div style={{ 
        width: 56, height: 56, 
        borderRadius: 16, 
        background: "rgba(255,255,255,0.03)", 
        border: "1px solid rgba(255,255,255,0.08)", 
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,0.6)"
      }}>
        <Icon name={icon} size={24} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ink-0)", letterSpacing: "-0.01em" }}>{title}</h3>
        {body && <p style={{ margin: "8px auto 0", fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 380, lineHeight: 1.5 }}>{body}</p>}
      </div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
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
