'use client'

import { useEffect, useState } from 'react'
import { Bot, Plus, Pencil, Trash2, Brain, MessageSquare, Save, RefreshCw } from 'lucide-react'
import { ProviderBadge } from '@/components/admin/StatusBadge'
import { Drawer } from '@/components/admin/Drawer'
import { AgentForm } from '@/components/admin/Forms'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import { fetchAgents, createAgent, updateAgent, deleteAgent, fetchSettings, saveSettings, fetchLlmProviders } from '@/lib/admin-api'
import type { SettingsByCategory, LlmProvider } from '@/lib/admin-api'
import { AgentDefinition } from '@/types/agent'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

type ChatProvider = string

const WORKSPACE_CONTEXT_PROMPTS_SETTING_KEY = 'chat_workspace_context_prompts'

const WORKSPACE_PROMPT_TRIGGER_OPTIONS = [
  {
    value: 'workspace_brief',
    label: 'Contexte initial',
    description: 'Sidebar, type d’affiche, format, projet et style.',
    variables: ['{workspaceTitle}', '{projectTitle}', '{brandDescription}', '{posterType}', '{posterTypeName}', '{format}', '{formatLabel}', '{category}', '{style}'],
  },
  {
    value: 'assets_present',
    label: 'Fichiers présents',
    description: 'Fichiers détectés dans Fichiers de conception.',
    variables: ['{assetLines}', '{assetCount}'],
  },
  {
    value: 'assets_missing',
    label: 'Aucun fichier',
    description: 'Aucun fichier dans Fichiers de conception.',
    variables: [],
  },
  {
    value: 'vision_chat',
    label: 'Vision chat',
    description: 'Images transmises au provider pendant la discussion.',
    variables: ['{imageCount}', '{visionLines}'],
  },
  {
    value: 'opening_assets',
    label: 'Ouverture avec fichiers',
    description: 'Premier message quand des fichiers existent.',
    variables: ['{assetLines}', '{assetCount}'],
  },
  {
    value: 'opening_no_assets',
    label: 'Ouverture sans fichiers',
    description: 'Premier message sans fichiers.',
    variables: ['{assetLines}'],
  },
  {
    value: 'opening_vision',
    label: 'Vision ouverture',
    description: 'Images transmises au provider pour le premier message.',
    variables: ['{imageCount}', '{visionLines}'],
  },
] as const

type WorkspacePromptTrigger = typeof WORKSPACE_PROMPT_TRIGGER_OPTIONS[number]['value']
type WorkspaceContextPrompt = {
  id: string
  title: string
  trigger: WorkspacePromptTrigger
  priority: number
  enabled: boolean
  content: string
}

type ChatAgentSettings = Record<string, string> & {
  chat_agent_name: string
  text_ai_provider: ChatProvider
  openai_model: string
  anthropic_model: string
  gemini_model: string
  chat_agent_system_prompt: string
}

const DEFAULT_CHAT_AGENT_SETTINGS: ChatAgentSettings = {
  chat_agent_name: 'Studio Flyer AI',
  text_ai_provider: 'mock',
  openai_model: 'gpt-4o',
  anthropic_model: 'claude-3-5-sonnet-20241022',
  gemini_model: 'gemini-1.5-pro',
  chat_agent_system_prompt:
    "Tu es l’assistant IA de Flyer Studio. Ton rôle est d’aider l’utilisateur à créer des flyers, affiches, posters, visuels publicitaires, publications réseaux sociaux et supports de communication professionnels. Tu dois poser des questions utiles si le brief est incomplet, proposer des idées de contenu, structurer les textes, conseiller le style visuel, les couleurs, la composition et préparer un prompt exploitable pour générer le visuel.",
}

function isWorkspacePromptTrigger(value: unknown): value is WorkspacePromptTrigger {
  return typeof value === 'string' && WORKSPACE_PROMPT_TRIGGER_OPTIONS.some((option) => option.value === value)
}

function createWorkspacePromptId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `workspace_prompt_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function parseWorkspacePrompts(raw: string | undefined): WorkspaceContextPrompt[] {
  if (!raw?.trim()) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item, index): WorkspaceContextPrompt | null => {
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const content = typeof record.content === 'string' ? record.content : ''
        if (!isWorkspacePromptTrigger(record.trigger)) return null

        return {
          id: typeof record.id === 'string' && record.id.trim() ? record.id : `workspace_prompt_${index + 1}`,
          title: typeof record.title === 'string' && record.title.trim() ? record.title : `Prompt workspace ${index + 1}`,
          trigger: record.trigger,
          priority: Number.isFinite(Number(record.priority)) ? Number(record.priority) : 0,
          enabled: record.enabled !== false,
          content,
        }
      })
      .filter((prompt): prompt is WorkspaceContextPrompt => Boolean(prompt))
      .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title, 'fr'))
  } catch {
    return []
  }
}

function normalizeWorkspacePrompts(prompts: WorkspaceContextPrompt[]) {
  return prompts
    .map((prompt, index) => ({
      id: prompt.id || `workspace_prompt_${index + 1}`,
      title: prompt.title.trim() || `Prompt workspace ${index + 1}`,
      trigger: prompt.trigger,
      priority: Number.isFinite(Number(prompt.priority)) ? Number(prompt.priority) : 0,
      enabled: prompt.enabled,
      content: prompt.content,
    }))
    .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title, 'fr'))
}

function triggerMeta(trigger: WorkspacePromptTrigger) {
  return WORKSPACE_PROMPT_TRIGGER_OPTIONS.find((option) => option.value === trigger) || WORKSPACE_PROMPT_TRIGGER_OPTIONS[0]
}

function flattenSettings(data: SettingsByCategory) {
  const flat: Record<string, string> = {}
  for (const items of Object.values(data)) {
    for (const setting of items) flat[setting.key] = setting.value
  }
  return flat
}

function modelKeyForProvider(provider: ChatProvider) {
  if (provider === 'openai') return 'openai_model'
  if (provider === 'anthropic') return 'anthropic_model'
  if (provider === 'gemini') return 'gemini_model'
  if (provider === 'mock') return ''
  return `custom_${provider}_default_model`
}

function providerHint(provider: LlmProvider | undefined) {
  if (!provider) return 'Sélectionnez un provider texte activé dans Paramètres → Providers.'
  if (provider.id === 'mock') return 'Réponse locale de secours.'
  if (provider.id === 'openai') return 'openai_api_key + openai_model.'
  if (provider.id === 'anthropic') return 'anthropic_api_key + anthropic_model.'
  if (provider.id === 'gemini') return 'gemini_api_key + gemini_model.'
  return `Provider custom actif · ${provider.type}${provider.defaultModel ? ` · ${provider.defaultModel}` : ''}.`
}

function providersFromSettings(flat: Record<string, string>): LlmProvider[] {
  const providers: LlmProvider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      slug: 'openai',
      type: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: flat.openai_model || '',
      enabled: Boolean(flat.openai_api_key?.trim()),
      supportsText: true,
      supportsVision: true,
      supportsReasoning: true,
      supportsImageGeneration: true,
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      slug: 'anthropic',
      type: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      defaultModel: flat.anthropic_model || '',
      enabled: Boolean(flat.anthropic_api_key?.trim()),
      supportsText: true,
      supportsVision: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      slug: 'gemini',
      type: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: flat.gemini_model || '',
      enabled: Boolean(flat.gemini_api_key?.trim()),
      supportsText: true,
      supportsVision: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
    },
    {
      id: 'mock',
      name: 'Mock (simulation)',
      slug: 'mock',
      type: 'mock',
      baseUrl: '',
      defaultModel: 'mock-model',
      enabled: true,
      supportsText: true,
      supportsVision: true,
      supportsReasoning: false,
      supportsImageGeneration: false,
    },
  ]

  for (const [key, name] of Object.entries(flat)) {
    const match = key.match(/^custom_(.+)_name$/)
    if (!match) continue

    const slug = match[1]
    const supportsTextValue = flat[`custom_${slug}_supports_text`]
    providers.push({
      id: slug,
      name,
      slug,
      type: flat[`custom_${slug}_type`] || 'openai-compatible',
      baseUrl: flat[`custom_${slug}_base_url`] || '',
      defaultModel: flat[`custom_${slug}_default_model`] || '',
      enabled: flat[`custom_${slug}_is_active`] === 'true',
      supportsText: supportsTextValue === 'true' || supportsTextValue === undefined || supportsTextValue === '',
      supportsVision: flat[`custom_${slug}_supports_vision`] === 'true',
      supportsReasoning: flat[`custom_${slug}_supports_reasoning`] === 'true',
      supportsImageGeneration: flat[`custom_${slug}_supports_image_generation`] === 'true',
    })
  }

  return providers
}

async function readChatSettings() {
  const [settingsData, providerList] = await Promise.all([
    fetchSettings(),
    fetchLlmProviders(),
  ])
  const flat = flattenSettings(settingsData)
  const providers = providerList.length > 0 ? providerList : providersFromSettings(flat)
  const textProviders = providers.filter((provider) => provider.supportsText && provider.enabled)
  const configuredProvider = (flat.text_ai_provider || '').trim()
  const fallbackProvider = textProviders.find((provider) => provider.id !== 'mock')?.id || textProviders[0]?.id || 'mock'
  const text_ai_provider = configuredProvider && configuredProvider !== 'auto'
    ? configuredProvider
    : fallbackProvider

  return {
    providers,
    workspacePrompts: parseWorkspacePrompts(flat[WORKSPACE_CONTEXT_PROMPTS_SETTING_KEY]),
    settings: {
      ...DEFAULT_CHAT_AGENT_SETTINGS,
      ...flat,
      chat_agent_name: flat.chat_agent_name || DEFAULT_CHAT_AGENT_SETTINGS.chat_agent_name,
      text_ai_provider,
      openai_model: flat.openai_model || DEFAULT_CHAT_AGENT_SETTINGS.openai_model,
      anthropic_model: flat.anthropic_model || DEFAULT_CHAT_AGENT_SETTINGS.anthropic_model,
      gemini_model: flat.gemini_model || DEFAULT_CHAT_AGENT_SETTINGS.gemini_model,
      chat_agent_system_prompt: flat.chat_agent_system_prompt || DEFAULT_CHAT_AGENT_SETTINGS.chat_agent_system_prompt,
    },
  }
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editAgent, setEditAgent] = useState<AgentDefinition | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [chatSettings, setChatSettings] = useState<ChatAgentSettings>(DEFAULT_CHAT_AGENT_SETTINGS)
  const [llmProviders, setLlmProviders] = useState<LlmProvider[]>([])
  const [workspacePrompts, setWorkspacePrompts] = useState<WorkspaceContextPrompt[]>([])
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)

  async function loadChatSettings() {
    setSettingsLoading(true)
    try {
      const { providers, settings, workspacePrompts } = await readChatSettings()
      setLlmProviders(providers)
      setChatSettings(settings)
      setWorkspacePrompts(workspacePrompts)
    } catch (error) {
      toastLoadError(error, "Impossible de charger l'agent conversationnel")
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents().then(setAgents).catch((error) => toastLoadError(error, 'Impossible de charger les agents')).finally(() => setIsLoading(false))
    readChatSettings()
      .then(({ providers, settings, workspacePrompts }) => {
        setLlmProviders(providers)
        setChatSettings(settings)
        setWorkspacePrompts(workspacePrompts)
      })
      .catch((error) => toastLoadError(error, "Impossible de charger l'agent conversationnel"))
      .finally(() => setSettingsLoading(false))
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
  const textProviderOptions = llmProviders.filter((provider) => provider.supportsText && provider.enabled)
  const selectedProvider = textProviderOptions.find((provider) => provider.id === chatSettings.text_ai_provider)
  const selectedProviderMissing = Boolean(chatSettings.text_ai_provider && !selectedProvider)
  const sortedWorkspacePrompts = [...workspacePrompts].sort((a, b) => (
    b.priority - a.priority || a.title.localeCompare(b.title, 'fr')
  ))

  function setChatSetting<K extends keyof ChatAgentSettings>(key: K, value: ChatAgentSettings[K]) {
    setChatSettings((current) => ({ ...current, [key]: value }))
  }

  function addWorkspacePrompt() {
    setWorkspacePrompts((current) => [
      {
        id: createWorkspacePromptId(),
        title: 'Nouveau prompt workspace',
        trigger: 'workspace_brief',
        priority: current.length > 0 ? Math.max(...current.map((prompt) => prompt.priority)) + 10 : 100,
        enabled: true,
        content: '',
      },
      ...current,
    ])
  }

  function updateWorkspacePrompt(id: string, patch: Partial<WorkspaceContextPrompt>) {
    setWorkspacePrompts((current) => current.map((prompt) => (
      prompt.id === id ? { ...prompt, ...patch } : prompt
    )))
  }

  function deleteWorkspacePrompt(id: string) {
    setWorkspacePrompts((current) => current.filter((prompt) => prompt.id !== id))
  }

  async function handleSaveChatAgent() {
    setSettingsSaving(true)
    try {
      const entries = [
        { key: 'chat_agent_name', value: chatSettings.chat_agent_name.trim() || DEFAULT_CHAT_AGENT_SETTINGS.chat_agent_name, category: 'providers' },
        { key: 'text_ai_provider', value: chatSettings.text_ai_provider, category: 'providers' },
        { key: 'openai_model', value: chatSettings.openai_model.trim() || DEFAULT_CHAT_AGENT_SETTINGS.openai_model, category: 'providers' },
        { key: 'anthropic_model', value: chatSettings.anthropic_model.trim() || DEFAULT_CHAT_AGENT_SETTINGS.anthropic_model, category: 'providers' },
        { key: 'gemini_model', value: chatSettings.gemini_model.trim() || DEFAULT_CHAT_AGENT_SETTINGS.gemini_model, category: 'providers' },
        { key: 'chat_agent_system_prompt', value: chatSettings.chat_agent_system_prompt.trim() || DEFAULT_CHAT_AGENT_SETTINGS.chat_agent_system_prompt, category: 'providers' },
        {
          key: WORKSPACE_CONTEXT_PROMPTS_SETTING_KEY,
          value: JSON.stringify(normalizeWorkspacePrompts(workspacePrompts), null, 2),
          category: 'providers',
        },
      ]

      if (selectedModelKey && selectedModelKey.startsWith('custom_')) {
        entries.push({
          key: selectedModelKey,
          value: (chatSettings[selectedModelKey] || selectedProvider?.defaultModel || '').trim(),
          category: 'providers',
        })
      }

      await saveSettings(entries)
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
                  disabled={textProviderOptions.length === 0}
                >
                  {selectedProviderMissing && (
                    <option value={chatSettings.text_ai_provider}>
                      {chatSettings.text_ai_provider} (introuvable ou inactif)
                    </option>
                  )}
                  {textProviderOptions.length === 0 ? (
                    <option value="">Aucun provider texte actif</option>
                  ) : (
                    textProviderOptions.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] leading-4 text-[var(--text-subtle)]">
                  {selectedProviderMissing
                    ? 'Ce provider est sauvegardé mais il n’est plus actif dans Paramètres → Providers.'
                    : providerHint(selectedProvider)}
                </p>
              </label>

              {selectedModelKey && chatSettings.text_ai_provider !== 'mock' && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    Modèle {selectedProvider?.name || chatSettings.text_ai_provider}
                  </span>
                  <input
                    value={chatSettings[selectedModelKey] || selectedProvider?.defaultModel || ''}
                    onChange={(event) => setChatSetting(selectedModelKey, event.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                  {selectedModelKey.startsWith('custom_') && (
                    <p className="text-[11px] leading-4 text-[var(--text-subtle)]">
                      Ce champ met à jour le modèle par défaut du provider custom sélectionné.
                    </p>
                  )}
                </label>
              )}
            </div>

            <div className="space-y-5">
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

              <div className="border-t border-[var(--border)] pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Prompts contexte workspace</h3>
                    <p className="mt-1 text-[11px] leading-4 text-[var(--text-subtle)]">
                      Liste CRUD enregistrée en base, triée par priorité avant injection dans le chat client.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addWorkspacePrompt}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg-subtle)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {sortedWorkspacePrompts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-6 text-center text-xs text-[var(--text-subtle)]">
                      Aucun prompt workspace configuré.
                    </div>
                  ) : (
                    sortedWorkspacePrompts.map((prompt) => {
                      const meta = triggerMeta(prompt.trigger)
                      return (
                        <div key={prompt.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 shadow-sm">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-[var(--accent)]/10 px-2 py-1 text-[11px] font-bold text-[var(--accent)]">
                                  P{prompt.priority}
                                </span>
                                <span className={cn(
                                  'rounded-md px-2 py-1 text-[11px] font-semibold',
                                  prompt.enabled
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-[var(--bg-subtle)] text-[var(--text-subtle)]'
                                )}>
                                  {prompt.enabled ? 'Actif' : 'Inactif'}
                                </span>
                                <span className="rounded-md bg-[var(--bg-subtle)] px-2 py-1 text-[11px] font-medium text-[var(--text-muted)]">
                                  {meta.label}
                                </span>
                              </div>
                              <input
                                value={prompt.title}
                                onChange={(event) => updateWorkspacePrompt(prompt.id, { title: event.target.value })}
                                className="w-full rounded-lg border border-transparent bg-transparent px-0 py-1 text-sm font-semibold text-[var(--text)] outline-none transition-colors focus:border-[var(--border)] focus:bg-[var(--surface)] focus:px-3"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateWorkspacePrompt(prompt.id, { enabled: !prompt.enabled })}
                                className={cn(
                                  'relative h-6 w-11 rounded-full transition-colors',
                                  prompt.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                                )}
                                aria-label={prompt.enabled ? 'Désactiver le prompt' : 'Activer le prompt'}
                              >
                                <span className={cn(
                                  'absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
                                  prompt.enabled ? 'left-6' : 'left-1'
                                )} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteWorkspacePrompt(prompt.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 transition-colors hover:bg-red-50"
                                aria-label="Supprimer le prompt"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px]">
                            <label className="block space-y-1.5">
                              <span className="text-[11px] font-medium text-[var(--text-muted)]">Moment d’injection</span>
                              <select
                                value={prompt.trigger}
                                onChange={(event) => updateWorkspacePrompt(prompt.id, { trigger: event.target.value as WorkspacePromptTrigger })}
                                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                              >
                                {WORKSPACE_PROMPT_TRIGGER_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                              <span className="block text-[11px] leading-4 text-[var(--text-subtle)]">{meta.description}</span>
                            </label>
                            <label className="block space-y-1.5">
                              <span className="text-[11px] font-medium text-[var(--text-muted)]">Priorité</span>
                              <input
                                type="number"
                                value={prompt.priority}
                                onChange={(event) => updateWorkspacePrompt(prompt.id, { priority: Number(event.target.value) })}
                                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                              />
                            </label>
                          </div>

                          <label className="mt-3 block space-y-1.5">
                            <span className="text-[11px] font-medium text-[var(--text-muted)]">Contenu du prompt</span>
                            <textarea
                              value={prompt.content}
                              onChange={(event) => updateWorkspacePrompt(prompt.id, { content: event.target.value })}
                              rows={7}
                              className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-xs leading-5 text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                            />
                          </label>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {meta.variables.length > 0 ? meta.variables.map((variable) => (
                              <code key={variable} className="rounded-md bg-[var(--bg-subtle)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
                                {variable}
                              </code>
                            )) : (
                              <span className="text-[11px] text-[var(--text-subtle)]">Aucune variable pour ce moment.</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
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
