'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Menu, Bell, Sun, Moon, LogOut, ChevronRight, User } from 'lucide-react'
import { useState } from 'react'
import { cn, getInitials } from '@/lib/utils'
import { useAdminStore } from '@/store/admin-store'

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin': 'Vue d\'ensemble',
  '/admin/users': 'Utilisateurs',
  '/admin/projects': 'Projets',
  '/admin/agents': 'Agents IA',
  '/admin/orchestrator': 'Orchestrateur',
  '/admin/memories': 'Mémoires',
  '/admin/agent-memory-links': 'Liaisons Agent/Mémoire',
  '/admin/artistic-base': 'Base Artistique',
  '/admin/generated-posters': 'Affiches Générées',
  '/admin/files': 'Fichiers',
  '/admin/prompts': 'Prompts Finaux',
  '/admin/subscriptions': 'Abonnements',
  '/admin/payments': 'Paiements',
  '/admin/credits': 'Crédits IA',
  '/admin/logs': 'Logs Agents',
  '/admin/settings': 'Paramètres',
}

interface AdminHeaderProps {
  isDark: boolean
  onToggleTheme: () => void
}

export function AdminHeader({ isDark, onToggleTheme }: AdminHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, toggleSidebar } = useAdminStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const pageTitle = BREADCRUMB_MAP[pathname] || 'Administration'
  const segments = pathname.split('/').filter(Boolean)

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center px-4 gap-4">
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
      >
        <Menu className="w-5 h-5 text-[var(--text-muted)]" />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm flex-1">
        <span className="text-[var(--text-muted)]">Admin</span>
        {segments.slice(1).map((seg, i) => {
          const path = '/' + segments.slice(0, i + 2).join('/')
          const label = BREADCRUMB_MAP[path] || seg
          return (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
              <span className={cn(
                i === segments.length - 2
                  ? 'text-[var(--text)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer'
              )}>{label}</span>
            </span>
          )
        })}
      </nav>

      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors">
          <Bell className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--error)]" />
        </button>

        {/* Dark mode */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
        >
          {isDark
            ? <Sun className="w-4 h-4 text-[var(--text-muted)]" />
            : <Moon className="w-4 h-4 text-[var(--text-muted)]" />
          }
        </button>

        {/* User menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
              {user ? getInitials(user.fullName) : 'AD'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-[var(--text)] max-w-[120px] truncate">
              {user?.fullName || 'Admin'}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-10 z-50 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg py-1.5 animate-fade-up">
                <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                  <div className="text-xs font-medium text-[var(--text)] truncate">{user?.fullName}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{user?.email}</div>
                </div>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] transition-colors">
                  <User className="w-3.5 h-3.5" /> Mon profil
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-[var(--icon-red)] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
