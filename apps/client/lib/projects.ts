import { apiFetch, apiUpload } from "./api"
import { getSessionToken } from "@/services/auth.service"
import type {
  Project,
  Travail,
  MemoryEntry,
  FileAsset,
  AgentRun,
  GeneratedPoster,
} from "@/types/project"

/**
 * Télécharge une affiche générée via l'endpoint API
 *   GET /api/travaux/:travailId/generated-posters/:posterId/download
 */
export async function downloadGeneratedPoster(
  travailId: string,
  posterId: string,
  opts: { format?: "png" | "jpg" | "pdf" | "webp"; width?: number; quality?: number } = {}
): Promise<void> {
  const params = new URLSearchParams()
  if (opts.format) params.set("format", opts.format)
  if (opts.width) params.set("width", String(opts.width))
  if (opts.quality) params.set("quality", String(opts.quality))
  const qs = params.toString()
  const url = `/api/travaux/${travailId}/generated-posters/${posterId}/download${qs ? `?${qs}` : ""}`

  const token = await getSessionToken()
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    throw new Error(`Téléchargement échoué (${response.status})`)
  }

  const blob = await response.blob()
  const disposition = response.headers.get("content-disposition") ?? ""
  const match = /filename="?([^";]+)"?/i.exec(disposition)
  const filename = match?.[1] ?? `poster-${posterId}.${opts.format ?? "jpg"}`

  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = objectUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

// ─── Projects (marque / client) ─────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects")
}

export async function fetchProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`)
}

export async function createProject(data: { title: string; brandDescription?: string }): Promise<Project> {
  return apiFetch<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateProject(
  id: string,
  data: Partial<{ title: string; brandDescription: string | null }>,
): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteProject(id: string): Promise<void> {
  return apiFetch<void>(`/api/projects/${id}`, { method: "DELETE" })
}

// ─── Travaux (livrables) ────────────────────────────────────────────────────

export async function fetchTravaux(projectId?: string): Promise<Travail[]> {
  const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""
  return apiFetch<Travail[]>(`/api/travaux${qs}`)
}

export async function fetchTravail(travailId: string): Promise<Travail & { messages?: Array<{ id: string; role: string; content: string; createdAt: string }> }> {
  return apiFetch(`/api/travaux/${travailId}`)
}

export async function createTravail(
  projectId: string,
  data: { title: string; posterType?: string; category?: string; format?: string; style?: string },
): Promise<Travail> {
  return apiFetch<Travail>(`/api/projects/${projectId}/travaux`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateTravail(
  travailId: string,
  data: Partial<{ title: string; posterType: string | null; category: string | null; format: string | null; style: string | null }>,
): Promise<Travail> {
  return apiFetch<Travail>(`/api/travaux/${travailId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteTravail(travailId: string): Promise<void> {
  return apiFetch<void>(`/api/travaux/${travailId}`, { method: "DELETE" })
}

// ─── Memories (travail-scoped) ──────────────────────────────────────────────

export async function fetchTravailMemories(travailId: string): Promise<MemoryEntry[]> {
  return apiFetch<MemoryEntry[]>(`/api/travaux/${travailId}/memories`)
}

export async function upsertTravailMemory(
  travailId: string,
  memoryKey: string,
  content: Record<string, unknown>,
): Promise<MemoryEntry> {
  try {
    return await apiFetch<MemoryEntry>(`/api/travaux/${travailId}/memories`, {
      method: "POST",
      body: JSON.stringify({ memoryKey, content }),
    })
  } catch {
    return apiFetch<MemoryEntry>(`/api/travaux/${travailId}/memories/${memoryKey}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    })
  }
}

export async function getTravailMemory(
  travailId: string,
  memoryKey: string,
): Promise<MemoryEntry | null> {
  try {
    return await apiFetch<MemoryEntry>(`/api/travaux/${travailId}/memories/${memoryKey}`)
  } catch {
    return null
  }
}

// Back-compat aliases used widely across the client UI.
export const fetchProjectMemories = fetchTravailMemories
export const upsertProjectMemory = upsertTravailMemory
export const getProjectMemory = getTravailMemory

// ─── Files ──────────────────────────────────────────────────────────────────

/**
 * Upload un fichier — par défaut rattaché au Project (assets de marque).
 * Passez `travailId` à la place pour rattacher au livrable courant uniquement.
 */
export async function uploadProjectFile(
  projectId: string,
  file: File,
  usageType: string,
  onProgress?: (pct: number) => void,
): Promise<FileAsset> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("usageType", usageType)
  return apiUpload<FileAsset>(`/api/projects/${projectId}/files/upload`, fd, onProgress)
}

export async function fetchProjectFiles(projectId: string): Promise<FileAsset[]> {
  return apiFetch<FileAsset[]>(`/api/projects/${projectId}/files`)
}

export async function deleteProjectFile(fileId: string): Promise<void> {
  return apiFetch<void>(`/api/files/${fileId}`, { method: "DELETE" })
}

export async function updateProjectFile(
  fileId: string,
  data: Partial<Pick<FileAsset, "usageType">>,
): Promise<FileAsset> {
  return apiFetch<FileAsset>(`/api/files/${fileId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

// ─── Orchestration (travail-scoped) ─────────────────────────────────────────

export interface OrchestrationResult {
  success: boolean
  message: string
  data: {
    ready_for_generation: boolean
    final_prompt?: string
    negative_prompt?: string
    agents_executed: string[]
    total_duration_ms: number
  }
}

export async function generateFinalPrompt(
  travailId: string,
  opts?: { force?: boolean },
): Promise<OrchestrationResult> {
  return apiFetch<OrchestrationResult>(`/api/travaux/${travailId}/generate-final-prompt`, {
    method: "POST",
    body: JSON.stringify(opts ?? {}),
  })
}

export async function fetchAgentRuns(travailId: string): Promise<AgentRun[]> {
  return apiFetch<AgentRun[]>(`/api/travaux/${travailId}/agent-runs`)
}

export async function runAgent(agentKey: string, travailId: string, input?: unknown): Promise<unknown> {
  return apiFetch(`/api/agents-dynamic/${agentKey}/run/${travailId}`, {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  })
}

// ─── Image generation ───────────────────────────────────────────────────────

export interface GenerateImagesResponse {
  travailId: string
  posters: GeneratedPoster[]
  durationMs: number
}

export async function generateImages(
  travailId: string,
  options?: { variations?: number; provider?: "mock" | "gemini" | "openai-image" },
): Promise<GenerateImagesResponse> {
  return apiFetch<GenerateImagesResponse>(`/api/travaux/${travailId}/generate-images`, {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  })
}

export async function fetchGeneratedPosters(travailId: string): Promise<GeneratedPoster[]> {
  return apiFetch<GeneratedPoster[]>(`/api/travaux/${travailId}/generated-posters`)
}

export async function deleteGeneratedPoster(travailId: string, posterId: string): Promise<void> {
  return apiFetch<void>(`/api/travaux/${travailId}/generated-posters/${posterId}`, {
    method: "DELETE",
  })
}

export interface ExtractedColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export async function extractColorsFromLogo(
  travailId: string,
  imageUrl: string,
): Promise<ExtractedColors> {
  const result = await apiFetch<{ success: boolean; data: { colors: ExtractedColors } }>(
    `/api/travaux/${travailId}/extract-colors`,
    { method: "POST", body: JSON.stringify({ imageUrl }) },
  )
  return result.data.colors
}
