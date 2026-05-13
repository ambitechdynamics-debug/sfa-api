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
