import { describe, expect, it } from 'vitest';
import { buildChatMessages } from '../chat.service';
import { chatRequestSchema } from '../chat.validation';

describe('chat module', () => {
  it('rejects an empty message', () => {
    expect(chatRequestSchema.safeParse({ message: '   ', travailId: 'trv_1' }).success).toBe(false);
  });

  it('rejects a missing travailId', () => {
    expect(chatRequestSchema.safeParse({ message: 'Salut' }).success).toBe(false);
  });

  it('accepts a message with conversation history', () => {
    const result = chatRequestSchema.safeParse({
      message: 'Créer une affiche premium',
      travailId: 'trv_123',
      history: [
        { role: 'user', content: 'Bonjour' },
        { role: 'assistant', content: 'Bonjour, quel visuel souhaitez-vous créer ?' }
      ]
    });

    expect(result.success).toBe(true);
  });

  it('defaults missing history safely', () => {
    const result = chatRequestSchema.safeParse({
      message: 'Créer un flyer professionnel pour mon restaurant',
      travailId: 'trv_x'
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.history).toEqual([]);
      expect(result.data.travailId).toBe('trv_x');
    }
  });

  it('builds OpenAI-compatible messages with system prompt first', () => {
    const messages = buildChatMessages(
      [
        { role: 'user', content: 'Je veux un flyer' },
        { role: 'assistant', content: 'Quel style souhaitez-vous ?' }
      ],
      'Un style luxe',
      'Prompt système lu depuis AppSetting.'
    );

    expect(messages[0]?.role).toBe('system');
    expect(messages[0]?.content).toContain('Prompt système lu depuis AppSetting.');
    expect(messages.at(-1)).toEqual({ role: 'user', content: 'Un style luxe' });
  });
});
