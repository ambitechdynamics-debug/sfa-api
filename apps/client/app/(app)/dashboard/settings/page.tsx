"use client"

import { Card } from "@/components/ui/Card"
import { Icon } from "@/components/ui/Icon"
import { PageContainer } from "@/components/app/dashboard-ui"
import { useUiStore, ACCENT_PALETTES } from "@/store/ui-store"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { theme, density, accent, setTheme, setDensity, setAccent } = useUiStore()

  return (
    <PageContainer width={820}>
      <Card padding={28}>
        <h2 className="display" style={{ fontSize: 20, margin: 0, marginBottom: 4 }}>Appearance</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 24 }}>Customize the application's appearance.</p>

        <Setting label="Theme" hint="Dark by default, light for bright environments">
          <Segmented
            options={[
              { value: "dark",  label: "Dark" },
              { value: "light", label: "Light" },
            ]}
            value={theme}
            onChange={(v) => setTheme(v as "dark" | "light")}
          />
        </Setting>

        <Setting label="Density" hint="More compact means more information on screen">
          <Segmented
            options={[
              { value: "compact", label: "Compact" },
              { value: "regular", label: "Comfortable" },
              { value: "comfy",   label: "Airy" },
            ]}
            value={density}
            onChange={(v) => setDensity(v as "compact" | "regular" | "comfy")}
          />
        </Setting>

        <Setting label="Accent color" hint="Main interface palette">
          <div style={{ display: "flex", gap: 10 }}>
            {Object.keys(ACCENT_PALETTES).map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                title={c}
                className={cn("transition-transform")}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: c, cursor: "pointer",
                  border: accent === c ? "3px solid var(--ink-0)" : "2px solid var(--line-2)",
                  boxShadow: accent === c ? "0 0 0 2px var(--bg-0), 0 0 0 4px " + c : "none",
                }}
              />
            ))}
          </div>
        </Setting>
      </Card>

      <Card padding={28}>
        <h2 className="display" style={{ fontSize: 20, margin: 0, marginBottom: 4 }}>AI preferences</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>Settings applied to new prompts.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <InfoRow label="Language" hint="English" icon="globe" />
          <InfoRow label="Generation mode" hint="Fast by default, advanced options collapsed" icon="sparkles" />
          <InfoRow label="Notifications" hint="Enabled for generations, exports, and billing" icon="bell" />
        </div>
      </Card>

      <Card padding={28}>
        <h2 className="display" style={{ fontSize: 20, margin: 0, marginBottom: 4 }}>Security</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>Account and access management.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <InfoRow label="Password" hint="Managed by the authentication module" icon="lock" />
          <InfoRow label="Active sessions" hint="One current session" icon="user" />
          <InfoRow label="Account deletion" hint="Available through a verified support request" icon="warn" danger />
        </div>
      </Card>
    </PageContainer>
  )
}

function Setting({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingBlock: 16, borderTop: "1px solid var(--line-1)", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }} className="first:border-t-0 first:pt-0">
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Segmented({ value, options, onChange }: { value: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "inline-flex", gap: 2, padding: 3, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9 }}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: "6px 12px",
              background: active ? "rgba(255,255,255,0.08)" : "transparent",
              border: 0,
              color: active ? "#fff" : "rgba(255,255,255,0.5)",
              fontSize: 13, fontWeight: 500,
              borderRadius: 6, cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function InfoRow({ label, hint, icon, danger }: { label: string; hint?: string; icon: string; danger?: boolean }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
        padding: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8,
        color: danger ? "rgba(255,100,100,0.9)" : "rgba(255,255,255,0.8)",
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{hint}</div>}
      </div>
      <Icon name={icon} size={14} />
    </div>
  )
}
