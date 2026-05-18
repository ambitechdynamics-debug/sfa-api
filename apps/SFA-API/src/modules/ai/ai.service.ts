/**
 * Service IA générique.
 * Expose callTextAI() et callVisionAI() avec auto-sélection du provider
 * selon les variables d'environnement ou le paramètre explicite.
 */

import { CallTextAIOptions, CallVisionAIOptions, AIProvider, AIResponse } from './ai.types';
import { createProvider } from './ai.providers';
import { safeJsonParseAIResponse } from './ai.validation';
import { settingsService } from '../settings/settings.service';

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
  let provider = resolveProvider(options.provider, 'AI_DEFAULT_VISION_PROVIDER');
  let adapter = await createProvider(provider);

  // 1. Detect if the provider does not support vision or is DeepSeek
  if (!adapter.capabilities.supportsVision || provider.toLowerCase().includes('deepseek')) {
    // Resolve the default vision provider from settings database or environment
    const defaultVisionProvider = await settingsService.resolve('image_gen_provider', 'AI_DEFAULT_VISION_PROVIDER') || 'gemini';
    
    if (defaultVisionProvider !== provider) {
      try {
        const fallbackAdapter = await createProvider(defaultVisionProvider);
        if (fallbackAdapter.capabilities.supportsVision && !defaultVisionProvider.toLowerCase().includes('deepseek')) {
          provider = defaultVisionProvider;
          adapter = fallbackAdapter;
        } else {
          // Iterate over standard vision-capable built-ins
          const builtIns = ['gemini', 'openai', 'anthropic', 'mock'];
          let found = false;
          for (const p of builtIns) {
            const tempAdapter = await createProvider(p);
            if (tempAdapter.capabilities.supportsVision) {
              provider = p;
              adapter = tempAdapter;
              found = true;
              break;
            }
          }
          if (!found) {
            throw new Error("Aucun fournisseur d'IA supportant la vision n'est configuré.");
          }
        }
      } catch {
        provider = 'gemini';
        adapter = await createProvider('gemini');
      }
    } else {
      // Find any active standard provider that supports vision
      const builtIns = ['gemini', 'openai', 'anthropic', 'mock'];
      let found = false;
      for (const p of builtIns) {
        const tempAdapter = await createProvider(p);
        if (tempAdapter.capabilities.supportsVision) {
          provider = p;
          adapter = tempAdapter;
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error("Aucun fournisseur d'IA supportant la vision n'est configuré.");
      }
    }
  }

  // 2. Strict backend validation
  if (!adapter.capabilities.supportsVision) {
    throw new Error(`Le fournisseur "${provider}" ne supporte pas l'analyse d'images/multimodale.`);
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
