'use client'

import { useEffect, useMemo, useState } from 'react'
import { Ban, Plus, Pencil, Trash2, Power, RefreshCw, Sparkles, AlertTriangle, CheckCircle2, Search, Copy, Check } from 'lucide-react'
import { Drawer } from '@/components/admin/Drawer'
import { ForbiddenRuleForm } from '@/components/admin/Forms'
import { ConfirmDeleteModal } from '@/components/admin/Modals'
import {
  fetchForbiddenRules,
  createForbiddenRule,
  updateForbiddenRule,
  deleteForbiddenRule,
  toggleForbiddenRule,
  syncForbiddenRulesToMemory,
  buildForbiddenNegativePrompt,
} from '@/lib/admin-api'
import {
  ForbiddenRule,
  ForbiddenRuleCategory,
  ForbiddenRuleSeverity,
  ForbiddenRulesFilters,
  FORBIDDEN_RULE_CATEGORIES,
  FORBIDDEN_RULE_SEVERITIES,
} from '@/types/forbidden-rule'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'
import { cn } from '@/lib/utils'

// ─── Badge styles ─────────────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<ForbiddenRuleSeverity, string> = {
  LOW:      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  HIGH:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const CATEGORY_STYLE: Record<ForbiddenRuleCategory, string> = {
  TYPOGRAPHY:     'bg-violet-100 text-violet-700',
  COLORS:         'bg-pink-100 text-pink-700',
  COMPOSITION:    'bg-blue-100 text-blue-700',
  LOGO:           'bg-emerald-100 text-emerald-700',
  IMAGE_QUALITY:  'bg-cyan-100 text-cyan-700',
  TEXT_CONTENT:   'bg-indigo-100 text-indigo-700',
  BRAND_IDENTITY: 'bg-fuchsia-100 text-fuchsia-700',
  CONTACT_INFO:   'bg-teal-100 text-teal-700',
  EFFECTS:        'bg-purple-100 text-purple-700',
  TEXTURES:       'bg-amber-100 text-amber-700',
  SOCIAL_MEDIA:   'bg-sky-100 text-sky-700',
  PRINT:          'bg-lime-100 text-lime-700',
  AI_GENERATION:  'bg-rose-100 text-rose-700',
  LEGAL_SECURITY: 'bg-red-100 text-red-700',
  OTHER:          'bg-gray-100 text-gray-700',
}

export default function ForbiddenRulesPage() {
  const [rules, setRules] = useState<ForbiddenRule[]>([])
  const [filters, setFilters] = useState<ForbiddenRulesFilters>({ q: '', category: '', severity: '', isActive: '', page: 1, limit: 50 })
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRule, setEditRule] = useState<ForbiddenRule | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewText, setPreviewText] = useState('')
  const [previewCopied, setPreviewCopied] = useState(false)

  async function load() {
    setIsLoading(true)
    try {
      const res = await fetchForbiddenRules(filters)
      setRules(res.items)
    } catch (e) {
      toastLoadError(e, 'Impossible de charger les règles')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filters.q, filters.category, filters.severity, filters.isActive])

  // Stats — based on currently loaded list
  const stats = useMemo(() => ({
    total: rules.length,
    active: rules.filter((r) => r.isActive).length,
    critical: rules.filter((r) => r.severity === 'CRITICAL' && r.isActive).length,
    system: rules.filter((r) => r.isSystem).length,
  }), [rules])

  async function handleSave(data: Partial<ForbiddenRule>) {
    setSaving(true)
    try {
      // Strip read-only / server-only fields before sending
      const payload = { ...data }
      delete (payload as Record<string, unknown>).id
      delete (payload as Record<string, unknown>).isSystem
      delete (payload as Record<string, unknown>).createdAt
      delete (payload as Record<string, unknown>).updatedAt
      delete (payload as Record<string, unknown>).createdById

      if (editRule?.id) {
        const updated = await updateForbiddenRule(editRule.id, payload)
        setRules((prev) => prev.map((r) => r.id === editRule.id ? updated : r))
        toastSuccess('Règle mise à jour')
      } else {
        const created = await createForbiddenRule(payload)
        setRules((prev) => [created, ...prev])
        toastSuccess('Règle créée')
      }
      setDrawerOpen(false); setEditRule(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la sauvegarde'
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(rule: ForbiddenRule) {
    try {
      const updated = await toggleForbiddenRule(rule.id)
      setRules((prev) => prev.map((r) => r.id === rule.id ? updated : r))
      toastSuccess(updated.isActive ? 'Règle activée' : 'Règle désactivée')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      toastError(msg)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const result = await syncForbiddenRulesToMemory()
      toastSuccess(`${result.ruleCount} règles synchronisées vers M-INTERDITS`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur de synchronisation'
      toastError(msg)
    } finally {
      setSyncing(false)
    }
  }

  async function handlePreview() {
    try {
      const { negative_prompt } = await buildForbiddenNegativePrompt()
      setPreviewText(negative_prompt)
      setPreviewOpen(true)
      setPreviewCopied(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      toastError(msg)
    }
  }

  function copyPreview() {
    navigator.clipboard.writeText(previewText)
    setPreviewCopied(true)
    setTimeout(() => setPreviewCopied(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Éléments interdits</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Règles utilisées par les agents IA pour éviter les générations de mauvaise qualité
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Aperçu negative prompt
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-60"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} /> Sync M-INTERDITS
          </button>
          <button
            onClick={() => { setEditRule(null); setDrawerOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="w-4 h-4" /> Ajouter règle
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-xs text-[var(--text-muted)]">Total</div>
          <div className="text-2xl font-bold text-[var(--text)] mt-1">{stats.total}</div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]"><CheckCircle2 className="w-3 h-3 text-emerald-500" />Actives</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]"><AlertTriangle className="w-3 h-3 text-red-500" />Critiques actives</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">Système</div>
          <div className="text-2xl font-bold text-[var(--text)] mt-1">{stats.system}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            value={filters.q || ''}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))}
            placeholder="Rechercher par titre, clé, description…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
          />
        </div>
        <select
          value={filters.category || ''}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value as ForbiddenRuleCategory | '', page: 1 }))}
          className="border border-[var(--border)] rounded-lg px-3 py-2 text-xs bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] min-w-[140px]"
        >
          <option value="">Toutes catégories</option>
          {FORBIDDEN_RULE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filters.severity || ''}
          onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value as ForbiddenRuleSeverity | '', page: 1 }))}
          className="border border-[var(--border)] rounded-lg px-3 py-2 text-xs bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] min-w-[140px]"
        >
          <option value="">Toutes sévérités</option>
          {FORBIDDEN_RULE_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filters.isActive ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, isActive: e.target.value as 'true' | 'false' | '', page: 1 }))}
          className="border border-[var(--border)] rounded-lg px-3 py-2 text-xs bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] min-w-[140px]"
        >
          <option value="">Tous statuts</option>
          <option value="true">Actives</option>
          <option value="false">Inactives</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--surface)] border border-[var(--border)] rounded-xl animate-skeleton" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl py-16 text-center">
          <Ban className="w-8 h-8 text-[var(--text-subtle)] mx-auto mb-2" />
          <p className="text-sm text-[var(--text-muted)]">Aucune règle trouvée</p>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Règle</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Catégorie</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sévérité</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Negative prompt</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actif</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--text)] truncate">{rule.title}</span>
                          {rule.isSystem && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">SYS</span>
                          )}
                        </div>
                        <code className="text-[10px] text-[var(--text-subtle)] font-mono">{rule.key}</code>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', CATEGORY_STYLE[rule.category])}>
                      {rule.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', SEVERITY_STYLE[rule.severity])}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="text-xs text-[var(--text-muted)] truncate" title={rule.negativePrompt || ''}>
                      {rule.negativePrompt || <span className="italic text-[var(--text-subtle)]">—</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(rule)}
                      className={cn('inline-flex items-center justify-center w-9 h-5 rounded-full transition-colors relative', rule.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600')}
                      title={rule.isActive ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                    >
                      <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all', rule.isActive ? 'left-[18px]' : 'left-0.5')} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditRule(rule); setDrawerOpen(true) }}
                        className="p-1.5 rounded-md hover:bg-[var(--surface)] transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </button>
                      <button
                        onClick={() => handleToggle(rule)}
                        className="p-1.5 rounded-md hover:bg-[var(--surface)] transition-colors"
                        title="Activer/désactiver"
                      >
                        <Power className={cn('w-3.5 h-3.5', rule.isActive ? 'text-emerald-500' : 'text-[var(--text-subtle)]')} />
                      </button>
                      <button
                        onClick={() => setDeleteId(rule.id)}
                        disabled={rule.isSystem}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={rule.isSystem ? 'Règle système — non supprimable' : 'Supprimer'}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer form */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditRule(null) }}
        title={editRule ? 'Modifier la règle' : 'Nouvelle règle interdite'}
      >
        <ForbiddenRuleForm
          initial={editRule || undefined}
          onSubmit={handleSave}
          onCancel={() => { setDrawerOpen(false); setEditRule(null) }}
          isLoading={saving}
        />
      </Drawer>

      {/* Confirm delete */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await deleteForbiddenRule(deleteId!)
            setRules((prev) => prev.filter((r) => r.id !== deleteId))
            toastSuccess('Règle supprimée')
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Erreur de suppression'
            toastError(msg)
          }
          setDeleteId(null)
        }}
        description="Cette règle interdite sera supprimée définitivement. Les agents IA cesseront de l'utiliser."
      />

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-up" onClick={() => setPreviewOpen(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">Aperçu negative_prompt généré</h3>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">×</button>
            </div>
            <div className="p-4">
              <p className="text-xs text-[var(--text-muted)] mb-2">
                Phrase synthétisée à partir de toutes les règles actives — utilisée par Prompt Architect Agent et Quality Agent.
              </p>
              <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] p-3 font-mono text-xs text-[var(--text)] max-h-[60vh] overflow-y-auto whitespace-pre-wrap">
                {previewText || <span className="italic text-[var(--text-subtle)]">Aucun texte (aucune règle active avec negativePrompt)</span>}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={copyPreview}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  {previewCopied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copié</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
