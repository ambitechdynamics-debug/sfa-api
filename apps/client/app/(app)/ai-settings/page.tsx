"use client"

import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { Input, Textarea } from "@/components/ui/Input"

export default function AiSettingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 880 }}>
      <Card padding={24} style={{ borderColor: "var(--gold-soft)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Icon name="info" size={18} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Mémoires de marque · bientôt disponibles</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
              Cette section permettra bientôt de centraliser votre identité visuelle (logo, polices, palette, ton, exemples). L&apos;IA mémorisera vos préférences pour produire des visuels cohérents.
            </div>
          </div>
        </div>
      </Card>

      <Card padding={28}>
        <h2 className="display" style={{ fontSize: 20, margin: 0, marginBottom: 4 }}>Identité de marque</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 20 }}>Importez et configurez les éléments réutilisables.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Nom de la marque" placeholder="Ma Marque" disabled />
          <Input label="Slogan" placeholder="Votre accroche" disabled />
        </div>

        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", marginBottom: 8 }}>Logo</div>
            <button
              disabled
              style={{
                width: "100%", padding: 24,
                background: "var(--bg-1)", border: "1px dashed var(--line-3)",
                borderRadius: 10, cursor: "not-allowed", opacity: 0.5,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                color: "var(--ink-3)",
              }}
            >
              <Icon name="upload" size={20} />
              <span style={{ fontSize: 13 }}>Importer un logo</span>
              <span style={{ fontSize: 11 }}>PNG, SVG · 5MB max</span>
            </button>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", marginBottom: 8 }}>Palette principale</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["#c66a45", "#1a0e08", "#f4ecd8", "#d8a85a"].map((c) => (
                <span key={c} style={{ width: 36, height: 36, background: c, borderRadius: 8, border: "1px solid var(--line-2)" }} />
              ))}
              <button
                disabled
                style={{ width: 36, height: 36, borderRadius: 8, border: "1px dashed var(--line-3)", color: "var(--ink-3)", background: "transparent", cursor: "not-allowed", opacity: 0.5 }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <Textarea label="Ton & style éditorial" rows={3} placeholder="Ex. : Chaleureux, professionnel mais pas froid. Phrases courtes." disabled />
        </div>
      </Card>

      <Card padding={28}>
        <h2 className="display" style={{ fontSize: 20, margin: 0, marginBottom: 12 }}>Style par défaut</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Élégant", "Moderne", "Chaleureux", "Minimaliste", "Corporate"].map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <Button disabled icon="check">Enregistrer (bientôt)</Button>
        </div>
      </Card>
    </div>
  )
}
