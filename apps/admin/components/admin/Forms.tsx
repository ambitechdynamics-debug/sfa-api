'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, ImagePlus, X, Link2, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { JsonEditor } from './JsonEditor'
import { AgentDefinition, AgentMemoryLink } from '@/types/agent'
import { MemoryDefinition } from '@/types/memory'
import { ArtisticResource } from '@/types/payment'
import {
  ForbiddenRule,
  FORBIDDEN_RULE_CATEGORIES,
  FORBIDDEN_RULE_SCOPES,
  FORBIDDEN_RULE_SEVERITIES,
} from '@/types/forbidden-rule'
import { uploadArtisticResourceImage, analyzeArtisticResourceImage, fetchLlmProviders, LlmProvider } from '@/lib/admin-api'
import { cn } from '@/lib/utils'

// ─── SHARED FORM COMPONENTS ───────────────────────────────────────────────────
interface FieldProps {
  label: string
  hint?: string
  children: React.ReactNode
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--text-muted)]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--text-subtle)]">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none placeholder:text-[var(--text-subtle)] transition-colors'
const selectCls = inputCls

// ─── AGENT FORM ───────────────────────────────────────────────────────────────
interface AgentFormProps {
  initial?: Partial<AgentDefinition>
  onSubmit: (data: Partial<AgentDefinition>) => void
  onCancel: () => void
  isLoading?: boolean
}

export function AgentForm({ initial, onSubmit, onCancel, isLoading }: AgentFormProps) {
  const [form, setForm] = useState<Partial<AgentDefinition>>({
    key: '', name: '', description: '', provider: 'anthropic', model: 'claude-sonnet-4-6',
    systemPrompt: '', expectedOutputSchema: {}, isActive: true, ...initial
  })
  const [providers, setProviders] = useState<LlmProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)

  useEffect(() => {
    fetchLlmProviders()
      .then((list) => setProviders(list.filter((p) => p.enabled)))
      .catch(() => {})
      .finally(() => setLoadingProviders(false))
  }, [])

  const set = (field: keyof AgentDefinition, val: unknown) =>
    setForm((f) => ({ ...f, [field]: val }))

  function handleProviderChange(slug: string) {
    set('provider', slug)
    const matched = providers.find((p) => p.id === slug)
    if (matched?.defaultModel) set('model', matched.defaultModel)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <Field label="Clé unique *" hint="Identifiant technique (ex: planner-agent)">
        <input className={inputCls} placeholder="planner-agent" value={form.key || ''} onChange={(e) => set('key', e.target.value)} required disabled={!!initial?.id} />
      </Field>
      <Field label="Nom affiché *">
        <input className={inputCls} placeholder="Planner Agent" value={form.name || ''} onChange={(e) => set('name', e.target.value)} required />
      </Field>
      <Field label="Description">
        <input className={inputCls} placeholder="Description courte de l'agent" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Provider *">
          <select
            className={selectCls}
            value={form.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            disabled={loadingProviders}
          >
            {loadingProviders ? (
              <option value="">Chargement…</option>
            ) : providers.length === 0 ? (
              <option value="">Aucun provider configuré</option>
            ) : (
              providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            )}
          </select>
        </Field>
        <Field label="Modèle *" hint="Modifiable — le défaut vient des paramètres">
          <input
            className={inputCls}
            list="agent-model-suggestions"
            placeholder="claude-sonnet-4-6"
            value={form.model || ''}
            onChange={(e) => set('model', e.target.value)}
            required
          />
          <datalist id="agent-model-suggestions">
            {providers
              .filter((p) => p.id === form.provider && p.defaultModel)
              .map((p) => <option key={p.id} value={p.defaultModel} />)
            }
          </datalist>
        </Field>
      </div>
      <Field label="Prompt Système *">
        <textarea
          className={cn(inputCls, 'resize-none')}
          rows={8}
          placeholder="Tu es un expert en..."
          value={form.systemPrompt || ''}
          onChange={(e) => set('systemPrompt', e.target.value)}
          required
        />
      </Field>
      <JsonEditor
        label="Schema de Sortie Attendu (JSON)"
        value={form.expectedOutputSchema as Record<string, unknown> || {}}
        onChange={(v) => set('expectedOutputSchema', v)}
        rows={5}
      />
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-subtle)]">
        <div>
          <div className="text-sm font-medium text-[var(--text)]">Agent actif</div>
          <div className="text-xs text-[var(--text-muted)]">L'agent sera utilisé dans les workflows</div>
        </div>
        <button
          type="button"
          onClick={() => set('isActive', !form.isActive)}
          className={cn(
            'w-10 h-6 rounded-full transition-all duration-200 relative',
            form.isActive ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
          )}
        >
          <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200', form.isActive ? 'left-[18px]' : 'left-0.5')} />
        </button>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors">Annuler</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60">
          {isLoading ? 'Enregistrement...' : initial?.id ? 'Mettre à jour' : 'Créer l\'agent'}
        </button>
      </div>
    </form>
  )
}

// ─── MEMORY DEFINITION FORM ───────────────────────────────────────────────────
interface MemoryFormProps {
  initial?: Partial<MemoryDefinition>
  onSubmit: (data: Partial<MemoryDefinition>) => void
  onCancel: () => void
  isLoading?: boolean
}

export function MemoryDefinitionForm({ initial, onSubmit, onCancel, isLoading }: MemoryFormProps) {
  const [form, setForm] = useState<Partial<MemoryDefinition>>({
    key: '', name: '', description: '', scope: 'PROJECT', schema: {}, isActive: true, ...initial
  })
  const isSystem = !!initial?.isSystem
  const set = (field: keyof MemoryDefinition, val: unknown) => setForm((f) => ({ ...f, [field]: val }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      {isSystem && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <span className="text-xs text-amber-700 dark:text-amber-400">Mémoire système — modification limitée</span>
        </div>
      )}
      <Field label="Clé unique *" hint="Identifiant (ex: M-SMS, M-CONTACT)">
        <input className={inputCls} value={form.key || ''} onChange={(e) => set('key', e.target.value)} required disabled={isSystem} />
      </Field>
      <Field label="Nom affiché *">
        <input className={inputCls} value={form.name || ''} onChange={(e) => set('name', e.target.value)} required disabled={isSystem} />
      </Field>
      <Field label="Description">
        <input className={inputCls} value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <Field label="Scope">
        <select className={selectCls} value={form.scope} onChange={(e) => set('scope', e.target.value)} disabled={isSystem}>
          <option value="PROJECT">Projet</option>
          <option value="USER">Utilisateur</option>
          <option value="GLOBAL">Global</option>
        </select>
      </Field>
      <JsonEditor
        label="Schéma JSON"
        value={form.schema as Record<string, unknown> || {}}
        onChange={(v) => set('schema', v)}
        rows={6}
        readonly={isSystem}
      />
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-subtle)]">
        <span className="text-sm font-medium text-[var(--text)]">Mémoire active</span>
        <button type="button" onClick={() => set('isActive', !form.isActive)} className={cn('w-10 h-6 rounded-full transition-all relative', form.isActive ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}>
          <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all', form.isActive ? 'left-[18px]' : 'left-0.5')} />
        </button>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors">Annuler</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60">
          {isLoading ? 'Enregistrement...' : initial?.id ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </form>
  )
}

// ─── ARTISTIC RESOURCE FORM ───────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  'Promotion','Événement','Restaurant','Boutique','Formation',
  'Corporate','Immobilier','Mode','Église','Institutionnel',
]

interface ArtisticFormProps {
  initial?: Partial<ArtisticResource>
  existingCategories?: string[]
  onSubmit: (data: Partial<ArtisticResource>) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ArtisticResourceForm({ initial, existingCategories, onSubmit, onCancel, isLoading }: ArtisticFormProps) {
  const [form, setForm] = useState<Partial<ArtisticResource>>({
    title: '', category: 'Promotion', resourceType: 'STYLE', url: '', description: '', tags: [], content: {}, ...initial
  })
  const [tagInput, setTagInput] = useState('')
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [newCategoryInput, setNewCategoryInput] = useState('')

  // ── Image upload state ──
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── AI Analysis state ──
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProviderId, setAnalyzeProviderId] = useState('gemini')
  const [analyzeModel, setAnalyzeModel] = useState('')
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [providers, setProviders] = useState<LlmProvider[]>([])

  useEffect(() => {
    fetchLlmProviders().then((list) => {
      const activeList = list.filter(p => p.enabled)
      setProviders(activeList)

      const visionList = activeList.filter(p => p.supportsVision)
      if (visionList.some(p => p.id === 'gemini')) {
        const geminiProv = visionList.find(p => p.id === 'gemini')!
        setAnalyzeProviderId('gemini')
        setAnalyzeModel(geminiProv.defaultModel || 'gemini-2.0-flash')
      } else if (visionList.some(p => p.id === 'mock')) {
        const mockProv = visionList.find(p => p.id === 'mock')!
        setAnalyzeProviderId('mock')
        setAnalyzeModel(mockProv.defaultModel || 'mock-model')
      } else if (visionList.length > 0) {
        setAnalyzeProviderId(visionList[0].id)
        setAnalyzeModel(visionList[0].defaultModel || '')
      }
    }).catch(() => {})
  }, [])

  const set = (field: keyof ArtisticResource, val: unknown) => setForm((f) => ({ ...f, [field]: val }))

  async function handleAnalyze() {
    if (!form.url) return
    setIsAnalyzing(true)
    setAnalyzeError(null)

    const selectedProvider = providers.find(p => p.id === analyzeProviderId)
    if (!selectedProvider) {
      setAnalyzeError("Aucun fournisseur d'IA sélectionné.")
      setIsAnalyzing(false)
      return
    }
    if (!selectedProvider.defaultModel || selectedProvider.defaultModel.trim() === '') {
      setAnalyzeError(`Le fournisseur "${selectedProvider.name}" n'a pas de modèle par défaut configuré dans les paramètres.`)
      setIsAnalyzing(false)
      return
    }

    try {
      const result = await analyzeArtisticResourceImage(form.url, analyzeProviderId, analyzeModel || selectedProvider.defaultModel)
      
      setForm((prev) => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        resourceType: result.resourceType || prev.resourceType,
        tags: result.tags && result.tags.length > 0 ? result.tags : prev.tags,
        content: result.content && Object.keys(result.content).length > 0 ? result.content : prev.content,
      }))

      if (result.category) {
        if (!allCategories.includes(result.category)) {
          setIsNewCategory(true)
          setNewCategoryInput(result.category)
          set('category', result.category)
        } else {
          setIsNewCategory(false)
          set('category', result.category)
        }
      }
    } catch (err: any) {
      setAnalyzeError(err.message || "Erreur lors de l'analyse")
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true)
    setUploadPct(0)
    setUploadError(null)
    try {
      const result = await uploadArtisticResourceImage(file, setUploadPct)
      set('url', result.url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de l\'upload'
      setUploadError(msg)
    } finally {
      setUploading(false)
      setUploadPct(0)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    e.target.value = ''
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  // Merge defaults + categories already in DB, deduplicated
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...(existingCategories ?? [])]))

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      set('tags', [...(form.tags || []), tagInput.trim()])
      setTagInput('')
    }
  }

  function handleCategorySelect(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === '__new__') {
      setIsNewCategory(true)
      set('category', '')
    } else {
      set('category', e.target.value)
    }
  }

  function cancelNewCategory() {
    setIsNewCategory(false)
    setNewCategoryInput('')
    set('category', allCategories[0])
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <Field label="Titre *">
        <input className={inputCls} value={form.title || ''} onChange={(e) => set('title', e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Catégorie">
          {isNewCategory ? (
            <div className="flex gap-1.5">
              <input
                className={cn(inputCls, 'flex-1 min-w-0')}
                value={newCategoryInput}
                onChange={(e) => { setNewCategoryInput(e.target.value); set('category', e.target.value) }}
                placeholder="Nouvelle catégorie…"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={cancelNewCategory}
                title="Revenir à la liste"
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-300 transition-colors text-base"
              >
                ×
              </button>
            </div>
          ) : (
            <select className={selectCls} value={form.category} onChange={handleCategorySelect}>
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option disabled>──────────</option>
              <option value="__new__">+ Nouvelle catégorie…</option>
            </select>
          )}
        </Field>
        <Field label="Type">
          <select className={selectCls} value={form.resourceType} onChange={(e) => set('resourceType', e.target.value)}>
            {['MODEL','TEXTURE','FONT','PALETTE','STYLE','REFERENCE','FORBIDDEN_RULE'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      {/* ── Image Upload Zone ── */}
      <Field label="Image / URL">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />

        {/* Preview si URL définie */}
        {form.url && !uploading ? (
          <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-subtle)] group">
            <img
              src={form.url}
              alt="preview"
              className="w-full h-40 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[var(--text)] text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" /> Changer
              </button>
              <button
                type="button"
                onClick={() => { set('url', ''); setShowUrlInput(false) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Supprimer
              </button>
            </div>
            <div className="absolute top-2 right-2">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-medium">
                <CheckCircle2 className="w-3 h-3" /> Cloudinary
              </span>
            </div>
          </div>
        ) : uploading ? (
          /* Upload progress */
          <div className="flex flex-col items-center justify-center gap-3 h-36 rounded-xl border border-[var(--accent)] bg-[var(--accent)]/5">
            <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
            <div className="w-40">
              <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-200 rounded-full"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-[var(--text-muted)]">Upload en cours… {uploadPct}%</span>
          </div>
        ) : (
          /* Dropzone */
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              'flex flex-col items-center justify-center gap-2 h-36 rounded-xl border-2 border-dashed transition-all cursor-pointer',
              isDragging
                ? 'border-[var(--accent)] bg-[var(--accent)]/8'
                : 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-subtle)]'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={cn('p-2.5 rounded-full', isDragging ? 'bg-[var(--accent)]/15' : 'bg-[var(--bg-subtle)]')}>
              <Upload className={cn('w-5 h-5', isDragging ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]')} />
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center">
              <span className="font-medium text-[var(--accent)]">Cliquez</span> ou glissez une image ici
            </p>
            <p className="text-[10px] text-[var(--text-subtle)]">JPEG, PNG, WebP — max 10 Mo</p>
          </div>
        )}

        {/* AI Analysis trigger */}
        {form.url && !uploading && (
          <div className="flex flex-col gap-2 mt-3 p-3 bg-[var(--bg-subtle)] border border-[var(--accent)]/20 rounded-lg">
            {providers.filter(p => p.supportsVision).length === 0 ? (
              <p className="text-xs text-amber-600 text-center font-medium">
                Aucun provider compatible vision n'est configuré ou activé. Veuillez en configurer un dans les paramètres d'administration.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" /> 
                    Auto-complétion par l'IA
                  </span>
                  <select
                    className="border border-[var(--border)] rounded px-2 py-1 text-xs bg-[var(--surface)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none max-w-[200px]"
                    value={analyzeProviderId}
                    onChange={(e) => {
                      const id = e.target.value
                      setAnalyzeProviderId(id)
                      const matched = providers.find(p => p.id === id)
                      if (matched) {
                        setAnalyzeModel(matched.defaultModel || '')
                      }
                    }}
                    disabled={isAnalyzing}
                  >
                    {providers.filter(p => p.supportsVision).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.defaultModel ? `— ${p.defaultModel}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse en cours...
                    </>
                  ) : (
                    'Analyser et remplir les champs'
                  )}
                </button>
                {analyzeError && (
                  <p className="text-xs text-red-500 text-center">{analyzeError}</p>
                )}
              </>
            )}
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-red-500 mt-1">{uploadError}</p>
        )}

        {/* Toggle URL manuelle */}
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--text-subtle)] hover:text-[var(--accent)] transition-colors"
        >
          <Link2 className="w-3 h-3" />
          {showUrlInput ? 'Masquer l\'URL' : 'Saisir une URL manuellement'}
        </button>

        {showUrlInput && (
          <input
            className={cn(inputCls, 'mt-1')}
            type="url"
            value={form.url || ''}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://..."
          />
        )}
      </Field>
      <Field label="Description">
        <textarea className={cn(inputCls, 'resize-none')} rows={3} value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <Field label="Tags (Entrée pour ajouter)">
        <input className={inputCls} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Ajouter un tag..." />
        {(form.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(form.tags || []).map((tag, i) => (
              <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] text-xs">
                {tag}
                <button type="button" onClick={() => set('tags', (form.tags || []).filter((_, j) => j !== i))} className="hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        )}
      </Field>
      <JsonEditor label="Contenu JSON" value={form.content as Record<string, unknown> || {}} onChange={(v) => set('content', v)} rows={5} />
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors">Annuler</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60">
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

// ─── AGENT MEMORY LINK FORM ───────────────────────────────────────────────────
interface AgentMemoryLinkFormProps {
  agents: Array<{ id: string; name: string }>
  memories: Array<{ id: string; key: string; name: string }>
  /** Pre-select this agent (e.g. the currently viewed agent on the page) */
  defaultAgentId?: string
  /** All existing links — used to compute the next priority automatically */
  existingLinks?: Array<{ agentDefinitionId: string; priority: number }>
  onSubmit: (data: Partial<AgentMemoryLink>) => void
  onCancel: () => void
  isLoading?: boolean
}

function computeNextPriority(
  agentId: string,
  existingLinks: Array<{ agentDefinitionId: string; priority: number }>,
): number {
  const agentLinks = existingLinks.filter((l) => l.agentDefinitionId === agentId)
  if (agentLinks.length === 0) return 1
  return Math.max(...agentLinks.map((l) => l.priority)) + 1
}

export function AgentMemoryLinkForm({ agents, memories, defaultAgentId, existingLinks = [], onSubmit, onCancel, isLoading }: AgentMemoryLinkFormProps) {
  const initialAgentId = defaultAgentId || agents[0]?.id || ''
  const initialPriority = computeNextPriority(initialAgentId, existingLinks)

  const [form, setForm] = useState<Partial<AgentMemoryLink>>({
    agentDefinitionId: initialAgentId,
    memoryDefinitionId: memories[0]?.id || '',
    usageType: 'INPUT',
    isRequired: true,
    priority: initialPriority,
  })
  // true = priority follows agent changes automatically; false = user locked it manually
  const [priorityAuto, setPriorityAuto] = useState(true)

  const set = (field: keyof AgentMemoryLink, val: unknown) => setForm((f) => ({ ...f, [field]: val }))

  function handleAgentChange(agentId: string) {
    set('agentDefinitionId', agentId)
    if (priorityAuto) {
      set('priority', computeNextPriority(agentId, existingLinks))
    }
  }

  function handlePriorityChange(val: number) {
    setPriorityAuto(false)     // user touched it → disable auto
    set('priority', val)
  }

  function resetPriorityAuto() {
    setPriorityAuto(true)
    set('priority', computeNextPriority(form.agentDefinitionId as string, existingLinks))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      {/* Agent — locked to the one currently viewed when defaultAgentId is set */}
      <Field label="Agent *">
        <select
          className={selectCls}
          value={form.agentDefinitionId}
          onChange={(e) => handleAgentChange(e.target.value)}
        >
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Mémoire *">
        <select className={selectCls} value={form.memoryDefinitionId} onChange={(e) => set('memoryDefinitionId', e.target.value)}>
          {memories.map((m) => <option key={m.id} value={m.id}>{m.key} — {m.name}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type d'usage">
          <select className={selectCls} value={form.usageType} onChange={(e) => set('usageType', e.target.value)}>
            <option value="INPUT">Entrée (INPUT)</option>
            <option value="OUTPUT">Sortie (OUTPUT)</option>
            <option value="BOTH">Entrée/Sortie (BOTH)</option>
          </select>
        </Field>

        {/* Priority — auto-calculated, but fully editable */}
        <Field label="Priorité">
          <div className="flex gap-1.5">
            <input
              className={cn(inputCls, 'flex-1')}
              type="number"
              min={0}
              value={form.priority}
              onChange={(e) => handlePriorityChange(Number(e.target.value))}
            />
            <button
              type="button"
              title={priorityAuto ? 'Priorité calculée automatiquement' : 'Recalculer automatiquement'}
              onClick={resetPriorityAuto}
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded-lg border text-xs font-bold transition-colors',
                priorityAuto
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              )}
            >
              {priorityAuto ? 'A' : '↺'}
            </button>
          </div>
          <p className="text-[10px] mt-1 text-[var(--text-subtle)]">
            {priorityAuto
              ? `Calculé automatiquement (suite aux ${existingLinks.filter((l) => l.agentDefinitionId === form.agentDefinitionId).length} liaison(s) existante(s))`
              : 'Valeur manuelle — cliquez ↺ pour recalculer'}
          </p>
        </Field>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-subtle)]">
        <div>
          <span className="text-sm font-medium text-[var(--text)]">Requis</span>
          <p className="text-xs text-[var(--text-muted)]">L'agent ne peut pas s'exécuter sans cette mémoire</p>
        </div>
        <button type="button" onClick={() => set('isRequired', !form.isRequired)} className={cn('w-10 h-6 rounded-full transition-all relative flex-shrink-0', form.isRequired ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}>
          <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all', form.isRequired ? 'left-[18px]' : 'left-0.5')} />
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors">Annuler</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60">
          {isLoading ? 'Création...' : 'Créer la liaison'}
        </button>
      </div>
    </form>
  )
}

// ─── FORBIDDEN RULE FORM ──────────────────────────────────────────────────────
interface ForbiddenRuleFormProps {
  initial?: Partial<ForbiddenRule>
  onSubmit: (data: Partial<ForbiddenRule>) => void
  onCancel: () => void
  isLoading?: boolean
}

function StringListField({
  label,
  hint,
  values,
  onChange,
  placeholder,
}: {
  label: string
  hint?: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')
  function add() {
    const v = draft.trim()
    if (!v) return
    onChange([...values, v])
    setDraft('')
  }
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-1.5">
        <input
          className={cn(inputCls, 'flex-1')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={add}
          className="flex-shrink-0 px-3 rounded-lg border border-[var(--border)] text-xs hover:bg-[var(--bg-subtle)] transition-colors"
        >
          + Ajouter
        </button>
      </div>
      {values.length > 0 && (
        <ul className="space-y-1 mt-2">
          {values.map((v, i) => (
            <li key={i} className="flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--bg-subtle)] text-xs">
              <span className="flex-1 text-[var(--text)] break-words">{v}</span>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                className="flex-shrink-0 text-[var(--text-subtle)] hover:text-red-500 transition-colors"
                title="Retirer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  )
}

export function ForbiddenRuleForm({ initial, onSubmit, onCancel, isLoading }: ForbiddenRuleFormProps) {
  const [form, setForm] = useState<Partial<ForbiddenRule>>({
    key: '', title: '', description: '', category: 'COMPOSITION', severity: 'MEDIUM',
    scope: 'GLOBAL', examples: [], correctionTips: [], negativePrompt: '', isActive: true, ...initial,
  })
  const isSystem = !!initial?.isSystem
  const set = (field: keyof ForbiddenRule, val: unknown) => setForm((f) => ({ ...f, [field]: val }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      {isSystem && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <span className="text-xs text-amber-700 dark:text-amber-400">
            Règle système — seuls description, conseils et negative prompt sont modifiables. Suppression désactivée.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Clé technique *" hint="UPPER_SNAKE_CASE — ex: FORBID_LOGO_DISTORTION">
          <input
            className={inputCls}
            value={form.key || ''}
            onChange={(e) => set('key', e.target.value.toUpperCase())}
            placeholder="FORBID_..."
            required
            disabled={isSystem}
          />
        </Field>
        <Field label="Titre lisible *">
          <input
            className={inputCls}
            value={form.title || ''}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Logo déformé"
            required
            disabled={isSystem}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          className={cn(inputCls, 'resize-none')}
          rows={3}
          value={form.description || ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Explication détaillée de l'interdiction…"
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Catégorie *">
          <select
            className={selectCls}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            disabled={isSystem}
          >
            {FORBIDDEN_RULE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Sévérité">
          <select
            className={selectCls}
            value={form.severity}
            onChange={(e) => set('severity', e.target.value)}
            disabled={isSystem}
          >
            {FORBIDDEN_RULE_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Portée">
          <select
            className={selectCls}
            value={form.scope}
            onChange={(e) => set('scope', e.target.value)}
            disabled={isSystem}
          >
            {FORBIDDEN_RULE_SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Negative prompt" hint="Phrase injectée dans le negative_prompt de M-PROMPT1">
        <textarea
          className={cn(inputCls, 'resize-none font-mono text-xs')}
          rows={2}
          value={form.negativePrompt || ''}
          onChange={(e) => set('negativePrompt', e.target.value)}
          placeholder="Éviter…"
        />
      </Field>

      <StringListField
        label="Exemples de mauvaises pratiques"
        values={form.examples || []}
        onChange={(v) => set('examples', v)}
        placeholder="Saisir un exemple et appuyer sur Entrée…"
      />

      <StringListField
        label="Conseils de correction"
        values={form.correctionTips || []}
        onChange={(v) => set('correctionTips', v)}
        placeholder="Saisir un conseil et appuyer sur Entrée…"
      />

      <JsonEditor
        label="Applique à (optionnel — JSON)"
        value={(form.appliesTo as Record<string, unknown>) || {}}
        onChange={(v) => set('appliesTo', v)}
        rows={4}
      />

      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-subtle)]">
        <div>
          <span className="text-sm font-medium text-[var(--text)]">Règle active</span>
          <p className="text-xs text-[var(--text-muted)]">Désactivée = ignorée par les agents IA</p>
        </div>
        <button
          type="button"
          onClick={() => set('isActive', !form.isActive)}
          className={cn('w-10 h-6 rounded-full transition-all relative flex-shrink-0', form.isActive ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}
        >
          <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all', form.isActive ? 'left-[18px]' : 'left-0.5')} />
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors">Annuler</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60">
          {isLoading ? 'Enregistrement...' : initial?.id ? 'Mettre à jour' : 'Créer la règle'}
        </button>
      </div>
    </form>
  )
}
