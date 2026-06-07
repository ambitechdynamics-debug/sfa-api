import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createProviderHttpError,
  isProviderQuotaError,
  providerApiKeysService,
  withRotatingProviderApiKey,
} from '../providerApiKeys.service';

vi.mock('../../../config/database', () => ({
  prisma: {
    providerApiKey: {},
    appSetting: {},
  },
}));

vi.mock('../../settings/settings.service', () => ({
  settingsService: {
    getRaw: vi.fn(),
  },
}));

describe('providerApiKeysService rotation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('marks a quota key in cooldown and retries with another key', async () => {
    vi.spyOn(providerApiKeysService, 'selectAvailable')
      .mockResolvedValueOnce({ id: 'key-1', providerSlug: 'gemini', label: 'A', apiKey: 'quota-key' })
      .mockResolvedValueOnce({ id: 'key-2', providerSlug: 'gemini', label: 'B', apiKey: 'healthy-key' });
    const markQuota = vi.spyOn(providerApiKeysService, 'markQuotaCooldown').mockResolvedValue(undefined);
    const markUsed = vi.spyOn(providerApiKeysService, 'markUsed').mockResolvedValue(undefined);
    const markFailure = vi.spyOn(providerApiKeysService, 'markFailure').mockResolvedValue(undefined);

    const result = await withRotatingProviderApiKey('gemini', async (apiKey) => {
      if (apiKey === 'quota-key') throw createProviderHttpError('Gemini', 429, 'quota exceeded');
      return `used:${apiKey}`;
    });

    expect(result).toBe('used:healthy-key');
    expect(markQuota).toHaveBeenCalledWith('key-1', expect.stringContaining('quota exceeded'));
    expect(markUsed).toHaveBeenCalledWith('key-2');
    expect(markFailure).not.toHaveBeenCalled();
  });

  it('detects common quota responses', () => {
    expect(isProviderQuotaError(createProviderHttpError('OpenAI', 429, 'rate limit'))).toBe(true);
    expect(isProviderQuotaError(createProviderHttpError('Gemini', 403, 'RESOURCE_EXHAUSTED'))).toBe(true);
    expect(isProviderQuotaError(createProviderHttpError('OpenAI', 401, 'invalid key'))).toBe(false);
  });
});
