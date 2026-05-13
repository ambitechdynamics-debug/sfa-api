import { describe, expect, it } from 'vitest';
import { buildChatMessages } from '../chat.service';
import { chatRequestSchema } from '../chat.validation';

describe('chat module', () => {
  it('rejects an empty message', () => {
    expect(chatRequestSchema.safeParse({ message: '   ' }).success).toBe(false);
  });

  it('accepts a message with conversation history', () => {
    const result = chatRequestSchema.safeParse({
      message: 'Créer une affiche premium',
      conversationId: 'conv_123',
      history: [
        { role: 'user', content: 'Bonjour' },
        { role: 'assistant', content: 'Bonjour, quel visuel souhaitez-vous créer ?' }
      ]
    });

    expect(result.success).toBe(true);
  });

  it('defaults missing history and optional ids safely', () => {
    const result = chatRequestSchema.safeParse({
      message: 'Créer un flyer professionnel pour mon restaurant',
      conversationId: null,
      projectId: ''
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.history).toEqual([]);
      expect(result.data.conversationId).toBeUndefined();
      expect(result.data.projectId).toBeUndefined();
    }
  });

  it('builds OpenAI-compatible messages with system prompt first', () => {
    const messages = buildChatMessages(
      [
        { role: 'user', content: 'Je veux un flyer' },
        { role: 'assistant', content: 'Quel style souhaitez-vous ?' }
      ],
      'Un style luxe'
    );

    expect(messages[0]?.role).toBe('system');
    expect(messages[0]?.content).toContain('assistant IA de Flyer Studio');
    expect(messages.at(-1)).toEqual({ role: 'user', content: 'Un style luxe' });
  });
});
