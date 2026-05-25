"use client"

/**
 * Template SVG mocks used in posters stage + templates grid.
 * Pure SVG, no state — just colored backgrounds with placeholder text.
 */

export type TemplateKind =
  | "flyer-event" | "poster-sale" | "card" | "social-square"
  | "social-story" | "cv" | "menu" | "flyer-corporate"

export type TemplatePalette = [string, string, string, string] // [bg, mid, accent, fg]

interface Props {
  kind: TemplateKind
  palette?: TemplatePalette
  title?: string
  subtitle?: string
}

const FONT = "Segoe UI Variable, sans-serif"

export function TemplateMock({ kind, palette, title, subtitle }: Props) {
  const C: TemplatePalette = palette || ["#1a1a1a", "#2b2b2b", "#4cc2ff", "#ffffff"]
  const [bg, mid, ac, fg] = C

  if (kind === "flyer-event") {
    return (
      <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="200" height="260" fill={bg} />
        <circle cx="100" cy="100" r="78" fill={ac} opacity=".18" />
        <circle cx="100" cy="100" r="50" fill={ac} opacity=".35" />
        <rect x="22" y="22" width="40" height="3" fill={ac} />
        <text x="22" y="50" fill={fg} fontFamily={FONT} fontSize="9" fontWeight="600" letterSpacing="2">EVENT · 2026</text>
        <text x="22" y="195" fill={fg} fontFamily={FONT} fontSize="22" fontWeight="700">{title || "Soirée Live"}</text>
        <text x="22" y="213" fill={fg} fontFamily={FONT} fontSize="10" opacity=".7">{subtitle || "Vendredi · 21:00 · Paris"}</text>
        <rect x="22" y="225" width="56" height="2" fill={ac} />
      </svg>
    )
  }
  if (kind === "poster-sale") {
    return (
      <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="200" height="260" fill={mid} />
        <rect x="10" y="10" width="180" height="240" fill="none" stroke={ac} strokeWidth="1.5" />
        <text x="100" y="92" fill={fg} fontFamily={FONT} fontSize="44" fontWeight="800" textAnchor="middle">-50%</text>
        <text x="100" y="115" fill={ac} fontFamily={FONT} fontSize="9" fontWeight="600" textAnchor="middle" letterSpacing="3">PROMOTION</text>
        <line x1="40" y1="135" x2="160" y2="135" stroke={ac} strokeWidth="1" />
        <text x="100" y="170" fill={fg} fontFamily={FONT} fontSize="13" fontWeight="600" textAnchor="middle">Collection Hiver</text>
        <text x="100" y="187" fill={fg} fontFamily={FONT} fontSize="9" textAnchor="middle" opacity=".6">Jusqu&apos;au 28 fév.</text>
        <rect x="60" y="210" width="80" height="22" fill={ac} rx="3" />
        <text x="100" y="225" fill={bg} fontFamily={FONT} fontSize="9" fontWeight="700" textAnchor="middle">EN BOUTIQUE</text>
      </svg>
    )
  }
  if (kind === "card") {
    return (
      <svg viewBox="0 0 260 160" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="260" height="160" fill={bg} />
        <rect x="0" y="0" width="100" height="160" fill={ac} />
        <circle cx="50" cy="80" r="22" fill={bg} />
        <text x="50" y="84" fill={fg} fontFamily={FONT} fontSize="14" fontWeight="700" textAnchor="middle">CD</text>
        <text x="120" y="60" fill={fg} fontFamily={FONT} fontSize="13" fontWeight="600">{title || "Camille Durand"}</text>
        <text x="120" y="74" fill={fg} fontFamily={FONT} fontSize="9" opacity=".7">{subtitle || "Directrice artistique"}</text>
        <line x1="120" y1="86" x2="240" y2="86" stroke={fg} strokeOpacity=".15" />
        <text x="120" y="106" fill={fg} fontFamily={FONT} fontSize="8" opacity=".8">camille@studio-flyer.ai</text>
        <text x="120" y="120" fill={fg} fontFamily={FONT} fontSize="8" opacity=".8">+33 6 12 34 56 78</text>
        <text x="120" y="134" fill={fg} fontFamily={FONT} fontSize="8" opacity=".5">studio-flyer.ai</text>
      </svg>
    )
  }
  if (kind === "social-square") {
    return (
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="csl-g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ac} stopOpacity=".4" />
            <stop offset="100%" stopColor={bg} />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#csl-g1)" />
        <path d="M0 130 L200 90 L200 200 L0 200Z" fill={bg} opacity=".6" />
        <text x="100" y="100" fill={fg} fontFamily={FONT} fontSize="22" fontWeight="700" textAnchor="middle">{title || "Nouveau"}</text>
        <text x="100" y="122" fill={fg} fontFamily={FONT} fontSize="10" opacity=".75" textAnchor="middle">{subtitle || "Disponible maintenant"}</text>
        <circle cx="100" cy="160" r="14" fill={ac} />
        <path d="M94 160 L98 164 L106 156" stroke={bg} strokeWidth="2" fill="none" />
      </svg>
    )
  }
  if (kind === "social-story") {
    return (
      <svg viewBox="0 0 140 240" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="140" height="240" fill={bg} />
        <rect x="0" y="0" width="140" height="120" fill={ac} opacity=".5" />
        <circle cx="70" cy="60" r="28" fill={bg} />
        <text x="70" y="65" fontFamily={FONT} fontSize="18" fontWeight="700" fill={fg} textAnchor="middle">★</text>
        <text x="70" y="146" fill={fg} fontFamily={FONT} fontSize="13" fontWeight="700" textAnchor="middle">Story</text>
        <text x="70" y="160" fill={fg} fontFamily={FONT} fontSize="8" opacity=".7" textAnchor="middle">Glisse pour voir</text>
        <rect x="20" y="200" width="100" height="2" fill={fg} opacity=".3" rx="1" />
        <rect x="20" y="200" width="40" height="2" fill={ac} rx="1" />
      </svg>
    )
  }
  if (kind === "cv") {
    return (
      <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="200" height="260" fill={fg} />
        <rect x="0" y="0" width="70" height="260" fill={bg} />
        <circle cx="35" cy="46" r="20" fill={ac} opacity=".6" />
        <text x="35" y="86" fill={fg} fontFamily={FONT} fontSize="7" fontWeight="600" textAnchor="middle" letterSpacing="1">EXPÉRIENCE</text>
        <rect x="14" y="94" width="42" height="1" fill={ac} />
        <rect x="14" y="102" width="42" height="2" fill={fg} opacity=".3" />
        <rect x="14" y="108" width="32" height="2" fill={fg} opacity=".2" />
        <rect x="14" y="120" width="42" height="2" fill={fg} opacity=".3" />
        <rect x="14" y="126" width="28" height="2" fill={fg} opacity=".2" />
        <text x="14" y="158" fill={fg} fontFamily={FONT} fontSize="7" fontWeight="600" letterSpacing="1">FORMATION</text>
        <rect x="14" y="166" width="42" height="1" fill={ac} />
        <rect x="14" y="172" width="42" height="2" fill={fg} opacity=".3" />
        <rect x="14" y="178" width="34" height="2" fill={fg} opacity=".2" />
        <text x="90" y="40" fill={bg} fontFamily={FONT} fontSize="14" fontWeight="700">Léa Martin</text>
        <text x="90" y="54" fill={bg} fontFamily={FONT} fontSize="8" opacity=".6">Designer Produit</text>
        <line x1="90" y1="62" x2="186" y2="62" stroke={ac} />
        <rect x="90" y="78" width="80" height="3" fill={bg} opacity=".2" />
        <rect x="90" y="86" width="92" height="3" fill={bg} opacity=".2" />
        <rect x="90" y="94" width="70" height="3" fill={bg} opacity=".2" />
        <rect x="90" y="118" width="50" height="6" fill={ac} />
        <text x="115" y="123" fill={bg} fontFamily={FONT} fontSize="6" fontWeight="700" textAnchor="middle">PROJETS</text>
        <rect x="90" y="134" width="92" height="3" fill={bg} opacity=".2" />
        <rect x="90" y="142" width="80" height="3" fill={bg} opacity=".2" />
      </svg>
    )
  }
  if (kind === "menu") {
    return (
      <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="200" height="260" fill={bg} />
        <text x="100" y="40" fill={ac} fontFamily={FONT} fontSize="8" textAnchor="middle" letterSpacing="3">— MENU —</text>
        <text x="100" y="64" fill={fg} fontFamily={FONT} fontSize="18" fontWeight="700" textAnchor="middle">Le Comptoir</text>
        <line x1="60" y1="76" x2="140" y2="76" stroke={ac} />
        <text x="22" y="100" fill={fg} fontFamily={FONT} fontSize="9" fontWeight="600">Entrées</text>
        <text x="22" y="114" fill={fg} fontFamily={FONT} fontSize="7" opacity=".7">Burrata · tomates anciennes</text>
        <text x="178" y="114" fill={fg} fontFamily={FONT} fontSize="7" opacity=".7" textAnchor="end">12€</text>
        <text x="22" y="126" fill={fg} fontFamily={FONT} fontSize="7" opacity=".7">Tartare de saumon</text>
        <text x="178" y="126" fill={fg} fontFamily={FONT} fontSize="7" opacity=".7" textAnchor="end">14€</text>
        <text x="22" y="148" fill={fg} fontFamily={FONT} fontSize="9" fontWeight="600">Plats</text>
        <text x="22" y="162" fill={fg} fontFamily={FONT} fontSize="7" opacity=".7">Magret de canard</text>
        <text x="178" y="162" fill={fg} fontFamily={FONT} fontSize="7" opacity=".7" textAnchor="end">22€</text>
        <text x="22" y="174" fill={fg} fontFamily={FONT} fontSize="7" opacity=".7">Risotto truffe</text>
        <text x="178" y="174" fill={fg} fontFamily={FONT} fontSize="7" opacity=".7" textAnchor="end">24€</text>
        <text x="22" y="196" fill={fg} fontFamily={FONT} fontSize="9" fontWeight="600">Desserts</text>
        <text x="22" y="210" fill={fg} fontFamily={FONT} fontSize="7" opacity=".7">Tarte au citron</text>
        <text x="178" y="210" fill={fg} fontFamily={FONT} fontSize="7" opacity=".7" textAnchor="end">9€</text>
      </svg>
    )
  }
  if (kind === "flyer-corporate") {
    return (
      <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="200" height="260" fill={bg} />
        <rect x="0" y="0" width="200" height="80" fill={mid} />
        <rect x="16" y="16" width="32" height="3" fill={ac} />
        <text x="16" y="42" fill={fg} fontFamily={FONT} fontSize="9" fontWeight="600" letterSpacing="2">RAPPORT · 2026</text>
        <text x="16" y="62" fill={fg} fontFamily={FONT} fontSize="16" fontWeight="700">Bilan annuel</text>
        <g transform="translate(16,100)">
          <rect width="80" height="44" fill={mid} rx="3" />
          <text x="10" y="16" fill={fg} fontFamily={FONT} fontSize="6" opacity=".6">CHIFFRE</text>
          <text x="10" y="34" fill={fg} fontFamily={FONT} fontSize="14" fontWeight="700">€ 2,4M</text>
        </g>
        <g transform="translate(104,100)">
          <rect width="80" height="44" fill={mid} rx="3" />
          <text x="10" y="16" fill={ac} fontFamily={FONT} fontSize="6" opacity=".9">+ 18%</text>
          <text x="10" y="34" fill={fg} fontFamily={FONT} fontSize="14" fontWeight="700">Croissance</text>
        </g>
        <polyline points="16,200 50,180 80,190 110,165 145,170 184,150" stroke={ac} strokeWidth="1.5" fill="none" />
        <line x1="16" y1="220" x2="184" y2="220" stroke={fg} strokeOpacity=".15" />
        <text x="16" y="240" fill={fg} fontFamily={FONT} fontSize="7" opacity=".5">studio-flyer.ai</text>
      </svg>
    )
  }
  return null
}
