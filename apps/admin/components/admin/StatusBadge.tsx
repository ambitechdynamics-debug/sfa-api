'use client'

import { cn } from '@/lib/utils'

type Status =
  | 'DRAFT' | 'QUESTIONING' | 'ANALYZING' | 'READY_FOR_PROMPT'
  | 'PROMPT_READY' | 'GENERATING' | 'GENERATED' | 'FAILED'
  | 'PENDING' | 'SUCCESS' | 'CANCELLED' | 'ACTIVE' | 'INACTIVE'
  | 'PROJECT' | 'USER' | 'GLOBAL'
  | 'INPUT' | 'OUTPUT' | 'BOTH'
  | 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'MOCK'

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT:            { label: 'Brouillon',      className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  QUESTIONING:      { label: 'Questionnaire',  className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' },
  ANALYZING:        { label: 'Analyse',        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  READY_FOR_PROMPT: { label: 'Prêt prompt',    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' },
  PROMPT_READY:     { label: 'Prompt OK',      className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
  GENERATING:       { label: 'Génération',     className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  GENERATED:        { label: 'Généré',         className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  FAILED:           { label: 'Échoué',         className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  PENDING:          { label: 'En attente',     className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  SUCCESS:          { label: 'Succès',         className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  CANCELLED:        { label: 'Annulé',         className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  ACTIVE:           { label: 'Actif',          className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  INACTIVE:         { label: 'Inactif',        className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
  PROJECT:          { label: 'Projet',         className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  USER:             { label: 'Utilisateur',    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
  GLOBAL:           { label: 'Global',         className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  INPUT:            { label: 'Entrée',         className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  OUTPUT:           { label: 'Sortie',         className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400' },
  BOTH:             { label: 'Entrée/Sortie',  className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  OPENAI:           { label: 'OpenAI',         className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  ANTHROPIC:        { label: 'Anthropic',      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
  GEMINI:           { label: 'Gemini',         className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  MOCK:             { label: 'Mock',           className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  openai:           { label: 'OpenAI',         className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  anthropic:        { label: 'Anthropic',      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
  gemini:           { label: 'Gemini',         className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  mock:             { label: 'Mock',           className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
  dot?: boolean
}

export function StatusBadge({ status, size = 'md', dot = false }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      config.className
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {config.label}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'ADMIN'
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
      isAdmin
        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    )}>
      {isAdmin ? 'Admin' : 'Utilisateur'}
    </span>
  )
}

export function PlanBadge({ plan }: { plan?: string }) {
  const PLANS: Record<string, string> = {
    Gratuit: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    Starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    Business: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
    Agence: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  }
  const cls = PLANS[plan || ''] || 'bg-gray-100 text-gray-500'
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', cls)}>
      {plan || '—'}
    </span>
  )
}

export function ProviderBadge({ provider }: { provider: string }) {
  return <StatusBadge status={provider} />
}

export type { Status }
