'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Brain, Key, HardDrive, CreditCard, Shield, Wrench,
  Eye, EyeOff, Save, AlertTriangle, Check, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchSettings, saveSettings, AppSetting, SettingsByCategory } from '@/lib/admin-api'
import { toastSuccess, toastError, toastLoadError } from '@/lib/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'ia' | 'providers' | 'storage' | 'payment' | 'security' | 'maintenance'

// ─── Sub-components ───────────────────────────────────────────────────────────

function SaveButton({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {saving
        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : <Save className="w-4 h-4" />}
      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
    </button>
  )
}

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm animate-fade-up">
      <Check className="w-4 h-4" />
      Paramètres sauvegardés
    </div>
  )
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-[var(--border)] last:border-0">
      <div className="flex-1">
        <div className="text-sm font-medium text-[var(--text)]">{label}</div>
        {hint && <div className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</div>}
      </div>
      <div className="flex-1 max-w-xs">{children}</div>
    </div>
  )
}

function SkeletonField() {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-[var(--border)]">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-[var(--bg-subtle)] animate-skeleton" />
        <div className="h-3 w-56 rounded bg-[var(--bg-subtle)] animate-skeleton" />
      </div>
      <div className="flex-1 max-w-xs">
        <div className="h-9 rounded-lg bg-[var(--bg-subtle)] animate-skeleton" />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('ia')
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  // Flat map of all settings: key → current value (string)
  const [values, setValues] = useState<Record<string, string>>({})
  // Original data from API (for isSecret metadata)
  const [meta, setMeta] = useState<Record<string, AppSetting>>({})

  // ── Load all settings on mount ──────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const data: SettingsByCategory = await fetchSettings()
      const flat: Record<string, string> = {}
      const flatMeta: Record<string, AppSetting> = {}
      for (const items of Object.values(data)) {
        for (const s of items) {
          flat[s.key] = s.value
          flatMeta[s.key] = s
        }
      }
      setValues(flat)
      setMeta(flatMeta)
    } catch (err) {
      toastLoadError(err, 'Impossible de charger les paramètres')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const val = (key: string, fallback = '') => values[key] ?? fallback
  const boolVal = (key: string) => val(key) === 'true'

  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }))
  const toggle = (key: string) => set(key, boolVal(key) ? 'false' : 'true')

  // ── Save current tab ────────────────────────────────────────────────────────
  async function handleSave() {
    const tabKeys: Record<Tab, string[]> = {
      ia: ['credits_per_generation','credits_per_prompt','free_generations','free_prompts','default_model','timeout_ms','max_retries'],
      providers: ['openai_api_key','openai_model','anthropic_api_key','anthropic_model','gemini_api_key','gemini_model'],
      storage: ['storage_provider','max_file_size_mb','allowed_types','auto_compress','compression_quality'],
      payment: ['currency','mtn_enabled','mtn_number','airtel_enabled','airtel_number','stripe_enabled','stripe_secret_key','stripe_public_key'],
      security: ['jwt_expiry_hours','max_login_attempts','lockout_minutes','require_email_verification','allowed_origins'],
      maintenance: ['maintenance_mode','maintenance_message'],
    }

    const payload = tabKeys[tab]
      .map((key) => ({ key, value: values[key] ?? '' }))

    setSaving(true)
    try {
      await saveSettings(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      toastSuccess('Paramètres sauvegardés avec succès')
      // Reload to get freshly masked secrets
      await loadSettings()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'ia',          label: 'IA',          icon: Brain },
    { id: 'providers',   label: 'Providers',   icon: Key },
    { id: 'storage',     label: 'Stockage',    icon: HardDrive },
    { id: 'payment',     label: 'Paiement',    icon: CreditCard },
    { id: 'security',    label: 'Sécurité',    icon: Shield },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  ]

  const INPUT_CLS = 'w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]'
  const MONO_INPUT_CLS = `${INPUT_CLS} font-mono`

  const PROVIDERS = [
    { name: 'OpenAI',        key: 'openai',    color: 'bg-emerald-500', keyField: 'openai_api_key',    modelField: 'openai_model' },
    { name: 'Anthropic',     key: 'anthropic', color: 'bg-orange-500',  keyField: 'anthropic_api_key', modelField: 'anthropic_model' },
    { name: 'Google Gemini', key: 'gemini',    color: 'bg-blue-500',    keyField: 'gemini_api_key',    modelField: 'gemini_model' },
  ]

  return (
    <div className="space-y-5 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Paramètres</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Configuration de la plateforme — persistée en base</p>
        </div>
        <button
          onClick={loadSettings}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              tab === id
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)]'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">

        {/* ── IA ────────────────────────────────────────────────────────────── */}
        {tab === 'ia' && (
          <div className="space-y-0">
            <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Configuration IA</h3>
            {isLoading ? Array.from({ length: 7 }).map((_, i) => <SkeletonField key={i} />) : (
              <>
                <FieldGroup label="Crédits par génération" hint="Crédits déduits par affiche générée">
                  <input type="number" value={val('credits_per_generation', '10')} onChange={(e) => set('credits_per_generation', e.target.value)} className={INPUT_CLS} />
                </FieldGroup>
                <FieldGroup label="Crédits par prompt" hint="Crédits déduits par génération de prompt">
                  <input type="number" value={val('credits_per_prompt', '2')} onChange={(e) => set('credits_per_prompt', e.target.value)} className={INPUT_CLS} />
                </FieldGroup>
                <FieldGroup label="Générations gratuites" hint="Offertes aux nouveaux utilisateurs">
                  <input type="number" value={val('free_generations', '3')} onChange={(e) => set('free_generations', e.target.value)} className={INPUT_CLS} />
                </FieldGroup>
                <FieldGroup label="Prompts gratuits" hint="Prompts gratuits à l'inscription">
                  <input type="number" value={val('free_prompts', '5')} onChange={(e) => set('free_prompts', e.target.value)} className={INPUT_CLS} />
                </FieldGroup>
                <FieldGroup label="Modèle par défaut" hint="Modèle utilisé si aucun agent n'est spécifié">
                  <select value={val('default_model', 'gpt-4o')} onChange={(e) => set('default_model', e.target.value)} className={INPUT_CLS}>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  </select>
                </FieldGroup>
                <FieldGroup label="Timeout (ms)" hint="Délai maximum avant échec d'une requête IA">
                  <input type="number" value={val('timeout_ms', '30000')} onChange={(e) => set('timeout_ms', e.target.value)} className={INPUT_CLS} />
                </FieldGroup>
                <FieldGroup label="Tentatives max" hint="Réessais automatiques en cas d'erreur">
                  <input type="number" value={val('max_retries', '3')} onChange={(e) => set('max_retries', e.target.value)} className={INPUT_CLS} />
                </FieldGroup>
              </>
            )}
            <div className="flex items-center justify-between pt-5">
              <SavedBadge show={saved} />
              <div className="ml-auto"><SaveButton onSave={handleSave} saving={saving} /></div>
            </div>
          </div>
        )}

        {/* ── PROVIDERS ─────────────────────────────────────────────────────── */}
        {tab === 'providers' && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-[var(--text)]">Clés API Providers</h3>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border border-[var(--border)] rounded-xl space-y-3">
                    <div className="h-4 w-24 rounded bg-[var(--bg-subtle)] animate-skeleton" />
                    <div className="h-9 rounded-lg bg-[var(--bg-subtle)] animate-skeleton" />
                    <div className="h-9 rounded-lg bg-[var(--bg-subtle)] animate-skeleton" />
                  </div>
                ))
              : PROVIDERS.map((p) => {
                  const hasKey = val(p.keyField) && !val(p.keyField).includes('••')
                  const isMasked = val(p.keyField).includes('••')
                  return (
                    <div key={p.key} className="p-4 border border-[var(--border)] rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2.5 h-2.5 rounded-full', p.color)} />
                        <span className="text-sm font-semibold text-[var(--text)]">{p.name}</span>
                        {(hasKey || isMasked) && (
                          <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                            Configuré
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-[var(--text-muted)]">Clé API</label>
                        <div className="relative">
                          <input
                            type={showKeys[p.keyField] ? 'text' : 'password'}
                            value={val(p.keyField)}
                            onChange={(e) => set(p.keyField, e.target.value)}
                            placeholder={p.key === 'openai' ? 'sk-...' : p.key === 'anthropic' ? 'sk-ant-...' : 'AIza...'}
                            className={cn(MONO_INPUT_CLS, 'pr-10')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKeys((s) => ({ ...s, [p.keyField]: !s[p.keyField] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                          >
                            {showKeys[p.keyField] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {isMasked && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            La clé est masquée. Saisissez une nouvelle valeur pour la remplacer.
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-[var(--text-muted)]">Modèle par défaut</label>
                        <input
                          type="text"
                          value={val(p.modelField)}
                          onChange={(e) => set(p.modelField, e.target.value)}
                          className={MONO_INPUT_CLS}
                        />
                      </div>
                    </div>
                  )
                })
            }
            <div className="flex items-center justify-between pt-2">
              <SavedBadge show={saved} />
              <div className="ml-auto"><SaveButton onSave={handleSave} saving={saving} /></div>
            </div>
          </div>
        )}

        {/* ── STORAGE ───────────────────────────────────────────────────────── */}
        {tab === 'storage' && (
          <div className="space-y-0">
            <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Configuration Stockage</h3>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonField key={i} />) : (
              <>
                <FieldGroup label="Provider" hint="Service de stockage des fichiers">
                  <select value={val('storage_provider', 'cloudinary')} onChange={(e) => set('storage_provider', e.target.value)} className={INPUT_CLS}>
                    <option value="cloudinary">Cloudinary</option>
                    <option value="aws-s3">AWS S3</option>
                    <option value="local">Local (dev seulement)</option>
                  </select>
                </FieldGroup>
                <FieldGroup label="Taille max (MB)" hint="Limite de taille par fichier uploadé">
                  <input type="number" value={val('max_file_size_mb', '10')} onChange={(e) => set('max_file_size_mb', e.target.value)} className={INPUT_CLS} />
                </FieldGroup>
                <FieldGroup label="Types autorisés" hint="MIME types acceptés (séparés par virgule)">
                  <input type="text" value={val('allowed_types')} onChange={(e) => set('allowed_types', e.target.value)} className={MONO_INPUT_CLS} />
                </FieldGroup>
                <FieldGroup label="Compression auto" hint="Compresser automatiquement les images à l'upload">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggle('auto_compress')}
                      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', boolVal('auto_compress') ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}
                    >
                      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', boolVal('auto_compress') ? 'translate-x-4' : 'translate-x-0.5')} />
                    </button>
                    <span className="text-sm text-[var(--text-muted)]">{boolVal('auto_compress') ? 'Activée' : 'Désactivée'}</span>
                  </div>
                </FieldGroup>
                {boolVal('auto_compress') && (
                  <FieldGroup label="Qualité compression" hint="De 1 (faible) à 100 (max)">
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="1" max="100"
                        value={val('compression_quality', '85')}
                        onChange={(e) => set('compression_quality', e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono text-[var(--text-muted)] w-8">{val('compression_quality', '85')}</span>
                    </div>
                  </FieldGroup>
                )}
              </>
            )}
            <div className="flex items-center justify-between pt-5">
              <SavedBadge show={saved} />
              <div className="ml-auto"><SaveButton onSave={handleSave} saving={saving} /></div>
            </div>
          </div>
        )}

        {/* ── PAYMENT ───────────────────────────────────────────────────────── */}
        {tab === 'payment' && (
          <div className="space-y-0">
            <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Configuration Paiement</h3>
            {isLoading ? Array.from({ length: 6 }).map((_, i) => <SkeletonField key={i} />) : (
              <>
                <FieldGroup label="Devise" hint="Devise utilisée pour les transactions">
                  <select value={val('currency', 'XOF')} onChange={(e) => set('currency', e.target.value)} className={INPUT_CLS}>
                    <option value="XOF">XOF (FCFA)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </FieldGroup>

                {/* MTN */}
                <div className="py-4 border-b border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[var(--text)]">MTN Mobile Money</div>
                      <div className="text-xs text-[var(--text-muted)]">Paiement via MTN MoMo</div>
                    </div>
                    <button onClick={() => toggle('mtn_enabled')} className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', boolVal('mtn_enabled') ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}>
                      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', boolVal('mtn_enabled') ? 'translate-x-4' : 'translate-x-0.5')} />
                    </button>
                  </div>
                  {boolVal('mtn_enabled') && (
                    <input type="text" value={val('mtn_number')} onChange={(e) => set('mtn_number', e.target.value)} placeholder="Numéro MTN marchand" className={cn(INPUT_CLS, 'mt-3 max-w-xs')} />
                  )}
                </div>

                {/* Airtel */}
                <div className="py-4 border-b border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[var(--text)]">Airtel Money</div>
                      <div className="text-xs text-[var(--text-muted)]">Paiement via Airtel Money</div>
                    </div>
                    <button onClick={() => toggle('airtel_enabled')} className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', boolVal('airtel_enabled') ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}>
                      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', boolVal('airtel_enabled') ? 'translate-x-4' : 'translate-x-0.5')} />
                    </button>
                  </div>
                  {boolVal('airtel_enabled') && (
                    <input type="text" value={val('airtel_number')} onChange={(e) => set('airtel_number', e.target.value)} placeholder="Numéro Airtel marchand" className={cn(INPUT_CLS, 'mt-3 max-w-xs')} />
                  )}
                </div>

                {/* Stripe */}
                <div className="py-4 border-b border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[var(--text)]">Stripe</div>
                      <div className="text-xs text-[var(--text-muted)]">Paiement par carte bancaire</div>
                    </div>
                    <button onClick={() => toggle('stripe_enabled')} className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', boolVal('stripe_enabled') ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}>
                      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', boolVal('stripe_enabled') ? 'translate-x-4' : 'translate-x-0.5')} />
                    </button>
                  </div>
                  {boolVal('stripe_enabled') && (
                    <div className="mt-3 space-y-2 max-w-xs">
                      <div className="relative">
                        <input
                          type={showKeys['stripe_secret_key'] ? 'text' : 'password'}
                          value={val('stripe_secret_key')}
                          onChange={(e) => set('stripe_secret_key', e.target.value)}
                          placeholder="sk_live_..."
                          className={cn(MONO_INPUT_CLS, 'pr-10')}
                        />
                        <button type="button" onClick={() => setShowKeys((s) => ({ ...s, stripe_secret_key: !s.stripe_secret_key }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                          {showKeys['stripe_secret_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <input type="text" value={val('stripe_public_key')} onChange={(e) => set('stripe_public_key', e.target.value)} placeholder="pk_live_..." className={MONO_INPUT_CLS} />
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="flex items-center justify-between pt-5">
              <SavedBadge show={saved} />
              <div className="ml-auto"><SaveButton onSave={handleSave} saving={saving} /></div>
            </div>
          </div>
        )}

        {/* ── SECURITY ──────────────────────────────────────────────────────── */}
        {tab === 'security' && (
          <div className="space-y-0">
            <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Configuration Sécurité</h3>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonField key={i} />) : (
              <>
                <FieldGroup label="Expiration JWT (h)" hint="Durée de validité des tokens d'authentification">
                  <input type="number" value={val('jwt_expiry_hours', '24')} onChange={(e) => set('jwt_expiry_hours', e.target.value)} className={INPUT_CLS} />
                </FieldGroup>
                <FieldGroup label="Tentatives de login max" hint="Nombre d'échecs avant verrouillage du compte">
                  <input type="number" value={val('max_login_attempts', '5')} onChange={(e) => set('max_login_attempts', e.target.value)} className={INPUT_CLS} />
                </FieldGroup>
                <FieldGroup label="Durée verrouillage (min)" hint="Durée avant que le compte soit débloqué">
                  <input type="number" value={val('lockout_minutes', '30')} onChange={(e) => set('lockout_minutes', e.target.value)} className={INPUT_CLS} />
                </FieldGroup>
                <FieldGroup label="Vérification email" hint="Exiger la confirmation par email à l'inscription">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggle('require_email_verification')} className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', boolVal('require_email_verification') ? 'bg-[var(--accent)]' : 'bg-[var(--border)]')}>
                      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', boolVal('require_email_verification') ? 'translate-x-4' : 'translate-x-0.5')} />
                    </button>
                    <span className="text-sm text-[var(--text-muted)]">{boolVal('require_email_verification') ? 'Activée' : 'Désactivée'}</span>
                  </div>
                </FieldGroup>
                <FieldGroup label="Origines autorisées (CORS)" hint="URLs autorisées à appeler l'API (séparées par virgule)">
                  <textarea
                    value={val('allowed_origins')}
                    onChange={(e) => set('allowed_origins', e.target.value)}
                    rows={3}
                    className={cn(INPUT_CLS, 'font-mono resize-none')}
                  />
                </FieldGroup>
              </>
            )}
            <div className="flex items-center justify-between pt-5">
              <SavedBadge show={saved} />
              <div className="ml-auto"><SaveButton onSave={handleSave} saving={saving} /></div>
            </div>
          </div>
        )}

        {/* ── MAINTENANCE ───────────────────────────────────────────────────── */}
        {tab === 'maintenance' && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-[var(--text)]">Mode Maintenance</h3>

            {isLoading ? (
              <div className="h-24 rounded-xl bg-[var(--bg-subtle)] animate-skeleton" />
            ) : (
              <div className={cn(
                'p-4 rounded-xl border-2 transition-all',
                boolVal('maintenance_mode')
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                  : 'border-[var(--border)] bg-[var(--bg-subtle)]'
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn('p-2 rounded-lg', boolVal('maintenance_mode') ? 'bg-red-100 dark:bg-red-900/40' : 'bg-[var(--surface)]')}>
                    <Wrench className={cn('w-5 h-5', boolVal('maintenance_mode') ? 'text-red-600' : 'text-[var(--text-muted)]')} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text)]">Mode maintenance</div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                          {boolVal('maintenance_mode') ? 'La plateforme est inaccessible aux utilisateurs' : 'La plateforme est accessible normalement'}
                        </div>
                      </div>
                      <button
                        onClick={() => toggle('maintenance_mode')}
                        className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', boolVal('maintenance_mode') ? 'bg-red-500' : 'bg-[var(--border)]')}
                      >
                        <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', boolVal('maintenance_mode') ? 'translate-x-6' : 'translate-x-1')} />
                      </button>
                    </div>
                  </div>
                </div>

                {boolVal('maintenance_mode') && (
                  <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-red-700 dark:text-red-300">
                      <strong>Attention :</strong> Le mode maintenance est actif. Tous les utilisateurs voient une page d'indisponibilité.
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isLoading && (
              <FieldGroup label="Message de maintenance" hint="Texte affiché aux utilisateurs pendant la maintenance">
                <textarea
                  value={val('maintenance_message')}
                  onChange={(e) => set('maintenance_message', e.target.value)}
                  rows={3}
                  className={cn(INPUT_CLS, 'resize-none')}
                />
              </FieldGroup>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions de maintenance</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Vider le cache IA',              desc: 'Supprime les réponses cached des agents',          color: 'text-amber-600',  bg: 'hover:bg-[var(--icon-amber)]' },
                  { label: 'Nettoyer les fichiers temporaires', desc: 'Supprime les uploads non liés à un projet',     color: 'text-blue-600',   bg: 'hover:bg-[var(--icon-blue)]' },
                  { label: 'Réindexer la base artistique',   desc: 'Reconstruit les métadonnées des ressources',       color: 'text-violet-600', bg: 'hover:bg-[var(--icon-violet)]' },
                  { label: 'Forcer déconnexion sessions',    desc: 'Invalide tous les tokens JWT actifs',              color: 'text-red-600',    bg: 'hover:bg-[var(--icon-red)]' },
                ].map(({ label, desc, color, bg }) => (
                  <button key={label} className={cn('flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] text-left transition-colors', bg)}>
                    <div className="flex-1">
                      <div className={cn('text-sm font-medium', color)}>{label}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <SavedBadge show={saved} />
              <div className="ml-auto"><SaveButton onSave={handleSave} saving={saving} /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
