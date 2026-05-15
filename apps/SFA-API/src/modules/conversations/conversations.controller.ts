import { Request, Response } from 'express';
import { conversationsService } from './conversations.service';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  archived: z.boolean().optional()
});

const createSchema = z.object({
  title: z.string().min(1).max(255),
  projectId: z.string().optional()
});

export const conversationsController = {
  async getConversations(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) throw new Error('User missing in request');

    const conversations = await conversationsService.getConversations(userId);
    res.json({ success: true, data: conversations });
  },

  async getConversationById(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) throw new Error('User missing in request');
    const { id } = req.params;

    const conversation = await conversationsService.getConversationById(id, userId);
    res.json({ success: true, data: conversation });
  },

  async createConversation(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) throw new Error('User missing in request');
    
    const { title, projectId } = createSchema.parse(req.body);
    const conversation = await conversationsService.createConversation(userId, title, projectId);
    res.status(201).json({ success: true, data: conversation });
  },

  async updateConversation(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) throw new Error('User missing in request');
    const { id } = req.params;
    const { title, archived } = updateSchema.parse(req.body);

    const status = archived === true ? 'ARCHIVED' : archived === false ? 'ACTIVE' : undefined;

    const conversation = await conversationsService.updateConversation(id, userId, { title, status });
    res.json({ success: true, data: conversation });
  },

  async deleteConversation(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) throw new Error('User missing in request');
    const { id } = req.params;

    await conversationsService.deleteConversation(id, userId);
    res.json({ success: true, data: null });
  }
};
