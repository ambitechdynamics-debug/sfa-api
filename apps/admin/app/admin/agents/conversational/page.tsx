'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Save, RefreshCw, Plus, Trash2, Database, Files, Palette, Ban, ListFilter } from 'lucide-react'
import {
  fetchSettings,
  saveSettings,
  fetchLlmProviders,
  fetchMemories,
  fetchChatAgentConfig,
  saveChatAgentConfig,
} from '@/lib/admin-api'
import type { SettingsByCategory, LlmProvider } from '@/lib/admin-api'
import type { ChatAgentConfig, ChatAgentModule } from '@/types/agent'
import type { MemoryDefinition } from '@/types/memory'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Toggle } from '@/components/admin/Toggle'

type ChatProvider = string

const WORKSPACE_CONTEXT_PROMPTS_SETTING_KEY = 'chat_workspace_context_prompts'

const WORKSPACE_PROMPT_TRIGGER_OPTIONS = [
  { value: 'workspace_brief', label: 'Contexte initial', description: 'Sidebar, type d’affiche, format, projet et style.', variables: ['{workspaceTitle}', '{projectTitle}', '{brandDescription}', '{posterType}', '{posterTypeName}', '{format}', '{formatLabel}', '{category}', '{style}'] },
  { value: 'assets_present', label: 'Fichiers présents', description: 'Fichiers détectés dans Fichiers de conception.', variables: ['{assetLines}', '{assetCount}'] },
  { value: 'assets_missing', label: 'Aucun fichier', description: 'Aucun fichier dans Fichiers de conception.', variables: [] },
  { value: 'vision_chat', label: 'Vision chat', description: 'Images transmises au provider pendant la discussion.', variables: ['{imageCount}', '{visionLines}'] },
  { value: 'opening_assets', label: 'Ouverture avec fichiers', description: 'Premier message quand des fichiers existent.', variables: ['{assetLines}', '{assetCount}'] },
  { value: 'opening_no_assets', label: 'Ouverture sans fichiers', description: 'Premier message sans fichiers.', variables: ['{assetLines}'] },
  { value: 'opening_vision', label: 'Vision ouverture', description: 'Images transmises au provider pour le premier message.', variables: ['{imageCount}', '{visionLines}'] },
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

const DEFAULT_CHAT_AGENT_CONFIG: ChatAgentConfig = {
  memoryTargetKey: 'M_SMS',
  moduleAccess: { files: true, artistic_base: false, forbidden_rules: false, creation_options: true },
}

const MODULE_META: Record<ChatAgentModule, { label: string; description: string; icon: typeof Files }> = {
  files: { label: 'Fichiers du client', description: 'L’agent voit l’inventaire des fichiers uploadés (logos, modèles, références). Si une image est compatible vision, elle est envoyée au provider.', icon: Files },
  artistic_base: { label: 'Base artistique', description: 'L’agent peut citer les ressources artistiques (styles, palettes, polices, modèles). Filtré par catégorie du travail si renseignée.', icon: Palette },
  forbidden_rules: { label: 'Règles interdites', description: 'L’agent voit la liste des règles actives et refuse poliment les demandes correspondantes.', icon: Ban },
  creation_options: { label: 'Type de création', description: 'L’agent reçoit le contexte spécifique au type d’affiche choisi par le client (slug CreationOption).', icon: ListFilter },
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

async function readChatSettings() {
  const [settingsData, providerList] = await Promise.all([fetchSettings(), fetchLlmProviders()])
  const flat = flattenSettings(settingsData)
  const providers = providerList
  const textProviders = providers.filter((provider) => provider.supportsText && provider.enabled)
  const configuredProvider = (flat.text_ai_provider || '').trim()
  const fallbackProvider = textProviders.find((provider) => provider.id !== 'mock')?.id || textProviders[0]?.id || 'mock'
  const text_ai_provider = configuredProvider && configuredProvider !== 'auto' ? configuredProvider : fallbackProvider
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

export default function ConversationalAgentPage() {
  const [chatSettings, setChatSettings] = useState<ChatAgentSettings>(DEFAULT_CHAT_AGENT_SETTINGS)
  const [llmProviders, setLlmProviders] = useState<LlmProvider[]>([])
  const [workspacePrompts, setWorkspacePrompts] = useState<WorkspaceContextPrompt[]>([])
  const [memories, setMemories] = useState<MemoryDefinition[]>([])
  const [chatConfig, setChatConfig] = useState<ChatAgentConfig>(DEFAULT_CHAT_AGENT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [{ providers, settings, workspacePrompts }, memoryRows, config] = await Promise.all([
        readChatSettings(),
        fetchMemories(),
        fetchChatAgentConfig(),
      ])
      setLlmProviders(providers)
      setChatSettings(settings)
      setWorkspacePrompts(workspacePrompts)
      setMemories(memoryRows)
      setChatConfig(config)
    } catch (error) {
      toastLoadError(error, "Impossible de charger l'agent conversationnel")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const selectedModelKey = modelKeyForProvider(chatSettings.text_ai_provider)
  const textProviderOptions = llmProviders.filter((provider) => provider.supportsText && provider.enabled)
  const selectedProvider = textProviderOptions.find((provider) => provider.id === chatSettings.text_ai_provider)
  const selectedProviderMissing = Boolean(chatSettings.text_ai_provider && !selectedProvider)
  const sortedPrompts = [...workspacePrompts].sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title, 'fr'))
  const memoryExists = memories.some((m) => m.key === chatConfig.memoryTargetKey)

  function setChatSetting<K extends keyof ChatAgentSettings>(key: K, value: ChatAgentSettings[K]) {
    setChatSettings((current) => ({ ...current, [key]: value }))
  }

  function toggleModule(key: ChatAgentModule) {
    setChatConfig((current) => ({
      ...current,
      moduleAccess: { ...current.moduleAccess, [key]: !current.moduleAccess[key] },
    }))
  }

  function addWorkspacePrompt() {
    setWorkspacePrompts((current) => [
      {
        id: createWorkspacePromptId(),
        title: 'Nouveau prompt workspace',
        trigger: 'workspace_brief',
        priority: current.length > 0 ? Math.max(...current.map((p) => p.priority)) + 10 : 100,
        enabled: true,
        content: '',
      },
      ...current,
    ])
  }

  function updateWorkspacePrompt(id: string, patch: Partial<WorkspaceContextPrompt>) {
    setWorkspacePrompts((current) => current.map((prompt) => (prompt.id === id ? { ...prompt, ...patch } : prompt)))
  }

  function deleteWorkspacePrompt(id: string) {
    setWorkspacePrompts((current) => current.filter((prompt) => prompt.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const entries = [
        { key: 'chat_agent_name', value: chatSettings.chat_agent_name.trim() || DEFAULT_CHAT_AGENT_SETTINGS.chat_agent_name, category: 'providers' },
        { key: 'text_ai_provider', value: chatSettings.text_ai_provider, category: 'providers' },
        { key: 'openai_model', value: chatSettings.openai_model.trim() || DEFAULT_CHAT_AGENT_SETTINGS.openai_model, category: 'providers' },
        { key: 'anthropic_model', value: chatSettings.anthropic_model.trim() || DEFAULT_CHAT_AGENT_SETTINGS.anthropic_model, category: 'providers' },
        { key: 'gemini_model', value: chatSettings.gemini_model.trim() || DEFAULT_CHAT_AGENT_SETTINGS.gemini_model, category: 'providers' },
        { key: 'chat_agent_system_prompt', value: chatSettings.chat_agent_system_prompt.trim() || DEFAULT_CHAT_AGENT_SETTINGS.chat_agent_system_prompt, category: 'providers' },
        { key: WORKSPACE_CONTEXT_PROMPTS_SETTING_KEY, value: JSON.stringify(normalizeWorkspacePrompts(workspacePrompts), null, 2), category: 'providers' },
      ]
      if (selectedModelKey && selectedModelKey.startsWith('custom_')) {
        entries.push({
          key: selectedModelKey,
          value: (chatSettings[selectedModelKey] || selectedProvider?.defaultModel || '').trim(),
          category: 'providers',
        })
      }
      await Promise.all([saveSettings(entries), saveChatAgentConfig(chatConfig)])
      toastSuccess('Agent conversationnel mis à jour')
      await load()
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text)]">Agent conversationnel</h1>
            <p className="mt-0.5 max-w-2xl text-xs leading-5 text-[var(--text-muted)]">
              Pilote le chat client de <span className="font-mono">/dashboard/ai</span> via <span className="font-mono">/api/chat</span>. Identité, mémoire de destination, modules de lecture et prompts contextuels.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Recharger
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {saving ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Enregistrer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-60 rounded-xl bg-[var(--bg-subtle)] animate-skeleton" />
          <div className="h-60 rounded-xl bg-[var(--bg-subtle)] animate-skeleton" />
        </div>
      ) : (
        <>
          {/* Section 1 — Identité */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Identité & provider</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">Nom de l’agent</span>
                <input
                  value={chatSettings.chat_agent_name}
                  onChange={(event) => setChatSetting('chat_agent_name', event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">Provider</span>
                <select
                  value={chatSettings.text_ai_provider}
                  onChange={(event) => setChatSetting('text_ai_provider', event.target.value as ChatProvider)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                  disabled={textProviderOptions.length === 0}
                >
                  {selectedProviderMissing && (
                    <option value={chatSettings.text_ai_provider}>{chatSettings.text_ai_provider} (introuvable ou inactif)</option>
                  )}
                  {textProviderOptions.length === 0 ? (
                    <option value="">Aucun provider texte actif</option>
                  ) : (
                    textProviderOptions.map((provider) => (
                      <option key={provider.id} value={provider.id}>{provider.name}</option>
                    ))
                  )}
                </select>
                <p className="text-[11px] leading-4 text-[var(--text-subtle)]">
                  {selectedProviderMissing ? "Ce provider est sauvegardé mais il n’est plus actif dans Paramètres → Providers." : providerHint(selectedProvider)}
                </p>
              </label>
              {selectedModelKey && chatSettings.text_ai_provider !== 'mock' && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Modèle {selectedProvider?.name || chatSettings.text_ai_provider}</span>
                  <input
                    value={chatSettings[selectedModelKey] || selectedProvider?.defaultModel || ''}
                    onChange={(event) => setChatSetting(selectedModelKey, event.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                </label>
              )}
            </div>
          </section>

          {/* Section 2 — System prompt */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Comportement (prompt système)</h2>
            <textarea
              value={chatSettings.chat_agent_system_prompt}
              onChange={(event) => setChatSetting('chat_agent_system_prompt', event.target.value)}
              rows={10}
              className="min-h-[220px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm leading-6 text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
            />
            <p className="mt-1.5 text-[11px] leading-4 text-[var(--text-subtle)]">
              Définit le rôle, le ton et les limites de l’agent. Injecté à chaque appel <span className="font-mono">/api/chat</span>.
            </p>
          </section>

          {/* Section 3 — Mémoire de destination */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Mémoire de destination</h2>
                <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-subtle)]">
                  Le premier message de chaque conversation est stocké dans cette mémoire (clef <span className="font-mono">MemoryDefinition.key</span>).
                </p>
              </div>
            </div>
            <label className="block space-y-1.5 max-w-md">
              <span className="text-xs font-medium text-[var(--text-muted)]">Mémoire cible</span>
              <select
                value={chatConfig.memoryTargetKey}
                onChange={(event) => setChatConfig((c) => ({ ...c, memoryTargetKey: event.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
              >
                {!memoryExists && (
                  <option value={chatConfig.memoryTargetKey}>{chatConfig.memoryTargetKey} (introuvable)</option>
                )}
                {memories.map((memory) => (
                  <option key={memory.id} value={memory.key}>
                    {memory.key} — {memory.name}
                  </option>
                ))}
              </select>
              {!memoryExists && (
                <p className="text-[11px] leading-4 text-amber-600">Cette clef n’existe pas dans MemoryDefinition. Créez-la dans /admin/memories ou choisissez-en une autre.</p>
              )}
            </label>
          </section>

          {/* Section 4 — Modules accessibles */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Modules de lecture</h2>
            <p className="mb-4 text-[11px] leading-4 text-[var(--text-subtle)]">
              Active les sources de données que l’agent peut consulter pendant la conversation. Chaque module est injecté comme bloc contextuel dans le prompt système.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {(Object.keys(MODULE_META) as ChatAgentModule[]).map((key) => {
                const meta = MODULE_META[key]
                const Icon = meta.icon
                const enabled = chatConfig.moduleAccess[key]
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-4 transition-colors',
                      enabled ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5' : 'border-[var(--border)] bg-[var(--bg)]',
                    )}
                  >
                    <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', enabled ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'bg-[var(--bg-subtle)] text-[var(--text-subtle)]')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-semibold text-[var(--text)]">{meta.label}</div>
                        <Toggle checked={enabled} onChange={() => toggleModule(key)} ariaLabel={meta.label} />
                      </div>
                      <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">{meta.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Section 5 — Workspace context prompts */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Prompts contexte workspace</h2>
                <p className="mt-1 text-[11px] leading-4 text-[var(--text-subtle)]">
                  Liste CRUD enregistrée en base, triée par priorité avant injection dans le chat client.
                </p>
              </div>
              <button
                type="button"
                onClick={addWorkspacePrompt}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition-colors hover:bg-[var(--bg-subtle)]"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {sortedPrompts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-6 text-center text-xs text-[var(--text-subtle)]">
                  Aucun prompt workspace configuré.
                </div>
              ) : (
                sortedPrompts.map((prompt) => {
                  const meta = triggerMeta(prompt.trigger)
                  return (
                    <div key={prompt.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 shadow-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[var(--accent)]/10 px-2 py-1 text-[11px] font-bold text-[var(--accent)]">P{prompt.priority}</span>
                            <span className={cn('rounded-md px-2 py-1 text-[11px] font-semibold', prompt.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[var(--bg-subtle)] text-[var(--text-subtle)]')}>
                              {prompt.enabled ? 'Actif' : 'Inactif'}
                            </span>
                            <span className="rounded-md bg-[var(--bg-subtle)] px-2 py-1 text-[11px] font-medium text-[var(--text-muted)]">{meta.label}</span>
                          </div>
                          <input
                            value={prompt.title}
                            onChange={(event) => updateWorkspacePrompt(prompt.id, { title: event.target.value })}
                            className="w-full rounded-lg border border-transparent bg-transparent px-0 py-1 text-sm font-semibold text-[var(--text)] outline-none transition-colors focus:border-[var(--border)] focus:bg-[var(--surface)] focus:px-3"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Toggle checked={prompt.enabled} onChange={() => updateWorkspacePrompt(prompt.id, { enabled: !prompt.enabled })} ariaLabel={prompt.enabled ? 'Désactiver' : 'Activer'} />
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
          </section>
        </>
      )}
    </div>
  )
}
