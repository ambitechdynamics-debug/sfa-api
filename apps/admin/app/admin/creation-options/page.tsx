'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Power } from 'lucide-react'
import { Drawer } from '@/components/admin/Drawer'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import {
  fetchCreationOptions,
  createCreationOption,
  updateCreationOption,
  deleteCreationOption,
} from '@/lib/admin-api'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

function CreationOptionForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initial?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: initial?.name || '',
    slug: initial?.slug || '',
    icon: initial?.icon || 'image',
    description: initial?.description || '',
    formatPreset: initial?.formatPreset || '',
    contextPrompt: initial?.contextPrompt || '',
    isActive: initial?.isActive ?? true,
    sortOrder: initial?.sortOrder ?? 0,
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(formData)
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Nom</label>
        <input
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] focus:border-[var(--accent)] outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Slug (identifiant technique)</label>
        <input
          required
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] focus:border-[var(--accent)] outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Icône (ex: image, message, layers)</label>
        <input
          required
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] focus:border-[var(--accent)] outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Description (optionnelle)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] focus:border-[var(--accent)] outline-none min-h-[60px]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Prompt Contextuel (Injecté dans l'IA)</label>
        <textarea
          required
          value={formData.contextPrompt}
          onChange={(e) => setFormData({ ...formData, contextPrompt: e.target.value })}
          placeholder="Ex: L'utilisateur souhaite créer un flyer. Demande l'offre, la cible..."
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] focus:border-[var(--accent)] outline-none min-h-[120px]"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--text-muted)]">Actif</label>
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
      </div>
      <div className="flex items-center gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-2 text-sm font-medium text-[var(--text)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-subtle)]"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-hover)]"
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

export default function CreationOptionsPage() {
  const [options, setOptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editOption, setEditOption] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setIsLoading(true)
    try {
      const res = await fetchCreationOptions(true)
      setOptions(Array.isArray(res) ? res : [])
    } catch (e) {
      toastLoadError(e, 'Impossible de charger les types de création')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(data: any) {
    setSaving(true)
    try {
      if (editOption?.id) {
        const updated = await updateCreationOption(editOption.id, data)
        setOptions((prev) => prev.map((r) => r.id === editOption.id ? updated : r))
        toastSuccess('Option mise à jour')
      } else {
        const created = await createCreationOption(data)
        setOptions((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder))
        toastSuccess('Option créée')
      }
      setDrawerOpen(false); setEditOption(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la sauvegarde'
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(option: any) {
    try {
      const updated = await updateCreationOption(option.id, { isActive: !option.isActive }) as any
      setOptions((prev) => prev.map((r) => r.id === option.id ? updated : r))
      toastSuccess(updated?.isActive ? 'Option activée' : 'Option désactivée')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      toastError(msg)
    }
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Types de Création (Boutons Dashboard)</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Configurez les options qui apparaissent sous la barre de prompt client.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setEditOption(null); setDrawerOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--surface)] border border-[var(--border)] rounded-xl animate-skeleton" />
          ))}
        </div>
      ) : options.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl py-16 text-center">
          <p className="text-sm text-[var(--text-muted)]">Aucune option trouvée</p>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Nom</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Slug / Icône</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Prompt Contextuel</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Actif</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {options.map((opt) => (
                <tr key={opt.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--text)]">{opt.name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                    <div>{opt.slug}</div>
                    <div>Icône: {opt.icon}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="text-xs text-[var(--text-muted)] truncate" title={opt.contextPrompt}>
                      {opt.contextPrompt}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(opt)}
                      className={cn('inline-flex items-center justify-center w-9 h-5 rounded-full transition-colors relative', opt.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600')}
                    >
                      <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all', opt.isActive ? 'left-[18px]' : 'left-0.5')} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditOption(opt); setDrawerOpen(true) }}
                        className="p-1.5 rounded-md hover:bg-[var(--surface)] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </button>
                      <button
                        onClick={() => setDeleteId(opt.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditOption(null) }}
        title={editOption ? 'Modifier le type de création' : 'Nouveau type de création'}
      >
        <CreationOptionForm
          initial={editOption}
          onSubmit={handleSave}
          onCancel={() => { setDrawerOpen(false); setEditOption(null) }}
          isLoading={saving}
        />
      </Drawer>

      {/* Confirm delete */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await deleteCreationOption(deleteId!)
            setOptions((prev) => prev.filter((r) => r.id !== deleteId))
            toastSuccess('Option supprimée')
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Erreur'
            toastError(msg)
          }
          setDeleteId(null)
        }}
        description="Ce bouton ne sera plus disponible dans le dashboard client."
      />
    </div>
  )
}
