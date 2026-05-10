'use client'

import { useEffect, useState } from 'react'
import { Coins, Plus, Minus, TrendingUp } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { AdminStatsCard } from '@/components/admin/AdminStatsCard'
import { AdminChartCard } from '@/components/admin/AdminChartCard'
import { DataTable, Column } from '@/components/admin/DataTable'
import { CreditAdjustModal } from '@/components/admin/Modals'
import { fetchCreditTransactions, fetchUsers, fetchStats, fetchChartData, updateUserCredits, ChartDataPoint } from '@/lib/admin-api'
import { CreditTransaction, AdminUser } from '@/types/user'
import { AdminStats } from '@/types/admin'
import { formatDate, formatNumber } from '@/lib/utils'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  ADD: 'Ajout', REMOVE: 'Retrait', CONSUME_GENERATION: 'Génération',
  CONSUME_PROMPT: 'Prompt', REFUND: 'Remboursement', BONUS: 'Bonus',
}

export default function CreditsPage() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [creditUser, setCreditUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    Promise.all([fetchCreditTransactions(), fetchUsers(), fetchStats(), fetchChartData()]).then(([t, u, s, cd]) => {
      setTransactions(t)
      setUsers(u)
      setStats(s)
      setChartData(cd)
    }).catch((error) => toastLoadError(error, 'Impossible de charger les données')).finally(() => setIsLoading(false))
  }, [])

  const columns: Column<CreditTransaction>[] = [
    {
      header: 'Utilisateur', accessor: 'userId',
      cell: (t) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
            {(t.user?.fullName || '?').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-[var(--text)]">{t.user?.fullName || '—'}</span>
        </div>
      )
    },
    {
      header: 'Action', accessor: 'type',
      cell: (t) => <span className="text-xs text-[var(--text-muted)]">{TYPE_LABELS[t.type] || t.type}</span>
    },
    {
      header: 'Montant', accessor: 'amount', sortable: true, align: 'right',
      cell: (t) => (
        <span className={cn('text-sm font-bold tabular-nums flex items-center justify-end gap-0.5', t.amount > 0 ? 'text-emerald-600' : 'text-red-600')}>
          {t.amount > 0 ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {Math.abs(t.amount)}
        </span>
      )
    },
    {
      header: 'Solde après', accessor: 'balanceAfter', sortable: true, align: 'right',
      cell: (t) => <span className="text-sm tabular-nums text-[var(--text-muted)]">{formatNumber(t.balanceAfter)}</span>
    },
    { header: 'Raison', accessor: 'reason', cell: (t) => <span className="text-xs text-[var(--text-muted)]">{t.reason || '—'}</span> },
    { header: 'Date', accessor: 'createdAt', sortable: true, cell: (t) => <span className="text-xs text-[var(--text-muted)]">{formatDate(t.createdAt)}</span> },
  ]

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Crédits IA</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Suivi de la consommation</p>
        </div>
        <select
          onChange={(e) => setCreditUser(users.find((u) => u.id === e.target.value) || null)}
          className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] min-w-[220px]"
        >
          <option value="">Ajuster les crédits d'un user…</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.credits} cr)</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard title="Total consommés" value={stats?.creditsConsumed ?? 0} icon={Coins} iconColor="text-violet-600" iconBg="bg-[var(--icon-violet)]" trend={15} />
        <AdminStatsCard title="Transactions ADD" value={transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0)} icon={Coins} iconColor="text-blue-600" iconBg="bg-[var(--icon-blue)]" />
        <AdminStatsCard title="Transactions RETRAIT" value={Math.abs(transactions.filter(t => t.amount < 0).reduce((a, t) => a + t.amount, 0))} icon={Coins} iconColor="text-amber-600" iconBg="bg-[var(--icon-amber)]" />
        <AdminStatsCard title="Paiements réussis" value={stats?.successfulPayments ?? 0} icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-[var(--icon-emerald)]" />
      </div>

      {/* Chart */}
      <AdminChartCard title="Consommation de crédits" subtitle="30 derniers jours">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} />
            <Area type="monotone" dataKey="prompts" stroke="var(--accent)" strokeWidth={2} fill="url(#creditsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </AdminChartCard>

      {/* Transactions */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text)]">Historique des transactions</h3>
        </div>
        <DataTable<CreditTransaction>
          data={transactions}
          columns={columns}
          isLoading={isLoading}
          emptyIcon={Coins}
          emptyTitle="Aucune transaction"
          rowKey={(t) => t.id}
        />
      </div>

      <CreditAdjustModal
        open={!!creditUser}
        user={creditUser}
        onClose={() => setCreditUser(null)}
        onConfirm={async (amount, reason) => {
          if (!creditUser) return
          try {
            const updated = await updateUserCredits(creditUser.id, amount, reason)
            const newTx: CreditTransaction = {
              id: 'new-' + Date.now(),
              userId: creditUser.id,
              user: creditUser,
              type: amount > 0 ? 'ADD' : 'REMOVE',
              amount,
              balanceAfter: updated.credits,
              reason,
              createdAt: new Date().toISOString(),
            }
            setTransactions((prev) => [newTx, ...prev])
            toastSuccess(`Crédits ajustés : ${amount > 0 ? '+' : ''}${amount}`)
          } catch { toastError('Erreur lors de l\'ajustement') }
          setCreditUser(null)
        }}
      />
    </div>
  )
}
