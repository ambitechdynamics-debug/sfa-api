'use client'

import { useEffect, useState } from 'react'
import { Bot, Plus, Pencil, Trash2, Brain, Zap, ZapOff } from 'lucide-react'
import { StatusBadge, ProviderBadge } from '@/components/admin/StatusBadge'
import { Drawer } from '@/components/admin/Drawer'
import { AgentForm } from '@/components/admin/Forms'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import { fetchAgents, createAgent, updateAgent, deleteAgent } from '@/lib/admin-api'
import { AgentDefinition } from '@/types/agent'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editAgent, setEditAgent] = useState<AgentDefinition | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAgents().then(setAgents).catch((error) => toastLoadError(error, 'Impossible de charger les agents')).finally(() => setIsLoading(false)) }, [])

  const activeCount = agents.filter((a) => a.isActive).length

  async function handleSave(data: Partial<AgentDefinition>) {
    setSaving(true)
    try {
      if (editAgent?.id) {
        const updated = await updateAgent(editAgent.id, data)
        setAgents((prev) => prev.map((a) => a.id === editAgent.id ? updated : a))
        toastSuccess('Agent mis à jour')
      } else {
        const created = await createAgent(data)
        setAgents((prev) => [...prev, created])
        toastSuccess('Agent créé')
      }
      setDrawerOpen(false)
      setEditAgent(null)
    } catch { toastError('Erreur lors de la sauvegarde') }
    finally { setSaving(false) }
  }

  async function handleToggle(agent: AgentDefinition) {
    const updated = await updateAgent(agent.id, { isActive: !agent.isActive })
    setAgents((prev) => prev.map((a) => a.id === agent.id ? updated : a))
  }

  const PROVIDER_COLORS: Record<string, string> = {
    OPENAI: 'bg-emerald-500',
    ANTHROPIC: 'bg-orange-500',
    GEMINI: 'bg-blue-500',
    MOCK: 'bg-gray-400',
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Agents IA</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{activeCount} actif(s) / {agents.length} total</p>
        </div>
        <button
          onClick={() => { setEditAgent(null); setDrawerOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouvel Agent
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
        {['OPENAI', 'ANTHROPIC', 'GEMINI', 'MOCK'].map((prov) => {
          const count = agents.filter((a) => a.provider === prov).length
          return (
            <div key={prov} className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full', PROVIDER_COLORS[prov])} />
              <span className="text-xs font-medium text-[var(--text-muted)]">{prov} · {count}</span>
            </div>
          )
        })}
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 h-40 animate-skeleton" />
            ))
          : agents.map((agent, i) => (
              <div
                key={agent.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:shadow-md transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'forwards', opacity: 0 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', PROVIDER_COLORS[agent.provider], 'bg-opacity-15')}>
                      <Bot className={cn('w-4.5 h-4.5', agent.provider === 'OPENAI' ? 'text-emerald-600' : agent.provider === 'ANTHROPIC' ? 'text-orange-600' : agent.provider === 'GEMINI' ? 'text-blue-600' : 'text-gray-500')} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)]">{agent.name}</div>
                      <code className="text-xs text-[var(--text-subtle)] font-mono">{agent.key}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(agent)}
                    className={cn('w-9 h-5 rounded-full transition-all relative', agent.isActive ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}
                  >
                    <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all', agent.isActive ? 'left-[18px]' : 'left-0.5')} />
                  </button>
                </div>

                <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">{agent.description}</p>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <ProviderBadge provider={agent.provider} />
                  <span className="text-xs text-[var(--text-subtle)] font-mono">{agent.model}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Brain className="w-3.5 h-3.5" />
                    <span>{agent.memoryLinksCount || 0} mémoires</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditAgent(agent); setDrawerOpen(true) }} className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </button>
                    <button onClick={() => setDeleteId(agent.id)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
        }
      </div>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditAgent(null) }}
        title={editAgent ? 'Modifier l\'agent' : 'Nouvel Agent IA'}
        subtitle={editAgent ? `Clé: ${editAgent.key}` : 'Configurer un nouvel agent'}
      >
        <AgentForm
          initial={editAgent || undefined}
          onSubmit={handleSave}
          onCancel={() => { setDrawerOpen(false); setEditAgent(null) }}
          isLoading={saving}
        />
      </Drawer>

      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await deleteAgent(deleteId!)
            setAgents((prev) => prev.filter((a) => a.id !== deleteId))
            toastSuccess('Agent supprimé')
          } catch { toastError('Erreur lors de la suppression') }
          setDeleteId(null)
        }}
        description="L'agent sera supprimé avec toutes ses liaisons aux mémoires."
      />
    </div>
  )
}
