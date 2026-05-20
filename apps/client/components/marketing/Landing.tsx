"use client"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { BrandMark } from "@/components/ui/BrandMark"
import { Poster } from "@/components/poster/Poster"
import { AiPromptPanel } from "./AiPromptPanel"
import { FloatingTestimonials } from "./FloatingTestimonials"
import { AdCreationShowcase } from "./AdCreationShowcase"
import { TestimonialsSection } from "./TestimonialsSection"
import { PlatformVisualLibrarySection } from "./PlatformVisualLibrarySection"

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
      <AdCreationShowcase />
      <PlatformVisualLibrarySection />
      <Features />
      <Pricing />
      <TestimonialsSection />
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
      background: "transparent",
      marginTop: 0, // Reset negative margin to lower it
      position: "relative",
      zIndex: 10,
      overflow: "hidden",
    }}>
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        position: "relative",
        padding: "0 32px"
      }}>
        {/* Left Limiter (Enter) */}
        <div
          className="anim-shimmer"
          style={{
            position: "absolute",
            left: 32,
            top: "50%",
            transform: "translateY(-50%)",
            width: 1,
            height: 40,
            background: "linear-gradient(to bottom, transparent, var(--acc), transparent)",
            boxShadow: "0 0 15px var(--acc-soft)",
            zIndex: 20
          }}
        />

        {/* Right Limiter (Exit) */}
        <div
          className="anim-shimmer"
          style={{
            position: "absolute",
            right: 32,
            top: "50%",
            transform: "translateY(-50%)",
            width: 1,
            height: 40,
            background: "linear-gradient(to bottom, transparent, var(--acc), transparent)",
            boxShadow: "0 0 15px var(--acc-soft)",
            zIndex: 20
          }}
        />

        {/* Marquee with Mask */}
        <div style={{
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}>
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
    <section style={{ position: "relative", overflow: "hidden", paddingBottom: 40 }}>
      {/* Ambient glow */}
      <div aria-hidden style={{ position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)", width: 1200, height: 800, pointerEvents: "none", background: "radial-gradient(50% 60% at 50% 50%, var(--acc-soft) 0%, transparent 70%)", filter: "blur(20px)" }} />

      {/* Decorative Floating Logos */}
      <FloatingLogos />
      <FloatingTestimonials />

      {/* Grid */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(var(--line-1) 1px, transparent 1px), linear-gradient(90deg, var(--line-1) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(70% 60% at 50% 0%, black, transparent)",
        WebkitMaskImage: "radial-gradient(70% 60% at 50% 0%, black, transparent)",
      }} />

      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "100px 32px 0", textAlign: "center" }}>


        <h1 className="display anim-fade-up" style={{ margin: 0, fontSize: "clamp(30px, 5vw, 53px)", fontWeight: 600, letterSpacing: "-0.04em", maxWidth: 1000, marginInline: "auto", lineHeight: 1.05 }}>
          Créez des affiches professionnelles avec le meilleur{" "}
          <span className="serif" style={{ color: "var(--acc)" }}> créateur de visuel.</span>{" "}
        </h1>

        <p className="anim-fade-up" style={{ margin: "24px auto 0", maxWidth: 600, fontSize: "clamp(16px, 2vw, 18px)", color: "var(--ink-2)", lineHeight: 1.6, animationDelay: "100ms" }}>
          Studio Flyer aide les entreprises, créateurs et agences à générer rapidement des visuels marketing de qualité. En une minute.
        </p>

        <div className="anim-fade-up" style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", animationDelay: "200ms" }}>
          <Link href="/register"><Button size="xl" icon="sparkles" className="cta-glow">Commencer maintenant</Button></Link>
          <a href="#gallery"><Button size="xl" variant="outline" iconRight="arrowR">Voir des exemples</Button></a>
        </div>

        <div className="anim-fade-up" style={{ marginTop: 24, fontSize: 13, color: "var(--ink-3)", display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", animationDelay: "300ms" }}>
          {["300 crédits gratuites", "Sans carte bancaire", "Export de visuel"].map((t) => (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="check" size={14} stroke={2.5} style={{ color: "var(--sage)" }} />{t}
            </span>
          ))}
        </div>
      </div>

      {/* Hero showcase */}
      <AiPromptPanel />
    </section>
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
    <section id="features" style={{ padding: "120px 32px", background: "var(--bg-0)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionTitle
          overline="Fonctionnalités"
          title="Tout ce qu'il faut pour briefer, générer, livrer."
          subtitle="Studio Flyer ne remplace pas votre direction artistique. Il accélère le travail répétitif pour vous laisser créer encore mieux, plus vite."
        />
        <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {features.map((f) => (
            <Card key={f.title} padding={28} style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", background: "var(--bg-0)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--acc-soft)", border: "1px solid var(--acc-line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc)" }}>
                <Icon name={f.icon} size={20} />
              </div>
              <h3 className="display" style={{ fontSize: 22, margin: 0 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
            </Card>
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

function FloatingLogos() {
  const colors = ["var(--acc)", "var(--sage)", "var(--plum)", "var(--gold)", "var(--rose)", "var(--sky)"]
  const [logos, setLogos] = useState<Array<{ id: number; top: number; left: number; size: number; duration: number; delay: number; color: string; rotation: number }>>([])

  useEffect(() => {
    // Generate 25 random floating logos (more density for smaller size)
    const newLogos = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.floor(Math.random() * 6) + 6, // 6px to 12px (miniaturized)
      duration: Math.random() * 20 + 20,
      delay: Math.random() * -40,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.floor(Math.random() * 360) // random initial orientation
    }))
    setLogos(newLogos)
  }, [])

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1, opacity: 0.08 }}>
      {logos.map((logo) => (
        <div
          key={logo.id}
          style={{
            position: "absolute",
            top: `${logo.top}%`,
            left: `${logo.left}%`,
            animation: `float ${logo.duration}s ease-in-out infinite`,
            animationDelay: `${logo.delay}s`,
            transform: `rotate(${logo.rotation}deg)`, // random orientation
            filter: "blur(0.5px)",
          }}
        >
          <BrandMark size={logo.size} withWordmark={false} color={logo.color} />
        </div>
      ))}
    </div>
  )
}


