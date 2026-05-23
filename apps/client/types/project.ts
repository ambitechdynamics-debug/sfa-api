export type TravailStatus =
  | "DRAFT"
  | "QUESTIONING"
  | "ANALYZING"
  | "READY_FOR_PROMPT"
  | "PROMPT_READY"
  | "GENERATING"
  | "GENERATED"
  | "FAILED"

/**
 * Backward-compat alias — the schema used to call this `ProjectStatus` before
 * the Project → Travail split. Code that still imports `ProjectStatus` keeps
 * working as long as it deals with travail-level state.
 */
export type ProjectStatus = TravailStatus

/**
 * Container "marque / client". Regroupe N Travaux (livrables) et les assets de marque.
 */
export interface Project {
  id: string
  userId: string
  title: string
  brandDescription?: string | null
  createdAt: string
  updatedAt: string
  travaux?: Travail[]
  _count?: {
    travaux?: number
    files?: number
  }
}

/**
 * Unité de travail concrète au sein d'un Project. Porte le chat, les mémoires,
 * les posters et les assets propres au livrable.
 */
export interface Travail {
  id: string
  projectId: string
  userId: string
  title: string
  status: TravailStatus
  posterType?: string | null
  category?: string | null
  format?: string | null
  style?: string | null
  lastMessageAt: string
  createdAt: string
  updatedAt: string
  project?: { id: string; title: string; brandDescription?: string | null }
  _count?: {
    messages?: number
    generatedPosters?: number
    files?: number
  }
}

export interface MemoryEntry {
  id: string
  memoryDefinitionId: string
  userId: string
  travailId: string
  content: Record<string, unknown>
  createdAt: string
  updatedAt: string
  memoryDefinition?: { key: string; name: string; description?: string; scope: string }
}

export interface FileAsset {
  id: string
  userId: string
  projectId: string | null
  travailId: string | null
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
  travailId: string
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
  travailId: string
  imageUrl: string
  promptUsed: string
  variationNumber: number
  status: "PENDING" | "GENERATING" | "GENERATED" | "FAILED"
  qualityScore?: number | null
  isExample: boolean
  createdAt: string
  updatedAt: string
}
