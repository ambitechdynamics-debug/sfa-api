/**
 * Service IA générique.
 *
 * Strict mode : aucun défaut codé en dur, aucun fallback environnement.
 * Le provider vient soit du paramètre explicite, soit de l'AppSetting
 * `text_ai_provider` (configuré dans /admin/settings). Si ni l'un ni
 * l'autre, on lève une erreur claire.
 */

import { CallTextAIOptions, CallVisionAIOptions, AIProvider, AIResponse } from './ai.types';
import { createProvider } from './ai.providers';
import { safeJsonParseAIResponse } from './ai.validation';
import { settingsService } from '../settings/settings.service';

const BUILT_IN_PROVIDERS: ReadonlySet<string> = new Set(['openai', 'anthropic', 'gemini', 'mock']);

async function isActiveCustomProvider(slug: string): Promise<boolean> {
  const [name, isActive] = await Promise.all([
    settingsService.getRaw(`custom_${slug}_name`),
    settingsService.getRaw(`custom_${slug}_is_active`),
  ]);
  if (!name || !name.trim()) return false;
  return isActive === 'true';
}

async function resolveProvider(explicit?: AIProvider): Promise<AIProvider> {
  if (explicit) return explicit;
  const fromSettings = (await settingsService.getRaw('text_ai_provider'))?.trim().toLowerCase();
  if (!fromSettings) {
    throw new Error(
      "Aucun provider IA configuré. Renseignez 'text_ai_provider' dans /admin/settings (built-in : openai | anthropic | gemini | mock, ou slug d'un provider custom)."
    );
  }
  if (BUILT_IN_PROVIDERS.has(fromSettings)) return fromSettings as AIProvider;
  if (await isActiveCustomProvider(fromSettings)) return fromSettings as AIProvider;
  throw new Error(
    `Provider "${fromSettings}" introuvable ou inactif. Ajoutez-le dans /admin/settings → onglet Providers, ou choisissez un built-in.`
  );
}

export async function callTextAI(options: CallTextAIOptions): Promise<AIResponse> {
  const provider = await resolveProvider(options.provider);
  const model = options.model || undefined;

  const adapter = await createProvider(provider);
  const start = Date.now();

  const rawContent = await adapter.callText({ ...options, provider, model });

  const durationMs = Date.now() - start;

  let parsed: unknown = rawContent;
  if (options.responseFormat === 'json') {
    const result = safeJsonParseAIResponse(rawContent);
    parsed = result.success ? result.data : { _parseError: result.error, _raw: result.raw };
  }

  return { provider, model: model ?? '', rawContent, parsed, durationMs };
}

export async function callVisionAI(options: CallVisionAIOptions): Promise<AIResponse> {
  const provider = await resolveProvider(options.provider);
  const adapter = await createProvider(provider);

  if (!adapter.capabilities.supportsVision) {
    throw new Error(
      `Le provider "${provider}" ne supporte pas l'analyse d'images. Choisissez un provider compatible vision (gemini, openai, anthropic) dans /admin/settings.`
    );
  }

  const model = options.model || undefined;
  const start = Date.now();

  const rawContent = await adapter.callVision({ ...options, provider, model });

  const durationMs = Date.now() - start;

  let parsed: unknown = rawContent;
  if (options.responseFormat === 'json') {
    const result = safeJsonParseAIResponse(rawContent);
    parsed = result.success ? result.data : { _parseError: result.error, _raw: result.raw };
  }

  return { provider, model: model ?? '', rawContent, parsed, durationMs };
}
