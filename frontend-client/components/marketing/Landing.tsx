"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { BrandMark } from "@/components/ui/BrandMark"
import { Poster } from "@/components/poster/Poster"

const FAQ = [
  { q: "Comment fonctionne la génération par IA ?", a: "Vous remplissez un brief en quelques étapes (type, message, style, couleurs, format). Notre IA combine ces informations avec vos préférences de marque pour produire 4 propositions de visuels en moins d'une minute. Vous pouvez ensuite demander des retouches en langage naturel." },
  { q: "Mes visuels sont-ils libres de droits ?", a: "Oui, tous les visuels générés via votre abonnement vous appartiennent et sont utilisables commercialement sans restriction, y compris pour de l'impression grand format ou de la publicité payante." },
  { q: "Puis-je importer ma charte graphique ?", a: "Bien sûr. Importez votre logo, vos couleurs principales, vos polices et vos exemples de visuels. L'IA mémorise votre identité et l'applique à chaque génération. C'est notre fonction Mémoires de marque (plans Pro et Business)." },
  { q: "Comment se passent les retouches ?", a: "Sur chaque proposition, vous pouvez décrire en quelques mots ce que vous souhaitez changer (« plus chaleureux », « ajouter le logo en haut à droite »). L'IA régénère une nouvelle version en gardant la composition." },
  { q: "Puis-je annuler mon abonnement ?", a: "À tout moment, depuis la page Abonnement. Aucun engagement, aucun frais d'annulation. Vos visuels créés restent accessibles dans votre historique." },
  { q: "Quels formats d'export sont disponibles ?", a: "PNG haute résolution, PDF print (CMJN, 300 DPI), JPEG web et SVG. Disponibles dès le plan Starter." },
]

const PLANS = [
  { name: "Découverte", price: "0", period: "€/mois", desc: "Pour tester l'outil", features: ["3 générations / mois", "Formats web", "Filigrane Studio Flyer", "Export PNG"], cta: "Commencer", featured: false },
  { name: "Starter", price: "19", period: "€/mois", desc: "Pour les indépendants", features: ["20 générations / mois", "Tous les formats", "Sans filigrane", "Export HD PNG, PDF, JPEG", "Historique 30 jours"], cta: "Choisir Starter", featured: false },
  { name: "Pro", price: "49", period: "€/mois", desc: "Pour les pros & créateurs", features: ["100 générations / mois", "Retouches illimitées", "Mémoires de marque", "Export tous formats", "Historique illimité", "Support prioritaire"], cta: "Choisir Pro", featured: true },
  { name: "Business", price: "129", period: "€/mois", desc: "Pour les agences", features: ["Générations illimitées", "Multi-marques (10)", "API d'intégration", "Branding agence", "Account manager dédié"], cta: "Nous contacter", featured: false },
]

export function Landing() {
  return (
    <div style={{ background: "var(--bg-0)", minHeight: "100vh" }}>
      <MarketingNav />
      <Hero />
      <PartnerLogos />
      <Features />
      <Gallery />
      <Pricing />
      <Faq />
      <CTA />
      <Footer />
    </div>
  )
}

function PartnerLogos() {
  const logos = ["L'Oréal", "Danone", "Station F", "Publicis", "Havas", "Kering"]
  return (
    <section style={{
      padding: "32px 0",
      background: "rgba(24, 19, 16, 0.4)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderTop: "1px solid var(--line-1)",
      borderBottom: "1px solid var(--line-1)",
      marginTop: -60,
      position: "relative",
      zIndex: 10,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: 24
    }}>
      <div style={{ textAlign: "center", fontSize: 13, color: "var(--ink-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ils génèrent avec nous</div>
      <div style={{ display: "flex", width: "200%" }}>
        <div style={{ display: "flex", width: "50%", justifyContent: "space-around", animation: "marquee 30s linear infinite" }}>
          {logos.map((logo, i) => (
            <span key={i} className="display" style={{ fontSize: 24, color: "var(--ink-2)", opacity: 0.6 }}>{logo}</span>
          ))}
        </div>
        <div style={{ display: "flex", width: "50%", justifyContent: "space-around", animation: "marquee 30s linear infinite" }}>
          {logos.map((logo, i) => (
            <span key={`dup-${i}`} className="display" style={{ fontSize: 24, color: "var(--ink-2)", opacity: 0.6 }}>{logo}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function MarketingNav() {
  return (
    <header
      className="header-shimmer-wrap"
      style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(16,12,8,0.65)",
        backdropFilter: "saturate(160%) blur(14px)",
        WebkitBackdropFilter: "saturate(160%) blur(14px)",
        borderBottom: "1px solid var(--line-1)",
      }}
    >
      <nav style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 32px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" className="logo-hover" style={{ transition: "transform 0.3s ease, filter 0.3s ease", display: "inline-block" }}>
          <BrandMark size={22} animate={true} />
        </Link>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/login"><Button variant="ghost" size="sm">Connexion</Button></Link>
          <Link href="/register"><Button size="sm" icon="sparkles" style={{ boxShadow: "none" }}>Essayer gratuitement</Button></Link>
        </div>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section style={{ position: "relative", overflow: "hidden", paddingBottom: 120 }}>
      {/* Ambient glow */}
      <div aria-hidden style={{ position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)", width: 1200, height: 800, pointerEvents: "none", background: "radial-gradient(50% 60% at 50% 50%, var(--acc-soft) 0%, transparent 70%)", filter: "blur(20px)" }} />
      {/* Grid */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(var(--line-1) 1px, transparent 1px), linear-gradient(90deg, var(--line-1) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(70% 60% at 50% 0%, black, transparent)",
        WebkitMaskImage: "radial-gradient(70% 60% at 50% 0%, black, transparent)",
      }} />

      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "100px 32px 0", textAlign: "center" }}>


        <h1 className="display anim-fade-up" style={{ margin: 0, fontSize: "clamp(40px, 8vw, 84px)", fontWeight: 600, letterSpacing: "-0.04em", maxWidth: 1000, marginInline: "auto", lineHeight: 1.05 }}>
          Créez des affiches{" "}
          <span className="serif" style={{ color: "var(--acc)" }}>professionnelles</span>{" "}
          avec l&apos;intelligence artificielle.
        </h1>

        <p className="anim-fade-up" style={{ margin: "24px auto 0", maxWidth: 600, fontSize: "clamp(16px, 2vw, 18px)", color: "var(--ink-2)", lineHeight: 1.6, animationDelay: "100ms" }}>
          Studio Flyer AI aide les entreprises, créateurs et agences à générer rapidement des visuels marketing de qualité — flyers, affiches, stories, menus. Briefez, générez, retouchez. En une minute.
        </p>

        <div className="anim-fade-up" style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", animationDelay: "200ms" }}>
          <Link href="/register"><Button size="xl" icon="sparkles" className="cta-glow">Commencer maintenant</Button></Link>
          <a href="#gallery"><Button size="xl" variant="outline" iconRight="arrowR">Voir des exemples</Button></a>
        </div>

        <div className="anim-fade-up" style={{ marginTop: 24, fontSize: 13, color: "var(--ink-3)", display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", animationDelay: "300ms" }}>
          {["3 générations gratuites", "Sans carte bancaire", "Export HD inclus"].map((t) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="check" size={14} stroke={2.5} style={{ color: "var(--sage)" }} />{t}
            </span>
          ))}
        </div>
      </div>

      {/* Hero showcase */}
      <div className="anim-fade-up" style={{ position: "relative", maxWidth: 1180, margin: "80px auto 0", padding: "0 32px", animationDelay: "400ms" }}>
        <HeroShowcase />
      </div>
    </section>
  )
}

function HeroShowcase() {
  return (
    <div style={{
      position: "relative", borderRadius: 20,
      background: "var(--bg-1)",
      border: "1px solid var(--line-2)",
      boxShadow: "0 60px 120px rgba(0,0,0,0.6), 0 0 0 1px var(--line-1)",
      overflow: "hidden",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: 520 }} className="max-md:!grid-cols-1">
        {/* Brief sidebar */}
        <div style={{ padding: 24, borderRight: "1px solid var(--line-1)", display: "flex", flexDirection: "column", gap: 18, background: "var(--bg-1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--acc)", letterSpacing: "0.1em" }}>BRIEF · ÉTAPE 3/7</span>
            <Badge size="sm" tone="acc" dot>Live</Badge>
          </div>
          <div style={{ height: 4, background: "var(--bg-3)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: "42%", height: "100%", background: "var(--acc)" }} />
          </div>
          <BriefRow label="Type de visuel"><Badge tone="acc" icon="calendar">Affiche événement</Badge></BriefRow>
          <BriefRow label="Message principal">
            <div style={{ padding: 12, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8, fontSize: 13, lineHeight: 1.5, color: "var(--ink-1)" }}>
              Soirée After Work du vendredi 12 mai, ambiance chaleureuse, bar à cocktails, DJ jusqu&apos;à 1h.
            </div>
          </BriefRow>
          <BriefRow label="Style">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Badge tone="neutral">Élégant</Badge><Badge tone="neutral">Chaleureux</Badge><Badge tone="neutral">Soirée</Badge>
            </div>
          </BriefRow>
          <BriefRow label="Palette">
            <div style={{ display: "flex", gap: 6 }}>
              {["#c66a45", "#1a0e08", "#f4ecd8", "#d8a85a"].map((c) => (
                <div key={c} style={{ width: 28, height: 28, background: c, borderRadius: 6, border: "1px solid var(--line-2)" }} />
              ))}
            </div>
          </BriefRow>
          <div style={{ flex: 1 }} />
          <Button full icon="sparkles">Générer 4 propositions</Button>
        </div>

        {/* Results grid */}
        <div style={{ padding: 24, background: "var(--bg-0)", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="display" style={{ fontSize: 18, marginBottom: 2 }}>4 propositions</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)" }}>Générées en 38 secondes · Cliquez pour retoucher</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button size="sm" variant="outline" icon="refresh">Régénérer</Button>
              <Button size="sm" variant="secondary" icon="download">Exporter</Button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, flex: 1 }}>
            <Poster kind="editorial" ratio="3/4" brief={{ title: "Soirée\nAfter Work", date: "Vendredi 12 Mai", venue: "Le Loft · Paris 10", brand: "EVENTLAB" }} />
            <Poster kind="music" ratio="3/4" brief={{ title: "Soirée\nAfter Work", artist: "EVENTLAB", date: "12.05", venue: "Le Loft · Paris 10" }} />
            <Poster kind="menu" ratio="3/4" brief={{ title: "After\nWork", price: "Gratuit", brand: "EVENTLAB" }} />
            <Poster kind="corp" ratio="3/4" brief={{ title: "Soirée\nAfter Work", date: "12 Mai", brand: "EVENTLAB" }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function BriefRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  )
}

function SectionTitle({ overline, title, subtitle }: { overline: string; title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--acc)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{overline}</div>
      <h2 className="display" style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.03em", margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ marginTop: 16, fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>{subtitle}</p>}
    </div>
  )
}

function Features() {
  const features = [
    { icon: "zap" as const, title: "Création rapide", desc: "De l'idée au visuel en moins d'une minute. Vraiment." },
    { icon: "wand" as const, title: "Visuels professionnels", desc: "Composition, typographie, hiérarchie. Pas de bricolage." },
    { icon: "edit" as const, title: "Retouches en langage naturel", desc: "« Plus chaleureux », « bouge le logo en haut » — l'IA comprend." },
    { icon: "rocket" as const, title: "Tous les formats", desc: "Stories, A4, A5, bannières, posts. Au pixel près." },
    { icon: "download" as const, title: "Export HD", desc: "PNG, PDF print 300dpi, JPEG, SVG. Sans filigrane." },
    { icon: "palette" as const, title: "Mémoires de marque", desc: "L'IA mémorise votre identité et l'applique." },
  ]
  return (
    <section id="features" style={{ padding: "120px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <SectionTitle
        overline="Fonctionnalités"
        title="Tout ce qu'il faut pour briefer, générer, livrer."
        subtitle="Studio Flyer AI ne remplace pas votre direction artistique. Il accélère le travail répétitif pour vous laisser créer mieux, plus vite."
      />
      <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        {features.map((f) => (
          <Card key={f.title} padding={28} style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--acc-soft)", border: "1px solid var(--acc-line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc)" }}>
              <Icon name={f.icon} size={20} />
            </div>
            <h3 className="display" style={{ fontSize: 22, margin: 0 }}>{f.title}</h3>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

function Gallery() {
  const items: Array<{ kind: "editorial" | "menu" | "launch" | "sale" | "corp" | "music"; brief: Record<string, string> }> = [
    { kind: "editorial", brief: { title: "Soirée\nAfter Work", date: "VEN 12.05", venue: "Le Loft · Paris", brand: "EVENTLAB" } },
    { kind: "menu", brief: { title: "Brunch\nDominical", price: "18€", brand: "MAISON CAFÉ" } },
    { kind: "launch", brief: { title: "Drop\nÉté '25", subtitle: "Nouvelle collection", brand: "MAREA" } },
    { kind: "sale", brief: { percent: "40", brand: "BOUTIQUE 22" } },
    { kind: "corp", brief: { title: "Lancement\nProduit", date: "Q3 2025", brand: "NORTH LABS" } },
    { kind: "music", brief: { title: "Live\nSession", artist: "MARA", date: "23.06", venue: "La Bellevilloise" } },
  ]
  return (
    <section id="gallery" style={{ padding: "120px 32px", background: "var(--bg-1)", borderTop: "1px solid var(--line-1)", borderBottom: "1px solid var(--line-1)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionTitle overline="Galerie" title="Des résultats que vous pourriez signer." subtitle="Chaque visuel ci-dessous a été généré en moins d'une minute à partir d'un brief de quelques lignes." />
        <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {items.map((it, i) => (
            <div key={i} style={{ animation: `fadeUp 400ms ${i * 80}ms backwards` }}>
              <Poster kind={it.kind} brief={it.brief} ratio="3/4" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" style={{ padding: "120px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <SectionTitle overline="Tarifs" title="Un plan pour chaque cadence." subtitle="Sans engagement, annulez à tout moment. Tous les plans incluent les mises à jour et les nouvelles fonctionnalités." />
      <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {PLANS.map((p) => (
          <Card key={p.name} padding={28} style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", borderColor: p.featured ? "var(--acc-line)" : "var(--line-1)", boxShadow: p.featured ? "var(--sh-acc)" : "var(--sh-1)", height: "100%" }}>
            {p.featured && <Badge tone="acc" style={{ position: "absolute", top: -12, right: 20 }}>Recommandé</Badge>}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{p.desc}</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span className="display" style={{ fontSize: 48, letterSpacing: "-0.03em", fontWeight: 600 }}>{p.price}</span>
              <span style={{ color: "var(--ink-3)", fontSize: 14 }}>{p.period}</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--ink-1)" }}>
              {p.features.map((f) => (
                <li key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Icon name="check" size={14} stroke={3} style={{ color: "var(--acc)", marginTop: 2, flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" style={{ marginTop: "auto", paddingTop: 12 }}>
              <Button full variant={p.featured ? "primary" : "outline"}>{p.cta}</Button>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" style={{ padding: "120px 32px", maxWidth: 880, margin: "0 auto" }}>
      <SectionTitle overline="FAQ" title="Questions fréquentes." />
      <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 8 }}>
        {FAQ.map((item, i) => {
          const active = open === i
          return (
            <Card key={i} padding={0} style={{ overflow: "hidden" }}>
              <button
                onClick={() => setOpen(active ? null : i)}
                style={{ width: "100%", padding: "20px 24px", background: "transparent", border: 0, color: "var(--ink-0)", fontSize: 15, fontWeight: 500, textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              >
                <span>{item.q}</span>
                <Icon name={active ? "chevronU" : "chevronD"} size={16} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
              </button>
              {active && (
                <div className="anim-fade-up" style={{ padding: "0 24px 20px", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6 }}>
                  {item.a}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section style={{ padding: "120px 32px", textAlign: "center", borderTop: "1px solid var(--line-1)" }}>
      <h2 className="display" style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.03em", margin: 0 }}>
        Prêt à <span className="serif" style={{ color: "var(--acc)" }}>créer</span> ?
      </h2>
      <p style={{ marginTop: 16, fontSize: 16, color: "var(--ink-2)" }}>
        3 générations gratuites pour tester. Aucune carte requise.
      </p>
      <div style={{ marginTop: 32 }}>
        <Link href="/register"><Button size="xl" icon="sparkles">Créer mon premier visuel</Button></Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ padding: "48px 32px", borderTop: "1px solid var(--line-1)", color: "var(--ink-3)", fontSize: 13, textAlign: "center" }}>
      <BrandMark size={18} />
      <div style={{ marginTop: 16, fontFamily: "var(--font-mono)" }}>© 2025 Studio Flyer AI · Paris</div>
    </footer>
  )
}
