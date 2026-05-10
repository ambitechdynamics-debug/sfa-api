export type MemoryScope = 'PROJECT' | 'USER' | 'GLOBAL'

export interface MemoryDefinition {
  id: string
  key: string
  name: string
  description?: string
  scope: MemoryScope
  schema: Record<string, unknown>
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  entriesCount?: number
}

export interface MemoryEntry {
  id: string
  memoryDefinitionId: string
  memoryDefinition?: MemoryDefinition
  userId: string
  projectId?: string
  content: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
