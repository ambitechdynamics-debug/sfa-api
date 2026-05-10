// Types partagés pour le service IA générique

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'mock';

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

export interface AIProviderAdapter {
  callText(options: CallTextAIOptions): Promise<string>;
  callVision(options: CallVisionAIOptions): Promise<string>;
}
