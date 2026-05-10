export type ProjectStatus =
  | "DRAFT"
  | "QUESTIONING"
  | "ANALYZING"
  | "READY_FOR_PROMPT"
  | "PROMPT_READY"
  | "GENERATING"
  | "GENERATED"
  | "FAILED"

export interface Project {
  id: string
  userId: string
  title: string
  posterType?: string | null
  category?: string | null
  status: ProjectStatus
  format?: string | null
  style?: string | null
  createdAt: string
  updatedAt: string
}

export interface MemoryEntry {
  id: string
  memoryDefinitionId: string
  userId: string
  projectId: string | null
  content: Record<string, unknown>
  createdAt: string
  updatedAt: string
  memoryDefinition?: { key: string; name: string; description?: string; scope: string }
}

export interface FileAsset {
  id: string
  userId: string
  projectId: string | null
  fileUrl: string
  publicId?: string | null
  fileType: string
  originalName: string
  usageType: string
  fileSizeBytes?: number | null
  width?: number | null
  height?: number | null
  format?: string | null
  createdAt: string
}

export interface AgentRun {
  id: string
  projectId: string
  agentName: string
  provider: string
  model: string
  status: "PENDING" | "SUCCESS" | "FAILED"
  durationMs?: number | null
  error?: string | null
  createdAt: string
}

export interface GeneratedPoster {
  id: string
  userId: string
  projectId: string
  imageUrl: string
  promptUsed: string
  variationNumber: number
  status: "PENDING" | "GENERATING" | "GENERATED" | "FAILED"
  qualityScore?: number | null
  isExample: boolean
  createdAt: string
  updatedAt: string
}
