import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { chatService } from './chat.service';
import { chatOpeningRequestSchema, chatRequestSchema } from './chat.validation';

function chatErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message === 'AI_PROVIDER_NOT_CONFIGURED') {
    return {
      status: 503,
      error: 'Configuration IA manquante côté serveur.'
    };
  }

  if (message.includes('Clé ') && message.includes('manquante')) {
    return {
      status: 503,
      error: 'Configuration IA manquante côté serveur.'
    };
  }

  if (message.startsWith('AI provider error') || message.includes('AI provider returned')) {
    return {
      status: 502,
      error: 'Le service IA est temporairement indisponible. Veuillez réessayer.'
    };
  }

  if (message === 'Travail not found or unauthorized') {
    return {
      status: 404,
      error: 'Travail introuvable.'
    };
  }

  return {
    status: 500,
    error: 'Une erreur est survenue. Veuillez réessayer.'
  };
}

export const chatController = {
  sendMessage: async (req: Request, res: Response) => {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      logger.warn('[chat] invalid request body', fieldErrors);
      // Surface the actual missing/invalid field instead of a generic phrase —
      // critical to diagnose cache-stale clients (old payload shape).
      const firstMissing = Object.entries(fieldErrors).find(([, msgs]) => Array.isArray(msgs) && msgs.length > 0);
      const message = firstMissing
        ? `Requête invalide : ${firstMissing[0]} ${firstMissing[1]?.[0] ?? 'invalide'}`
        : 'Requête invalide.';
      return res.status(400).json({
        success: false,
        error: message,
        fieldErrors,
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
      const result = await chatService.sendMessage(parsed.data, userId);
      return res.json(result);
    } catch (error) {
      logger.error('[chat] request failed', error instanceof Error ? error.message : error);
      const response = chatErrorResponse(error);
      return res.status(response.status).json({
        success: false,
        error: response.error
      });
    }
  },

  generateOpening: async (req: Request, res: Response) => {
    const parsed = chatOpeningRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('[chat/opening] invalid request body', parsed.error.flatten().fieldErrors);
      return res.status(400).json({
        success: false,
        error: 'travailId requis.',
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
      const result = await chatService.generateOpening(parsed.data, userId);
      return res.json(result);
    } catch (error) {
      logger.error('[chat/opening] request failed', error instanceof Error ? error.message : error);
      const response = chatErrorResponse(error);
      return res.status(response.status).json({
        success: false,
        error: response.error,
      });
    }
  },
};
