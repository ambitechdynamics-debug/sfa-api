"use client"

import type { CSSProperties, ReactNode } from "react"
import { Ico } from "./icons"

/* WindowChrome — Win11-style window with traffic-light controls */
export function WindowChrome({
  title,
  icon,
  children,
  className = "",
  style,
  glass = false,
  actions,
}: {
  title: ReactNode
  icon?: ReactNode
  children: ReactNode
  className?: string
  style?: CSSProperties
  glass?: boolean
  actions?: ReactNode
}) {
  return (
    <div className={`win ${className}`} style={style}>
      <div className={`win-titlebar ${glass ? "glass" : ""}`}>
        <div className="win-title">
          {icon}
          <span>{title}</span>
        </div>
        {actions}
      </div>
      <div className="win-body">{children}</div>
    </div>
  )
}

/* Mini keyboard chip */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 22,
        height: 22,
        padding: "0 6px",
        borderRadius: 4,
        background: "var(--bg-elev-1)",
        border: "1px solid var(--bd-medium)",
        borderBottomWidth: 2,
        fontFamily: "var(--font-mono-csl)",
        fontSize: 11,
        color: "var(--tx-secondary)",
      }}
    >
      {children}
    </kbd>
  )
}

/* Stat tile mirroring Win11 settings cards */
export function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon?: ReactNode
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <div className="stat-tile">
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--tx-tertiary)", fontSize: 12, marginBottom: 12 }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.15, color: "var(--tx-primary)" }}>
        {value}
      </div>
      {sub && <div style={{ marginTop: 18, fontSize: 12, color: "var(--tx-tertiary)" }}>{sub}</div>}
    </div>
  )
}

/* Row inside a window with an icon + title + optional action */
export function SectionRow({
  icon,
  title,
  expanded = true,
  action,
}: {
  icon: ReactNode
  title: ReactNode
  expanded?: boolean
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px 18px",
        borderBottom: expanded ? "1px solid var(--bd-divider)" : "none",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent)",
          background: "var(--accent-soft)",
          borderRadius: 6,
          marginRight: 14,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{title}</div>
      {action}
      <button className="btn" style={{ width: 32, height: 32, padding: 0, marginLeft: 8 }}>
        <Ico.chev style={{ width: 12, height: 12, transform: expanded ? "rotate(90deg)" : "none" }} />
      </button>
    </div>
  )
}

/* System tray cluster (wifi/speaker/battery + clock) */
export function SystemTray() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--tx-secondary)", padding: "0 10px" }}>
      <Ico.wifi style={{ width: 16, height: 16 }} />
      <Ico.speaker style={{ width: 16, height: 16 }} />
      <Ico.battery style={{ width: 18, height: 18 }} />
      <span style={{ fontSize: 12, marginLeft: 4, lineHeight: 1.1, textAlign: "right" }}>
        <span style={{ display: "block" }}>18:34</span>
        <span style={{ display: "block", color: "var(--tx-tertiary)" }}>16/05/2026</span>
      </span>
    </div>
  )
}

/* Avatar circle */
export function Avatar({
  initials = "EB",
  size = 36,
  color = "linear-gradient(135deg,#4cc2ff,#2d6e8c)",
}: {
  initials?: string
  size?: number
  color?: string
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 600,
        color: "#0a1a23",
        flex: "none",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      {initials}
    </div>
  )
}
