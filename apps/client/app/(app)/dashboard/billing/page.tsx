"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { PageContainer } from "@/components/app/dashboard-ui"
import { trackEvent } from "@/lib/ux-metrics"
import { useAuthStore } from "@/store/auth-store"
import { api } from "@/lib/api"
import { toast } from "sonner"

const PLANS = [
  {
    key: "free",
    name: "Découverte",
    desc: "Pour tester l'outil",
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: "5 générations / mois",
    features: [
      "Format unique 1080×1080",
      "Filigrane Studio Flyer",
      "Export PNG standard",
      "Assistance par e-mail"
    ]
  },
  {
    key: "starter",
    name: "Starter",
    desc: "Pour les indépendants",
    monthlyPrice: 9,
    yearlyPrice: 90,
    credits: "20 générations / mois",
    features: [
      "Tous les formats de visuels",
      "Sans filigrane",
      "Export HD (PNG, JPG, PDF)",
      "Mémoires de marque (1)",
      "Historique 30 jours"
    ]
  },
  {
    key: "pro",
    name: "Pro",
    desc: "Pour les pros & créateurs",
    monthlyPrice: 19,
    yearlyPrice: 190,
    credits: "100 générations / mois",
    features: [
      "Retouches IA illimitées",
      "Sans filigrane",
      "Export HD + vectoriel SVG",
      "Mémoires de marque (5)",
      "Historique illimité",
      "Support prioritaire"
    ],
    featured: true
  },
  {
    key: "business",
    name: "Business",
    desc: "Pour les agences",
    monthlyPrice: 49,
    yearlyPrice: 490,
    credits: "400 générations / mois",
    features: [
      "Générations IA avancées",
      "Export tous formats",
      "Marques illimitées",
      "Support dédié 24/7",
      "Account Manager personnel"
    ]
  }
]

export default function BillingPage() {
  const { user } = useAuthStore()
  const [isYearly, setIsYearly] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const used = user?.credits ?? 0
  const userPlan = user?.subscriptionPlan?.toLowerCase() || "free"
  const isPaidUser = userPlan !== "free"
  const isSubscriptionActive = user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trialing"

  // Get current plan object
  const currentPlanObj = PLANS.find((p) => p.key === userPlan) || PLANS[0]

  // Resolve total credits based on active limits
  const totalCredits = currentPlanObj.key === "free" ? 5 : currentPlanObj.key === "starter" ? 20 : currentPlanObj.key === "pro" ? 100 : 400

  // Format subscription period end date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch {
      return ""
    }
  }

  // Handle Stripe Checkout
  const handleSubscribe = async (planKey: string) => {
    if (planKey === "free") {
      toast.info("Le plan Découverte est déjà actif par défaut.")
      return
    }

    setLoadingPlan(planKey)
    try {
      trackEvent("billing_opened", { action: "upgrade_plan", plan: planKey })
      
      const res = await api.post<{ url: string }>("/stripe/create-checkout-session", {
        plan: planKey,
        period: isYearly ? "yearly" : "monthly"
      })

      if (res && res.url) {
        window.location.href = res.url
      } else {
        toast.error("Erreur de redirection vers Stripe Checkout")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Impossible de démarrer la session d'abonnement.")
    } finally {
      setLoadingPlan(null)
    }
  }

  // Handle Billing Portal Session
  const handleManageBilling = async () => {
    setLoadingPortal(true)
    try {
      trackEvent("billing_opened", { action: "manage_billing" })
      const res = await api.post<{ url: string }>("/stripe/create-billing-portal-session")
      
      if (res && res.url) {
        window.location.href = res.url
      } else {
        toast.error("Erreur de redirection vers le portail client")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Impossible d'accéder au portail Stripe.")
    } finally {
      setLoadingPortal(false)
    }
  }

  return (
    <PageContainer width={1180}>
      {/* Current plan card */}
      <Card padding={28} style={{ background: "linear-gradient(135deg, var(--acc-soft), transparent 60%)", borderColor: "var(--acc-line)", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div>
            <Badge tone="acc" icon="zap">Plan actuel · {currentPlanObj.name}</Badge>
            <div className="display" style={{ fontSize: 32, marginTop: 12, letterSpacing: "-0.02em" }}>
              {used} / {totalCredits} crédits IA
            </div>
            
            {isPaidUser ? (
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
                Abonnement {user?.subscriptionStatus === "canceled" ? "résilié" : "actif"} ·
                {user?.subscriptionCurrentPeriodEnd && ` Renouvellement le ${formatDate(user.subscriptionCurrentPeriodEnd)}`}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
                Version d'essai gratuite · Mettez à niveau votre compte pour débloquer plus de crédits
              </div>
            )}
            
            <div style={{ height: 6, width: 280, background: "var(--bg-3)", borderRadius: 3, marginTop: 14, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (used / totalCredits) * 100)}%`, background: "var(--acc)" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isPaidUser && (
              <Button variant="outline" icon={loadingPortal ? undefined : "credit"} onClick={handleManageBilling} disabled={loadingPortal}>
                {loadingPortal ? "Chargement..." : "Gérer mon abonnement"}
              </Button>
            )}
            <a href="#plans-selection">
              <Button icon="trend">Changer de plan</Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Plans selector controls */}
      <div id="plans-selection" style={{ textAlign: "center", margin: "40px 0 20px" }}>
        <h2 className="display" style={{ fontSize: 28, marginBottom: 8 }}>Choisissez le plan adapté à vos besoins</h2>
        <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 24 }}>Sans engagement. Modifiez ou annulez votre formule à tout moment.</p>
        
        {/* Toggle Switch */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "var(--bg-2)", padding: "4px 8px", borderRadius: 100, border: "1px solid var(--line-1)" }}>
          <button
            onClick={() => setIsYearly(false)}
            style={{
              padding: "6px 16px",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              background: !isYearly ? "var(--bg-0)" : "transparent",
              color: !isYearly ? "var(--ink-0)" : "var(--ink-2)",
              boxShadow: !isYearly ? "var(--sh-1)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            Mensuel
          </button>
          <button
            onClick={() => setIsYearly(true)}
            style={{
              padding: "6px 16px",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              background: isYearly ? "var(--bg-0)" : "transparent",
              color: isYearly ? "var(--ink-0)" : "var(--ink-2)",
              boxShadow: isYearly ? "var(--sh-1)" : "none",
              transition: "all 0.2s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            Annuel <Badge size="sm" tone="acc" style={{ fontSize: 10, padding: "2px 6px" }}>-20%</Badge>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {PLANS.map((p) => {
          const isCurrent = userPlan === p.key
          const price = isYearly ? p.yearlyPrice : p.monthlyPrice
          const unit = isYearly ? "/an" : "/mois"
          
          return (
            <Card
              key={p.name}
              padding={24}
              style={{
                borderColor: isCurrent ? "var(--acc-line)" : "var(--line-1)",
                boxShadow: isCurrent ? "0 0 0 2px var(--acc-soft)" : "var(--sh-1)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                position: "relative",
                transition: "transform 0.2s ease",
              }}
              className="hover:scale-[1.01]"
            >
              {p.featured && (
                <Badge tone="acc" style={{ position: "absolute", top: -10, right: 16 }}>
                  Recommandé
                </Badge>
              )}
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</span>
                  {isCurrent && <Badge size="sm" tone="acc">Actuel</Badge>}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 4 }}>{p.desc}</div>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span className="display" style={{ fontSize: 38, letterSpacing: "-0.02em", fontWeight: 600 }}>{price}$</span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{unit}</span>
              </div>

              <div style={{ fontSize: 12, color: "var(--acc-bright)", fontFamily: "var(--font-mono)" }}>
                {p.credits}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "var(--ink-1)" }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Icon name="check" size={12} stroke={3} style={{ color: "var(--acc)", marginTop: 3, flexShrink: 0 }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button full variant="outline" disabled style={{ marginTop: "auto" }}>
                  Plan actuel
                </Button>
              ) : (
                <Button
                  full
                  variant={p.featured ? "primary" : "outline"}
                  disabled={loadingPlan !== null}
                  onClick={() => handleSubscribe(p.key)}
                  style={{ marginTop: "auto" }}
                >
                  {loadingPlan === p.key ? "Redirection..." : (p.key === "free" ? "Plan actuel" : `Choisir ${p.name}`)}
                </Button>
              )}
            </Card>
          )
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }} className="max-md:!grid-cols-1">
        <Card padding={24}>
          <h3 className="display" style={{ fontSize: 18, margin: 0, letterSpacing: 0 }}>Factures</h3>
          <div style={{ marginTop: 14, padding: 20, background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 10, color: "var(--ink-2)", fontSize: 13, textAlign: "center" }}>
            {isPaidUser ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <span>Historique des paiements disponible sur votre portail Stripe.</span>
                <Button variant="ghost" size="sm" icon={loadingPortal ? undefined : "link"} onClick={handleManageBilling} disabled={loadingPortal}>
                  {loadingPortal ? "Chargement..." : "Consulter mes factures"}
                </Button>
              </div>
            ) : (
              "Aucune facture disponible pour le moment."
            )}
          </div>
        </Card>
        
        <Card padding={24}>
          <h3 className="display" style={{ fontSize: 18, margin: 0, letterSpacing: 0 }}>Sécurité des paiements</h3>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-1)" }}>
              <Icon name="credit" size={16} style={{ color: "var(--acc)" }} />
              <span>Paiement sécurisé et hébergé à 100 % par <strong>Stripe</strong>.</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
              Nous ne stockons aucune information de carte bancaire sur nos serveurs. Vos transactions sont entièrement chiffrées selon les standards de l'industrie (conformité PCI-DSS).
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
