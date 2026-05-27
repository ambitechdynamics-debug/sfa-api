export type OrchestratorExecutionMode = 'sequential' | 'parallel'
export type OrchestratorCondition = 'always' | 'has_files' | 'planner_ready_or_force' | 'has_prompt'
export type OrchestratorStepId =
  | 'image_analysis'
  | 'planning'
  | 'text_analysis'
  | 'brand_analysis'
  | 'artistic_base'
  | 'prompt_architect'
  | 'safety'
  | 'quality'

export interface OrchestratorPipelineStep {
  id: OrchestratorStepId
  label: string
  agentKey: string
  order: number
  enabled: boolean
  required: boolean
  executionMode: OrchestratorExecutionMode
  inputMemoryKeys: string[]
  outputMemoryKey: string | null
  retries: number
  timeoutMs: number
  condition: OrchestratorCondition
}

export interface OrchestratorPipelineConfig {
  version: number
  steps: OrchestratorPipelineStep[]
}

export interface OrchestratorPipelineDiagnostics {
  missingAgents: string[]
  inactiveAgents: string[]
  missingMemories: string[]
  orderIssues: string[]
}

export interface OrchestratorPipelinePayload {
  source: 'default' | 'db'
  updatedAt: string | null
  config: OrchestratorPipelineConfig
  defaultConfig: OrchestratorPipelineConfig
  stepTemplates: OrchestratorPipelineConfig
  diagnostics: OrchestratorPipelineDiagnostics
}
