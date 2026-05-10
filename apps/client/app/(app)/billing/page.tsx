"use client"

import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "sonner"

const PLANS = [
  { name: "Gratuit",  price: "0€",  unit: "/mois", credits: "3 générations",   features: ["Format 1080×1080", "Filigrane Studio Flyer", "Export PNG"] },
  { name: "Starter",  price: "19€", unit: "/mois", credits: "20 générations",  features: ["Tous les formats", "Sans filigrane", "Export PNG, JPG", "Mémoires : 1 marque"] },
  { name: "Pro",      price: "39€", unit: "/mois", credits: "100 générations", features: ["Retouches illimitées", "Export PNG, JPG, PDF", "Mémoires : 5 marques", "Support prioritaire"], current: true },
  { name: "Business", price: "99€", unit: "/mois", credits: "400 générations", features: ["Génération avancée", "Export vectoriel SVG", "Mémoires illimitées", "Account manager dédié"] },
]

export default function BillingPage() {
  const { user } = useAuthStore()
  const used = user?.credits ?? 0
  const total = Math.max(100, used)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280 }}>
      {/* Current plan card */}
      <Card padding={28} style={{ background: "linear-gradient(135deg, var(--acc-soft), transparent 60%)", borderColor: "var(--acc-line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Badge tone="acc" icon="zap">Plan actuel · Pro</Badge>
            <div className="display" style={{ fontSize: 32, marginTop: 12, letterSpacing: "-0.02em" }}>{used} / {total} crédits IA</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>Renouvellement le 04 du mois · 39€/mois</div>
            <div style={{ height: 6, width: 280, background: "var(--bg-3)", borderRadius: 3, marginTop: 14, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(used / total) * 100}%`, background: "var(--acc)" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="outline" icon="plus" onClick={() => toast.info("Fonction bientôt disponible")}>Acheter des crédits</Button>
            <Button icon="trend" onClick={() => toast.info("Fonction bientôt disponible")}>Changer de plan</Button>
          </div>
        </div>
      </Card>

      {/* Plans grid */}
      <div>
        <h2 className="display" style={{ fontSize: 22, marginBottom: 12 }}>Tous les plans</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {PLANS.map((p) => (
            <Card
              key={p.name}
              padding={20}
              style={{
                borderColor: p.current ? "var(--acc-line)" : "var(--line-1)",
                boxShadow: p.current ? "0 0 0 2px var(--acc-soft)" : "var(--sh-1)",
                display: "flex", flexDirection: "column", gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</span>
                {p.current && <Badge size="sm" tone="acc">Actuel</Badge>}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span className="display" style={{ fontSize: 30, letterSpacing: "-0.02em" }}>{p.price}</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{p.unit}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--acc-bright)", fontFamily: "var(--font-mono)" }}>{p.credits}</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-1)" }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Icon name="check" size={11} stroke={2.5} style={{ color: "var(--acc)", marginTop: 4, flexShrink: 0 }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                full
                variant={p.current ? "outline" : "primary"}
                disabled={p.current}
                onClick={() => toast.info("Fonction bientôt disponible")}
                style={{ marginTop: "auto" }}
              >
                {p.current ? "Plan actuel" : "Choisir"}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <Card padding={24} style={{ borderColor: "var(--gold-soft)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Icon name="info" size={18} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Paiements bientôt disponibles</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
              L&apos;intégration MTN Mobile Money / Airtel Money / Stripe est en cours de finalisation. En attendant, contactez-nous pour souscrire ou mettre à jour votre plan.
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
