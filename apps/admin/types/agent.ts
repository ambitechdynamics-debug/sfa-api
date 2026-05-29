import { MemoryDefinition } from './memory'

export type AgentProvider = string
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
  moduleAccess?: ChatAgentModuleAccess | null
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

export type ChatAgentModule = 'files' | 'artistic_base' | 'forbidden_rules' | 'creation_options'

export interface ChatAgentModuleAccess {
  files: boolean
  artistic_base: boolean
  forbidden_rules: boolean
  creation_options: boolean
}

export interface ChatAgentConfig {
  memoryTargetKey: string
  moduleAccess: ChatAgentModuleAccess
}
