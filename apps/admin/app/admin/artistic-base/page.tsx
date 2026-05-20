'use client'

import { useEffect, useState, useMemo } from 'react'
import { Palette, Plus, Pencil, Trash2, ExternalLink, Tag, AlertCircle, LayoutGrid, List } from 'lucide-react'
import { Drawer } from '@/components/admin/Drawer'
import { ArtisticResourceForm } from '@/components/admin/Forms'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import { fetchArtisticResources, createArtisticResource, updateArtisticResource, deleteArtisticResource } from '@/lib/admin-api'
import { ArtisticResource } from '@/types/payment'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

const RESOURCE_TYPES = ['ALL', 'MODEL', 'TEXTURE', 'FONT', 'PALETTE', 'STYLE', 'REFERENCE', 'FORBIDDEN_RULE']

const TYPE_COLORS: Record<string, string> = {
  MODEL: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30',
  TEXTURE: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30',
  FONT: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-100 dark:border-violet-900/30',
  PALETTE: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-100 dark:border-pink-900/30',
  STYLE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30',
  REFERENCE: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30',
  FORBIDDEN_RULE: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-100 dark:border-red-900/30',
}

// Robust color extraction helper for palettes
function parseColors(resource: ArtisticResource): string[] {
  if (resource.content && Array.isArray(resource.content.colors)) {
    return resource.content.colors.map(String)
  }
  const text = resource.description || ''
  const hexRegex = /#[0-9A-Fa-f]{3,8}\b/g
  const matches = text.match(hexRegex)
  if (matches && matches.length > 0) {
    return matches
  }
  return ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B']
}

interface ResourceCardProps {
  resource: ArtisticResource
  index: number
  onEdit: (r: ArtisticResource) => void
  onDelete: (id: string) => void
}

function ResourceCard({ resource, index, onEdit, onDelete }: ResourceCardProps) {
  // Determine if this type shows a standard image preview or custom visual
  const hasImage = !!resource.url && (
    resource.resourceType === 'MODEL' || 
    resource.resourceType === 'TEXTURE' || 
    resource.resourceType === 'REFERENCE' || 
    resource.resourceType === 'STYLE'
  )

  const renderVisual = () => {
    if (hasImage) {
      return (
        <img 
          src={resource.url} 
          alt={resource.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} 
        />
      )
    }

    if (resource.resourceType === 'PALETTE') {
      const colors = parseColors(resource)
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/30 p-3.5 gap-1.5 select-none">
          {colors.slice(0, 5).map((color, idx) => (
            <div 
              key={idx} 
              className="flex-1 h-full rounded-md shadow-sm border border-black/5 dark:border-white/5 transition-transform duration-300 hover:scale-110"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )
    }

    if (resource.resourceType === 'FONT') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/30 dark:to-slate-900/20 text-slate-800 dark:text-slate-200 select-none">
          <span className="text-3xl font-serif tracking-widest font-normal">Aa</span>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1 font-mono">
            {resource.title.slice(0, 10)}
          </span>
        </div>
      )
    }

    if (resource.resourceType === 'FORBIDDEN_RULE') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100/30 dark:from-red-950/10 dark:to-red-900/5 text-red-500 p-3 select-none">
          <AlertCircle className="w-6 h-6 mb-1 text-red-500/70 animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-red-500/80 dark:text-red-400/80">Règle Interdite</span>
        </div>
      )
    }

    // Default fallback placeholder
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--border)]/30 text-[var(--text-muted)] p-4 select-none">
        <Palette className="w-6 h-6 mb-1 text-[var(--text-subtle)]" />
        <span className="text-[9px] font-semibold uppercase tracking-wider">{resource.resourceType}</span>
      </div>
    )
  }

  return (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--accent)] hover:-translate-y-1 transition-all duration-300 animate-fade-up group flex flex-col h-full"
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'forwards', opacity: 0 }}
    >
      {/* Visual Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--bg-subtle)] border-b border-[var(--border)]">
        {renderVisual()}

        {/* Hover glassmorphic actions overlay */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 z-10">
          {resource.url && (
            <a 
              href={resource.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/35 text-white backdrop-blur-sm transition-all transform translate-y-2 group-hover:translate-y-0 duration-300"
              title="Voir l'original"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button 
            onClick={() => onEdit(resource)} 
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/35 text-white backdrop-blur-sm transition-all transform translate-y-2 group-hover:translate-y-0 duration-300 delay-[40ms]"
            title="Modifier"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(resource.id)} 
            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-200 backdrop-blur-sm transition-all transform translate-y-2 group-hover:translate-y-0 duration-300 delay-[80ms]"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metadata info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Badges line */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider', TYPE_COLORS[resource.resourceType] || 'bg-gray-100 text-gray-600')}>
              {resource.resourceType}
            </span>
            <span className="text-[10px] text-[var(--text-subtle)] truncate max-w-[90px]">{resource.category}</span>
          </div>

          {/* Title */}
          <h3 className="text-xs font-bold text-[var(--text)] truncate mb-1" title={resource.title}>
            {resource.title}
          </h3>

          {/* Description truncated */}
          {resource.description && (
            <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 leading-relaxed" title={resource.description}>
              {resource.description}
            </p>
          )}
        </div>

        {/* Tags footer */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-[var(--border-subtle)]">
            {resource.tags.slice(0, 2).map((tag, j) => (
              <span key={j} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[9px] text-[var(--text-muted)] truncate max-w-[75px]" title={tag}>
                <Tag className="w-2 h-2 flex-shrink-0" />
                <span className="truncate">{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ArtisticBasePage() {
  const [resources, setResources] = useState<ArtisticResource[]>([])
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID')
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
        <button onClick={() => { setEditResource(null); setDrawerOpen(true) }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Ajouter ressource
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin flex-1 items-center h-10">
          {RESOURCE_TYPES.map((type) => {
            const count = type === 'ALL'
              ? resources.filter((r) => categoryFilter === 'ALL' || r.category === categoryFilter).length
              : resources.filter((r) => r.resourceType === type && (categoryFilter === 'ALL' || r.category === categoryFilter)).length
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  'flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors h-8',
                  typeFilter === type
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                )}
              >
                {type === 'ALL' ? 'Tout' : type}
                <span className={cn('px-1.5 py-0.5 rounded-full text-[10px]', typeFilter === type ? 'bg-white/20' : 'bg-[var(--bg-subtle)]')}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Category & View Switch Panel */}
        <div className="flex items-center gap-2">
          {existingCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-[var(--border)] rounded-lg px-3 text-xs bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] min-w-[160px] flex-shrink-0 h-8"
            >
              <option value="ALL">Toutes catégories</option>
              {existingCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Segmented Display Mode Toggle */}
          <div className="flex items-center gap-0.5 border border-[var(--border)] rounded-lg p-0.5 bg-[var(--surface)] shadow-sm h-8">
            <button 
              onClick={() => setViewMode('GRID')}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-md transition-all",
                viewMode === 'GRID' 
                  ? "bg-[var(--accent)] text-white shadow-sm" 
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
              title="Affichage Grille"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('LIST')}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-md transition-all",
                viewMode === 'LIST' 
                  ? "bg-[var(--accent)] text-white shadow-sm" 
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
              title="Affichage Liste"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards grid / list section */}
      {isLoading ? (
        viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 animate-fade-up">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="aspect-[4/3] w-full bg-[var(--bg-subtle)] animate-pulse" />
                <div className="p-3 space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-12 bg-[var(--bg-subtle)] rounded-full animate-pulse" />
                    <div className="h-3 w-16 bg-[var(--bg-subtle)] rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-3/4 bg-[var(--bg-subtle)] rounded animate-pulse" />
                  <div className="flex gap-1 mt-2">
                    <div className="h-3.5 w-10 bg-[var(--bg-subtle)] rounded animate-pulse" />
                    <div className="h-3.5 w-12 bg-[var(--bg-subtle)] rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm animate-fade-up">
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 h-12">
                  <div className="w-9 h-7 rounded bg-[var(--bg-subtle)] animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-1/4 bg-[var(--bg-subtle)] rounded animate-pulse" />
                    <div className="h-3 w-1/6 bg-[var(--bg-subtle)] rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-16 bg-[var(--bg-subtle)] rounded animate-pulse hidden md:block" />
                  <div className="h-4 w-12 bg-[var(--bg-subtle)] rounded animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-lg mx-auto shadow-sm animate-fade-up">
          <div className="w-16 h-16 bg-[var(--bg-subtle)] text-[var(--accent)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Palette className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[var(--text)] mb-1">Aucune ressource trouvée</h3>
          <p className="text-xs text-[var(--text-muted)] mb-6 max-w-xs mx-auto">
            Il n'y a actuellement aucune ressource artistique correspondant à ces filtres dans votre base.
          </p>
          <button 
            onClick={() => { setEditResource(null); setDrawerOpen(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Créer une ressource
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map((resource, i) => (
            <ResourceCard 
              key={resource.id} 
              resource={resource} 
              index={i} 
              onEdit={setEditResource} 
              onDelete={setDeleteId} 
            />
          ))}
        </section>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm animate-fade-up">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-muted)] font-bold select-none">
                  <th className="p-3 w-14">Aperçu</th>
                  <th className="p-3">Nom / Type</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3 max-w-xs">Description</th>
                  <th className="p-3">Tags</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((resource) => {
                  const colors = parseColors(resource)
                  
                  const renderListVisual = () => {
                    const hasImage = !!resource.url && (
                      resource.resourceType === 'MODEL' || 
                      resource.resourceType === 'TEXTURE' || 
                      resource.resourceType === 'REFERENCE' || 
                      resource.resourceType === 'STYLE'
                    )
                    if (hasImage) {
                      return <img src={resource.url} alt="" className="w-9 h-7 rounded object-cover shadow-sm border border-black/5" />
                    }
                    if (resource.resourceType === 'PALETTE') {
                      return (
                        <div className="flex gap-0.5 w-9 h-7 rounded overflow-hidden border border-black/5 p-0.5 bg-slate-100 dark:bg-slate-900/30">
                          {colors.slice(0, 3).map((col, idx) => (
                            <div key={idx} className="flex-1 h-full" style={{ backgroundColor: col }} />
                          ))}
                        </div>
                      )
                    }
                    if (resource.resourceType === 'FONT') {
                      return (
                        <div className="w-9 h-7 rounded bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/30 dark:to-slate-900/20 text-slate-800 dark:text-slate-200 flex items-center justify-center font-serif text-[10px] border border-black/5">
                          Aa
                        </div>
                      )
                    }
                    if (resource.resourceType === 'FORBIDDEN_RULE') {
                      return (
                        <div className="w-9 h-7 rounded bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500 border border-red-100 dark:border-red-900/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )
                    }
                    return (
                      <div className="w-9 h-7 rounded bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--text-muted)] border border-[var(--border)]">
                        <Palette className="w-3.5 h-3.5" />
                      </div>
                    )
                  }

                  return (
                    <tr key={resource.id} className="hover:bg-[var(--bg-subtle)]/30 transition-colors">
                      <td className="p-3">{renderListVisual()}</td>
                      <td className="p-3">
                        <div className="font-semibold text-[var(--text)]">{resource.title}</div>
                        <div className="mt-0.5">
                          <span className={cn('px-1.5 py-0.2 rounded-full text-[8px] font-bold uppercase tracking-wider', TYPE_COLORS[resource.resourceType] || 'bg-gray-100 text-gray-600')}>
                            {resource.resourceType}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-[var(--text-muted)]">{resource.category}</td>
                      <td className="p-3 text-[var(--text-muted)] truncate max-w-xs" title={resource.description}>
                        {resource.description || '—'}
                      </td>
                      <td className="p-3">
                        {resource.tags && resource.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {resource.tags.slice(0, 2).map((tag, j) => (
                              <span key={j} className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-[var(--bg-subtle)] text-[9px] text-[var(--text-muted)] truncate max-w-[65px]" title={tag}>
                                <Tag className="w-1.5 h-1.5 flex-shrink-0" />
                                <span className="truncate">{tag}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[var(--text-subtle)]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {resource.url && (
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                              title="Voir l'original"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button 
                            onClick={() => { setEditResource(resource); setDrawerOpen(true) }} 
                            className="p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(resource.id)} 
                            className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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

