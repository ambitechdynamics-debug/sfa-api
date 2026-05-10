'use client'

import { useEffect, useState } from 'react'
import { Users, Download, Search, MoreVertical, Coins, ShieldOff, Trash2, Eye } from 'lucide-react'
import { DataTable, Column } from '@/components/admin/DataTable'
import { RoleBadge } from '@/components/admin/StatusBadge'
import { ConfirmDeleteModal, CreditAdjustModal } from '@/components/admin/Modals'
import { fetchUsers, updateUserCredits, deleteUser } from '@/lib/admin-api'
import { formatDate, formatNumber, downloadCSV } from '@/lib/utils'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { AdminUser } from '@/types/user'

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filtered, setFiltered] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [creditUser, setCreditUser] = useState<AdminUser | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  useEffect(() => { fetchUsers().then(setUsers).catch((error) => toastLoadError(error, 'Impossible de charger les utilisateurs')).finally(() => setIsLoading(false)) }, [])

  useEffect(() => {
    let r = users
    if (search) r = r.filter((u) => `${u.fullName} ${u.email} ${u.phone || ''}`.toLowerCase().includes(search.toLowerCase()))
    if (roleFilter !== 'ALL') r = r.filter((u) => u.role === roleFilter)
    setFiltered(r)
  }, [users, search, roleFilter])

  const columns: Column<AdminUser>[] = [
    {
      header: 'Utilisateur', accessor: 'fullName',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {u.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text)]">{u.fullName}</div>
            <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Téléphone', accessor: 'phone', cell: (u) => <span className="text-xs text-[var(--text-muted)]">{u.phone || '—'}</span> },
    { header: 'Rôle', accessor: 'role', cell: (u) => <RoleBadge role={u.role} />, sortable: true },
    {
      header: 'Crédits', accessor: 'credits', sortable: true, align: 'right',
      cell: (u) => <span className="text-sm font-semibold text-[var(--text)] tabular-nums">{formatNumber(u.credits)}</span>
    },
    {
      header: 'Projets', accessor: '_count', sortable: false, align: 'center',
      cell: (u) => <span className="text-sm text-[var(--text-muted)]">{u._count?.projects ?? 0}</span>
    },
    { header: 'Inscrit le', accessor: 'createdAt', sortable: true, cell: (u) => <span className="text-xs text-[var(--text-muted)]">{formatDate(u.createdAt)}</span> },
    {
      header: 'Actions', accessor: 'id',
      cell: (u) => (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === u.id ? null : u.id) }}
            className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          {menuOpen === u.id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
              <div className="absolute right-0 top-8 z-20 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg py-1 text-sm">
                <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--bg-subtle)] text-[var(--text)]">
                  <Eye className="w-3.5 h-3.5" /> Voir profil
                </button>
                <button onClick={() => { setCreditUser(u); setMenuOpen(null) }} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--bg-subtle)] text-[var(--text)]">
                  <Coins className="w-3.5 h-3.5" /> Modifier crédits
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-amber-50 text-amber-600">
                  <ShieldOff className="w-3.5 h-3.5" /> Suspendre
                </button>
                <div className="h-px bg-[var(--border)] my-1" />
                <button onClick={() => { setDeleteUserId(u.id); setMenuOpen(null) }} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-red-600">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Utilisateurs</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{filtered.length} utilisateur(s)</p>
        </div>
        <button onClick={() => downloadCSV(filtered as unknown as Record<string, unknown>[], 'utilisateurs.csv')} className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-[var(--text-subtle)]" />
          <input
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] focus:outline-none">
          <option value="ALL">Tous les rôles</option>
          <option value="USER">Utilisateur</option>
          <option value="ADMIN">Administrateur</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <DataTable<AdminUser>
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          emptyIcon={Users}
          emptyTitle="Aucun utilisateur"
          rowKey={(u) => u.id}
        />
      </div>

      {/* Modals */}
      <CreditAdjustModal
        open={!!creditUser}
        user={creditUser}
        onClose={() => setCreditUser(null)}
        onConfirm={async (amount, reason) => {
          if (!creditUser) return
          const updated = await updateUserCredits(creditUser.id, amount, reason)
          setUsers((prev) => prev.map((u) => u.id === creditUser.id ? { ...u, credits: updated.credits } : u))
          setCreditUser(null)
        }}
      />
      <ConfirmDeleteModal
        open={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={async () => {
          try {
            await deleteUser(deleteUserId!)
            setUsers((prev) => prev.filter((u) => u.id !== deleteUserId))
            toastSuccess('Utilisateur supprimé')
          } catch { toastError('Erreur lors de la suppression') }
          setDeleteUserId(null)
        }}
        description="L'utilisateur et toutes ses données seront supprimés définitivement."
      />
    </div>
  )
}
