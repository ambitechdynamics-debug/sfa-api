'use client'

import { useEffect, useState, useMemo } from 'react'
import { Palette, Plus, Pencil, Trash2, ExternalLink, Tag } from 'lucide-react'
import { Drawer } from '@/components/admin/Drawer'
import { ArtisticResourceForm } from '@/components/admin/Forms'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import { fetchArtisticResources, createArtisticResource, updateArtisticResource, deleteArtisticResource } from '@/lib/admin-api'
import { ArtisticResource } from '@/types/payment'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

const RESOURCE_TYPES = ['ALL', 'MODEL', 'TEXTURE', 'FONT', 'PALETTE', 'STYLE', 'REFERENCE', 'FORBIDDEN_RULE']

const TYPE_COLORS: Record<string, string> = {
  MODEL: 'bg-blue-100 text-blue-700',
  TEXTURE: 'bg-amber-100 text-amber-700',
  FONT: 'bg-violet-100 text-violet-700',
  PALETTE: 'bg-pink-100 text-pink-700',
  STYLE: 'bg-emerald-100 text-emerald-700',
  REFERENCE: 'bg-indigo-100 text-indigo-700',
  FORBIDDEN_RULE: 'bg-red-100 text-red-700',
}

export default function ArtisticBasePage() {
  const [resources, setResources] = useState<ArtisticResource[]>([])
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editResource, setEditResource] = useState<ArtisticResource | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchArtisticResources().then(setResources).catch((error) => toastLoadError(error, 'Impossible de charger les ressources')).finally(() => setIsLoading(false)) }, [])

  // Unique categories derived from loaded resources
  const existingCategories = useMemo(
    () => Array.from(new Set(resources.map((r) => r.category).filter(Boolean))).sort(),
    [resources]
  )

  const filtered = resources.filter((r) => {
    const matchType = typeFilter === 'ALL' || r.resourceType === typeFilter
    const matchCategory = categoryFilter === 'ALL' || r.category === categoryFilter
    return matchType && matchCategory
  })

  async function handleSave(data: Partial<ArtisticResource>) {
    setSaving(true)
    try {
      if (editResource?.id) {
        const updated = await updateArtisticResource(editResource.id, data)
        setResources((prev) => prev.map((r) => r.id === editResource.id ? updated : r))
        toastSuccess('Ressource mise à jour')
      } else {
        const created = await createArtisticResource(data)
        setResources((prev) => [...prev, created])
        toastSuccess('Ressource créée')
      }
      setDrawerOpen(false); setEditResource(null)
    } catch { toastError('Erreur lors de la sauvegarde') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Base Artistique</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{filtered.length} ressource(s)</p>
        </div>
        <button onClick={() => { setEditResource(null); setDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors">
          <Plus className="w-4 h-4" /> Ajouter ressource
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin flex-1">
          {RESOURCE_TYPES.map((type) => {
            const count = type === 'ALL'
              ? resources.filter((r) => categoryFilter === 'ALL' || r.category === categoryFilter).length
              : resources.filter((r) => r.resourceType === type && (categoryFilter === 'ALL' || r.category === categoryFilter)).length
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  typeFilter === type
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                )}
              >
                {type === 'ALL' ? 'Tout' : type}
                <span className={cn('px-1.5 py-0.5 rounded-full text-[10px]', typeFilter === type ? 'bg-white/20' : 'bg-[var(--bg-subtle)]')}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Category filter */}
        {existingCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] min-w-[160px] flex-shrink-0"
          >
            <option value="ALL">Toutes catégories</option>
            {existingCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-[var(--surface)] border border-[var(--border)] rounded-xl animate-skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <Palette className="w-8 h-8 mx-auto mb-2 text-[var(--text-subtle)]" />
          <p className="text-sm">Aucune ressource de ce type</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resource, i) => (
            <div
              key={resource.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 animate-fade-up"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'forwards', opacity: 0 }}
            >
              {resource.url && (resource.resourceType === 'MODEL' || resource.resourceType === 'TEXTURE' || resource.resourceType === 'REFERENCE') && (
                <div className="h-28 overflow-hidden bg-[var(--bg-subtle)]">
                  <img src={resource.url} alt={resource.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', TYPE_COLORS[resource.resourceType] || 'bg-gray-100 text-gray-600')}>
                        {resource.resourceType}
                      </span>
                      <span className="text-xs text-[var(--text-subtle)]">{resource.category}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text)]">{resource.title}</h3>
                  </div>
                </div>
                {resource.description && (
                  <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">{resource.description}</p>
                )}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {resource.tags.slice(0, 4).map((tag, j) => (
                      <span key={j} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-xs text-[var(--text-muted)]">
                        <Tag className="w-2.5 h-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {resource.url && (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
                      <ExternalLink className="w-3 h-3" /> Voir
                    </a>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <button onClick={() => { setEditResource(resource); setDrawerOpen(true) }} className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </button>
                    <button onClick={() => setDeleteId(resource.id)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditResource(null) }} title={editResource ? 'Modifier ressource' : 'Nouvelle Ressource'}>
        <ArtisticResourceForm existingCategories={existingCategories} initial={editResource || undefined} onSubmit={handleSave} onCancel={() => { setDrawerOpen(false); setEditResource(null) }} isLoading={saving} />
      </Drawer>

      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await deleteArtisticResource(deleteId!)
            setResources((prev) => prev.filter((r) => r.id !== deleteId))
            toastSuccess('Ressource supprimée')
          } catch { toastError('Erreur lors de la suppression') }
          setDeleteId(null)
        }}
        description="Cette ressource sera supprimée de la base artistique."
      />
    </div>
  )
}
