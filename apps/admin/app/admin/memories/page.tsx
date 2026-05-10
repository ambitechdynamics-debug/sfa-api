'use client'

import { useEffect, useState } from 'react'
import { Brain, Plus, Pencil, Trash2, Lock } from 'lucide-react'
import { DataTable, Column } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Drawer } from '@/components/admin/Drawer'
import { MemoryDefinitionForm } from '@/components/admin/Forms'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import { fetchMemories, createMemory, updateMemory, deleteMemory } from '@/lib/admin-api'
import { formatDate } from '@/lib/utils'
import { MemoryDefinition } from '@/types/memory'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function MemoriesPage() {
  const [memories, setMemories] = useState<MemoryDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editMemory, setEditMemory] = useState<MemoryDefinition | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchMemories().then(setMemories).catch((error) => toastLoadError(error, 'Impossible de charger les mémoires')).finally(() => setIsLoading(false)) }, [])

  async function handleSave(data: Partial<MemoryDefinition>) {
    setSaving(true)
    try {
      if (editMemory?.id) {
        const updated = await updateMemory(editMemory.id, data)
        setMemories((prev) => prev.map((m) => m.id === editMemory.id ? updated : m))
        toastSuccess('Mémoire mise à jour')
      } else {
        const created = await createMemory(data)
        setMemories((prev) => [...prev, created])
        toastSuccess('Mémoire créée')
      }
      setDrawerOpen(false); setEditMemory(null)
    } catch { toastError('Erreur lors de la sauvegarde') }
    finally { setSaving(false) }
  }

  const columns: Column<MemoryDefinition>[] = [
    {
      header: 'Clé', accessor: 'key',
      cell: (m) => (
        <div className="flex items-center gap-2">
          {m.isSystem && <Lock className="w-3.5 h-3.5 text-amber-500" />}
          <code className="text-sm font-mono font-semibold text-[var(--accent)]">{m.key}</code>
        </div>
      )
    },
    {
      header: 'Nom', accessor: 'name',
      cell: (m) => (
        <div>
          <div className="text-sm font-medium text-[var(--text)]">{m.name}</div>
          {m.description && <div className="text-xs text-[var(--text-muted)] truncate max-w-xs">{m.description}</div>}
        </div>
      )
    },
    { header: 'Scope', accessor: 'scope', cell: (m) => <StatusBadge status={m.scope} />, sortable: true },
    {
      header: 'Système', accessor: 'isSystem',
      cell: (m) => m.isSystem
        ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"><Lock className="w-2.5 h-2.5" />Système</span>
        : <span className="text-xs text-[var(--text-subtle)]">Custom</span>
    },
    {
      header: 'Actif', accessor: 'isActive',
      cell: (m) => (
        <button
          onClick={() => handleSave({ ...m, isActive: !m.isActive })}
          className={cn('w-9 h-5 rounded-full transition-all relative', m.isActive ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}
        >
          <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all', m.isActive ? 'left-[18px]' : 'left-0.5')} />
        </button>
      )
    },
    { header: 'Entrées', accessor: 'entriesCount', sortable: true, align: 'right', cell: (m) => <span className="text-sm tabular-nums text-[var(--text-muted)]">{m.entriesCount ?? 0}</span> },
    { header: 'Modifié', accessor: 'updatedAt', sortable: true, cell: (m) => <span className="text-xs text-[var(--text-muted)]">{formatDate(m.updatedAt)}</span> },
    {
      header: 'Actions', accessor: 'id',
      cell: (m) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditMemory(m); setDrawerOpen(true) }} className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors">
            <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>
          <button
            onClick={() => !m.isSystem && setDeleteId(m.id)}
            disabled={m.isSystem}
            className={cn('p-1.5 rounded-md transition-colors', m.isSystem ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-50')}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      )
    },
  ]

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Mémoires Dynamiques</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{memories.filter((m) => m.isSystem).length} système(s) · {memories.filter((m) => !m.isSystem).length} personnalisée(s)</p>
        </div>
        <button onClick={() => { setEditMemory(null); setDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors">
          <Plus className="w-4 h-4" /> Nouvelle Mémoire
        </button>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <DataTable<MemoryDefinition>
          data={memories}
          columns={columns}
          isLoading={isLoading}
          emptyIcon={Brain}
          emptyTitle="Aucune mémoire"
          rowKey={(m) => m.id}
        />
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditMemory(null) }}
        title={editMemory ? 'Modifier la mémoire' : 'Nouvelle Mémoire'}
        subtitle={editMemory?.key}
      >
        <MemoryDefinitionForm
          initial={editMemory || undefined}
          onSubmit={handleSave}
          onCancel={() => { setDrawerOpen(false); setEditMemory(null) }}
          isLoading={saving}
        />
      </Drawer>

      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await deleteMemory(deleteId!)
            setMemories((prev) => prev.filter((m) => m.id !== deleteId))
            toastSuccess('Mémoire supprimée')
          } catch { toastError('Erreur lors de la suppression') }
          setDeleteId(null)
        }}
        description="Cette mémoire et toutes ses entrées seront supprimées."
      />
    </div>
  )
}
