'use client'

import { useEffect, useState } from 'react'
import { Wallet, Download, Search, Eye, RotateCcw } from 'lucide-react'
import { DataTable, Column } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Modal } from '@/components/admin/Modals'
import { fetchPayments } from '@/lib/admin-api'
import { Payment, PaymentStatus } from '@/types/payment'
import { formatDate, formatCurrency, downloadCSV } from '@/lib/utils'
import { toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

const PROVIDER_STYLES: Record<string, string> = {
  MTN: 'bg-yellow-100 text-yellow-700',
  AIRTEL: 'bg-red-100 text-red-700',
  STRIPE: 'bg-indigo-100 text-indigo-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filtered, setFiltered] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [detail, setDetail] = useState<Payment | null>(null)

  useEffect(() => { fetchPayments().then(setPayments).catch((error) => toastLoadError(error, 'Impossible de charger les paiements')).finally(() => setIsLoading(false)) }, [])

  useEffect(() => {
    let r = payments
    if (search) r = r.filter((p) => `${p.user?.fullName || ''} ${p.reference} ${p.provider}`.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'ALL') r = r.filter((p) => p.status === statusFilter)
    setFiltered(r)
  }, [payments, search, statusFilter])

  const totalRevenue = filtered.filter((p) => p.status === 'SUCCESS').reduce((acc, p) => acc + p.amount, 0)

  const columns: Column<Payment>[] = [
    {
      header: 'Utilisateur', accessor: 'userId',
      cell: (p) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(p.user?.fullName || '?').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs text-[var(--text)]">{p.user?.fullName || '—'}</span>
        </div>
      )
    },
    {
      header: 'Montant', accessor: 'amount', sortable: true, align: 'right',
      cell: (p) => <span className="text-sm font-semibold text-[var(--text)] tabular-nums">{formatCurrency(p.amount, p.currency)}</span>
    },
    {
      header: 'Provider', accessor: 'provider',
      cell: (p) => <span className={cn('px-2 py-0.5 rounded-md text-xs font-semibold', PROVIDER_STYLES[p.provider] || PROVIDER_STYLES.OTHER)}>{p.provider}</span>
    },
    { header: 'Plan', accessor: 'planName', cell: (p) => <span className="text-xs text-[var(--text-muted)]">{p.planName || '—'}</span> },
    { header: 'Statut', accessor: 'status', cell: (p) => <StatusBadge status={p.status} dot />, sortable: true },
    { header: 'Référence', accessor: 'reference', cell: (p) => <code className="text-xs font-mono text-[var(--text-muted)]">{p.reference}</code> },
    { header: 'Date', accessor: 'createdAt', sortable: true, cell: (p) => <span className="text-xs text-[var(--text-muted)]">{formatDate(p.createdAt)}</span> },
    {
      header: 'Actions', accessor: 'id',
      cell: (p) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setDetail(p)} className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors">
            <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>
          {p.status === 'PENDING' && (
            <button className="p-1.5 rounded-md hover:bg-amber-50 transition-colors" title="Relancer vérification">
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            </button>
          )}
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Paiements</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{filtered.length} transaction(s) · {formatCurrency(totalRevenue, 'XOF')} reçus</p>
        </div>
        <button onClick={() => downloadCSV(filtered as unknown as Record<string, unknown>[], 'paiements.csv')} className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['SUCCESS', 'PENDING', 'FAILED', 'CANCELLED'] as PaymentStatus[]).map((status) => {
          const count = payments.filter((p) => p.status === status).length
          const colors: Record<PaymentStatus, string> = { SUCCESS: 'text-emerald-600', PENDING: 'text-amber-600', FAILED: 'text-red-600', CANCELLED: 'text-gray-500' }
          return (
            <div key={status} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
              <div className={cn('text-xl font-bold tabular-nums', colors[status])}>{count}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{status}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-[var(--text-subtle)]" />
          <input className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none">
          <option value="ALL">Tous les statuts</option>
          <option value="SUCCESS">Succès</option>
          <option value="PENDING">En attente</option>
          <option value="FAILED">Échoué</option>
          <option value="CANCELLED">Annulé</option>
        </select>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <DataTable<Payment>
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          emptyIcon={Wallet}
          emptyTitle="Aucun paiement"
          rowKey={(p) => p.id}
        />
      </div>

      {/* Detail modal */}
      {detail && (
        <Modal open={!!detail} onClose={() => setDetail(null)} title="Détail paiement">
          <div className="space-y-3 text-sm">
            {[
              ['Référence', detail.reference],
              ['Utilisateur', detail.user?.fullName || '—'],
              ['Email', detail.user?.email || '—'],
              ['Montant', formatCurrency(detail.amount, detail.currency)],
              ['Provider', detail.provider],
              ['Plan', detail.planName || '—'],
              ['Statut', detail.status],
              ['Date', formatDate(detail.createdAt)],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">{label}</span>
                <span className="font-medium text-[var(--text)]">{val}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
