'use client'

import { useEffect, useState } from 'react'
import { FileText, Star, Search } from 'lucide-react'
import { PromptViewer } from '@/components/admin/PromptViewer'
import { fetchPrompts } from '@/lib/admin-api'
import { FinalPrompt } from '@/types/project'
import { formatDate } from '@/lib/utils'
import { toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<FinalPrompt[]>([])
  const [filtered, setFiltered] = useState<FinalPrompt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchPrompts().then(setPrompts).catch((error) => toastLoadError(error, 'Impossible de charger les prompts')).finally(() => setIsLoading(false)) }, [])

  useEffect(() => {
    let r = prompts
    if (search) r = r.filter((p) => `${p.user?.fullName || ''} ${p.project?.title || ''} ${p.finalPrompt}`.toLowerCase().includes(search.toLowerCase()))
    setFiltered(r)
  }, [prompts, search])

  function QualityBadge({ score }: { score?: number }) {
    if (!score) return null
    const color = score >= 90 ? 'bg-emerald-100 text-emerald-700' : score >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
    return (
      <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', color)}>
        <Star className="w-3 h-3" /> {score}/100
      </span>
    )
  }

  return (
    <div className="space-y-5 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Prompts Finaux</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{filtered.length} prompt(s) M-PROMPT1</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2">
        <Search className="w-4 h-4 text-[var(--text-subtle)]" />
        <input className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Prompts list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 h-48 animate-skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--text-subtle)]" />
          <p className="text-sm text-[var(--text-muted)]">Aucun prompt trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((prompt, i) => (
            <div
              key={prompt.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden animate-fade-up"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'forwards', opacity: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">{prompt.project?.title || '—'}</div>
                    <div className="text-xs text-[var(--text-muted)]">par {prompt.user?.fullName || '—'} · {formatDate(prompt.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {prompt.memoriesUsed && (
                    <div className="hidden sm:flex items-center gap-1">
                      {prompt.memoriesUsed.map((m, j) => (
                        <span key={j} className="px-1.5 py-0.5 rounded-md bg-[var(--accent-light)] text-[var(--accent)] text-xs font-mono">{m}</span>
                      ))}
                    </div>
                  )}
                  <QualityBadge score={prompt.qualityScore} />
                </div>
              </div>
              {/* Prompt viewer */}
              <div className="p-5">
                <PromptViewer finalPrompt={prompt.finalPrompt ?? ''} negativePrompt={prompt.negativePrompt} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
