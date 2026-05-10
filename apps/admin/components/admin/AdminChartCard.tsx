'use client'

import { cn } from '@/lib/utils'

interface AdminChartCardProps {
  title: string
  subtitle?: string
  className?: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function AdminChartCard({ title, subtitle, className, children, action }: AdminChartCardProps) {
  return (
    <div className={cn('bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  )
}
