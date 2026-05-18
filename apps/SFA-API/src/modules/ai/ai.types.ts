// Types partagés pour le service IA générique

export type AIProvider = string;

export const BUILT_IN_PROVIDERS = ['openai', 'anthropic', 'gemini', 'mock'] as const;

export type CustomProviderType = 'openai-compatible' | 'anthropic-compatible' | 'gemini-compatible';

export interface CustomAIProvider {
  id: string;
  name: string;
  type: CustomProviderType;
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  isActive: boolean;
}

export interface CallTextAIOptions {
  provider?: AIProvider;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  responseFormat?: 'json' | 'text';
}

export interface CallVisionAIOptions {
  provider?: AIProvider;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  imageUrls: string[];
  temperature?: number;
  responseFormat?: 'json' | 'text';
}

export interface AIResponse {
  provider: AIProvider;
  model: string;
  rawContent: string;
  parsed: unknown;
  durationMs: number;
}

export interface AIProviderCapabilities {
  supportsText: boolean;
  supportsVision: boolean;
  supportsReasoning: boolean;
  supportsImageGeneration: boolean;
}

export interface AIProviderAdapter {
  capabilities: AIProviderCapabilities;
  callText(options: CallTextAIOptions): Promise<string>;
  callVision(options: CallVisionAIOptions): Promise<string>;
}
