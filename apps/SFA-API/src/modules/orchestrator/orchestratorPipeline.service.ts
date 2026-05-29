import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';

export const ORCHESTRATOR_PIPELINE_SETTING_KEY = 'orchestrator_pipeline_config';
export const ORCHESTRATOR_PIPELINE_VERSION = 1;

export type OrchestratorExecutionMode = 'sequential' | 'parallel';
export type OrchestratorCondition = 'always' | 'has_files' | 'planner_ready_or_force' | 'has_prompt';
export type OrchestratorStepId = string;

export interface OrchestratorPipelineStep {
  id: OrchestratorStepId;
  label: string;
  agentKey: string;
  order: number;
  enabled: boolean;
  required: boolean;
  executionMode: OrchestratorExecutionMode;
  inputMemoryKeys: string[];
  outputMemoryKey: string | null;
  retries: number;
  timeoutMs: number;
  condition: OrchestratorCondition;
}

export interface OrchestratorPipelineConfig {
  version: number;
  steps: OrchestratorPipelineStep[];
}

export interface OrchestratorPipelineDiagnostics {
  missingAgents: string[];
  inactiveAgents: string[];
  missingMemories: string[];
  orderIssues: string[];
}

export interface OrchestratorPipelinePayload {
  source: 'default' | 'db';
  updatedAt: string | null;
  config: OrchestratorPipelineConfig;
  defaultConfig: OrchestratorPipelineConfig;
  diagnostics: OrchestratorPipelineDiagnostics;
}

const CONDITIONS = new Set<OrchestratorCondition>([
  'always',
  'has_files',
  'planner_ready_or_force',
  'has_prompt',
]);

export const DEFAULT_ORCHESTRATOR_PIPELINE: OrchestratorPipelineConfig = {
  version: ORCHESTRATOR_PIPELINE_VERSION,
  steps: [],
};

function cloneDefaultConfig(): OrchestratorPipelineConfig {
  return JSON.parse(JSON.stringify(DEFAULT_ORCHESTRATOR_PIPELINE)) as OrchestratorPipelineConfig;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean),
    ),
  );
}

function normalizeInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizeExecutionMode(value: unknown): OrchestratorExecutionMode {
  return value === 'parallel' ? 'parallel' : 'sequential';
}

function normalizeCondition(value: unknown): OrchestratorCondition {
  return typeof value === 'string' && CONDITIONS.has(value as OrchestratorCondition)
    ? value as OrchestratorCondition
    : 'always';
}

function normalizeStep(input: unknown, index: number): OrchestratorPipelineStep {
  const record = asRecord(input);
  const rawId = typeof record.id === 'string' ? record.id.trim() : '';
  if (!rawId) {
    throw new AppError(`Étape orchestrateur #${index + 1} sans identifiant`, 400);
  }

  const outputMemoryKey = record.outputMemoryKey === null
    ? null
    : typeof record.outputMemoryKey === 'string'
      ? record.outputMemoryKey.trim() || null
      : null;

  return {
    id: rawId,
    label: typeof record.label === 'string' && record.label.trim() ? record.label.trim() : rawId,
    agentKey: typeof record.agentKey === 'string' ? record.agentKey.trim() : '',
    order: normalizeInt(record.order, (index + 1) * 10, 1, 999),
    enabled: typeof record.enabled === 'boolean' ? record.enabled : true,
    required: typeof record.required === 'boolean' ? record.required : false,
    executionMode: normalizeExecutionMode(record.executionMode),
    inputMemoryKeys: normalizeStringArray(record.inputMemoryKeys),
    outputMemoryKey,
    retries: normalizeInt(record.retries, 0, 0, 5),
    timeoutMs: normalizeInt(record.timeoutMs, 30000, 1000, 300000),
    condition: normalizeCondition(record.condition),
  };
}

export function normalizeOrchestratorPipelineConfig(input: unknown): OrchestratorPipelineConfig {
  const record = asRecord(input);
  const rawSteps = Array.isArray(record.steps) ? record.steps : [];
  const seen = new Set<string>();
  const steps = rawSteps.map((step, index) => {
    const normalized = normalizeStep(step, index);
    if (seen.has(normalized.id)) {
      throw new AppError(`Étape orchestrateur dupliquée: ${normalized.id}`, 400);
    }
    seen.add(normalized.id);
    return normalized;
  });

  const sorted = steps.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'fr'));
  return {
    version: ORCHESTRATOR_PIPELINE_VERSION,
    steps: sorted.map((step, index) => ({ ...step, order: (index + 1) * 10 })),
  };
}

async function getDiagnostics(config: OrchestratorPipelineConfig): Promise<OrchestratorPipelineDiagnostics> {
  const agentKeys = Array.from(new Set(config.steps.map((step) => step.agentKey).filter(Boolean)));
  const memoryKeys = Array.from(
    new Set(
      config.steps
        .flatMap((step) => [...step.inputMemoryKeys, step.outputMemoryKey ?? ''])
        .map((key) => key.trim())
        .filter(Boolean),
    ),
  );

  const [agents, memories] = await Promise.all([
    agentKeys.length
      ? prisma.agentDefinition.findMany({ where: { key: { in: agentKeys } }, select: { key: true, isActive: true } })
      : Promise.resolve([]),
    memoryKeys.length
      ? prisma.memoryDefinition.findMany({ where: { key: { in: memoryKeys } }, select: { key: true } })
      : Promise.resolve([]),
  ]);

  const agentsByKey = new Map(agents.map((agent) => [agent.key, agent]));
  const memorySet = new Set(memories.map((memory) => memory.key));

  return {
    missingAgents: agentKeys.filter((key) => !agentsByKey.has(key)),
    inactiveAgents: agentKeys.filter((key) => agentsByKey.get(key)?.isActive === false),
    missingMemories: memoryKeys.filter((key) => !memorySet.has(key)),
    orderIssues: [],
  };
}

async function readConfigFromDb(): Promise<{ source: 'default' | 'db'; updatedAt: string | null; config: OrchestratorPipelineConfig }> {
  const row = await prisma.appSetting.findUnique({
    where: { key: ORCHESTRATOR_PIPELINE_SETTING_KEY },
    select: { value: true, updatedAt: true },
  });

  if (!row) {
    return { source: 'default', updatedAt: null, config: cloneDefaultConfig() };
  }

  try {
    return {
      source: 'db',
      updatedAt: row.updatedAt.toISOString(),
      config: normalizeOrchestratorPipelineConfig(JSON.parse(row.value)),
    };
  } catch {
    return { source: 'default', updatedAt: row.updatedAt.toISOString(), config: cloneDefaultConfig() };
  }
}

export const orchestratorPipelineService = {
  getPayload: async (): Promise<OrchestratorPipelinePayload> => {
    const current = await readConfigFromDb();
    const diagnostics = await getDiagnostics(current.config);

    return {
      ...current,
      defaultConfig: cloneDefaultConfig(),
      diagnostics,
    };
  },

  getRuntimeConfig: async (): Promise<OrchestratorPipelineConfig> => {
    const { config } = await readConfigFromDb();
    return config;
  },

  save: async (input: unknown): Promise<OrchestratorPipelinePayload> => {
    const config = normalizeOrchestratorPipelineConfig(input);

    await prisma.appSetting.upsert({
      where: { key: ORCHESTRATOR_PIPELINE_SETTING_KEY },
      create: {
        key: ORCHESTRATOR_PIPELINE_SETTING_KEY,
        value: JSON.stringify(config, null, 2),
        category: 'orchestrator',
        isSecret: false,
        description: 'Configuration JSON du pipeline orchestrateur administrable depuis /admin/orchestrator',
      },
      update: {
        value: JSON.stringify(config, null, 2),
        category: 'orchestrator',
        isSecret: false,
        description: 'Configuration JSON du pipeline orchestrateur administrable depuis /admin/orchestrator',
      },
    });

    return orchestratorPipelineService.getPayload();
  },

  reset: async (): Promise<OrchestratorPipelinePayload> => {
    const config = cloneDefaultConfig();
    await prisma.appSetting.upsert({
      where: { key: ORCHESTRATOR_PIPELINE_SETTING_KEY },
      create: {
        key: ORCHESTRATOR_PIPELINE_SETTING_KEY,
        value: JSON.stringify(config, null, 2),
        category: 'orchestrator',
        isSecret: false,
        description: 'Configuration JSON du pipeline orchestrateur administrable depuis /admin/orchestrator',
      },
      update: {
        value: JSON.stringify(config, null, 2),
        category: 'orchestrator',
        isSecret: false,
        description: 'Configuration JSON du pipeline orchestrateur administrable depuis /admin/orchestrator',
      },
    });

    return orchestratorPipelineService.getPayload();
  },
};
