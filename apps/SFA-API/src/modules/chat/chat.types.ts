export type ChatRole = 'user' | 'assistant';

export interface ChatHistoryMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequestInput {
  message: string;
  travailId: string;
  history?: ChatHistoryMessage[];
  visualConfig?: Record<string, unknown>;
}

export interface ChatResponsePayload {
  success: true;
  reply: string;
  message: {
    role: 'assistant';
    content: string;
  };
  travailId: string;
  projectId: string;
}

export interface ChatOpeningInput {
  travailId: string;
  visualConfig?: Record<string, unknown>;
}

export interface ChatOpeningPayload {
  success: true;
  opening: string;
  message: {
    id: string;
    role: 'assistant';
    content: string;
    createdAt: string;
  };
  travailId: string;
  projectId: string;
  hasAssets: boolean;
  assetSummary: Record<string, number>;
  reused: boolean;
}
