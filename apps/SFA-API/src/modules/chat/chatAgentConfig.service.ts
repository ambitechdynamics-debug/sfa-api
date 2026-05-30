import { prisma } from '../../config/database';

export const CHAT_AGENT_CONFIG_SETTING_KEY = 'chat_agent_config';

export type ChatAgentModule = 'files' | 'artistic_base' | 'forbidden_rules' | 'creation_options';

export interface ChatAgentModuleAccess {
  files: boolean;
  artistic_base: boolean;
  forbidden_rules: boolean;
  creation_options: boolean;
}

export interface ChatAgentConfig {
  memoryTargetKey: string;
  moduleAccess: ChatAgentModuleAccess;
}

const DEFAULT_CONFIG: ChatAgentConfig = {
  memoryTargetKey: 'M-CREATIVE-BRIEF',
  moduleAccess: {
    files: true,
    artistic_base: false,
    forbidden_rules: false,
    creation_options: true,
  },
};

function cloneDefault(): ChatAgentConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as ChatAgentConfig;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeModuleAccess(value: unknown): ChatAgentModuleAccess {
  const record = asRecord(value);
  return {
    files: normalizeBool(record.files, DEFAULT_CONFIG.moduleAccess.files),
    artistic_base: normalizeBool(record.artistic_base, DEFAULT_CONFIG.moduleAccess.artistic_base),
    forbidden_rules: normalizeBool(record.forbidden_rules, DEFAULT_CONFIG.moduleAccess.forbidden_rules),
    creation_options: normalizeBool(record.creation_options, DEFAULT_CONFIG.moduleAccess.creation_options),
  };
}

export function normalizeChatAgentConfig(input: unknown): ChatAgentConfig {
  const record = asRecord(input);
  const rawKey = typeof record.memoryTargetKey === 'string' ? record.memoryTargetKey.trim() : '';
  return {
    memoryTargetKey: rawKey || DEFAULT_CONFIG.memoryTargetKey,
    moduleAccess: normalizeModuleAccess(record.moduleAccess),
  };
}

export const chatAgentConfigService = {
  get: async (): Promise<ChatAgentConfig> => {
    const row = await prisma.appSetting.findUnique({
      where: { key: CHAT_AGENT_CONFIG_SETTING_KEY },
      select: { value: true },
    });
    if (!row) return cloneDefault();
    try {
      return normalizeChatAgentConfig(JSON.parse(row.value));
    } catch {
      return cloneDefault();
    }
  },

  save: async (input: unknown): Promise<ChatAgentConfig> => {
    const config = normalizeChatAgentConfig(input);
    await prisma.appSetting.upsert({
      where: { key: CHAT_AGENT_CONFIG_SETTING_KEY },
      create: {
        key: CHAT_AGENT_CONFIG_SETTING_KEY,
        value: JSON.stringify(config, null, 2),
        category: 'chat',
        isSecret: false,
        description: "Configuration de l'agent conversationnel (mémoire cible + modules de lecture).",
      },
      update: {
        value: JSON.stringify(config, null, 2),
        category: 'chat',
        isSecret: false,
        description: "Configuration de l'agent conversationnel (mémoire cible + modules de lecture).",
      },
    });
    return config;
  },
};
