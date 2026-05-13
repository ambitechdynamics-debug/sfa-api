import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';

export const conversationsService = {
  async getConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        projectId: true,
        createdAt: true,
        updatedAt: true
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

  async updateConversationTitle(id: string, userId: string, title: string) {
    const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
    if (!conversation) throw new AppError('Conversation not found', 404);

    return prisma.conversation.update({
      where: { id },
      data: { title }
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
