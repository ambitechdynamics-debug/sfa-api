import { AdminStats, SubscriptionPlan } from '@/types/admin'
import { AdminUser, CreditTransaction } from '@/types/user'
import { AdminProject, FileAsset, GeneratedPoster, FinalPrompt } from '@/types/project'
import { AgentDefinition, AgentMemoryLink, AgentRunRecord } from '@/types/agent'
import { MemoryDefinition } from '@/types/memory'
import { Payment, ArtisticResource } from '@/types/payment'
import { ForbiddenRule, ForbiddenRulesFilters, ForbiddenRulesPaginated } from '@/types/forbidden-rule'
import { OrchestratorPipelineConfig, OrchestratorPipelinePayload } from '@/types/orchestrator'
import { clearSession, getToken } from './auth'
import { AdminApiError } from './api-error'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:5000' : '')
).replace(/\/+$/, '')

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

function notifyInvalidAuth() {
  if (typeof window === 'undefined') return
  clearSession()
  window.dispatchEvent(new Event('admin-auth-invalid'))
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new AdminApiError('URL API manquante. Configurez NEXT_PUBLIC_API_URL.', 0)
  }

  const token = await getToken()
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })
  } catch {
    throw new AdminApiError('API indisponible. Vérifiez que le serveur backend est lancé.', 0)
  }

  const data = await res.json().catch(() => ({} as ApiResponse<T>))
  if (!res.ok || !data.success) {
    const error = new AdminApiError(data.message || 'Erreur API', res.status)
    if (error.status === 401) notifyInvalidAuth()
    throw error
  }

  return data.data
}

// ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
export async function fetchSubscriptions(): Promise<SubscriptionPlan[]> {
  return apiFetch('/api/admin/subscriptions')
}

export async function updateSubscription(
  planId: string,
  data: Partial<Pick<SubscriptionPlan, 'price' | 'credits' | 'maxProjects'>>,
): Promise<SubscriptionPlan> {
  return apiFetch(`/api/admin/subscriptions/${planId}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function cancelSubscription(subscriptionId: string) {
  return apiFetch(`/api/admin/stripe/subscriptions/${subscriptionId}/cancel`, { method: 'POST' })
}

// ==========================================
// CREATION OPTIONS
// ==========================================

export async function fetchCreationOptions(includeInactive = true) {
  return apiFetch(`/api/creation-options?includeInactive=${includeInactive}`);
}

export async function createCreationOption(data: any) {
  return apiFetch('/api/creation-options', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCreationOption(id: string, data: any) {
  return apiFetch(`/api/creation-options/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCreationOption(id: string) {
  return apiFetch(`/api/creation-options/${id}`, {
    method: 'DELETE',
  });
}

// ─── STATS ────────────────────────────────────────────────────────────────────
export async function fetchStats(): Promise<AdminStats> {
  return apiFetch('/api/admin/stats')
}

export interface ChartDataPoint {
  date: string
  users: number
  generations: number
  revenue: number
  prompts: number
}

export async function fetchChartData(): Promise<ChartDataPoint[]> {
  return apiFetch('/api/admin/chart-data')
}

// ─── USERS ────────────────────────────────────────────────────────────────────
export async function fetchUsers(): Promise<AdminUser[]> {
  return apiFetch('/api/admin/users')
}

export async function updateUserCredits(userId: string, amount: number, reason: string): Promise<AdminUser> {
  return apiFetch(`/api/admin/users/${userId}/credits`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  })
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
export async function fetchProjects(): Promise<AdminProject[]> {
  return apiFetch('/api/admin/projects')
}

export async function deleteProject(id: string): Promise<void> {
  return apiFetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
}

export async function deleteUser(id: string): Promise<void> {
  return apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' })
}

// ─── AGENTS ───────────────────────────────────────────────────────────────────
export async function fetchAgents(): Promise<AgentDefinition[]> {
  return apiFetch('/api/admin/agent-definitions')
}

export async function createAgent(data: Partial<AgentDefinition>): Promise<AgentDefinition> {
  return apiFetch('/api/admin/agent-definitions', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateAgent(id: string, data: Partial<AgentDefinition>): Promise<AgentDefinition> {
  return apiFetch(`/api/admin/agent-definitions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteAgent(id: string): Promise<void> {
  return apiFetch(`/api/admin/agent-definitions/${id}`, { method: 'DELETE' })
}

// ─── MEMORIES ─────────────────────────────────────────────────────────────────
export async function fetchMemories(): Promise<MemoryDefinition[]> {
  return apiFetch('/api/admin/memory-definitions')
}

export async function createMemory(data: Partial<MemoryDefinition>): Promise<MemoryDefinition> {
  return apiFetch('/api/admin/memory-definitions', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateMemory(id: string, data: Partial<MemoryDefinition>): Promise<MemoryDefinition> {
  return apiFetch(`/api/admin/memory-definitions/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteMemory(id: string): Promise<void> {
  return apiFetch(`/api/admin/memory-definitions/${id}`, { method: 'DELETE' })
}

// ─── AGENT MEMORY LINKS ───────────────────────────────────────────────────────
export async function fetchAgentMemoryLinks(): Promise<AgentMemoryLink[]> {
  return apiFetch('/api/admin/agent-memory-links')
}

export async function createAgentMemoryLink(data: Partial<AgentMemoryLink>): Promise<AgentMemoryLink> {
  return apiFetch('/api/admin/agent-memory-links', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteAgentMemoryLink(id: string): Promise<void> {
  return apiFetch(`/api/admin/agent-memory-links/${id}`, { method: 'DELETE' })
}

// ─── ORCHESTRATOR PIPELINE ───────────────────────────────────────────────────
export async function fetchOrchestratorPipeline(): Promise<OrchestratorPipelinePayload> {
  return apiFetch('/api/admin/orchestrator-pipeline')
}

export async function saveOrchestratorPipeline(config: OrchestratorPipelineConfig): Promise<OrchestratorPipelinePayload> {
  return apiFetch('/api/admin/orchestrator-pipeline', {
    method: 'PUT',
    body: JSON.stringify(config),
  })
}

export async function resetOrchestratorPipeline(): Promise<OrchestratorPipelinePayload> {
  return apiFetch('/api/admin/orchestrator-pipeline/reset', {
    method: 'POST',
    body: '{}',
  })
}

// ─── ARTISTIC RESOURCES ───────────────────────────────────────────────────────
export async function fetchArtisticResources(): Promise<ArtisticResource[]> {
  // Backend returns { items, pagination } — extract the array
  const res = await apiFetch<{ items: ArtisticResource[]; pagination: unknown }>('/api/artistic-resources')
  return Array.isArray(res) ? res : (res as { items: ArtisticResource[] }).items ?? []
}

export async function createArtisticResource(data: Partial<ArtisticResource>): Promise<ArtisticResource> {
  return apiFetch('/api/admin/artistic-resources', { method: 'POST', body: JSON.stringify(data) })
}

/**
 * Upload an image file to Cloudinary via the backend.
 * Uses raw fetch (no Content-Type header) so the browser sets the multipart boundary.
 * Returns { url, publicId }.
 */
export async function uploadArtisticResourceImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; publicId: string }> {
  if (!API_URL) {
    throw new AdminApiError('URL API manquante. Configurez NEXT_PUBLIC_API_URL.', 0)
  }

  const formData = new FormData()
  formData.append('file', file)
  const token = await getToken()

  // Use XMLHttpRequest for upload progress support
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/api/admin/artistic-resources/upload-image`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as ApiResponse<{ url: string; publicId: string }>
        if (xhr.status >= 400 || !data.success) {
          if (xhr.status === 401) notifyInvalidAuth()
          return reject(new AdminApiError(data.message || 'Erreur upload', xhr.status))
        }
        resolve(data.data!)
      } catch {
        reject(new AdminApiError('Réponse invalide du serveur', xhr.status))
      }
    }

    xhr.onerror = () => reject(new AdminApiError('API indisponible.', 0))
    xhr.send(formData)
  })
}

export type BulkArtisticResourceFailure = {
  index: number
  fileName: string
  stage: 'upload' | 'analyze' | 'create' | 'duplicate'
  message: string
}

export type BulkArtisticResourcesResult = {
  created: ArtisticResource[]
  failed: BulkArtisticResourceFailure[]
}

export async function bulkUploadAnalyzeCreateArtisticResources(
  files: File[],
  providerId: string,
  model: string,
  onProgress?: (pct: number) => void,
): Promise<BulkArtisticResourcesResult> {
  if (!API_URL) {
    throw new AdminApiError('URL API manquante. Configurez NEXT_PUBLIC_API_URL.', 0)
  }

  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  formData.append('providerId', providerId)
  if (model.trim()) formData.append('model', model.trim())

  const token = await getToken()

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/api/admin/artistic-resources/bulk-upload-analyze-create`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as ApiResponse<BulkArtisticResourcesResult>
        if (xhr.status >= 400 || !data.success) {
          if (xhr.status === 401) notifyInvalidAuth()
          return reject(new AdminApiError(data.message || 'Erreur import multi-images', xhr.status))
        }
        resolve(data.data ?? { created: [], failed: [] })
      } catch {
        reject(new AdminApiError('Réponse invalide du serveur', xhr.status))
      }
    }

    xhr.onerror = () => reject(new AdminApiError('API indisponible.', 0))
    xhr.send(formData)
  })
}

export async function updateArtisticResource(id: string, data: Partial<ArtisticResource>): Promise<ArtisticResource> {
  return apiFetch(`/api/admin/artistic-resources/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteArtisticResource(id: string): Promise<void> {
  return apiFetch(`/api/admin/artistic-resources/${id}`, { method: 'DELETE' })
}

export async function analyzeArtisticResourceImage(
  resourceImage: string,
  providerId: string,
  model: string
): Promise<Partial<ArtisticResource>> {
  return apiFetch('/api/admin/artistic-resources/analyze-image', {
    method: 'POST',
    body: JSON.stringify({
      providerId,
      model,
      resourceImage,
      context: {
        module: 'artistic-base',
        action: 'analyze-resource-and-fill-fields',
      },
    }),
  })
}

// ─── FORBIDDEN RULES ──────────────────────────────────────────────────────────
function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return qs ? `?${qs}` : ''
}

export async function fetchForbiddenRules(filters: ForbiddenRulesFilters = {}): Promise<ForbiddenRulesPaginated> {
  return apiFetch(`/api/admin/forbidden-rules${buildQuery(filters as Record<string, string | number | boolean | undefined>)}`)
}

export async function fetchForbiddenRuleById(id: string): Promise<ForbiddenRule> {
  return apiFetch(`/api/admin/forbidden-rules/${id}`)
}

export async function createForbiddenRule(data: Partial<ForbiddenRule>): Promise<ForbiddenRule> {
  return apiFetch('/api/admin/forbidden-rules', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateForbiddenRule(id: string, data: Partial<ForbiddenRule>): Promise<ForbiddenRule> {
  return apiFetch(`/api/admin/forbidden-rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteForbiddenRule(id: string): Promise<void> {
  return apiFetch(`/api/admin/forbidden-rules/${id}`, { method: 'DELETE' })
}

export async function toggleForbiddenRule(id: string): Promise<ForbiddenRule> {
  return apiFetch(`/api/admin/forbidden-rules/${id}/toggle`, { method: 'POST' })
}

export async function syncForbiddenRulesToMemory(): Promise<{ definitionId: string; entryId: string | null; ruleCount: number }> {
  return apiFetch('/api/admin/forbidden-rules/sync-memory', { method: 'POST' })
}

export async function seedForbiddenRules(): Promise<{ created: number; skipped: number }> {
  return apiFetch('/api/admin/forbidden-rules/seed', { method: 'POST' })
}

export async function buildForbiddenNegativePrompt(): Promise<{ negative_prompt: string }> {
  return apiFetch('/api/forbidden-rules/negative-prompt')
}

// ─── GENERATED POSTERS ────────────────────────────────────────────────────────
export async function fetchGeneratedPosters(): Promise<GeneratedPoster[]> {
  return apiFetch('/api/admin/generated-posters')
}

export async function deleteGeneratedPoster(id: string): Promise<void> {
  return apiFetch(`/api/admin/generated-posters/${id}`, { method: 'DELETE' })
}

export async function updateGeneratedPoster(id: string, data: Partial<GeneratedPoster>): Promise<GeneratedPoster> {
  return apiFetch(`/api/admin/generated-posters/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

// ─── FILES ────────────────────────────────────────────────────────────────────
export async function fetchFiles(): Promise<FileAsset[]> {
  return apiFetch('/api/admin/files')
}

export async function deleteFile(id: string): Promise<void> {
  return apiFetch(`/api/admin/files/${id}`, { method: 'DELETE' })
}

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
export async function fetchPrompts(): Promise<FinalPrompt[]> {
  const entries = await apiFetch<FinalPrompt[]>('/api/admin/prompts')
  // Normalize: expose content fields at top level for convenience
  return entries.map((e) => ({
    ...e,
    finalPrompt: (e.content?.finalPrompt as string) ?? '',
    negativePrompt: (e.content?.negativePrompt as string) ?? undefined,
    qualityScore: (e.content?.qualityScore as number) ?? undefined,
    memoriesUsed: (e.content?.memoriesUsed as string[]) ?? undefined,
  }))
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
export async function fetchPayments(): Promise<Payment[]> {
  return apiFetch('/api/admin/payments')
}

export async function refundPayment(id: string): Promise<Payment> {
  return apiFetch(`/api/admin/payments/${id}/refund`, { method: 'POST' })
}

export async function verifyPayment(id: string): Promise<Payment> {
  return apiFetch(`/api/admin/payments/${id}/verify`, { method: 'POST' })
}

// ─── CREDITS ──────────────────────────────────────────────────────────────────
export async function fetchCreditTransactions(): Promise<CreditTransaction[]> {
  return apiFetch('/api/admin/credits')
}

// ─── AGENT RUNS ───────────────────────────────────────────────────────────────
export async function fetchAgentRuns(): Promise<AgentRunRecord[]> {
  return apiFetch('/api/admin/agent-runs')
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

export interface AppSetting {
  key:         string
  value:       string
  category:    string
  isSecret:    boolean
  description: string | null
  updatedAt:   string
}

export type SettingsByCategory = Record<string, AppSetting[]>

/** Fetch all settings grouped by category */
export async function fetchSettings(): Promise<SettingsByCategory> {
  return apiFetch('/api/admin/settings')
}

/** Fetch settings for a single category */
export async function fetchSettingsByCategory(category: string): Promise<AppSetting[]> {
  return apiFetch(`/api/admin/settings/category/${category}`)
}

/** Bulk save settings — only sends changed keys */
export async function saveSettings(settings: { key: string; value: string; category?: string; isSecret?: boolean }[]): Promise<AppSetting[]> {
  return apiFetch('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  })
}

/** Seed default setting keys (idempotent) */
export async function seedSettings(): Promise<{ created: number }> {
  return apiFetch('/api/admin/settings/seed', { method: 'POST', body: '{}' })
}

/** Bulk delete settings by key */
export async function deleteSettings(keys: string[]): Promise<void> {
  return apiFetch('/api/admin/settings/delete', {
    method: 'POST',
    body: JSON.stringify({ keys }),
  })
}

export type SettingSource = 'db' | 'env' | 'default' | 'missing'

export interface EffectiveSetting {
  key: string
  category: string
  isSecret: boolean
  description: string | null
  source: SettingSource
  envFallback: string | null
  dbValue: string
  envValue: string
  effective: string
}

/**
 * Fetch effective values + source (db/env/default/missing) for every AppSetting.
 * Useful to debug "why is my OpenAI key not working" — often an env var is
 * silently shadowing an empty DB value.
 */
export async function fetchEffectiveSettings(): Promise<EffectiveSetting[]> {
  return apiFetch('/api/admin/settings/effective')
}

// ─── CUSTOM AI PROVIDERS ───────────────────────────────────────────────────────

export interface CustomAIProviderSetting {
  id: string
  name: string
  type: 'openai-compatible' | 'anthropic-compatible' | 'gemini-compatible'
  apiKey: string
  baseUrl: string
  defaultModel: string
  isActive: boolean
  supportsText: boolean
  supportsVision: boolean
  supportsReasoning: boolean
  supportsImageGeneration: boolean
}

export async function fetchCustomProviders(): Promise<CustomAIProviderSetting[]> {
  try {
    const settings = await fetchSettingsByCategory('providers')
    const providers: CustomAIProviderSetting[] = []
    for (const s of settings) {
      const match = s.key.match(/^custom_(.+)_name$/)
      if (!match) continue
      const slug = match[1]
      const find = (field: string) => settings.find(x => x.key === `custom_${slug}_${field}`)?.value ?? ''
      
      const supportsTextVal = find('supports_text')
      const supportsText = supportsTextVal === 'true' || supportsTextVal === ''; // default true

      providers.push({
        id: slug,
        name: s.value,
        type: find('type') as CustomAIProviderSetting['type'],
        apiKey: find('api_key'),
        baseUrl: find('base_url'),
        defaultModel: find('default_model'),
        isActive: find('is_active') === 'true',
        supportsText,
        supportsVision: find('supports_vision') === 'true',
        supportsReasoning: find('supports_reasoning') === 'true',
        supportsImageGeneration: find('supports_image_generation') === 'true',
      })
    }
    return providers
  } catch {
    return []
  }
}

export interface ActiveAIProvider {
  id: string
  name: string
  isActive: boolean
  supportsText: boolean
  supportsVision: boolean
  supportsReasoning: boolean
  supportsImageGeneration: boolean
}

export async function fetchActiveProviders(): Promise<ActiveAIProvider[]> {
  try {
    const data = await fetchSettings()
    const allSettings = Object.values(data).flat()
    const providers: ActiveAIProvider[] = []

    const findVal = (key: string) => allSettings.find(x => x.key === key)?.value ?? ''

    // 1. Standard providers - active if API key is not empty
    const openaiKey = findVal('openai_api_key')
    if (openaiKey && openaiKey.trim() !== '') {
      providers.push({
        id: 'openai',
        name: 'OpenAI',
        isActive: true,
        supportsText: true,
        supportsVision: true,
        supportsReasoning: true,
        supportsImageGeneration: true
      })
    }

    const anthropicKey = findVal('anthropic_api_key')
    if (anthropicKey && anthropicKey.trim() !== '') {
      providers.push({
        id: 'anthropic',
        name: 'Anthropic',
        isActive: true,
        supportsText: true,
        supportsVision: true,
        supportsReasoning: false,
        supportsImageGeneration: false
      })
    }

    const geminiKey = findVal('gemini_api_key')
    if (geminiKey && geminiKey.trim() !== '') {
      providers.push({
        id: 'gemini',
        name: 'Google Gemini',
        isActive: true,
        supportsText: true,
        supportsVision: true,
        supportsReasoning: false,
        supportsImageGeneration: false
      })
    }

    // Always include mock provider for local simulation / testing
    providers.push({
      id: 'mock',
      name: 'Mock (simulation)',
      isActive: true,
      supportsText: true,
      supportsVision: true,
      supportsReasoning: false,
      supportsImageGeneration: false
    })

    // 2. Custom providers - active if custom_is_active setting is true
    for (const s of allSettings) {
      const match = s.key.match(/^custom_(.+)_name$/)
      if (!match) continue
      const slug = match[1]
      const activeVal = allSettings.find(x => x.key === `custom_${slug}_is_active`)?.value ?? 'false'
      if (activeVal === 'true') {
        const supportsTextVal = allSettings.find(x => x.key === `custom_${slug}_supports_text`)?.value ?? ''
        const supportsText = supportsTextVal === 'true' || supportsTextVal === ''; // default true

        providers.push({
          id: slug,
          name: s.value,
          isActive: true,
          supportsText,
          supportsVision: allSettings.find(x => x.key === `custom_${slug}_supports_vision`)?.value === 'true',
          supportsReasoning: allSettings.find(x => x.key === `custom_${slug}_supports_reasoning`)?.value === 'true',
          supportsImageGeneration: allSettings.find(x => x.key === `custom_${slug}_supports_image_generation`)?.value === 'true',
        })
      }
    }

    return providers
  } catch {
    // Fallback if settings loading fails
    return [
      { id: 'gemini', name: 'Gemini', isActive: true, supportsText: true, supportsVision: true, supportsReasoning: false, supportsImageGeneration: false },
      { id: 'anthropic', name: 'Anthropic', isActive: true, supportsText: true, supportsVision: true, supportsReasoning: false, supportsImageGeneration: false },
      { id: 'openai', name: 'OpenAI', isActive: true, supportsText: true, supportsVision: true, supportsReasoning: true, supportsImageGeneration: true },
      { id: 'mock', name: 'Mock (simulation)', isActive: true, supportsText: true, supportsVision: true, supportsReasoning: false, supportsImageGeneration: false }
    ]
  }
}

export interface LlmProvider {
  id: string
  name: string
  slug: string
  type: string
  baseUrl: string
  defaultModel: string
  enabled: boolean
  supportsText: boolean
  supportsVision: boolean
  supportsReasoning: boolean
  supportsImageGeneration: boolean
}

export async function fetchLlmProviders(): Promise<LlmProvider[]> {
  try {
    const data = await apiFetch<{ providers: LlmProvider[] }>('/api/admin/llm-providers', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    return data?.providers || []
  } catch {
    return []
  }
}
