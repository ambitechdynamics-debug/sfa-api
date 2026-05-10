"use client"

import { usePathname } from "next/navigation"
import { Icon } from "@/components/ui/Icon"

const TITLES: Record<string, { title: string; sub?: string }> = {
  "/dashboard":     { title: "Bonjour", sub: "Reprenez là où vous vous étiez arrêté." },
  "/create":        { title: "Créer un visuel", sub: "Brief en 7 étapes — moins d'une minute." },
  "/projects":      { title: "Mes projets", sub: "Tous vos visuels et brouillons." },
  "/billing":       { title: "Abonnement & crédits", sub: "Gérez votre plan et vos crédits IA." },
  "/profile":       { title: "Profil", sub: "Vos informations personnelles." },
  "/settings":      { title: "Paramètres", sub: "Préférences de l'application." },
  "/ai-settings":   { title: "Paramètres IA", sub: "Mémoires de marque et style par défaut." },
  "/notifications": { title: "Notifications", sub: "Activité de votre compte." },
  "/support":       { title: "Support", sub: "FAQ, contact et tickets." },
}

export function AppHeader() {
  const pathname = usePathname()
  const meta = TITLES[pathname] ?? { title: "" }
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "var(--bg-0)",
        borderBottom: "1px solid var(--line-1)",
        padding: "20px 36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div>
        <h1 className="display" style={{ fontSize: 22, margin: 0, letterSpacing: "-0.02em" }}>{meta.title}</h1>
        {meta.sub && <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "2px 0 0" }}>{meta.sub}</p>}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          aria-label="Notifications"
          style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--bg-2)", color: "var(--ink-1)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <Icon name="bell" size={16} />
        </button>
      </div>
    </header>
  )
}
