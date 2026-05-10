'use client'

import { useEffect, useState } from 'react'
import { FolderOpen, Search, Eye, Archive, Trash2, MoreVertical } from 'lucide-react'
import { DataTable, Column } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import { fetchProjects, deleteProject } from '@/lib/admin-api'
import { formatDate } from '@/lib/utils'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { AdminProject, ProjectStatus } from '@/types/project'

const ALL_STATUSES: ProjectStatus[] = ['DRAFT','QUESTIONING','ANALYZING','READY_FOR_PROMPT','PROMPT_READY','GENERATING','GENERATED','FAILED']
const ALL_CATEGORIES = ['Restaurant','Mode','Corporate','Immobilier','Église','Formation','Événement','Boutique']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [filtered, setFiltered] = useState<AdminProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { fetchProjects().then(setProjects).catch((error) => toastLoadError(error, 'Impossible de charger les projets')).finally(() => setIsLoading(false)) }, [])

  useEffect(() => {
    let r = projects
    if (search) r = r.filter((p) => `${p.title} ${p.user?.fullName || ''} ${p.category || ''}`.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'ALL') r = r.filter((p) => p.status === statusFilter)
    if (categoryFilter !== 'ALL') r = r.filter((p) => p.category === categoryFilter)
    setFiltered(r)
  }, [projects, search, statusFilter, categoryFilter])

  const columns: Column<AdminProject>[] = [
    {
      header: 'Projet', accessor: 'title',
      cell: (p) => (
        <div>
          <div className="text-sm font-medium text-[var(--text)]">{p.title}</div>
          <div className="text-xs text-[var(--text-muted)]">{p.posterType || '—'}</div>
        </div>
      )
    },
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
    { header: 'Catégorie', accessor: 'category', cell: (p) => <span className="text-xs text-[var(--text-muted)]">{p.category || '—'}</span> },
    { header: 'Format', accessor: 'format', cell: (p) => <span className="text-xs text-[var(--text-muted)]">{p.format || '—'}</span> },
    { header: 'Statut', accessor: 'status', cell: (p) => <StatusBadge status={p.status} />, sortable: true },
    { header: 'Créé le', accessor: 'createdAt', sortable: true, cell: (p) => <span className="text-xs text-[var(--text-muted)]">{formatDate(p.createdAt)}</span> },
    {
      header: 'Actions', accessor: 'id',
      cell: (p) => (
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === p.id ? null : p.id) }} className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors">
            <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          {menuOpen === p.id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
              <div className="absolute right-0 top-8 z-20 w-40 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg py-1 text-sm">
                <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--bg-subtle)] text-[var(--text)]">
                  <Eye className="w-3.5 h-3.5" /> Voir détails
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-amber-50 text-amber-600">
                  <Archive className="w-3.5 h-3.5" /> Archiver
                </button>
                <div className="h-px bg-[var(--border)] my-1" />
                <button onClick={() => { setDeleteId(p.id); setMenuOpen(null) }} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-red-600">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-[var(--text)]">Projets</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{filtered.length} projet(s)</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-[var(--text-subtle)]" />
          <input className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none">
          <option value="ALL">Tous les statuts</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none">
          <option value="ALL">Toutes les catégories</option>
          {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <DataTable<AdminProject>
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          emptyIcon={FolderOpen}
          emptyTitle="Aucun projet"
          rowKey={(p) => p.id}
        />
      </div>

      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await deleteProject(deleteId!)
            setProjects((prev) => prev.filter((p) => p.id !== deleteId))
            toastSuccess('Projet supprimé')
          } catch { toastError('Erreur lors de la suppression') }
          setDeleteId(null)
        }}
        description="Le projet et toutes ses données (mémoires, fichiers, affiches) seront supprimés."
      />
    </div>
  )
}
