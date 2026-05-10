'use client'

import { useEffect, useState } from 'react'
import { Activity, Search, Eye } from 'lucide-react'
import { DataTable, Column } from '@/components/admin/DataTable'
import { StatusBadge, ProviderBadge } from '@/components/admin/StatusBadge'
import { Drawer } from '@/components/admin/Drawer'
import { JsonEditor } from '@/components/admin/JsonEditor'
import { fetchAgentRuns } from '@/lib/admin-api'
import { AgentRunRecord } from '@/types/agent'
import { formatDate, formatDuration } from '@/lib/utils'
import { toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function LogsPage() {
  const [runs, setRuns] = useState<AgentRunRecord[]>([])
  const [filtered, setFiltered] = useState<AgentRunRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [agentFilter, setAgentFilter] = useState('ALL')
  const [detail, setDetail] = useState<AgentRunRecord | null>(null)

  useEffect(() => { fetchAgentRuns().then(setRuns).catch((error) => toastLoadError(error, 'Impossible de charger les logs')).finally(() => setIsLoading(false)) }, [])

  const agentNames = [...new Set(runs.map((r) => r.agentName))]

  useEffect(() => {
    let r = runs
    if (search) r = r.filter((run) => `${run.agentName} ${run.projectId} ${run.model}`.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'ALL') r = r.filter((run) => run.status === statusFilter)
    if (agentFilter !== 'ALL') r = r.filter((run) => run.agentName === agentFilter)
    setFiltered(r)
  }, [runs, search, statusFilter, agentFilter])

  const successRate = runs.length > 0 ? Math.round((runs.filter((r) => r.status === 'SUCCESS').length / runs.length) * 100) : 0
  const avgDuration = runs.length > 0 ? Math.round(runs.filter((r) => r.durationMs).reduce((acc, r) => acc + (r.durationMs || 0), 0) / runs.filter((r) => r.durationMs).length) : 0

  const columns: Column<AgentRunRecord>[] = [
    {
      header: 'Agent', accessor: 'agentName',
      cell: (r) => (
        <div>
          <div className="text-sm font-medium text-[var(--text)]">{r.agentName}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ProviderBadge provider={r.provider} />
            <code className="text-xs font-mono text-[var(--text-subtle)]">{r.model}</code>
          </div>
        </div>
      )
    },
    { header: 'Projet', accessor: 'projectId', cell: (r) => <span className="text-xs text-[var(--text-muted)] truncate max-w-[120px] block">{r.projectTitle || r.projectId}</span> },
    { header: 'Statut', accessor: 'status', cell: (r) => <StatusBadge status={r.status} dot />, sortable: true },
    {
      header: 'Durée', accessor: 'durationMs', sortable: true,
      cell: (r) => r.durationMs ? (
        <span className={cn('text-xs tabular-nums font-mono', r.durationMs > 4000 ? 'text-amber-600' : 'text-[var(--text-muted)]')}>
          {formatDuration(r.durationMs)}
        </span>
      ) : <span className="text-xs text-[var(--text-subtle)]">—</span>
    },
    {
      header: 'Erreur', accessor: 'error',
      cell: (r) => r.error ? (
        <span className="text-xs text-red-500 truncate max-w-[150px] block" title={r.error}>{r.error}</span>
      ) : <span className="text-xs text-emerald-500">OK</span>
    },
    { header: 'Date', accessor: 'createdAt', sortable: true, cell: (r) => <span className="text-xs text-[var(--text-muted)]">{formatDate(r.createdAt)}</span> },
    {
      header: 'Voir', accessor: 'id',
      cell: (r) => (
        <button onClick={() => setDetail(r)} className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors">
          <Eye className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>
      )
    },
  ]

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-[var(--text)]">Logs des Agents</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{filtered.length} exécution(s) · {successRate}% de succès · moy. {formatDuration(avgDuration)}</p>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
        {['SUCCESS', 'FAILED', 'PENDING'].map((status) => {
          const count = runs.filter((r) => r.status === status).length
          const colors: Record<string, string> = { SUCCESS: 'text-emerald-600', FAILED: 'text-red-600', PENDING: 'text-amber-600' }
          return (
            <div key={status} className="flex items-center gap-2">
              <span className={cn('text-sm font-bold', colors[status])}>{count}</span>
              <span className="text-xs text-[var(--text-muted)]">{status}</span>
            </div>
          )
        })}
        <div className="ml-auto text-xs text-[var(--text-muted)]">Durée moy: {formatDuration(avgDuration)}</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-[var(--text-subtle)]" />
          <input className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none">
          <option value="ALL">Tous les agents</option>
          {agentNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none">
          <option value="ALL">Tous les statuts</option>
          <option value="SUCCESS">Succès</option>
          <option value="FAILED">Échoué</option>
          <option value="PENDING">En attente</option>
        </select>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <DataTable<AgentRunRecord>
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          emptyIcon={Activity}
          emptyTitle="Aucun log"
          rowKey={(r) => r.id}
        />
      </div>

      {/* Detail drawer */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.agentName || 'Détail'}
        subtitle={`${detail?.provider} · ${detail?.model}`}
        width="max-w-2xl"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Agent', detail.agentName],
                ['Statut', detail.status],
                ['Durée', detail.durationMs ? formatDuration(detail.durationMs) : '—'],
                ['Date', formatDate(detail.createdAt)],
              ].map(([label, val]) => (
                <div key={label} className="p-3 rounded-lg bg-[var(--bg-subtle)]">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">{label}</div>
                  <div className="text-sm font-medium text-[var(--text)]">{val}</div>
                </div>
              ))}
            </div>
            {detail.error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Erreur</div>
                <div className="text-sm text-red-700 dark:text-red-300">{detail.error}</div>
              </div>
            )}
            <JsonEditor label="Input JSON" value={detail.input} readonly rows={8} />
            {detail.output && <JsonEditor label="Output JSON" value={detail.output} readonly rows={8} />}
          </div>
        )}
      </Drawer>
    </div>
  )
}
