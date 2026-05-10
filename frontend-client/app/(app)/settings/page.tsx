"use client"

import { Card } from "@/components/ui/Card"
import { Icon } from "@/components/ui/Icon"
import { useUiStore, ACCENT_PALETTES } from "@/store/ui-store"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { theme, density, accent, setTheme, setDensity, setAccent } = useUiStore()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <Card padding={28}>
        <h2 className="display" style={{ fontSize: 20, margin: 0, marginBottom: 4 }}>Apparence</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 24 }}>Personnalisez l&apos;apparence de l&apos;application.</p>

        <Setting label="Thème" hint="Sombre par défaut, clair pour les environnements lumineux">
          <Segmented
            options={[
              { value: "dark",  label: "Sombre" },
              { value: "light", label: "Clair" },
            ]}
            value={theme}
            onChange={(v) => setTheme(v as "dark" | "light")}
          />
        </Setting>

        <Setting label="Densité" hint="Plus compact = plus d'informations à l'écran">
          <Segmented
            options={[
              { value: "compact", label: "Compact" },
              { value: "regular", label: "Confortable" },
              { value: "comfy",   label: "Aéré" },
            ]}
            value={density}
            onChange={(v) => setDensity(v as "compact" | "regular" | "comfy")}
          />
        </Setting>

        <Setting label="Couleur d'accent" hint="Palette principale de l'interface">
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
        <h2 className="display" style={{ fontSize: 20, margin: 0, marginBottom: 4 }}>Sécurité</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>Gestion du compte et accès.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SecRow label="Changer de mot de passe" hint="Modification possible bientôt" />
          <SecRow label="Sessions actives" hint="Une session actuelle" />
          <SecRow label="Supprimer mon compte" hint="Action irréversible" danger />
        </div>
      </Card>
    </div>
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
    <div style={{ display: "inline-flex", gap: 2, padding: 3, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 9 }}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: "6px 12px",
              background: active ? "var(--bg-4)" : "transparent",
              border: 0,
              color: active ? "var(--ink-0)" : "var(--ink-2)",
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

function SecRow({ label, hint, danger }: { label: string; hint?: string; danger?: boolean }) {
  return (
    <button
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: 14, background: "var(--bg-1)", border: "1px solid var(--line-1)",
        borderRadius: 8, cursor: "pointer", textAlign: "left",
        color: danger ? "var(--rose)" : "var(--ink-1)",
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{hint}</div>}
      </div>
      <Icon name="chevronR" size={14} />
    </button>
  )
}
