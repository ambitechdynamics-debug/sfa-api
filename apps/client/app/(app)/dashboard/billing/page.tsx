"use client"

import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { PageContainer } from "@/components/app/dashboard-ui"
import { trackEvent } from "@/lib/ux-metrics"
import { useAuthStore } from "@/store/auth-store"

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
    <PageContainer width={1180}>
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
            <Link href="/dashboard/support" onClick={() => trackEvent("billing_opened", { action: "buy_credits" })}>
              <Button variant="outline" icon="plus">Acheter des crédits</Button>
            </Link>
            <Link href="/dashboard/support" onClick={() => trackEvent("billing_opened", { action: "upgrade_plan" })}>
              <Button icon="trend">Changer de plan</Button>
            </Link>
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
              {p.current ? (
                <Button full variant="outline" disabled style={{ marginTop: "auto" }}>Plan actuel</Button>
              ) : (
                <Link href="/dashboard/support" onClick={() => trackEvent("billing_opened", { action: "select_plan", plan: p.name })} style={{ marginTop: "auto" }}>
                  <Button full>Choisir</Button>
                </Link>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="max-md:!grid-cols-1">
        <Card padding={22}>
          <h3 className="display" style={{ fontSize: 18, margin: 0, letterSpacing: 0 }}>Factures</h3>
          <div style={{ marginTop: 14, padding: 16, background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 10, color: "var(--ink-2)", fontSize: 13 }}>
            Aucune facture disponible pour le moment.
          </div>
        </Card>
        <Card padding={22}>
          <h3 className="display" style={{ fontSize: 18, margin: 0, letterSpacing: 0 }}>Méthodes de paiement</h3>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {["Carte bancaire", "Mobile Money", "Virement"].map((method) => (
              <div key={method} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, background: "var(--bg-1)", border: "1px solid var(--line-1)", fontSize: 13, color: "var(--ink-1)" }}>
                <Icon name="credit" size={14} style={{ color: "var(--acc-bright)" }} />
                {method}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
