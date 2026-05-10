'use client'

import { useState } from 'react'
import { X, AlertTriangle, Coins, Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminUser } from '@/types/user'

// ─── MODAL BASE ────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md animate-fade-up',
        className
      )}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── CONFIRM DELETE ────────────────────────────────────────────────────────────
interface ConfirmDeleteModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  isLoading?: boolean
}

export function ConfirmDeleteModal({
  open, onClose, onConfirm, title = 'Confirmer la suppression', description, isLoading
}: ConfirmDeleteModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-[var(--icon-red)] flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-sm text-[var(--text-muted)] pt-1.5">
          {description || 'Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?'}
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors">
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {isLoading ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </Modal>
  )
}

// ─── CREDIT ADJUST ────────────────────────────────────────────────────────────
interface CreditAdjustModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (amount: number, reason: string) => void
  user?: AdminUser | null
  isLoading?: boolean
}

export function CreditAdjustModal({ open, onClose, onConfirm, user, isLoading }: CreditAdjustModalProps) {
  const [amount, setAmount] = useState(50)
  const [type, setType] = useState<'add' | 'remove'>('add')
  const [reason, setReason] = useState('')

  function handleSubmit() {
    const finalAmount = type === 'add' ? amount : -amount
    onConfirm(finalAmount, reason)
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajuster les crédits">
      {user && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-subtle)] mb-4">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold">
            {user.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text)]">{user.fullName}</div>
            <div className="text-xs text-[var(--text-muted)]">Crédits actuels : {user.credits}</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setType('add')}
            className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
              type === 'add'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]'
            )}
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
          <button
            onClick={() => setType('remove')}
            className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
              type === 'remove'
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]'
            )}
          >
            <Minus className="w-4 h-4" /> Retirer
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">Montant de crédits</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setAmount(Math.max(1, amount - 10))} className="w-8 h-8 rounded-md border border-[var(--border)] hover:bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-muted)]">
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="flex-1 text-center border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
            />
            <button onClick={() => setAmount(amount + 10)} className="w-8 h-8 rounded-md border border-[var(--border)] hover:bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-muted)]">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">Raison (optionnel)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Bonus parrainage, remboursement..."
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none placeholder:text-[var(--text-subtle)]"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60',
              type === 'add'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            )}
          >
            <Coins className="w-4 h-4" />
            {isLoading ? 'En cours...' : `${type === 'add' ? '+' : '-'}${amount} crédits`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
