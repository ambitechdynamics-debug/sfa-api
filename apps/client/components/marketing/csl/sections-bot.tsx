"use client"

import Link from "next/link"
import { useState } from "react"
import type { ReactElement } from "react"
import type { LandingContent, Lang } from "@/lib/landing-content"
import { Ico, BrandMark, type IconName } from "./icons"
import { WindowChrome, Avatar, SystemTray } from "./primitives"
import { TemplateMock, type TemplateKind, type TemplatePalette } from "./template-mock"

/* Template palettes & items used by the Templates section */
const TEMPLATE_PALETTES: Record<string, TemplatePalette[]> = {
  flyers:  [["#0a1418","#16252d","#4cc2ff","#ffffff"], ["#1a1a1a","#2d2d2d","#76cbff","#ffffff"], ["#0e1d23","#1a3340","#4cc2ff","#e8f4fa"], ["#1f1f1f","#3a3a3a","#4cc2ff","#ffffff"]],
  posters: [["#1a1a1a","#272727","#4cc2ff","#ffffff"], ["#0a0a0a","#1a1a1a","#76cbff","#ffffff"]],
  cards:   [["#1a1a1a","#2b2b2b","#4cc2ff","#ffffff"], ["#0a1418","#16252d","#76cbff","#ffffff"]],
  social:  [["#1a1a1a","#2b2b2b","#4cc2ff","#ffffff"], ["#0e1d23","#1a3340","#4cc2ff","#e8f4fa"]],
  cv:      [["#1a1a1a","#ffffff","#4cc2ff","#1a1a1a"], ["#0a1418","#f0f4f7","#4cc2ff","#0a1418"]],
  menus:   [["#1a1a1a","#2b2b2b","#4cc2ff","#ffffff"]],
  reports: [["#1a1a1a","#272727","#4cc2ff","#ffffff"]],
}

interface TemplateItem {
  id: string
  cat: string
  kind: TemplateKind
  title: string
  subtitle: string
  format: string
  price: string
  paletteIdx: number
}

const TEMPLATE_ITEMS: TemplateItem[] = [
  { id: "f1",  cat: "flyers",  kind: "flyer-event",     title: "Soirée Live",      subtitle: "Vendredi · 21:00 · Paris", format: "A4",      price: "Pro",    paletteIdx: 0 },
  { id: "p1",  cat: "posters", kind: "poster-sale",     title: "Soldes Hiver",     subtitle: "−50%",                     format: "A3",      price: "Pro",    paletteIdx: 0 },
  { id: "c1",  cat: "cards",   kind: "card",            title: "Camille Durand",   subtitle: "Directrice artistique",    format: "85 × 55", price: "Free",   paletteIdx: 0 },
  { id: "s1",  cat: "social",  kind: "social-square",   title: "Lancement",        subtitle: "Nouveau produit",          format: "1080²",   price: "Pro",    paletteIdx: 1 },
  { id: "s2",  cat: "social",  kind: "social-story",    title: "Story",            subtitle: "1080 × 1920",              format: "Story",   price: "Pro",    paletteIdx: 0 },
  { id: "cv1", cat: "cv",      kind: "cv",              title: "CV Léa Martin",    subtitle: "Designer Produit",         format: "A4",      price: "Free",   paletteIdx: 0 },
  { id: "m1",  cat: "menus",   kind: "menu",            title: "Carte restaurant", subtitle: "Le Comptoir",              format: "A4",      price: "Pro",    paletteIdx: 0 },
  { id: "f2",  cat: "flyers",  kind: "flyer-corporate", title: "Bilan annuel",     subtitle: "Rapport 2026",             format: "A4",      price: "Studio", paletteIdx: 1 },
  { id: "p2",  cat: "posters", kind: "poster-sale",     title: "Promotion week",   subtitle: "−30%",                     format: "A3",      price: "Pro",    paletteIdx: 1 },
  { id: "f3",  cat: "flyers",  kind: "flyer-event",     title: "Conférence Tech",  subtitle: "Samedi · Lyon",            format: "A4",      price: "Pro",    paletteIdx: 2 },
  { id: "s3",  cat: "social",  kind: "social-square",   title: "Recrutement",      subtitle: "On embauche",              format: "1080²",   price: "Studio", paletteIdx: 0 },
  { id: "c2",  cat: "cards",   kind: "card",            title: "Karim Benali",     subtitle: "Coach certifié",           format: "85 × 55", price: "Free",   paletteIdx: 1 },
]

/* ========== TEMPLATES ========== */
export function Templates({ t, lang }: { t: LandingContent; lang: Lang }) {
  const [cat, setCat] = useState("all")
  const [format, setFormat] = useState(t.templates.formats[0])
  const filtered = TEMPLATE_ITEMS.filter((it) => cat === "all" || it.cat === cat)

  return (
    <section id="templates" className="section">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.templates.eyebrow}</div>
          <h2>{t.templates.title}</h2>
          <p>{t.templates.sub}</p>
        </div>

        <WindowChrome title={t.templates.windowTitle} icon={<Ico.templates style={{ color: "var(--accent)" }} />}>
          <div className="tpl-grid">
            <aside className="tpl-sb">
              <div style={{ padding: "12px 8px 4px", fontSize: 11, fontWeight: 600, color: "var(--tx-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {lang === "fr" ? "Catégories" : "Categories"}
              </div>
              {t.templates.sidebar.map((it) => {
                const IconEl = Ico[it.icon as IconName] || Ico.grid
                return (
                  <div key={it.id} onClick={() => setCat(it.id)} className={`sb-item ${cat === it.id ? "active" : ""}`}>
                    <IconEl />
                    <span style={{ flex: 1 }}>{it.label}</span>
                    <span style={{ fontSize: 11, color: "var(--tx-quaternary)" }}>{it.count}</span>
                  </div>
                )
              })}
            </aside>

            <div className="tpl-main">
              <div className="tpl-toolbar">
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--tx-secondary)", fontSize: 14 }}>
                  <Ico.templates style={{ width: 16, height: 16, color: "var(--accent)" }} />
                  <span style={{ fontWeight: 500, color: "var(--tx-primary)" }}>
                    {t.templates.sidebar.find((s) => s.id === cat)?.label || t.templates.sidebar[0].label}
                  </span>
                  <Ico.chev style={{ width: 12, height: 12 }} />
                  <span>{filtered.length} {t.templates.itemsLabel}</span>
                </div>
                <div style={{ flex: 1 }} />

                <div className="tpl-formats">
                  {t.templates.formats.map((f) => (
                    <button key={f} onClick={() => setFormat(f)} className={`format-chip ${format === f ? "active" : ""}`}>
                      {f}
                    </button>
                  ))}
                </div>

                <button className="btn" style={{ height: 30 }}>
                  <Ico.filter style={{ width: 14, height: 14 }} />
                  <span className="hide-md">{t.templates.filterLabel}</span>
                </button>
              </div>

              <div className="tpl-cards">
                {filtered.map((it) => {
                  const palettes = TEMPLATE_PALETTES[it.cat] || TEMPLATE_PALETTES.flyers
                  const pal = palettes[it.paletteIdx % palettes.length]
                  const aspectRatio =
                    it.kind === "card" ? "13/8" :
                    it.kind === "social-square" ? "1/1" :
                    it.kind === "social-story" ? "9/16" :
                    "200/260"
                  return (
                    <div key={it.id} className="tpl-card">
                      <div style={{ background: pal[0], aspectRatio, overflow: "hidden" }}>
                        <TemplateMock kind={it.kind} palette={pal} title={it.title} subtitle={it.subtitle} />
                      </div>
                      <div className="meta">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, color: "var(--tx-primary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {it.title}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--tx-tertiary)", marginTop: 2 }}>
                            {it.format}
                          </div>
                        </div>
                        <span className="chip" style={{ height: 20, fontSize: 10, padding: "0 8px" }}>
                          {it.price}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </WindowChrome>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <button className="btn btn-lg">
            {lang === "fr" ? "Voir tous les 12 480 modèles" : "See all 12,480 templates"}
            <Ico.arrow style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ========== USE CASES ========== */
function UseCaseCard({
  data, icon, kind, lang,
}: {
  data: LandingContent["uses"]["biz"]
  icon: ReactElement
  kind: "biz" | "perso"
  lang: Lang
}) {
  return (
    <WindowChrome title={data.chip} icon={icon} className="usecase-win">
      <div style={{ padding: "32px 32px 28px" }}>
        <h3 style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.015em", marginBottom: 14 }}>
          {data.title}
        </h3>
        <p style={{ fontSize: 15, color: "var(--tx-secondary)", lineHeight: 1.55, marginBottom: 26 }}>
          {data.body}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 26 }}>
          {data.bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "var(--accent-soft)", color: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 1
              }}>
                <Ico.check style={{ width: 12, height: 12 }} />
              </div>
              <span style={{ fontSize: 14, color: "var(--tx-secondary)", lineHeight: 1.5 }}>{b}</span>
            </div>
          ))}
        </div>

        <button className={`btn btn-lg ${kind === "biz" ? "btn-accent" : ""}`}>
          {data.cta}
          <Ico.arrow style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{
        borderTop: "1px solid var(--bd-divider)",
        padding: "14px 32px",
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(76,194,255,.03)"
      }}>
        {kind === "biz" ? (
          <>
            <Avatar initials="A" size={26} color="linear-gradient(135deg,#76cbff,#2d6e8c)" />
            <Avatar initials="L" size={26} color="linear-gradient(135deg,#4cc2ff,#1a4a5e)" />
            <Avatar initials="K" size={26} color="linear-gradient(135deg,#a2dcff,#3a8db5)" />
            <Avatar initials="+9" size={26} color="var(--bg-elev-2)" />
            <div style={{ fontSize: 12, color: "var(--tx-tertiary)", marginLeft: "auto" }}>
              {lang === "fr" ? "Équipe Boulangerie Pétrin" : "Boulangerie Pétrin team"}
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ico.bolt style={{ width: 14, height: 14 }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--tx-secondary)" }}>
              {lang === "fr" ? "Premier visuel en 4 min en moyenne" : "First visual in 4 min on average"}
            </div>
            <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--tx-tertiary)" }}>
              Free · Pro
            </div>
          </>
        )}
      </div>
    </WindowChrome>
  )
}

export function UseCases({ t, lang }: { t: LandingContent; lang: Lang }) {
  return (
    <section id="uses" className="section" style={{ background: "linear-gradient(180deg, transparent, rgba(76,194,255,.02), transparent)" }}>
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.uses.eyebrow}</div>
          <h2>{t.uses.title}</h2>
          <p>{t.uses.sub}</p>
        </div>

        <div className="uses-grid">
          <UseCaseCard data={t.uses.biz}   icon={<Ico.building style={{ color: "var(--accent)" }} />} kind="biz"   lang={lang} />
          <UseCaseCard data={t.uses.perso} icon={<Ico.user     style={{ color: "var(--accent)" }} />} kind="perso" lang={lang} />
        </div>
      </div>
    </section>
  )
}

/* ========== HOW IT WORKS ========== */
export function HowItWorks({ t }: { t: LandingContent }) {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.how.eyebrow}</div>
          <h2>{t.how.title}</h2>
          <p>{t.how.sub}</p>
        </div>

        <div className="how-grid">
          {t.how.steps.map((s, i) => (
            <div key={i} className="how-step">
              <div className="how-num">{s.n}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: "var(--tx-secondary)", lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========== PRICING ========== */
function PricingCard({
  plan, annual, lang,
}: {
  plan: LandingContent["pricing"]["plans"][number]
  annual: boolean
  lang: Lang
}) {
  const displayPrice = annual && plan.price !== "0"
    ? String(Math.round(parseInt(plan.price, 10) * 0.8))
    : plan.price

  return (
    <WindowChrome
      title={plan.name}
      icon={plan.highlight
        ? <Ico.sparkle   style={{ color: "var(--accent)" }} />
        : <Ico.templates style={{ color: "var(--tx-tertiary)" }} />}
      className={`pricing-win ${plan.highlight ? "highlight" : ""}`}
      glass={plan.highlight}
    >
      <div style={{ padding: "28px 28px 28px", position: "relative" }}>
        {plan.badge && (
          <div style={{
            position: "absolute", top: 18, right: 24,
            fontSize: 11, fontWeight: 600,
            background: "var(--accent)", color: "var(--accent-text-on)",
            padding: "3px 9px", borderRadius: 999
          }}>{plan.badge}</div>
        )}

        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>{plan.name}</div>
        <div style={{ fontSize: 13, color: "var(--tx-tertiary)", marginBottom: 22, minHeight: 36 }}>{plan.desc}</div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 22 }}>
          {plan.price === "0" ? (
            <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em" }}>
              {lang === "fr" ? "Gratuit" : "Free"}
            </span>
          ) : (
            <>
              <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em" }}>€{displayPrice}</span>
              <span style={{ fontSize: 14, color: "var(--tx-tertiary)" }}>
                / {annual ? (lang === "fr" ? "mois (annuel)" : "mo (yearly)") : (lang === "fr" ? "mois" : "month")}
              </span>
            </>
          )}
        </div>

        <button className={`btn ${plan.highlight ? "btn-accent" : ""} btn-lg`} style={{ width: "100%", marginBottom: 22 }}>
          {plan.cta}
          {plan.highlight && <Ico.arrow style={{ width: 14, height: 14 }} />}
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {plan.features.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: "var(--tx-secondary)" }}>
              <Ico.check style={{ width: 14, height: 14, color: "var(--accent)", flex: "none", marginTop: 3 }} />
              <span style={{ lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </WindowChrome>
  )
}

export function Pricing({ t, lang }: { t: LandingContent; lang: Lang }) {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="pricing" className="section">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.pricing.eyebrow}</div>
          <h2>{t.pricing.title}</h2>
          <p>{t.pricing.sub}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", padding: 4,
            background: "var(--bg-elev-1)",
            border: "1px solid var(--bd-soft-2)",
            borderRadius: 8
          }}>
            {([["monthly", t.pricing.monthly], ["yearly", t.pricing.yearly]] as const).map(([k, lbl]) => {
              const isActive = (k === "yearly" && annual) || (k === "monthly" && !annual)
              return (
                <button key={k} onClick={() => setAnnual(k === "yearly")} style={{
                  height: 34, padding: "0 18px",
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "var(--accent-text-on)" : "var(--tx-secondary)",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14, border: 0, borderRadius: 6,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 8
                }}>
                  {lbl}
                  {k === "yearly" && (
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      background: isActive ? "rgba(0,0,0,.18)" : "var(--accent-soft)",
                      color: isActive ? "var(--accent-text-on)" : "var(--accent)",
                      padding: "2px 6px", borderRadius: 4
                    }}>{t.pricing.yearlyHint}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pricing-grid">
          {t.pricing.plans.map((p, i) => (
            <PricingCard key={i} plan={p} annual={annual} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========== REVIEWS ========== */
export function Reviews({ t }: { t: LandingContent }) {
  return (
    <section id="reviews" className="section">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.reviews.eyebrow}</div>
          <h2>{t.reviews.title}</h2>
          <p>{t.reviews.sub}</p>
        </div>

        <div className="reviews-grid">
          {t.reviews.items.map((r, i) => (
            <div key={i} className="review-card">
              <div style={{ display: "flex", gap: 4, marginBottom: 16, color: "var(--accent)" }}>
                {Array.from({ length: r.rating }).map((_, k) => (
                  <Ico.star key={k} style={{ width: 14, height: 14, fill: "var(--accent)" }} />
                ))}
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--tx-primary)", marginBottom: 22, fontWeight: 400 }}>
                « {r.body} »
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: "auto" }}>
                <Avatar initials={r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")} size={36} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "var(--tx-tertiary)" }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========== CONTACT ========== */
export function Contact({ t, lang }: { t: LandingContent; lang: Lang }) {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "",
    topic: t.contact.topicOptions[0],
    message: "",
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <section id="contact" className="section">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.contact.eyebrow}</div>
          <h2>{t.contact.title}</h2>
          <p>{t.contact.sub}</p>
        </div>

        <div className="contact-grid">
          <WindowChrome title={t.contact.formTitle} icon={<Ico.mail style={{ color: "var(--accent)" }} />}>
            <form onSubmit={submit} style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="form-row">
                <div className="field">
                  <label className="field-lbl">{t.contact.name}</label>
                  <input className="input" placeholder={t.contact.namePh} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="field">
                  <label className="field-lbl">{t.contact.email}</label>
                  <input type="email" className="input" placeholder={t.contact.emailPh} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div className="field">
                <label className="field-lbl">{t.contact.topic}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {t.contact.topicOptions.map((tp) => (
                    <button key={tp} type="button" onClick={() => setForm({ ...form, topic: tp })}
                      className={`format-chip ${form.topic === tp ? "active" : ""}`}>
                      {tp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field-lbl">{t.contact.message}</label>
                <textarea rows={5} className="input" placeholder={t.contact.messagePh}
                  value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button type="submit" className="btn btn-accent btn-lg">
                  {sent ? t.contact.sent : t.contact.send}
                  {!sent && <Ico.arrow style={{ width: 14, height: 14 }} />}
                  {sent && <Ico.check style={{ width: 14, height: 14 }} />}
                </button>
                {sent && (
                  <div style={{ fontSize: 13, color: "var(--tx-tertiary)" }}>{t.contact.sentSub}</div>
                )}
              </div>
            </form>
          </WindowChrome>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <WindowChrome title={t.contact.alt.title} icon={<Ico.info style={{ color: "var(--accent)" }} />}>
              <div style={{ padding: "8px 0" }}>
                {t.contact.alt.items.map((it, i) => {
                  const IconEl = Ico[it.icon as IconName] || Ico.mail
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 20px",
                      borderBottom: i < t.contact.alt.items.length - 1 ? "1px solid var(--bd-divider)" : "none",
                      cursor: "pointer", transition: "background 0.12s"
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "var(--accent-soft)", color: "var(--accent)",
                        display: "flex", alignItems: "center", justifyContent: "center", flex: "none"
                      }}>
                        <IconEl style={{ width: 18, height: 18 }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, color: "var(--tx-tertiary)" }}>{it.label}</div>
                        <div style={{ fontSize: 14, color: "var(--tx-primary)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.value}</div>
                      </div>
                      <Ico.arrow style={{ width: 14, height: 14, color: "var(--tx-tertiary)" }} />
                    </div>
                  )
                })}
              </div>
            </WindowChrome>

            <WindowChrome title={t.contact.signin.title} icon={<Ico.user style={{ color: "var(--accent)" }} />}>
              <div style={{ padding: 24 }}>
                <p style={{ fontSize: 14, color: "var(--tx-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
                  {t.contact.signin.body}
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href="/login" className="btn btn-accent" style={{ textDecoration: "none" }}>
                    {t.contact.signin.cta}<Ico.arrow style={{ width: 14, height: 14 }} />
                  </Link>
                  <Link href="/register" className="btn" style={{ textDecoration: "none" }}>{t.cta.signup}</Link>
                </div>
              </div>
            </WindowChrome>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ========== FOOTER ========== */
export function Footer({
  t, lang, setLang, taskbar,
}: {
  t: LandingContent
  lang: Lang
  setLang: (l: Lang) => void
  taskbar?: boolean
}) {
  return (
    <footer style={{ paddingTop: 64, borderTop: "1px solid var(--bd-divider)", background: "rgba(0,0,0,.2)" }}>
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <BrandMark size={32} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>{t.brand}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--tx-tertiary)", maxWidth: 280, lineHeight: 1.55 }}>{t.footer.tagline}</p>

            <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
              <div style={{ fontSize: 11, color: "var(--tx-quaternary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {t.footer.madeIn}
              </div>
            </div>
          </div>

          {t.footer.cols.map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tx-primary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 14 }}>{col.title}</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {col.items.map((it, k) => (
                  <li key={k}>
                    <a href="#" style={{ fontSize: 14, color: "var(--tx-tertiary)", transition: "color 0.12s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--tx-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--tx-tertiary)")}>
                      {it}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {taskbar && (
          <div style={{ margin: "48px 0 0", display: "flex", justifyContent: "center", paddingBottom: 16 }}>
            <div className="taskbar">
              <button className="tb-btn" aria-label="Windows"><Ico.windows /></button>
              <button className="tb-btn" aria-label="Search"><Ico.search /></button>
              <button className="tb-btn active" aria-label="Studio Flyer AI">
                <BrandMark size={22} />
              </button>
              <button className="tb-btn" aria-label="Templates"><Ico.templates /></button>
              <button className="tb-btn" aria-label="Images"><Ico.image /></button>
              <button className="tb-btn" aria-label="Cloud"><Ico.cloud /></button>
              <div style={{ width: 1, height: 24, background: "var(--bd-medium)", margin: "0 4px" }} />
              <SystemTray />
            </div>
          </div>
        )}

        <div style={{
          borderTop: "1px solid var(--bd-divider)",
          marginTop: taskbar ? 16 : 48,
          padding: "20px 0 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12
        }}>
          <div style={{ fontSize: 12, color: "var(--tx-quaternary)" }}>{t.footer.copyright}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--tx-tertiary)" }}>
            <a href="#" style={{ color: "inherit" }}>{lang === "fr" ? "Mentions légales" : "Legal"}</a>
            <a href="#" style={{ color: "inherit" }}>{lang === "fr" ? "Confidentialité" : "Privacy"}</a>
            <a href="#" style={{ color: "inherit" }}>{lang === "fr" ? "Cookies" : "Cookies"}</a>
            <div style={{
              display: "inline-flex", height: 26, padding: 2,
              background: "var(--bg-elev-1)", borderRadius: 6, border: "1px solid var(--bd-soft-2)"
            }}>
              {(["fr", "en"] as const).map((L) => (
                <button key={L} onClick={() => setLang(L)} style={{
                  width: 28, height: 22, fontSize: 10, fontWeight: 600,
                  borderRadius: 4, border: 0, cursor: "pointer",
                  background: lang === L ? "var(--accent)" : "transparent",
                  color: lang === L ? "var(--accent-text-on)" : "var(--tx-secondary)",
                  textTransform: "uppercase",
                  fontFamily: "inherit"
                }}>{L}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
