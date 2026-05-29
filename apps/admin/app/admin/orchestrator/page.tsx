'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bot,
  CheckCircle2,
  Database,
  GitBranch,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Timer,
  Trash2,
} from 'lucide-react'
import {
  fetchAgents,
  fetchMemories,
  fetchOrchestratorPipeline,
  resetOrchestratorPipeline,
  saveOrchestratorPipeline,
} from '@/lib/admin-api'
import { toastError, toastLoadError, toastSuccess } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { AgentDefinition } from '@/types/agent'
import { MemoryDefinition } from '@/types/memory'
import {
  OrchestratorCondition,
  OrchestratorExecutionMode,
  OrchestratorPipelineConfig,
  OrchestratorPipelineDiagnostics,
  OrchestratorPipelineStep,
  OrchestratorStepId,
} from '@/types/orchestrator'

const CONDITION_OPTIONS: Array<{ value: OrchestratorCondition; label: string }> = [
  { value: 'always', label: 'Toujours' },
  { value: 'has_files', label: 'Si fichiers' },
  { value: 'planner_ready_or_force', label: 'Planner prêt / force' },
  { value: 'has_prompt', label: 'Prompt présent' },
]

const CRITICAL_AGENT_KEYS = new Set<string>(['PLANNER_AGENT', 'PROMPT_ARCHITECT_AGENT'])

const inputCls = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]'

function reindexSteps(steps: OrchestratorPipelineStep[]) {
  return steps.map((step, index) => ({ ...step, order: (index + 1) * 10 }))
}

function splitMemoryKeys(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
          checked ? 'left-6' : 'left-1',
        )}
      />
    </button>
  )
}

function DiagnosticList({ diagnostics, stepCount }: { diagnostics: OrchestratorPipelineDiagnostics | null; stepCount: number }) {
  if (!diagnostics) return null

  if (stepCount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
        <GitBranch className="h-4 w-4" />
        Pipeline vide
      </div>
    )
  }

  const items = [
    ...diagnostics.orderIssues.map((message) => ({ type: 'Ordre', message })),
    ...diagnostics.missingAgents.map((message) => ({ type: 'Agent absent', message })),
    ...diagnostics.inactiveAgents.map((message) => ({ type: 'Agent inactif', message })),
    ...diagnostics.missingMemories.map((message) => ({ type: 'Mémoire absente', message })),
  ]

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
        Configuration cohérente
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        Points à corriger
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {items.map((item, index) => (
          <div key={`${item.type}-${item.message}-${index}`} className="rounded-lg bg-[var(--surface)] px-3 py-2 text-xs">
            <span className="font-semibold text-[var(--text)]">{item.type}</span>
            <span className="ml-2 font-mono text-[var(--text-muted)]">{item.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrchestratorPage() {
  const [config, setConfig] = useState<OrchestratorPipelineConfig | null>(null)
  const [diagnostics, setDiagnostics] = useState<OrchestratorPipelineDiagnostics | null>(null)
  const [agents, setAgents] = useState<AgentDefinition[]>([])
  const [memories, setMemories] = useState<MemoryDefinition[]>([])
  const [source, setSource] = useState<'default' | 'db'>('default')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pipeline, agentRows, memoryRows] = await Promise.all([
        fetchOrchestratorPipeline(),
        fetchAgents(),
        fetchMemories(),
      ])
      setConfig({ ...pipeline.config, steps: reindexSteps([...pipeline.config.steps].sort((a, b) => a.order - b.order)) })
      setDiagnostics(pipeline.diagnostics)
      setAgents(agentRows)
      setMemories(memoryRows)
      setSource(pipeline.source)
      setUpdatedAt(pipeline.updatedAt)
    } catch (error) {
      toastLoadError(error, "Impossible de charger l'orchestrateur")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const steps = useMemo(() => config?.steps ?? [], [config])
  const memoryKeys = useMemo(() => memories.map((memory) => memory.key).sort((a, b) => a.localeCompare(b, 'fr')), [memories])
  const agentKeys = useMemo(() => agents.map((agent) => agent.key), [agents])
  const activeSteps = steps.filter((step) => step.enabled).length
  const requiredSteps = steps.filter((step) => step.required).length
  const parallelSteps = steps.filter((step) => step.executionMode === 'parallel').length

  function updateStep(id: OrchestratorStepId, patch: Partial<OrchestratorPipelineStep>) {
    setConfig((current) => {
      if (!current) return current
      return {
        ...current,
        steps: current.steps.map((step) => (step.id === id ? { ...step, ...patch } : step)),
      }
    })
  }

  function moveStep(index: number, direction: -1 | 1) {
    setConfig((current) => {
      if (!current) return current
      const next = [...current.steps]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return { ...current, steps: reindexSteps(next) }
    })
  }

  async function handleSave() {
    if (!config) return
    setSaving(true)
    try {
      const payload = await saveOrchestratorPipeline({ ...config, steps: reindexSteps(config.steps) })
      setConfig({ ...payload.config, steps: reindexSteps([...payload.config.steps].sort((a, b) => a.order - b.order)) })
      setDiagnostics(payload.diagnostics)
      setSource(payload.source)
      setUpdatedAt(payload.updatedAt)
      toastSuccess('Pipeline orchestrateur enregistré')
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!window.confirm('Vider toute la configuration orchestrateur ?')) return
    setSaving(true)
    try {
      const payload = await resetOrchestratorPipeline()
      setConfig({ ...payload.config, steps: reindexSteps([...payload.config.steps].sort((a, b) => a.order - b.order)) })
      setDiagnostics(payload.diagnostics)
      setSource(payload.source)
      setUpdatedAt(payload.updatedAt)
      toastSuccess('Pipeline vidé')
    } catch {
      toastError('Erreur lors de la restauration')
    } finally {
      setSaving(false)
    }
  }

  function addStep() {
    setConfig((current) => {
      if (!current) return current
      const usedIds = new Set(current.steps.map((step) => step.id))
      let candidate = `etape-${current.steps.length + 1}`
      let suffix = 1
      while (usedIds.has(candidate)) {
        suffix += 1
        candidate = `etape-${current.steps.length + 1}-${suffix}`
      }
      const newStep: OrchestratorPipelineStep = {
        id: candidate,
        label: 'Nouvelle étape',
        agentKey: agents[0]?.key ?? '',
        order: (current.steps.length + 1) * 10,
        enabled: true,
        required: false,
        executionMode: 'sequential',
        inputMemoryKeys: [],
        outputMemoryKey: null,
        retries: 0,
        timeoutMs: 30000,
        condition: 'always',
      }
      return { ...current, steps: reindexSteps([...current.steps, newStep]) }
    })
  }

  function deleteStep(stepId: OrchestratorStepId) {
    setConfig((current) => {
      if (!current) return current
      return { ...current, steps: reindexSteps(current.steps.filter((step) => step.id !== stepId)) }
    })
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Orchestrateur</h1>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {source === 'db' ? 'Configuration active en base' : 'Aucune configuration enregistrée'} · {updatedAt ? new Date(updatedAt).toLocaleString('fr-FR') : 'non enregistrée'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addStep}
            disabled={loading || saving || !config}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter étape
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading || saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Recharger
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading || saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Vider
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving || !config}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <GitBranch className="h-4 w-4 text-[var(--accent)]" />
            Étapes
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--text)]">{steps.length}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Actives
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--text)]">{activeSteps}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Obligatoires
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--text)]">{requiredSteps}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <Timer className="h-4 w-4 text-blue-500" />
            Parallèles
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--text)]">{parallelSteps}</div>
        </div>
      </div>

      <DiagnosticList diagnostics={diagnostics} stepCount={steps.length} />

      <datalist id="memory-keys">
        {memoryKeys.map((key) => <option key={key} value={key} />)}
      </datalist>

      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid grid-cols-[56px_1.2fr_1fr_110px_110px_120px_1.2fr_1fr_96px] gap-3 border-b border-[var(--border)] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] max-xl:hidden">
          <div>Ordre</div>
          <div>Étape</div>
          <div>Agent</div>
          <div>Active</div>
          <div>Mode</div>
          <div>Condition</div>
          <div>Mémoires entrée</div>
          <div>Mémoire sortie</div>
          <div>Retry</div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-28 rounded-lg bg-[var(--bg-subtle)] animate-skeleton" />
            ))}
          </div>
        ) : steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <GitBranch className="mb-3 h-8 w-8 text-[var(--text-subtle)]" />
            <div className="text-sm font-semibold text-[var(--text)]">Aucune étape configurée</div>
            <button
              type="button"
              onClick={addStep}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une étape
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {steps.map((step, index) => {
              const currentAgentMissing = Boolean(step.agentKey && !agentKeys.includes(step.agentKey))
              const isCritical = CRITICAL_AGENT_KEYS.has(step.agentKey)

              return (
                <div key={step.id} className="grid gap-3 p-4 xl:grid-cols-[56px_1.2fr_1fr_110px_110px_120px_1.2fr_1fr_96px] xl:items-start">
                  <div className="flex items-center gap-1 xl:flex-col">
                    <button
                      type="button"
                      onClick={() => moveStep(index, -1)}
                      disabled={index === 0}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-40"
                      aria-label="Monter"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 1)}
                      disabled={index === steps.length - 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-40"
                      aria-label="Descendre"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 xl:hidden">
                      <span className="rounded-md bg-[var(--accent)]/10 px-2 py-1 text-[10px] font-bold text-[var(--accent)]">#{index + 1}</span>
                      <span className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Étape</span>
                    </div>
                    <input
                      value={step.label}
                      onChange={(event) => updateStep(step.id, { label: event.target.value })}
                      className={cn(inputCls, 'font-semibold')}
                    />
                    <input
                      value={step.id}
                      onChange={(event) => updateStep(step.id, { id: event.target.value.trim() || step.id })}
                      className={cn(inputCls, 'font-mono text-[10px]')}
                      placeholder="identifiant"
                    />
                    {isCritical && (
                      <div className="flex">
                        <span className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-500">critique</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 xl:hidden">
                      <Bot className="h-3.5 w-3.5 text-[var(--text-subtle)]" />
                      <span className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Agent</span>
                    </div>
                    <select
                      value={step.agentKey}
                      onChange={(event) => updateStep(step.id, { agentKey: event.target.value })}
                      className={inputCls}
                    >
                      {currentAgentMissing && <option value={step.agentKey}>{step.agentKey} (absent)</option>}
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.key}>
                          {agent.name} · {agent.key}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => deleteStep(step.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500 transition-colors hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 xl:block xl:space-y-2">
                      <span className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Active</span>
                      <Toggle checked={step.enabled} onChange={() => updateStep(step.id, { enabled: !step.enabled })} />
                    </div>
                    <div className="flex items-center justify-between gap-2 xl:block xl:space-y-2">
                      <span className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Obligatoire</span>
                      <Toggle
                        checked={step.required}
                        onChange={() => updateStep(step.id, { required: !step.required })}
                      />
                    </div>
                  </div>

                  <div>
                    <select
                      value={step.executionMode}
                      onChange={(event) => updateStep(step.id, { executionMode: event.target.value as OrchestratorExecutionMode })}
                      className={inputCls}
                    >
                      <option value="sequential">Séquentiel</option>
                      <option value="parallel">Parallèle</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={step.condition}
                      onChange={(event) => updateStep(step.id, { condition: event.target.value as OrchestratorCondition })}
                      className={inputCls}
                    >
                      {CONDITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 xl:hidden">
                      <Database className="h-3.5 w-3.5 text-[var(--text-subtle)]" />
                      <span className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Mémoires entrée</span>
                    </div>
                    <input
                      value={step.inputMemoryKeys.join(', ')}
                      onChange={(event) => updateStep(step.id, { inputMemoryKeys: splitMemoryKeys(event.target.value) })}
                      className={cn(inputCls, 'font-mono')}
                      list="memory-keys"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 xl:hidden">
                      <Database className="h-3.5 w-3.5 text-[var(--text-subtle)]" />
                      <span className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Mémoire sortie</span>
                    </div>
                    <input
                      value={step.outputMemoryKey ?? ''}
                      onChange={(event) => updateStep(step.id, { outputMemoryKey: event.target.value.trim() || null })}
                      className={cn(inputCls, 'font-mono')}
                      list="memory-keys"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Retries</span>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        value={step.retries}
                        onChange={(event) => updateStep(step.id, { retries: Number(event.target.value) })}
                        className={inputCls}
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-[var(--text-subtle)]">Timeout</span>
                      <input
                        type="number"
                        min={1000}
                        max={300000}
                        step={1000}
                        value={step.timeoutMs}
                        onChange={(event) => updateStep(step.id, { timeoutMs: Number(event.target.value) })}
                        className={inputCls}
                      />
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
