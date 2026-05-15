import type { IconName } from "@/components/ui/Icon"

export interface AppNavItem {
  label: string
  href: string
  icon: IconName | string
}

export const WORKSPACE_NAV: AppNavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: "home" },
  { label: "Créer", href: "/dashboard/create", icon: "sparkles" },
  { label: "Assistant IA", href: "/dashboard/ai", icon: "message" },
  { label: "Projets", href: "/dashboard/projects", icon: "folder" },
  { label: "Métriques", href: "/dashboard/metrics", icon: "trend" },
]

export const LIBRARY_NAV: AppNavItem[] = [
  { label: "Billing", href: "/dashboard/billing", icon: "credit" },
  { label: "Notifications", href: "/dashboard/notifications", icon: "bell" },
  { label: "Support", href: "/dashboard/support", icon: "help" },
]

export const ACCOUNT_NAV: AppNavItem[] = [
  { label: "Paramètres", href: "/dashboard/settings", icon: "settings" },
]

const STATIC_TITLES: Record<string, { title: string; sub?: string }> = {
  "/dashboard": { title: "Studio", sub: "Créer, reprendre ou exporter un visuel." },
  "/dashboard/create": { title: "Créer", sub: "Prompt, options simples et génération." },
  "/dashboard/ai": { title: "Assistant IA", sub: "Aide créative et recommandations rapides." },
  "/dashboard/projects": { title: "Projets", sub: "Historique des créations et brouillons." },
  "/dashboard/metrics": { title: "Métriques", sub: "Activité personnelle et qualité d'usage." },
  "/dashboard/billing": { title: "Billing", sub: "Plan, crédits, factures et paiements." },
  "/dashboard/profile": { title: "Profil", sub: "Compte utilisateur et préférences principales." },
  "/dashboard/settings": { title: "Paramètres", sub: "Thème, génération, notifications et sécurité." },
  "/dashboard/notifications": { title: "Notifications", sub: "Nouveautés et activité récente." },
  "/dashboard/support": { title: "Support", sub: "Aide, FAQ et contact." },
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function getRouteMeta(pathname: string) {
  if (pathname.match(/^\/dashboard\/projects\/[^/]+\/result$/)) {
    return { title: "Résultats", sub: "Variantes générées, retouches et exports." }
  }
  if (pathname.match(/^\/dashboard\/projects\/[^/]+$/)) {
    return { title: "Détail du projet", sub: "Brief, mémoires et historique du projet." }
  }
  return STATIC_TITLES[pathname] ?? { title: "Studio Flyer", sub: "Espace de travail." }
}
