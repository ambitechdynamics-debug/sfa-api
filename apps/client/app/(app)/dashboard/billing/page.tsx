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
    name: "Discovery",
    desc: "For testing the tool",
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: "5 generations / month",
    features: [
      "Single 1080x1080 format",
      "Studio Flyer watermark",
      "Export PNG standard",
      "Email support"
    ]
  },
  {
    key: "starter",
    name: "Starter",
    desc: "For independents",
    monthlyPrice: 9,
    yearlyPrice: 90,
    credits: "20 generations / month",
    features: [
      "All visual formats",
      "No watermark",
      "Export HD (PNG, JPG, PDF)",
      "Brand memories (1)",
      "30-day history"
    ]
  },
  {
    key: "pro",
    name: "Pro",
    desc: "For pros and creators",
    monthlyPrice: 19,
    yearlyPrice: 190,
    credits: "100 generations / month",
    features: [
      "Unlimited AI edits",
      "No watermark",
      "HD export + SVG vector",
      "Brand memories (5)",
      "Unlimited history",
      "Priority support"
    ],
    featured: true
  },
  {
    key: "business",
    name: "Business",
    desc: "For agencies",
    monthlyPrice: 49,
    yearlyPrice: 490,
    credits: "400 generations / month",
    features: [
      "Advanced AI generations",
      "All-format export",
      "Unlimited brands",
      "Dedicated 24/7 support",
      "Personal account manager"
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
      return d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch {
      return ""
    }
  }

  // Handle Stripe Checkout
  const handleSubscribe = async (planKey: string) => {
    if (planKey === "free") {
      toast.info("The Discovery plan is already active by default.")
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
        window.location.assign(res.url)
      } else {
        toast.error("Stripe Checkout redirect failed.")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Unable to start the subscription session.")
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
        toast.error("Customer portal redirect failed.")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Unable to access the Stripe portal.")
    } finally {
      setLoadingPortal(false)
    }
  }

  return (
    <PageContainer width={1180}>
      {/* Current plan card */}
      <Card padding={28} style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), transparent 80%)", borderColor: "rgba(255,255,255,0.1)", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div>
            <Badge tone="acc" icon="zap">Current plan · {currentPlanObj.name}</Badge>
            <div className="display" style={{ fontSize: 32, marginTop: 12, letterSpacing: "-0.02em" }}>
              {used} / {totalCredits} AI credits
            </div>
            
            {isPaidUser ? (
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
                Subscription {user?.subscriptionStatus === "canceled" ? "canceled" : "active"} ·
                {user?.subscriptionCurrentPeriodEnd && ` Renews on ${formatDate(user.subscriptionCurrentPeriodEnd)}`}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
                Free trial · Upgrade your account to unlock more credits
              </div>
            )}
            
            <div style={{ height: 6, width: 280, background: "rgba(255,255,255,0.05)", borderRadius: 3, marginTop: 14, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (used / totalCredits) * 100)}%`, background: "rgba(255,255,255,0.9)" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isPaidUser && (
              <Button variant="outline" icon={loadingPortal ? undefined : "credit"} onClick={handleManageBilling} disabled={loadingPortal}>
                {loadingPortal ? "Loading..." : "Manage subscription"}
              </Button>
            )}
            <a href="#plans-selection">
              <Button icon="trend">Change plan</Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Plans selector controls */}
      <div id="plans-selection" style={{ textAlign: "center", margin: "40px 0 20px" }}>
        <h2 className="display" style={{ fontSize: 28, marginBottom: 8 }}>Choose the plan that fits your needs</h2>
        <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 24 }}>No commitment. Change or cancel your plan at any time.</p>
        
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
            Monthly
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
            Yearly <Badge size="sm" tone="acc" style={{ fontSize: 10, padding: "2px 6px" }}>-20%</Badge>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {PLANS.map((p) => {
          const isCurrent = userPlan === p.key
          const price = isYearly ? p.yearlyPrice : p.monthlyPrice
          const unit = isYearly ? "/year" : "/month"
          
          return (
            <Card
              key={p.name}
              padding={24}
              style={{
                borderColor: isCurrent ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
                boxShadow: isCurrent ? "0 0 0 1px rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.2)" : undefined,
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
                  Recommended
                </Badge>
              )}
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</span>
                  {isCurrent && <Badge size="sm" tone="acc">Current</Badge>}
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
                  Current plan
                </Button>
              ) : (
                <Button
                  full
                  variant={p.featured ? "primary" : "outline"}
                  disabled={loadingPlan !== null}
                  onClick={() => handleSubscribe(p.key)}
                  style={{ marginTop: "auto" }}
                >
                  {loadingPlan === p.key ? "Redirecting..." : (p.key === "free" ? "Current plan" : `Choose ${p.name}`)}
                </Button>
              )}
            </Card>
          )
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }} className="max-md:!grid-cols-1">
        <Card padding={24}>
          <h3 className="display" style={{ fontSize: 18, margin: 0, letterSpacing: 0 }}>Invoices</h3>
          <div style={{ marginTop: 14, padding: 20, background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 10, color: "var(--ink-2)", fontSize: 13, textAlign: "center" }}>
            {isPaidUser ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <span>Payment history is available in your Stripe portal.</span>
                <Button variant="ghost" size="sm" icon={loadingPortal ? undefined : "link"} onClick={handleManageBilling} disabled={loadingPortal}>
                  {loadingPortal ? "Loading..." : "View invoices"}
                </Button>
              </div>
            ) : (
              "No invoices available yet."
            )}
          </div>
        </Card>
        
        <Card padding={24}>
          <h3 className="display" style={{ fontSize: 18, margin: 0, letterSpacing: 0 }}>Payment security</h3>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-1)" }}>
              <Icon name="credit" size={16} style={{ color: "var(--acc)" }} />
              <span>Secure payments hosted 100% by <strong>Stripe</strong>.</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
              We do not store card details on our servers. Transactions are fully encrypted according to industry standards (PCI-DSS compliant).
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
