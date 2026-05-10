'use client'

import { useState } from 'react'
import { CreditCard, Users, Pencil, Check, X } from 'lucide-react'
import { SubscriptionPlan } from '@/types/admin'

// Plans définis en configuration (pas encore persistés en base)
const DEFAULT_PLANS: SubscriptionPlan[] = [
  { id: 'free', name: 'Gratuit', price: 0, currency: 'XOF', credits: 0, maxProjects: 3, maxFilesPerProject: 3, features: ['3 projets max', '3 générations gratuites', 'Affiches en basse résolution'], isActive: true, subscribersCount: 0 },
  { id: 'starter', name: 'Starter', price: 9, currency: 'EUR', credits: 50, maxProjects: 10, maxFilesPerProject: 10, features: ['10 projets', '50 crédits/mois', 'HD 1080p', 'Support email'], isActive: true, subscribersCount: 0 },
  { id: 'business', name: 'Business', price: 29, currency: 'EUR', credits: 200, maxProjects: 50, maxFilesPerProject: 20, features: ['50 projets', '200 crédits/mois', '4K', 'Support prioritaire', 'Export multi-formats'], isActive: true, subscribersCount: 0 },
  { id: 'agence', name: 'Agence', price: 79, currency: 'EUR', credits: 500, maxProjects: 999, maxFilesPerProject: 50, features: ['Projets illimités', '500 crédits/mois', '4K + RAW', 'Account manager dédié', 'API access', 'White-label'], isActive: true, subscribersCount: 0 },
]
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PLAN_COLORS: Record<string, string> = {
  Gratuit: 'border-gray-200 dark:border-gray-800',
  Starter: 'border-blue-200 dark:border-blue-800',
  Business: 'border-violet-300 dark:border-violet-700',
  Agence: 'border-amber-300 dark:border-amber-700',
}

const PLAN_HEADER_BG: Record<string, string> = {
  Gratuit: 'bg-gray-50 dark:bg-gray-900/30',
  Starter: 'bg-blue-50 dark:bg-blue-900/20',
  Business: 'bg-violet-50 dark:bg-violet-900/20',
  Agence: 'bg-amber-50 dark:bg-amber-900/20',
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({})

  function startEdit(plan: SubscriptionPlan) {
    setEditId(plan.id)
    setEditForm({ price: plan.price, credits: plan.credits, maxProjects: plan.maxProjects })
  }

  function saveEdit(planId: string) {
    setPlans((prev) => prev.map((p) => p.id === planId ? { ...p, ...editForm } : p))
    setEditId(null)
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-[var(--text)]">Abonnements</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{plans.reduce((acc, p) => acc + p.subscribersCount, 0)} abonné(s) au total</p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className={cn('bg-[var(--surface)] border-2 rounded-2xl overflow-hidden', PLAN_COLORS[plan.name])}>
            {/* Header */}
            <div className={cn('px-5 pt-5 pb-4', PLAN_HEADER_BG[plan.name])}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--text)]">{plan.name}</h3>
                {editId === plan.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => saveEdit(plan.id)} className="p-1 rounded bg-emerald-100 text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditId(null)} className="p-1 rounded bg-red-100 text-red-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(plan)} className="p-1.5 rounded-md hover:bg-white/50 transition-colors"><Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" /></button>
                )}
              </div>

              {editId === plan.id ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-[var(--text-muted)]">Prix (€/mois)</label>
                    <input type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} className="w-full mt-0.5 px-2 py-1 rounded border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)]">Crédits/mois</label>
                    <input type="number" value={editForm.credits} onChange={(e) => setEditForm((f) => ({ ...f, credits: Number(e.target.value) }))} className="w-full mt-0.5 px-2 py-1 rounded border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none" />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-[var(--text)]">
                    {plan.price === 0 ? 'Gratuit' : `${formatCurrency(plan.price, plan.currency)}`}
                    {plan.price > 0 && <span className="text-xs font-normal text-[var(--text-muted)]">/mois</span>}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{plan.credits === 0 ? '0 crédit' : `${plan.credits} crédits/mois`}</div>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="px-5 py-4 space-y-2">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            {/* Subscribers */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-subtle)]">
                <Users className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm font-semibold text-[var(--text)]">{plan.subscribersCount}</span>
                <span className="text-xs text-[var(--text-muted)]">abonné(s)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent subscriptions table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Répartition des abonnements</h3>
        <div className="space-y-3">
          {plans.map((plan) => {
            const total = plans.reduce((acc, p) => acc + p.subscribersCount, 0)
            const pct = Math.round((plan.subscribersCount / total) * 100)
            return (
              <div key={plan.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-[var(--text)]">{plan.name}</span>
                  <span className="text-[var(--text-muted)]">{plan.subscribersCount} ({pct}%)</span>
                </div>
                <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent)] rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
