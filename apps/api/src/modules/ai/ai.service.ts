/**
 * Service IA générique.
 * Expose callTextAI() et callVisionAI() avec auto-sélection du provider
 * selon les variables d'environnement ou le paramètre explicite.
 */

import { CallTextAIOptions, CallVisionAIOptions, AIProvider, AIResponse } from './ai.types';
import { createProvider } from './ai.providers';
import { safeJsonParseAIResponse } from './ai.validation';

function resolveProvider(explicit?: AIProvider, envKey = 'AI_DEFAULT_TEXT_PROVIDER'): AIProvider {
  if (explicit) return explicit;
  const fromEnv = process.env[envKey];
  if (fromEnv && ['openai', 'anthropic', 'gemini', 'mock'].includes(fromEnv)) {
    return fromEnv as AIProvider;
  }
  return 'mock';
}

export async function callTextAI(options: CallTextAIOptions): Promise<AIResponse> {
  const provider = resolveProvider(options.provider, 'AI_DEFAULT_TEXT_PROVIDER');
  const model = options.model ?? process.env.AI_DEFAULT_TEXT_MODEL ?? 'mock-text';

  const adapter = await createProvider(provider);
  const start = Date.now();

  const rawContent = await adapter.callText({ ...options, provider, model });

  const durationMs = Date.now() - start;

  let parsed: unknown = rawContent;
  if (options.responseFormat === 'json') {
    const result = safeJsonParseAIResponse(rawContent);
    parsed = result.success ? result.data : { _parseError: result.error, _raw: result.raw };
  }

  return { provider, model, rawContent, parsed, durationMs };
}

export async function callVisionAI(options: CallVisionAIOptions): Promise<AIResponse> {
  const provider = resolveProvider(options.provider, 'AI_DEFAULT_VISION_PROVIDER');
  const model = options.model ?? process.env.AI_DEFAULT_VISION_MODEL ?? 'mock-vision';

  const adapter = await createProvider(provider);
  const start = Date.now();

  const rawContent = await adapter.callVision({ ...options, provider, model });

  const durationMs = Date.now() - start;

  let parsed: unknown = rawContent;
  if (options.responseFormat === 'json') {
    const result = safeJsonParseAIResponse(rawContent);
    parsed = result.success ? result.data : { _parseError: result.error, _raw: result.raw };
  }

  return { provider, model, rawContent, parsed, durationMs };
}
