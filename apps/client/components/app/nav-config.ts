import type { IconName } from "@/components/ui/Icon"

export interface AppNavItem {
  label: string
  href: string
  icon: IconName | string
}

export const WORKSPACE_NAV: AppNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "home" },
  { label: "Create", href: "/dashboard/create", icon: "sparkles" },
  { label: "AI Assistant", href: "/dashboard/ai", icon: "message" },
  { label: "Projects", href: "/dashboard/projects", icon: "folder" },
  { label: "Metrics", href: "/dashboard/metrics", icon: "trend" },
]

export const LIBRARY_NAV: AppNavItem[] = [
  { label: "Billing", href: "/dashboard/billing", icon: "credit" },
  { label: "Notifications", href: "/dashboard/notifications", icon: "bell" },
  { label: "Support", href: "/dashboard/support", icon: "help" },
]

export const ACCOUNT_NAV: AppNavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
]

const STATIC_TITLES: Record<string, { title: string; sub?: string }> = {
  "/dashboard": { title: "Studio", sub: "Create, resume, or export a visual." },
  "/dashboard/create": { title: "Create", sub: "Prompt, simple options, and generation." },
  "/dashboard/ai": { title: "AI Assistant", sub: "Creative help and quick recommendations." },
  "/dashboard/projects": { title: "Projects", sub: "Creation history and drafts." },
  "/dashboard/metrics": { title: "Metrics", sub: "Personal activity and usage quality." },
  "/dashboard/billing": { title: "Billing", sub: "Plan, credits, invoices, and payments." },
  "/dashboard/profile": { title: "Profile", sub: "User account and main preferences." },
  "/dashboard/settings": { title: "Settings", sub: "Theme, generation, notifications, and security." },
  "/dashboard/notifications": { title: "Notifications", sub: "News and recent activity." },
  "/dashboard/support": { title: "Support", sub: "Help, FAQ, and contact." },
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function getRouteMeta(pathname: string) {
  if (pathname.match(/^\/dashboard\/projects\/[^/]+\/result$/)) {
    return { title: "Results", sub: "Generated variations, edits, and exports." }
  }
  if (pathname.match(/^\/dashboard\/projects\/[^/]+$/)) {
    return { title: "Project details", sub: "Brief, memories, and project history." }
  }
  return STATIC_TITLES[pathname] ?? { title: "Studio Flyer", sub: "Workspace." }
}
