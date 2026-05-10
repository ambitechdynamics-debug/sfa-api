'use client'

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

interface AdminStatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: number
  suffix?: string
  prefix?: string
  delay?: number
}

export function AdminStatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-violet-600',
  iconBg = 'bg-[var(--icon-violet)]',
  trend,
  suffix = '',
  prefix = '',
  delay = 0,
}: AdminStatsCardProps) {
  const displayValue = typeof value === 'number' ? formatNumber(value) : value
  const isPositive = trend === undefined ? null : trend >= 0

  return (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:shadow-lg hover:border-[var(--accent)]/20 transition-all duration-200 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            isPositive
              ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20'
              : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <div className="text-2xl font-bold text-[var(--text)] tabular-nums leading-tight">
          {prefix}{displayValue}{suffix}
        </div>
        <div className="text-xs text-[var(--text-muted)] font-medium">{title}</div>
      </div>
    </div>
  )
}
