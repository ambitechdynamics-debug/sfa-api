import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/database';

export const CHAT_AGENT_CONFIG_SETTING_KEY = 'chat_agent_config';
export const CHAT_AGENT_SKILL_CONTENT_MAX = 20_000;

export type ChatAgentModule = 'files' | 'artistic_base' | 'forbidden_rules' | 'creation_options';

export interface ChatAgentModuleAccess {
  files: boolean;
  artistic_base: boolean;
  forbidden_rules: boolean;
  creation_options: boolean;
}

export interface ChatAgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  content: string;
  isActive: boolean;
  order: number;
}

export interface ChatAgentConfig {
  memoryTargetKey: string;
  moduleAccess: ChatAgentModuleAccess;
  skills: ChatAgentSkill[];
}

const DEFAULT_CONFIG: ChatAgentConfig = {
  memoryTargetKey: 'M-CREATIVE-BRIEF',
  moduleAccess: {
    files: true,
    artistic_base: false,
    forbidden_rules: false,
    creation_options: true,
  },
  skills: [],
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

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
}

function normalizeSkillEntry(value: unknown, fallbackOrder: number): ChatAgentSkill | null {
  const record = asRecord(value);
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const content = typeof record.content === 'string' ? record.content : '';
  if (!name || !content.trim()) return null;

  const description = typeof record.description === 'string' ? record.description.trim() : '';
  const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : randomUUID();
  const orderRaw = Number(record.order);
  const order = Number.isFinite(orderRaw) ? Math.max(0, Math.trunc(orderRaw)) : fallbackOrder;
  const isActive = typeof record.isActive === 'boolean' ? record.isActive : true;

  return {
    id,
    name,
    description,
    tags: normalizeTags(record.tags),
    content: content.slice(0, CHAT_AGENT_SKILL_CONTENT_MAX),
    isActive,
    order,
  };
}

function normalizeSkills(value: unknown): ChatAgentSkill[] {
  if (!Array.isArray(value)) return [];
  const out: ChatAgentSkill[] = [];
  value.forEach((entry, index) => {
    const skill = normalizeSkillEntry(entry, index);
    if (skill) out.push(skill);
  });
  return out.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'fr'));
}

export function normalizeChatAgentConfig(input: unknown): ChatAgentConfig {
  const record = asRecord(input);
  const rawKey = typeof record.memoryTargetKey === 'string' ? record.memoryTargetKey.trim() : '';
  return {
    memoryTargetKey: rawKey || DEFAULT_CONFIG.memoryTargetKey,
    moduleAccess: normalizeModuleAccess(record.moduleAccess),
    skills: normalizeSkills(record.skills),
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
