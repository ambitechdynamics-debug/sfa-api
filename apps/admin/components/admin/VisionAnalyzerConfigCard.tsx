'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Eye, RefreshCw, Save, RotateCcw } from 'lucide-react'
import {
  fetchArtisticVisionConfig,
  saveArtisticVisionConfig,
  fetchLlmProviders,
  type ArtisticVisionConfig,
  type LlmProvider,
} from '@/lib/admin-api'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

const DEFAULT_CONFIG: ArtisticVisionConfig = {
  providerId: 'gemini',
  model: '',
  systemPrompt: '',
  userPrompt: 'Analyse cette image et extrais les métadonnées requises au format JSON.',
}

interface Props {
  /** Called whenever config is loaded or saved, so the page can pre-fill upload forms. */
  onConfigChange?: (config: ArtisticVisionConfig) => void
}

export function VisionAnalyzerConfigCard({ onConfigChange }: Props) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<ArtisticVisionConfig>(DEFAULT_CONFIG)
  const [providers, setProviders] = useState<LlmProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState<string>('')

  const visionProviders = providers.filter((p) => p.supportsVision && p.enabled)
  const selectedProvider = visionProviders.find((p) => p.id === config.providerId)
  const providerMissing = Boolean(config.providerId && !selectedProvider)
  const dirty = JSON.stringify(config) !== savedSnapshot

  async function load() {
    setLoading(true)
    try {
      const [cfg, llmProviders] = await Promise.all([fetchArtisticVisionConfig(), fetchLlmProviders()])
      setConfig(cfg)
      setProviders(llmProviders)
      setSavedSnapshot(JSON.stringify(cfg))
      onConfigChange?.(cfg)
    } catch (error) {
      toastLoadError(error, "Impossible de charger la configuration d'analyse")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const saved = await saveArtisticVisionConfig(config)
      setConfig(saved)
      setSavedSnapshot(JSON.stringify(saved))
      onConfigChange?.(saved)
      toastSuccess('Configuration analyseur enregistrée')
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof ArtisticVisionConfig>(key: K, value: ArtisticVisionConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  function resetToSaved() {
    if (!savedSnapshot) return
    const restored = JSON.parse(savedSnapshot) as ArtisticVisionConfig
    setConfig(restored)
    onConfigChange?.(restored)
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-[var(--bg-subtle)] transition-colors rounded-t-xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent)]">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--text)]">Analyseur d’images</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {loading
                ? 'Chargement…'
                : `Provider : ${selectedProvider?.name || config.providerId}${config.model ? ` · ${config.model}` : ''}`}
              {dirty && !loading && <span className="ml-2 text-amber-600">· modifications non enregistrées</span>}
            </div>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        )}
      </button>

      {open && (
        <div className="border-t border-[var(--border)] p-5 space-y-5">
          {loading ? (
            <div className="h-40 rounded-lg bg-[var(--bg-subtle)] animate-skeleton" />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Provider vision</span>
                  <select
                    value={config.providerId}
                    onChange={(e) => setField('providerId', e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                  >
                    {providerMissing && (
                      <option value={config.providerId}>{config.providerId} (introuvable ou inactif)</option>
                    )}
                    {visionProviders.length === 0 ? (
                      <option value="">Aucun provider vision actif</option>
                    ) : (
                      visionProviders.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[11px] leading-4 text-[var(--text-subtle)]">
                    Seuls les providers déclarés <span className="font-mono">supportsVision</span> apparaissent. Activez-les dans Paramètres → Providers.
                  </p>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Modèle (optionnel)</span>
                  <input
                    value={config.model}
                    onChange={(e) => setField('model', e.target.value)}
                    placeholder={selectedProvider?.defaultModel || 'modèle par défaut du provider'}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-xs text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                  />
                  <p className="text-[11px] leading-4 text-[var(--text-subtle)]">
                    Laisser vide pour utiliser le modèle par défaut du provider.
                  </p>
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Prompt système — décris ce que l’IA analyse et le format JSON attendu
                </span>
                <textarea
                  value={config.systemPrompt}
                  onChange={(e) => setField('systemPrompt', e.target.value)}
                  rows={14}
                  className="min-h-[280px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-xs leading-5 text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                />
                <p className="text-[11px] leading-4 text-[var(--text-subtle)]">
                  Définit le rôle de l’IA et la structure JSON exacte à retourner. C’est ce que l’IA reçoit pour chaque image analysée.
                </p>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">Prompt utilisateur (instruction par image)</span>
                <textarea
                  value={config.userPrompt}
                  onChange={(e) => setField('userPrompt', e.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]"
                />
                <p className="text-[11px] leading-4 text-[var(--text-subtle)]">
                  Court message envoyé avec chaque image (ex : « Analyse cette image et extrais… »).
                </p>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading || saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] disabled:opacity-50"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Recharger
                </button>
                {dirty && (
                  <button
                    type="button"
                    onClick={resetToSaved}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)] disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Annuler
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || saving || !dirty}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {saving ? (
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Enregistrer
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
