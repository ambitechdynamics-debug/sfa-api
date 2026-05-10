'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Check, AlertCircle } from 'lucide-react'

interface JsonEditorProps {
  value: Record<string, unknown> | null
  onChange?: (value: Record<string, unknown>) => void
  readonly?: boolean
  label?: string
  rows?: number
  className?: string
}

export function JsonEditor({ value, onChange, readonly = false, label, rows = 8, className }: JsonEditorProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    setText(value ? JSON.stringify(value, null, 2) : '{}')
  }, [value])

  function handleChange(val: string) {
    setText(val)
    try {
      const parsed = JSON.parse(val)
      setError(null)
      setIsValid(true)
      onChange?.(parsed)
    } catch (e) {
      setError('JSON invalide')
      setIsValid(false)
    }
  }

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--text-muted)]">{label}</label>
          <div className="flex items-center gap-1 text-xs">
            {isValid ? (
              <span className="flex items-center gap-1 text-emerald-600"><Check className="w-3 h-3" /> JSON valide</span>
            ) : (
              <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3 h-3" /> {error}</span>
            )}
          </div>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => !readonly && handleChange(e.target.value)}
        readOnly={readonly}
        rows={rows}
        className={cn(
          'w-full font-mono text-xs px-3 py-2.5 rounded-lg border resize-none transition-colors',
          'bg-[var(--bg-subtle)] text-[var(--text)]',
          readonly
            ? 'border-[var(--border)] cursor-default opacity-80'
            : 'border-[var(--border)] focus:border-[var(--accent)] focus:outline-none',
          !isValid && 'border-red-400 dark:border-red-600'
        )}
        spellCheck={false}
      />
      {!label && error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}
