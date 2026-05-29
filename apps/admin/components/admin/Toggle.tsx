'use client'

import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  ariaLabel?: string
}

export function Toggle({ checked, onChange, disabled, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={checked}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
          checked ? 'left-6' : 'left-1',
        )}
      />
    </button>
  )
}
