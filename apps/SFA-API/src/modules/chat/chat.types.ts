export type ChatRole = 'user' | 'assistant';

export interface ChatHistoryMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequestInput {
  message: string;
  conversationId?: string;
  projectId?: string;
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
  conversationId: string;
  projectId?: string;
  title?: string;
}

export interface ChatOpeningInput {
  projectId: string;
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
  conversationId: string;
  projectId: string;
  hasAssets: boolean;
  assetSummary: Record<string, number>;
  reused: boolean;
}
