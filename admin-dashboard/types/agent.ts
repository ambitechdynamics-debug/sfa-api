import { MemoryDefinition } from './memory'

export type AgentProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'MOCK'
export type AgentMemoryUsageType = 'INPUT' | 'OUTPUT' | 'BOTH'

export interface AgentDefinition {
  id: string
  key: string
  name: string
  description?: string
  provider: AgentProvider
  model: string
  systemPrompt: string
  expectedOutputSchema: Record<string, unknown>
  isActive: boolean
  createdAt: string
  updatedAt: string
  memoryLinksCount?: number
}

export interface AgentMemoryLink {
  id: string
  agentDefinitionId: string
  memoryDefinitionId: string
  usageType: AgentMemoryUsageType
  isRequired: boolean
  priority: number
  createdAt: string
  agent?: AgentDefinition
  memory?: MemoryDefinition
}

export interface AgentRunRecord {
  id: string
  projectId: string
  projectTitle?: string
  agentName: string
  provider: string
  model: string
  input: Record<string, unknown>
  output?: Record<string, unknown>
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  error?: string
  durationMs?: number
  createdAt: string
}
