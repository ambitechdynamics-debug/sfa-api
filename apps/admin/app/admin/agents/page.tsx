'use client'

import { useEffect, useState } from 'react'
import { Bot, Plus, Pencil, Trash2, Brain, MessageSquare, Save, RefreshCw } from 'lucide-react'
import { ProviderBadge } from '@/components/admin/StatusBadge'
import { Drawer } from '@/components/admin/Drawer'
import { AgentForm } from '@/components/admin/Forms'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import { fetchAgents, createAgent, updateAgent, deleteAgent, fetchSettings, saveSettings, SettingsByCategory } from '@/lib/admin-api'
import { AgentDefinition } from '@/types/agent'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

type ChatProvider = 'auto' | 'openai' | 'anthropic' | 'gemini' | 'mock'

type ChatAgentSettings = {
  chat_agent_name: string
  text_ai_provider: ChatProvider
  openai_model: string
  anthropic_model: string
  gemini_model: string
  chat_agent_system_prompt: string
}

const DEFAULT_CHAT_AGENT_SETTINGS: ChatAgentSettings = {
  chat_agent_name: 'Studio Flyer AI',
  text_ai_provider: 'auto',
  openai_model: 'gpt-4o',
  anthropic_model: 'claude-3-5-sonnet-20241022',
  gemini_model: 'gemini-1.5-pro',
  chat_agent_system_prompt:
    "Tu es l’assistant IA de Flyer Studio. Ton rôle est d’aider l’utilisateur à créer des flyers, affiches, posters, visuels publicitaires, publications réseaux sociaux et supports de communication professionnels. Tu dois poser des questions utiles si le brief est incomplet, proposer des idées de contenu, structurer les textes, conseiller le style visuel, les couleurs, la composition et préparer un prompt exploitable pour générer le visuel.",
}

const CHAT_PROVIDER_OPTIONS: Array<{ value: ChatProvider; label: string; hint: string }> = [
  { value: 'auto', label: 'Auto', hint: 'Utilise la première clé API disponible en base' },
  { value: 'openai', label: 'OpenAI', hint: 'openai_api_key + openai_model' },
  { value: 'anthropic', label: 'Anthropic', hint: 'anthropic_api_key + anthropic_model' },
  { value: 'gemini', label: 'Gemini', hint: 'gemini_api_key + gemini_model' },
  { value: 'mock', label: 'Mock', hint: 'Réponse locale de secours' },
]

function flattenSettings(data: SettingsByCategory) {
  const flat: Record<string, string> = {}
  for (const items of Object.values(data)) {
    for (const setting of items) flat[setting.key] = setting.value
  }
  return flat
}

function normalizeProvider(value: string): ChatProvider {
  return CHAT_PROVIDER_OPTIONS.some((option) => option.value === value)
    ? (value as ChatProvider)
    : 'auto'
}

function modelKeyForProvider(provider: ChatProvider) {
  if (provider === 'openai') return 'openai_model'
  if (provider === 'anthropic') return 'anthropic_model'
  if (provider === 'gemini') return 'gemini_model'
  return 'openai_model'
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editAgent, setEditAgent] = useState<AgentDefinition | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [chatSettings, setChatSettings] = useState<ChatAgentSettings>(DEFAULT_CHAT_AGENT_SETTINGS)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)

  async function loadChatSettings() {
    setSettingsLoading(true)
    try {
      const flat = flattenSettings(await fetchSettings())
      setChatSettings({
        ...DEFAULT_CHAT_AGENT_SETTINGS,
        chat_agent_name: flat.chat_agent_name || DEFAULT_CHAT_AGENT_SETTINGS.chat_agent_name,
        text_ai_provider: normalizeProvider(flat.text_ai_provider || DEFAULT_CHAT_AGENT_SETTINGS.text_ai_provider),
        openai_model: flat.openai_model || DEFAULT_CHAT_AGENT_SETTINGS.openai_model,
        anthropic_model: flat.anthropic_model || DEFAULT_CHAT_AGENT_SETTINGS.anthropic_model,
        gemini_model: flat.gemini_model || DEFAULT_CHAT_AGENT_SETTINGS.gemini_model,
        chat_agent_system_prompt: flat.chat_agent_system_prompt || DEFAULT_CHAT_AGENT_SETTINGS.chat_agent_system_prompt,
      })
    } catch (error) {
      toastLoadError(error, "Impossible de charger l'agent conversationnel")
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents().then(setAgents).catch((error) => toastLoadError(error, 'Impossible de charger les agents')).finally(() => setIsLoading(false))
    void loadChatSettings()
  }, [])

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
    OPENAI: 'bg-emerald-500', openai: 'bg-emerald-500',
    ANTHROPIC: 'bg-orange-500', anthropic: 'bg-orange-500',
    GEMINI: 'bg-blue-500', gemini: 'bg-blue-500',
    MOCK: 'bg-gray-400', mock: 'bg-gray-400',
  }

  const selectedModelKey = modelKeyForProvider(chatSettings.text_ai_provider)
  const selectedProvider = CHAT_PROVIDER_OPTIONS.find((option) => option.value === chatSettings.text_ai_provider)

  function setChatSetting<K extends keyof ChatAgentSettings>(key: K, value: ChatAgentSettings[K]) {
    setChatSettings((current) => ({ ...current, [key]: value }))
  }

  async function handleSaveChatAgent() {
    setSettingsSaving(true)
    try {
      await saveSettings([
        { key: 'chat_agent_name', value: chatSettings.chat_agent_name.trim() || DEFAULT_CHAT_AGENT_SETTINGS.chat_agent_name },
        { key: 'text_ai_provider', value: chatSettings.text_ai_provider },
        { key: 'openai_model', value: chatSettings.openai_model.trim() || DEFAULT_CHAT_AGENT_SETTINGS.openai_model },
        { key: 'anthropic_model', value: chatSettings.anthropic_model.trim() || DEFAULT_CHAT_AGENT_SETTINGS.anthropic_model },
        { key: 'gemini_model', value: chatSettings.gemini_model.trim() || DEFAULT_CHAT_AGENT_SETTINGS.gemini_model },
        { key: 'chat_agent_system_prompt', value: chatSettings.chat_agent_system_prompt.trim() || DEFAULT_CHAT_AGENT_SETTINGS.chat_agent_system_prompt },
      ])
      toastSuccess('Agent conversationnel mis à jour')
      await loadChatSettings()
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erreur lors de la sauvegarde de l'agent conversationnel")
    } finally {
      setSettingsSaving(false)
    }
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

      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Agent conversationnel du dashboard client</h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--text-muted)]">
                Ces réglages pilotent directement le champ de chat de <span className="font-mono">/dashboard</span> via l’API <span className="font-mono">/api/chat</span>.
                Le prompt système est lu depuis la base de données à chaque génération.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadChatSettings}
              disabled={settingsLoading || settingsSaving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', settingsLoading && 'animate-spin')} />
              Recharger
            </button>
            <button
              type="button"
              onClick={handleSaveChatAgent}
              disabled={settingsLoading || settingsSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {settingsSaving ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Enregistrer
            </button>
          </div>
        </div>

        {settingsLoading ? (
          <div className="grid gap-4 p-5 lg:grid-cols-[320px_1fr]">
            <div className="h-40 rounded-lg bg-[var(--bg-subtle)] animate-skeleton" />
            <div className="h-40 rounded-lg bg-[var(--bg-subtle)] animate-skeleton" />
          </div>
        ) : (
          <div className="grid gap-5 p-5 lg:grid-cols-[340px_1fr]">
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">Nom de l’agent</span>
                <input
                  value={chatSettings.chat_agent_name}
                  onChange={(event) => setChatSetting('chat_agent_name', event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">Provider conversationnel</span>
                <select
                  value={chatSettings.text_ai_provider}
                  onChange={(event) => setChatSetting('text_ai_provider', event.target.value as ChatProvider)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                >
                  {CHAT_PROVIDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <p className="text-[11px] leading-4 text-[var(--text-subtle)]">{selectedProvider?.hint}</p>
              </label>

              {chatSettings.text_ai_provider !== 'mock' && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    Modèle {chatSettings.text_ai_provider === 'auto' ? 'OpenAI par défaut' : selectedProvider?.label}
                  </span>
                  <input
                    value={chatSettings[selectedModelKey]}
                    onChange={(event) => setChatSetting(selectedModelKey, event.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                  {chatSettings.text_ai_provider === 'auto' && (
                    <p className="text-[11px] leading-4 text-[var(--text-subtle)]">En auto, le backend choisit le provider selon les clés configurées en base.</p>
                  )}
                </label>
              )}
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-muted)]">Prompt système envoyé au modèle</span>
              <textarea
                value={chatSettings.chat_agent_system_prompt}
                onChange={(event) => setChatSetting('chat_agent_system_prompt', event.target.value)}
                rows={10}
                className="min-h-[220px] w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm leading-6 text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
              />
              <p className="text-[11px] leading-4 text-[var(--text-subtle)]">
                Ce texte définit le comportement réel de l’agent du dashboard client : ton, rôle, questions à poser, limites et livrables attendus.
              </p>
            </label>
          </div>
        )}
      </section>

      {/* Stats bar */}
      <div className="flex items-center gap-4 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex-wrap">
        {(() => {
          const counts: Record<string, number> = {}
          for (const a of agents) {
            const key = a.provider.toLowerCase()
            counts[key] = (counts[key] || 0) + 1
          }
          const labels: Record<string, string> = { openai: 'OpenAI', anthropic: 'Anthropic', gemini: 'Gemini', mock: 'Mock' }
          return Object.entries(counts).map(([prov, count]) => (
            <div key={prov} className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full', PROVIDER_COLORS[prov] || 'bg-purple-500')} />
              <span className="text-xs font-medium text-[var(--text-muted)]">{labels[prov] || prov} · {count}</span>
            </div>
          ))
        })()}
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
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', PROVIDER_COLORS[agent.provider] || 'bg-purple-500', 'bg-opacity-15')}>
                      <Bot className={cn('w-4.5 h-4.5', ['OPENAI','openai'].includes(agent.provider) ? 'text-emerald-600' : ['ANTHROPIC','anthropic'].includes(agent.provider) ? 'text-orange-600' : ['GEMINI','gemini'].includes(agent.provider) ? 'text-blue-600' : 'text-gray-500')} />
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
