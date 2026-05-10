"use client"

import { Icon, type IconName } from "@/components/ui/Icon"
import { cn } from "@/lib/utils"

interface Step {
  id: number
  label: string
  icon: IconName | string
}

interface StepperProps {
  steps: Step[]
  current: number
  onJump: (id: number) => void
}

export function Stepper({ steps, current, onJump }: StepperProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 90 }}>
      {steps.map((s, i) => {
        const done = s.id < current
        const active = s.id === current
        return (
          <button
            key={s.id}
            onClick={() => onJump(s.id)}
            className={cn("transition-colors")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: active ? "var(--acc-soft)" : "transparent",
              border: active ? "1px solid var(--acc-line)" : "1px solid transparent",
              borderRadius: 10,
              cursor: "pointer",
              textAlign: "left",
              color: active ? "var(--acc-bright)" : done ? "var(--ink-1)" : "var(--ink-3)",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: done ? "var(--sage-soft)" : active ? "var(--acc)" : "var(--bg-3)",
                color: done ? "var(--sage)" : active ? "var(--acc-ink)" : "var(--ink-2)",
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {done ? <Icon name="check" size={14} stroke={2.5} /> : s.id}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: active ? "var(--acc)" : "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Étape {s.id}
              </div>
              <div style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{s.label}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
