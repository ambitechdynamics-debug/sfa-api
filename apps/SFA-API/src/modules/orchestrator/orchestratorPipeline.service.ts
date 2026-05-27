import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';

export const ORCHESTRATOR_PIPELINE_SETTING_KEY = 'orchestrator_pipeline_config';
export const ORCHESTRATOR_PIPELINE_VERSION = 1;

export type OrchestratorExecutionMode = 'sequential' | 'parallel';
export type OrchestratorCondition = 'always' | 'has_files' | 'planner_ready_or_force' | 'has_prompt';
export type OrchestratorStepId =
  | 'image_analysis'
  | 'planning'
  | 'text_analysis'
  | 'brand_analysis'
  | 'artistic_base'
  | 'prompt_architect'
  | 'safety'
  | 'quality';

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

const STEP_IDS = new Set<OrchestratorStepId>([
  'image_analysis',
  'planning',
  'text_analysis',
  'brand_analysis',
  'artistic_base',
  'prompt_architect',
  'safety',
  'quality',
]);

export const DEFAULT_ORCHESTRATOR_PIPELINE: OrchestratorPipelineConfig = {
  version: ORCHESTRATOR_PIPELINE_VERSION,
  steps: [
    {
      id: 'image_analysis',
      label: 'Analyse image',
      agentKey: 'IMAGE_ANALYST_AGENT',
      order: 10,
      enabled: true,
      required: false,
      executionMode: 'sequential',
      inputMemoryKeys: ['M_SMS', 'M-CREATIVE-BRIEF'],
      outputMemoryKey: 'M_MD',
      retries: 0,
      timeoutMs: 30000,
      condition: 'has_files',
    },
    {
      id: 'planning',
      label: 'Planification',
      agentKey: 'PLANNER_AGENT',
      order: 20,
      enabled: true,
      required: true,
      executionMode: 'sequential',
      inputMemoryKeys: ['M_SMS', 'M-CREATIVE-BRIEF', 'M_MD'],
      outputMemoryKey: 'M_QT1',
      retries: 1,
      timeoutMs: 45000,
      condition: 'always',
    },
    {
      id: 'text_analysis',
      label: 'Analyse texte',
      agentKey: 'TEXT_ANALYST_AGENT',
      order: 30,
      enabled: true,
      required: false,
      executionMode: 'parallel',
      inputMemoryKeys: ['M_SMS', 'M_QT1'],
      outputMemoryKey: null,
      retries: 0,
      timeoutMs: 30000,
      condition: 'planner_ready_or_force',
    },
    {
      id: 'brand_analysis',
      label: 'Identité marque',
      agentKey: 'BRAND_AGENT',
      order: 40,
      enabled: true,
      required: false,
      executionMode: 'parallel',
      inputMemoryKeys: ['M_SMS', 'M_QT1', 'M_MD'],
      outputMemoryKey: 'M_ID',
      retries: 0,
      timeoutMs: 30000,
      condition: 'planner_ready_or_force',
    },
    {
      id: 'artistic_base',
      label: 'Base artistique',
      agentKey: 'ARTISTIC_BASE_AGENT',
      order: 50,
      enabled: true,
      required: false,
      executionMode: 'parallel',
      inputMemoryKeys: ['M_QT1'],
      outputMemoryKey: 'M_BA',
      retries: 0,
      timeoutMs: 30000,
      condition: 'planner_ready_or_force',
    },
    {
      id: 'prompt_architect',
      label: 'Prompt final',
      agentKey: 'PROMPT_ARCHITECT_AGENT',
      order: 60,
      enabled: true,
      required: true,
      executionMode: 'sequential',
      inputMemoryKeys: ['M_SMS', 'M_QT1', 'M_ID', 'M_BA'],
      outputMemoryKey: 'M_PROMPT1',
      retries: 1,
      timeoutMs: 45000,
      condition: 'planner_ready_or_force',
    },
    {
      id: 'safety',
      label: 'Sécurité',
      agentKey: 'SAFETY_AGENT',
      order: 70,
      enabled: true,
      required: false,
      executionMode: 'sequential',
      inputMemoryKeys: ['M_PROMPT1'],
      outputMemoryKey: 'M_PROMPT1',
      retries: 0,
      timeoutMs: 30000,
      condition: 'has_prompt',
    },
    {
      id: 'quality',
      label: 'Qualité',
      agentKey: 'QUALITY_AGENT',
      order: 80,
      enabled: true,
      required: false,
      executionMode: 'sequential',
      inputMemoryKeys: ['M_PROMPT1'],
      outputMemoryKey: 'M_PROMPT1',
      retries: 0,
      timeoutMs: 30000,
      condition: 'has_prompt',
    },
  ],
};

const DEFAULT_STEPS_BY_ID = new Map(DEFAULT_ORCHESTRATOR_PIPELINE.steps.map((step) => [step.id, step]));

function cloneDefaultConfig(): OrchestratorPipelineConfig {
  return JSON.parse(JSON.stringify(DEFAULT_ORCHESTRATOR_PIPELINE)) as OrchestratorPipelineConfig;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
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

function normalizeExecutionMode(value: unknown, fallback: OrchestratorExecutionMode): OrchestratorExecutionMode {
  return value === 'parallel' || value === 'sequential' ? value : fallback;
}

function normalizeCondition(value: unknown, fallback: OrchestratorCondition): OrchestratorCondition {
  return typeof value === 'string' && CONDITIONS.has(value as OrchestratorCondition)
    ? value as OrchestratorCondition
    : fallback;
}

function normalizeStep(input: unknown, index: number): OrchestratorPipelineStep {
  const record = asRecord(input);
  const rawId = typeof record.id === 'string' ? record.id : '';
  if (!STEP_IDS.has(rawId as OrchestratorStepId)) {
    throw new AppError(`Étape orchestrateur inconnue: ${rawId || `#${index + 1}`}`, 400);
  }

  const id = rawId as OrchestratorStepId;
  const fallback = DEFAULT_STEPS_BY_ID.get(id)!;
  const outputMemoryKey = record.outputMemoryKey === null
    ? null
    : typeof record.outputMemoryKey === 'string'
      ? record.outputMemoryKey.trim() || null
      : fallback.outputMemoryKey;

  return {
    id,
    label: typeof record.label === 'string' && record.label.trim() ? record.label.trim() : fallback.label,
    agentKey: typeof record.agentKey === 'string' && record.agentKey.trim() ? record.agentKey.trim() : fallback.agentKey,
    order: normalizeInt(record.order, fallback.order, 1, 999),
    enabled: typeof record.enabled === 'boolean' ? record.enabled : fallback.enabled,
    required: typeof record.required === 'boolean' ? record.required : fallback.required,
    executionMode: normalizeExecutionMode(record.executionMode, fallback.executionMode),
    inputMemoryKeys: normalizeStringArray(record.inputMemoryKeys, fallback.inputMemoryKeys),
    outputMemoryKey,
    retries: normalizeInt(record.retries, fallback.retries, 0, 5),
    timeoutMs: normalizeInt(record.timeoutMs, fallback.timeoutMs, 1000, 300000),
    condition: normalizeCondition(record.condition, fallback.condition),
  };
}

export function normalizeOrchestratorPipelineConfig(input: unknown): OrchestratorPipelineConfig {
  const record = asRecord(input);
  const rawSteps = Array.isArray(record.steps) ? record.steps : [];
  const seen = new Set<OrchestratorStepId>();
  const steps = rawSteps.map((step, index) => {
    const normalized = normalizeStep(step, index);
    if (seen.has(normalized.id)) {
      throw new AppError(`Étape orchestrateur dupliquée: ${normalized.id}`, 400);
    }
    seen.add(normalized.id);
    return normalized;
  });

  for (const defaultStep of DEFAULT_ORCHESTRATOR_PIPELINE.steps) {
    if (!seen.has(defaultStep.id)) steps.push({ ...defaultStep });
  }

  const sorted = steps.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'fr'));
  return {
    version: ORCHESTRATOR_PIPELINE_VERSION,
    steps: sorted.map((step, index) => ({ ...step, order: (index + 1) * 10 })),
  };
}

function stepOrder(config: OrchestratorPipelineConfig, id: OrchestratorStepId): number {
  return config.steps.find((step) => step.id === id)?.order ?? 9999;
}

export function getOrchestratorPipelineOrderIssues(config: OrchestratorPipelineConfig): string[] {
  const dependencies: Array<[OrchestratorStepId, OrchestratorStepId, string]> = [
    ['planning', 'text_analysis', 'Planning doit précéder Analyse texte.'],
    ['planning', 'brand_analysis', 'Planning doit précéder Identité marque.'],
    ['planning', 'artistic_base', 'Planning doit précéder Base artistique.'],
    ['planning', 'prompt_architect', 'Planning doit précéder Prompt final.'],
    ['text_analysis', 'prompt_architect', 'Analyse texte doit précéder Prompt final.'],
    ['brand_analysis', 'prompt_architect', 'Identité marque doit précéder Prompt final.'],
    ['artistic_base', 'prompt_architect', 'Base artistique doit précéder Prompt final.'],
    ['prompt_architect', 'safety', 'Prompt final doit précéder Sécurité.'],
    ['prompt_architect', 'quality', 'Prompt final doit précéder Qualité.'],
  ];

  return dependencies
    .filter(([before, after]) => stepOrder(config, before) >= stepOrder(config, after))
    .map(([, , message]) => message);
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
    orderIssues: getOrchestratorPipelineOrderIssues(config),
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
    const orderIssues = getOrchestratorPipelineOrderIssues(config);
    if (orderIssues.length > 0) {
      throw new AppError(`Ordre du pipeline invalide: ${orderIssues.join(' ')}`, 400, orderIssues);
    }

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
