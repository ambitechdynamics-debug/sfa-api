'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }: DrawerProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className={cn(
            'relative h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col w-full animate-slide-in-right',
            width
          )}>
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
                {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors ml-4"
              >
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-5 border-t border-[var(--border)] bg-[var(--bg-subtle)]">
                {footer}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
