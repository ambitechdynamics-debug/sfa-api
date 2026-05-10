'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-[var(--text-subtle)]" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-[var(--text)] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[var(--text-muted)] max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] animate-skeleton" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[var(--bg-subtle)] rounded animate-skeleton" style={{ width: `${60 + i * 5}%` }} />
            <div className="h-2.5 bg-[var(--bg-subtle)] rounded animate-skeleton" style={{ width: `${40 + i * 3}%` }} />
          </div>
          <div className="h-6 w-16 bg-[var(--bg-subtle)] rounded-full animate-skeleton" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ cols = 6, rows = 8 }: { cols?: number; rows?: number }) {
  return (
    <div className="w-full">
      <div className="flex gap-4 p-3 border-b border-[var(--border)] mb-1">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-[var(--bg-subtle)] rounded animate-skeleton flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 border-b border-[var(--border)]">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-3 bg-[var(--bg-subtle)] rounded animate-skeleton flex-1" style={{ opacity: 1 - j * 0.08 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] animate-skeleton" />
        <div className="flex-1">
          <div className="h-3 bg-[var(--bg-subtle)] rounded animate-skeleton w-3/4 mb-1.5" />
          <div className="h-6 bg-[var(--bg-subtle)] rounded animate-skeleton w-1/2" />
        </div>
      </div>
      <div className="h-2 bg-[var(--bg-subtle)] rounded animate-skeleton w-1/3" />
    </div>
  )
}
