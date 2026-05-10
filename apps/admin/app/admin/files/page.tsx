'use client'

import { useEffect, useState } from 'react'
import { Files, Trash2, Search, FileImage, File } from 'lucide-react'
import { DataTable, Column } from '@/components/admin/DataTable'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import { fetchFiles, deleteFile } from '@/lib/admin-api'
import { FileAsset } from '@/types/project'
import { formatDate } from '@/lib/utils'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

const USAGE_TYPES = ['ALL', 'LOGO', 'MODEL', 'REFERENCE_IMAGE', 'PRODUCT_IMAGE', 'PERSON_IMAGE', 'OTHER']

function FilePreview({ file }: { file: FileAsset }) {
  const isImage = file.fileType.startsWith('image/')
  if (isImage) {
    return <img src={file.fileUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-[var(--bg-subtle)]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
  }
  return <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center"><File className="w-5 h-5 text-[var(--text-subtle)]" /></div>
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileAsset[]>([])
  const [filtered, setFiltered] = useState<FileAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [usageFilter, setUsageFilter] = useState('ALL')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { fetchFiles().then(setFiles).catch((error) => toastLoadError(error, 'Impossible de charger les fichiers')).finally(() => setIsLoading(false)) }, [])

  useEffect(() => {
    let r = files
    if (search) r = r.filter((f) => `${f.originalName} ${f.user?.fullName || ''} ${f.project?.title || ''}`.toLowerCase().includes(search.toLowerCase()))
    if (usageFilter !== 'ALL') r = r.filter((f) => f.usageType === usageFilter)
    setFiltered(r)
  }, [files, search, usageFilter])

  const columns: Column<FileAsset>[] = [
    {
      header: 'Aperçu', accessor: 'fileUrl',
      cell: (f) => <FilePreview file={f} />
    },
    {
      header: 'Nom', accessor: 'originalName',
      cell: (f) => (
        <div>
          <div className="text-sm font-medium text-[var(--text)] truncate max-w-xs">{f.originalName}</div>
          <div className="text-xs text-[var(--text-muted)]">{f.fileType}</div>
        </div>
      )
    },
    {
      header: 'Usage', accessor: 'usageType',
      cell: (f) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--accent-light)] text-[var(--accent)]">
          {f.usageType.replace('_', ' ')}
        </span>
      )
    },
    { header: 'Projet', accessor: 'projectId', cell: (f) => <span className="text-xs text-[var(--text-muted)] truncate max-w-[120px] block">{f.project?.title || '—'}</span> },
    { header: 'Utilisateur', accessor: 'userId', cell: (f) => <span className="text-xs text-[var(--text-muted)]">{f.user?.fullName || '—'}</span> },
    { header: 'Taille', accessor: 'fileSizeBytes', sortable: true, cell: (f) => <span className="text-xs tabular-nums text-[var(--text-muted)]">{formatFileSize(f.fileSizeBytes)}</span> },
    { header: 'Date', accessor: 'createdAt', sortable: true, cell: (f) => <span className="text-xs text-[var(--text-muted)]">{formatDate(f.createdAt)}</span> },
    {
      header: 'Actions', accessor: 'id',
      cell: (f) => (
        <button onClick={() => setDeleteId(f.id)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      )
    },
  ]

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-[var(--text)]">Fichiers</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{filtered.length} fichier(s)</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-[var(--text-subtle)]" />
          <input className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {USAGE_TYPES.map((type) => (
            <button key={type} onClick={() => setUsageFilter(type)} className={cn('px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors', usageFilter === type ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]')}>
              {type === 'ALL' ? 'Tous' : type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <DataTable<FileAsset>
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          emptyIcon={Files}
          emptyTitle="Aucun fichier"
          rowKey={(f) => f.id}
        />
      </div>

      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await deleteFile(deleteId!)
            setFiles((prev) => prev.filter((f) => f.id !== deleteId))
            toastSuccess('Fichier supprimé')
          } catch { toastError('Erreur lors de la suppression') }
          setDeleteId(null)
        }}
        description="Ce fichier sera supprimé définitivement."
      />
    </div>
  )
}
