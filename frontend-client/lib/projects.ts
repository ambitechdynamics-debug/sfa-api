import { apiFetch, apiUpload } from "./api"
import type { Project, MemoryEntry, FileAsset, AgentRun, GeneratedPoster } from "@/types/project"

export async function fetchProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects")
}

export async function fetchProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`)
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  return apiFetch<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteProject(id: string): Promise<void> {
  return apiFetch<void>(`/api/projects/${id}`, { method: "DELETE" })
}

// ─── Memories ────────────────────────────────────────────────────────────────
export async function fetchProjectMemories(projectId: string): Promise<MemoryEntry[]> {
  return apiFetch<MemoryEntry[]>(`/api/projects/${projectId}/memories`)
}

export async function upsertProjectMemory(
  projectId: string,
  memoryKey: string,
  content: Record<string, unknown>,
): Promise<MemoryEntry> {
  // Try create first, fallback to update on 409
  try {
    return await apiFetch<MemoryEntry>(`/api/projects/${projectId}/memories`, {
      method: "POST",
      body: JSON.stringify({ memoryKey, content }),
    })
  } catch (e) {
    // Already exists → patch instead
    return apiFetch<MemoryEntry>(`/api/projects/${projectId}/memories/${memoryKey}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    })
  }
}

export async function getProjectMemory(
  projectId: string,
  memoryKey: string,
): Promise<MemoryEntry | null> {
  try {
    return await apiFetch<MemoryEntry>(`/api/projects/${projectId}/memories/${memoryKey}`)
  } catch {
    return null
  }
}

// ─── Files ───────────────────────────────────────────────────────────────────
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

// ─── Generation orchestration ────────────────────────────────────────────────
export async function generateFinalPrompt(projectId: string): Promise<unknown> {
  return apiFetch(`/api/projects/${projectId}/generate-final-prompt`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export async function fetchAgentRuns(projectId: string): Promise<AgentRun[]> {
  return apiFetch<AgentRun[]>(`/api/projects/${projectId}/agent-runs`)
}

export async function runAgent(agentKey: string, projectId: string, input?: unknown): Promise<unknown> {
  return apiFetch(`/api/agents-dynamic/${agentKey}/run/${projectId}`, {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  })
}

// ─── Image generation (Nano Banana / Gemini Image) ──────────────────────────

export interface GenerateImagesResponse {
  projectId: string
  posters: GeneratedPoster[]
  durationMs: number
}

/**
 * Trigger N image generations for a project. The project must have M-PROMPT1
 * persisted (i.e. the orchestrator must have run first).
 */
export async function generateImages(
  projectId: string,
  options?: { variations?: number; provider?: "mock" | "gemini" | "openai-image" },
): Promise<GenerateImagesResponse> {
  return apiFetch<GenerateImagesResponse>(`/api/projects/${projectId}/generate-images`, {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  })
}

/**
 * List all already-generated posters for a project.
 */
export async function fetchGeneratedPosters(projectId: string): Promise<GeneratedPoster[]> {
  return apiFetch<GeneratedPoster[]>(`/api/projects/${projectId}/generated-posters`)
}
