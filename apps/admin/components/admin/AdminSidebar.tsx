'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FolderOpen, Bot, Brain, Link2,
  Palette, Image, Files, FileText, CreditCard, Wallet,
  Coins, Activity, Settings, Sparkles, ChevronRight, X, Ban, GitBranch
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/store/admin-store'

const NAV_ITEMS = [
  { label: 'Vue d\'ensemble', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Séparateur', type: 'separator', section: 'Gestion' },
  { label: 'Utilisateurs', href: '/admin/users', icon: Users },
  { label: 'Projets', href: '/admin/projects', icon: FolderOpen },
  { label: 'Abonnements', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Paiements', href: '/admin/payments', icon: Wallet },
  { label: 'Crédits IA', href: '/admin/credits', icon: Coins },
  { label: 'Séparateur', type: 'separator', section: 'IA & Contenu' },
  { label: 'Agents IA', href: '/admin/agents', icon: Bot },
  { label: 'Orchestrateur', href: '/admin/orchestrator', icon: GitBranch },
  { label: 'Mémoires', href: '/admin/memories', icon: Brain },
  { label: 'Liaisons Agent/Mémoire', href: '/admin/agent-memory-links', icon: Link2 },
  { label: 'Base Artistique', href: '/admin/artistic-base', icon: Palette },
  { label: 'Éléments Interdits', href: '/admin/forbidden-rules', icon: Ban },
  { label: 'Types de Création', href: '/admin/creation-options', icon: Sparkles },
  { label: 'Affiches Générées', href: '/admin/generated-posters', icon: Image },
  { label: 'Fichiers', href: '/admin/files', icon: Files },
  { label: 'Prompts Finaux', href: '/admin/prompts', icon: FileText },
  { label: 'Séparateur', type: 'separator', section: 'Système' },
  { label: 'Logs Agents', href: '/admin/logs', icon: Activity },
  { label: 'Paramètres', href: '/admin/settings', icon: Settings },
] as const

interface SidebarItemProps {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
}

function SidebarItem({ label, href, icon: Icon, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
        isActive
          ? 'bg-[var(--accent)] text-white shadow-sm'
          : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white'
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-current')} />
      <span className="flex-1 font-medium truncate">{label}</span>
      {isActive && <ChevronRight className="w-3 h-3 text-white/60" />}
    </Link>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useAdminStore()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--sidebar-bg)] w-60">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--sidebar-border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-xs font-bold text-white leading-tight">STUDIO FLYER AI</div>
          <div className="text-[10px] text-[var(--sidebar-text)]">Administration</div>
        </div>
        <button
          className="ml-auto lg:hidden p-1 hover:bg-white/10 rounded-md"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-4 h-4 text-[var(--sidebar-text)]" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item, i) => {
          if ('type' in item && item.type === 'separator') {
            return (
              <div key={i} className="pt-4 pb-1.5 first:pt-0">
                <span className="text-[10px] font-semibold text-[var(--sidebar-text)] uppercase tracking-widest px-3">
                  {item.section}
                </span>
              </div>
            )
          }
          if ('href' in item) {
            return (
              <SidebarItem
                key={item.href}
                label={item.label}
                href={item.href}
                icon={item.icon}
                isActive={isActive(item.href, 'exact' in item ? item.exact : false)}
              />
            )
          }
          return null
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--sidebar-border)]">
        <div className="text-[10px] text-[var(--sidebar-text)]">
          STUDIO FLYER AI v0.1.0
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 h-full">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
