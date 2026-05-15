import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';

export const conversationsService = {
  async getConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { lastMessageAt: 'desc' },
      select: {
        id: true,
        title: true,
        projectId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastMessageAt: true
      }
    });
  },

  async getConversationById(id: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    return {
      ...conversation,
      messages: conversation.messages.map((message) => ({
        ...message,
        role: message.role.toLowerCase()
      }))
    };
  },

  async createConversation(userId: string, title: string, projectId?: string) {
    return prisma.conversation.create({
      data: {
        userId,
        title,
        projectId
      }
    });
  },

  async updateConversation(id: string, userId: string, data: { title?: string; status?: 'ACTIVE' | 'ARCHIVED' }) {
    const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
    if (!conversation) throw new AppError('Conversation not found', 404);

    return prisma.conversation.update({
      where: { id },
      data
    });
  },

  async deleteConversation(id: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
    if (!conversation) throw new AppError('Conversation not found', 404);

    return prisma.conversation.delete({
      where: { id }
    });
  }
};
