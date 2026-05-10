import { AdminUser } from './user'

export type ProjectStatus =
  | 'DRAFT'
  | 'QUESTIONING'
  | 'ANALYZING'
  | 'READY_FOR_PROMPT'
  | 'PROMPT_READY'
  | 'GENERATING'
  | 'GENERATED'
  | 'FAILED'

export interface AdminProject {
  id: string
  title: string
  userId: string
  user?: AdminUser
  posterType?: string
  category?: string
  status: ProjectStatus
  format?: string
  style?: string
  createdAt: string
  updatedAt: string
  _count?: { generatedPosters: number; files: number }
}

export interface FileAsset {
  id: string
  userId: string
  user?: AdminUser
  projectId: string
  project?: { id: string; title: string }
  fileUrl: string
  fileType: string
  originalName: string
  usageType: 'LOGO' | 'MODEL' | 'REFERENCE_IMAGE' | 'PRODUCT_IMAGE' | 'PERSON_IMAGE' | 'OTHER'
  fileSizeBytes?: number
  createdAt: string
  updatedAt: string
}

export interface GeneratedPoster {
  id: string
  userId: string
  user?: AdminUser
  projectId: string
  project?: { id: string; title: string }
  imageUrl: string
  promptUsed: string
  variationNumber: number
  status: 'PENDING' | 'GENERATING' | 'GENERATED' | 'FAILED'
  isExample?: boolean
  qualityScore?: number
  createdAt: string
  updatedAt?: string
}

// Real structure: MemoryEntry where memoryDefinition.key = 'M-PROMPT1'
export interface FinalPrompt {
  id: string
  projectId?: string
  project?: { id: string; title: string }
  userId: string
  user?: AdminUser
  memoryDefinitionId: string
  memoryDefinition?: { key: string; name: string }
  // content JSON from MemoryEntry — shape defined by M-PROMPT1 schema
  content: {
    finalPrompt?: string
    negativePrompt?: string
    qualityScore?: number
    memoriesUsed?: string[]
    [key: string]: unknown
  }
  // convenience aliases resolved from content
  finalPrompt?: string
  negativePrompt?: string
  qualityScore?: number
  memoriesUsed?: string[]
  createdAt: string
  updatedAt: string
}
