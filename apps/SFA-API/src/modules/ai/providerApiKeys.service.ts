import { randomInt } from 'node:crypto';
import { ProviderApiKey } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { settingsService } from '../settings/settings.service';

const MASK = '••••••••••••••••••••••••••';
const QUOTA_COOLDOWN_HOURS = 24;

const BUILT_IN_LEGACY_SETTINGS: Record<string, string> = {
  openai: 'openai_api_key',
  anthropic: 'anthropic_api_key',
  gemini: 'gemini_api_key',
};

export interface ProviderApiKeyDTO {
  id: string;
  providerSlug: string;
  label: string;
  apiKey: string;
  isActive: boolean;
  cooldownUntil: Date | null;
  lastUsedAt: Date | null;
  lastQuotaAt: Date | null;
  quotaReason: string | null;
  usageCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'available' | 'cooldown' | 'disabled';
}

export interface ProviderApiKeySelection {
  id: string;
  providerSlug: string;
  label: string;
  apiKey: string;
}

export class ProviderHttpError extends Error {
  constructor(
    public readonly providerLabel: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`${providerLabel} API error ${status}: ${body}`);
  }
}

export function createProviderHttpError(providerLabel: string, status: number, body: string) {
  return new ProviderHttpError(providerLabel, status, body);
}

export function normalizeProviderSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function maskSecret(value: string): string {
  if (!value) return '';
  if (value.includes('••')) return value;
  if (value.length <= 6) return MASK;
  return `${value.slice(0, 6)}${MASK}`;
}

function toDTO(row: ProviderApiKey): ProviderApiKeyDTO {
  const now = Date.now();
  const inCooldown = row.cooldownUntil ? row.cooldownUntil.getTime() > now : false;
  return {
    ...row,
    apiKey: maskSecret(row.apiKey),
    status: !row.isActive ? 'disabled' : inCooldown ? 'cooldown' : 'available',
  };
}

function isMasked(value: string): boolean {
  return value.includes('••');
}

function isQuotaLikeMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('ratelimit') ||
    lower.includes('resource_exhausted') ||
    lower.includes('insufficient_quota')
  );
}

export function isProviderQuotaError(error: unknown): boolean {
  if (error instanceof ProviderHttpError) {
    return error.status === 429 || ((error.status === 403 || error.status === 400) && isQuotaLikeMessage(error.body));
  }
  if (error instanceof Error) return isQuotaLikeMessage(error.message);
  return false;
}

function quotaReason(error: unknown): string {
  if (error instanceof ProviderHttpError) return `${error.status}: ${error.body.slice(0, 500)}`;
  if (error instanceof Error) return error.message.slice(0, 500);
  return 'Quota provider atteint';
}

async function ensureLegacyBuiltInKey(providerSlug: string) {
  const legacyKey = BUILT_IN_LEGACY_SETTINGS[providerSlug];
  if (!legacyKey) return;

  const existing = await prisma.providerApiKey.count({ where: { providerSlug } });
  if (existing > 0) return;

  const value = await settingsService.getRaw(legacyKey);
  if (!value?.trim()) return;

  await prisma.providerApiKey.create({
    data: {
      providerSlug,
      label: 'Clé principale',
      apiKey: value.trim(),
      isActive: true,
    },
  });
}

async function ensureLegacyCustomKey(providerSlug: string) {
  if (BUILT_IN_LEGACY_SETTINGS[providerSlug] || providerSlug === 'mock') return;

  const existing = await prisma.providerApiKey.count({ where: { providerSlug } });
  if (existing > 0) return;

  const value = await settingsService.getRaw(`custom_${providerSlug}_api_key`);
  if (!value?.trim()) return;

  await prisma.providerApiKey.create({
    data: {
      providerSlug,
      label: 'Clé principale',
      apiKey: value.trim(),
      isActive: true,
    },
  });
}

async function ensureLegacyKey(providerSlug: string) {
  await ensureLegacyBuiltInKey(providerSlug);
  await ensureLegacyCustomKey(providerSlug);
}

export const providerApiKeysService = {
  async seedFromLegacySettings(): Promise<number> {
    const before = await prisma.providerApiKey.count();

    for (const providerSlug of Object.keys(BUILT_IN_LEGACY_SETTINGS)) {
      await ensureLegacyBuiltInKey(providerSlug);
    }

    const providerSettings = await prisma.appSetting.findMany({
      where: { category: 'providers' },
      select: { key: true },
    });
    for (const row of providerSettings) {
      const match = row.key.match(/^custom_(.+)_name$/);
      if (match) await ensureLegacyCustomKey(match[1]);
    }

    const after = await prisma.providerApiKey.count();
    return after - before;
  },

  async list(providerSlug?: string): Promise<ProviderApiKeyDTO[]> {
    const where = providerSlug ? { providerSlug: normalizeProviderSlug(providerSlug) } : undefined;
    const rows = await prisma.providerApiKey.findMany({
      where,
      orderBy: [{ providerSlug: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toDTO);
  },

  async create(input: { providerSlug: string; label?: string; apiKey: string; isActive?: boolean }): Promise<ProviderApiKeyDTO> {
    const providerSlug = normalizeProviderSlug(input.providerSlug);
    if (!providerSlug) throw new AppError('Provider invalide.', 400);
    if (!input.apiKey.trim()) throw new AppError('Clé API obligatoire.', 400);

    const label = input.label?.trim() || `Clé ${Date.now()}`;
    const row = await prisma.providerApiKey.create({
      data: {
        providerSlug,
        label,
        apiKey: input.apiKey.trim(),
        isActive: input.isActive ?? true,
      },
    });
    return toDTO(row);
  },

  async update(id: string, input: { label?: string; apiKey?: string; isActive?: boolean }): Promise<ProviderApiKeyDTO> {
    const data: { label?: string; apiKey?: string; isActive?: boolean } = {};
    if (input.label !== undefined) data.label = input.label.trim();
    if (input.apiKey !== undefined && input.apiKey.trim() && !isMasked(input.apiKey)) data.apiKey = input.apiKey.trim();
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const row = await prisma.providerApiKey.update({ where: { id }, data });
    return toDTO(row);
  },

  async delete(id: string): Promise<void> {
    await prisma.providerApiKey.delete({ where: { id } });
  },

  async resetCooldown(id: string): Promise<ProviderApiKeyDTO> {
    const row = await prisma.providerApiKey.update({
      where: { id },
      data: { cooldownUntil: null, quotaReason: null },
    });
    return toDTO(row);
  },

  async selectAvailable(providerSlugInput: string, excludeIds: string[] = []): Promise<ProviderApiKeySelection> {
    const providerSlug = normalizeProviderSlug(providerSlugInput);
    await ensureLegacyKey(providerSlug);

    const now = new Date();
    const rows = await prisma.providerApiKey.findMany({
      where: {
        providerSlug,
        isActive: true,
        id: excludeIds.length ? { notIn: excludeIds } : undefined,
        OR: [{ cooldownUntil: null }, { cooldownUntil: { lte: now } }],
      },
      orderBy: { createdAt: 'asc' },
    });

    if (rows.length === 0) {
      throw new AppError(`Aucune clé API disponible pour le provider "${providerSlug}". Ajoutez une clé active ou attendez la fin du cooldown.`, 503);
    }

    const selected = rows[randomInt(rows.length)];
    return {
      id: selected.id,
      providerSlug: selected.providerSlug,
      label: selected.label,
      apiKey: selected.apiKey,
    };
  },

  async markUsed(id: string): Promise<void> {
    await prisma.providerApiKey.update({
      where: { id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    });
  },

  async markFailure(id: string): Promise<void> {
    await prisma.providerApiKey.update({
      where: { id },
      data: {
        failureCount: { increment: 1 },
      },
    });
  },

  async markQuotaCooldown(id: string, reason: string): Promise<void> {
    const cooldownUntil = new Date(Date.now() + QUOTA_COOLDOWN_HOURS * 60 * 60 * 1000);
    await prisma.providerApiKey.update({
      where: { id },
      data: {
        cooldownUntil,
        lastQuotaAt: new Date(),
        quotaReason: reason.slice(0, 500),
        failureCount: { increment: 1 },
      },
    });
  },
};

export async function withRotatingProviderApiKey<T>(
  providerSlug: string,
  operation: (apiKey: string, selected: ProviderApiKeySelection) => Promise<T>,
): Promise<T> {
  const attempted: string[] = [];
  let lastQuota: unknown = null;

  for (let attempt = 0; attempt < 20; attempt++) {
    const selected = await providerApiKeysService.selectAvailable(providerSlug, attempted);
    attempted.push(selected.id);

    try {
      const result = await operation(selected.apiKey, selected);
      await providerApiKeysService.markUsed(selected.id);
      return result;
    } catch (error) {
      if (isProviderQuotaError(error)) {
        lastQuota = error;
        await providerApiKeysService.markQuotaCooldown(selected.id, quotaReason(error));
        continue;
      }

      await providerApiKeysService.markFailure(selected.id);
      throw error;
    }
  }

  throw new AppError(
    `Toutes les clés API disponibles pour "${normalizeProviderSlug(providerSlug)}" ont atteint leur quota. Réessayez plus tard ou ajoutez une nouvelle clé.`,
    503,
    lastQuota instanceof Error ? [lastQuota.message] : [],
  );
}
