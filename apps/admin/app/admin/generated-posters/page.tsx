'use client'

import { useEffect, useState } from 'react'
import { Image, Download, Trash2, Star, Search, X } from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import { fetchGeneratedPosters, deleteGeneratedPoster, updateGeneratedPoster } from '@/lib/admin-api'
import { GeneratedPoster } from '@/types/project'
import { formatDate } from '@/lib/utils'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function GeneratedPostersPage() {
  const [posters, setPosters] = useState<GeneratedPoster[]>([])
  const [filtered, setFiltered] = useState<GeneratedPoster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<GeneratedPoster | null>(null)

  useEffect(() => { fetchGeneratedPosters().then(setPosters).catch((error) => toastLoadError(error, 'Impossible de charger les affiches')).finally(() => setIsLoading(false)) }, [])

  useEffect(() => {
    let r = posters
    if (search) r = r.filter((p) => `${p.user?.fullName || ''} ${p.project?.title || ''}`.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'ALL') r = r.filter((p) => p.status === statusFilter)
    setFiltered(r)
  }, [posters, search, statusFilter])

  async function toggleExample(id: string) {
    const poster = posters.find((p) => p.id === id)
    if (!poster) return
    try {
      const updated = await updateGeneratedPoster(id, { isExample: !poster.isExample })
      setPosters((prev) => prev.map((p) => p.id === id ? { ...p, isExample: updated.isExample } : p))
      toastSuccess(updated.isExample ? 'Marqué comme exemple' : 'Retiré des exemples')
    } catch { toastError('Erreur lors de la mise à jour') }
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-[var(--text)]">Affiches Générées</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{filtered.length} affiche(s)</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-[var(--text-subtle)]" />
          <input className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {['ALL', 'GENERATED', 'GENERATING', 'FAILED', 'PENDING'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', statusFilter === s ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]')}>
            {s === 'ALL' ? 'Toutes' : s}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl bg-[var(--bg-subtle)] animate-skeleton" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((poster, i) => (
            <div
              key={poster.id}
              className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--bg-subtle)] cursor-pointer animate-fade-up"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'forwards', opacity: 0 }}
              onClick={() => setLightbox(poster)}
            >
              <img
                src={poster.imageUrl}
                alt="Affiche générée"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Status badge */}
              <div className="absolute top-2 left-2">
                <StatusBadge status={poster.status} size="sm" />
              </div>
              {poster.isExample && (
                <div className="absolute top-2 right-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                <div className="text-white text-xs font-medium text-center mb-1">
                  {poster.project?.title || '—'}
                </div>
                <div className="text-white/70 text-xs">{poster.user?.fullName || '—'}</div>
                <div className="text-white/60 text-xs">{formatDate(poster.createdAt)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <a href={poster.imageUrl} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                    <Download className="w-4 h-4 text-white" />
                  </a>
                  <button onClick={(e) => { e.stopPropagation(); toggleExample(poster.id) }} className={cn('p-2 rounded-full transition-colors', poster.isExample ? 'bg-amber-500 hover:bg-amber-600' : 'bg-white/20 hover:bg-white/30')}>
                    <Star className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(poster.id) }} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors">
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.imageUrl} alt="" className="w-full rounded-2xl shadow-2xl" />
            <div className="mt-4 text-center">
              <div className="text-white font-semibold">{lightbox.project?.title}</div>
              <div className="text-white/60 text-sm mt-1">par {lightbox.user?.fullName} · {formatDate(lightbox.createdAt)}</div>
              {lightbox.qualityScore && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs">
                  <Star className="w-3 h-3 text-amber-400" /> Score qualité: {lightbox.qualityScore}/100
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await deleteGeneratedPoster(deleteId!)
            setPosters((prev) => prev.filter((p) => p.id !== deleteId))
            toastSuccess('Affiche supprimée')
          } catch { toastError('Erreur lors de la suppression') }
          setDeleteId(null)
        }}
        description="Cette affiche sera supprimée définitivement."
      />
    </div>
  )
}
