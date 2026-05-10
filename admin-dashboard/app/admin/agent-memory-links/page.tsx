'use client'

import { useEffect, useState } from 'react'
import { Link2, Plus, Trash2, ArrowRight, ChevronRight, Network, User } from 'lucide-react'
import { StatusBadge, ProviderBadge } from '@/components/admin/StatusBadge'
import { Modal } from '@/components/admin/Modals'
import { AgentMemoryLinkForm } from '@/components/admin/Forms'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import { GlobalLinkGraph } from '@/components/admin/GlobalLinkGraph'
import { fetchAgents, fetchMemories, fetchAgentMemoryLinks, createAgentMemoryLink, deleteAgentMemoryLink } from '@/lib/admin-api'
import { AgentDefinition, AgentMemoryLink } from '@/types/agent'
import { MemoryDefinition } from '@/types/memory'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AgentMemoryLinksPage() {
  const [agents, setAgents] = useState<AgentDefinition[]>([])
  const [memories, setMemories] = useState<MemoryDefinition[]>([])
  const [links, setLinks] = useState<AgentMemoryLink[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'agent' | 'global'>('agent')
  const [isLoading, setIsLoading] = useState(true)
  const [linkFormOpen, setLinkFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([fetchAgents(), fetchMemories(), fetchAgentMemoryLinks()]).then(([a, m, l]) => {
      setAgents(a)
      setMemories(m)
      setLinks(l)
      if (a.length > 0) setSelectedAgentId(a[0].id)
    }).catch((error) => toastLoadError(error, 'Impossible de charger les données')).finally(() => setIsLoading(false))
  }, [])

  const selectedAgent = agents.find((a) => a.id === selectedAgentId)
  const agentLinks = links.filter((l) => l.agentDefinitionId === selectedAgentId)
  const inputLinks = agentLinks.filter((l) => l.usageType === 'INPUT' || l.usageType === 'BOTH')
  const outputLinks = agentLinks.filter((l) => l.usageType === 'OUTPUT' || l.usageType === 'BOTH')

  async function handleCreateLink(data: Partial<AgentMemoryLink>) {
    setSaving(true)
    try {
      const created = await createAgentMemoryLink(data)
      const memory = memories.find((m) => m.id === data.memoryDefinitionId)
      const agent = agents.find((a) => a.id === data.agentDefinitionId)
      setLinks((prev) => [...prev, { ...created, memory, agent }])
      setLinkFormOpen(false)
      toastSuccess('Liaison créée')
    } catch { toastError('Erreur lors de la création') }
    finally { setSaving(false) }
  }

  async function handleDeleteLink(id: string) {
    try {
      await deleteAgentMemoryLink(id)
      setLinks((prev) => prev.filter((l) => l.id !== id))
      toastSuccess('Liaison supprimée')
    } catch { toastError('Erreur lors de la suppression') }
    setDeleteId(null)
  }

  const USAGE_TYPE_STYLE: Record<string, string> = {
    INPUT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    OUTPUT: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    BOTH: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  }

  function MemoryLinkItem({ link }: { link: AgentMemoryLink }) {
    const memory = link.memory || memories.find((m) => m.id === link.memoryDefinitionId)
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border)] transition-colors">
        <div className="flex items-center gap-3">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', USAGE_TYPE_STYLE[link.usageType])}>
            {link.usageType}
          </span>
          <div>
            <code className="text-xs font-mono font-bold text-[var(--accent)]">{memory?.key}</code>
            <div className="text-xs text-[var(--text-muted)]">{memory?.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-[var(--text-subtle)]">Priorité: {link.priority}</div>
          {link.isRequired && <span className="text-xs text-red-500">requis</span>}
          <button onClick={() => setDeleteId(link.id)} className="p-1 rounded-md hover:bg-red-100 text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Liaisons Agent / Mémoire</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{links.length} liaison(s) configurée(s)</p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-subtle)]">
          <button
            onClick={() => setViewMode('agent')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              viewMode === 'agent'
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            <User className="w-3.5 h-3.5" /> Par agent
          </button>
          <button
            onClick={() => setViewMode('global')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              viewMode === 'global'
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            <Network className="w-3.5 h-3.5" /> Vue globale
          </button>
        </div>

        <button onClick={() => setLinkFormOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors">
          <Plus className="w-4 h-4" /> Ajouter liaison
        </button>
      </div>

      {viewMode === 'global' ? (
        <GlobalLinkGraph
          agents={agents}
          memories={memories}
          links={links}
          onDeleteLink={(id) => setDeleteId(id)}
        />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Agent selector */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Agents</h3>
          <div className="space-y-1">
            {agents.map((agent) => {
              const count = links.filter((l) => l.agentDefinitionId === agent.id).length
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    selectedAgentId === agent.id
                      ? 'bg-[var(--accent)] text-white'
                      : 'hover:bg-[var(--bg-subtle)] text-[var(--text)]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{agent.name}</div>
                    <div className={cn('text-xs', selectedAgentId === agent.id ? 'text-white/70' : 'text-[var(--text-muted)]')}>{count} mémoire(s)</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Links detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedAgent ? (
            <>
              {/* Agent info */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-[var(--text)]">{selectedAgent.name}</h3>
                  <ProviderBadge provider={selectedAgent.provider} />
                  <StatusBadge status={selectedAgent.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                </div>
                <p className="text-xs text-[var(--text-muted)]">{selectedAgent.description}</p>
              </div>

              {/* Flow visualization */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Flux des mémoires</h4>
                <div className="flex items-start gap-4">
                  {/* Input memories */}
                  <div className="flex-1">
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">INPUT ({inputLinks.length})</div>
                    <div className="space-y-1">
                      {inputLinks.map((l) => {
                        const m = l.memory || memories.find((mm) => mm.id === l.memoryDefinitionId)
                        return (
                          <div key={l.id} className="px-2 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-400 font-mono">
                            {m?.key}
                          </div>
                        )
                      })}
                      {inputLinks.length === 0 && <div className="text-xs text-[var(--text-subtle)]">Aucune</div>}
                    </div>
                  </div>

                  {/* Agent */}
                  <div className="flex flex-col items-center justify-center py-4">
                    <ArrowRight className="w-5 h-5 text-[var(--accent)]" />
                    <div className="mt-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold text-center max-w-[100px] truncate">
                      {selectedAgent.name.split(' ')[0]}
                    </div>
                    <ArrowRight className="w-5 h-5 text-[var(--accent)] mt-2" />
                  </div>

                  {/* Output memories */}
                  <div className="flex-1">
                    <div className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-2">OUTPUT ({outputLinks.length})</div>
                    <div className="space-y-1">
                      {outputLinks.map((l) => {
                        const m = l.memory || memories.find((mm) => mm.id === l.memoryDefinitionId)
                        return (
                          <div key={l.id} className="px-2 py-1.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-xs text-violet-700 dark:text-violet-400 font-mono">
                            {m?.key}
                          </div>
                        )
                      })}
                      {outputLinks.length === 0 && <div className="text-xs text-[var(--text-subtle)]">Aucune</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* All links list */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Toutes les liaisons ({agentLinks.length})</h4>
                <div className="space-y-2">
                  {agentLinks.length === 0
                    ? <div className="text-xs text-[var(--text-subtle)] py-4 text-center">Aucune liaison configurée</div>
                    : agentLinks.sort((a, b) => a.priority - b.priority).map((l) => <MemoryLinkItem key={l.id} link={l} />)
                  }
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-10 text-center">
              <Link2 className="w-8 h-8 text-[var(--text-subtle)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-muted)]">Sélectionnez un agent</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Link form modal */}
      <Modal open={linkFormOpen} onClose={() => setLinkFormOpen(false)} title="Ajouter une liaison" className="max-w-lg">
        <AgentMemoryLinkForm
          agents={agents.map((a) => ({ id: a.id, name: a.name }))}
          memories={memories.map((m) => ({ id: m.id, key: m.key, name: m.name }))}
          defaultAgentId={selectedAgentId ?? undefined}
          existingLinks={links.map((l) => ({ agentDefinitionId: l.agentDefinitionId, priority: l.priority }))}
          onSubmit={handleCreateLink}
          onCancel={() => setLinkFormOpen(false)}
          isLoading={saving}
        />
      </Modal>

      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDeleteLink(deleteId)}
        description="Cette liaison sera supprimée. L'agent n'aura plus accès à cette mémoire."
      />
    </div>
  )
}
