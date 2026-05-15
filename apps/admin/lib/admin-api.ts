import { AdminStats } from '@/types/admin'
import { AdminUser, CreditTransaction } from '@/types/user'
import { AdminProject, FileAsset, GeneratedPoster, FinalPrompt } from '@/types/project'
import { AgentDefinition, AgentMemoryLink, AgentRunRecord } from '@/types/agent'
import { MemoryDefinition } from '@/types/memory'
import { Payment, ArtisticResource } from '@/types/payment'
import { ForbiddenRule, ForbiddenRulesFilters, ForbiddenRulesPaginated } from '@/types/forbidden-rule'
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

export async function updateArtisticResource(id: string, data: Partial<ArtisticResource>): Promise<ArtisticResource> {
  return apiFetch(`/api/admin/artistic-resources/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteArtisticResource(id: string): Promise<void> {
  return apiFetch(`/api/admin/artistic-resources/${id}`, { method: 'DELETE' })
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
export async function saveSettings(settings: { key: string; value: string }[]): Promise<AppSetting[]> {
  return apiFetch('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  })
}

/** Seed default setting keys (idempotent) */
export async function seedSettings(): Promise<{ created: number }> {
  return apiFetch('/api/admin/settings/seed', { method: 'POST', body: '{}' })
}
