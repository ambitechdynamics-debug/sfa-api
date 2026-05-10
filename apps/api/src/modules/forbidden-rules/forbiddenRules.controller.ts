import { Request, Response } from 'express';
import { ForbiddenRuleCategory, ForbiddenRuleSeverity } from '@prisma/client';
import { sendSuccess } from '../../utils/apiResponse';
import { forbiddenRulesService } from './forbiddenRules.service';
import { SearchForbiddenRulesQuery } from './forbiddenRules.validation';

export const forbiddenRulesController = {
  // ─── ADMIN ──────────────────────────────────────────────────────────────────
  create: async (req: Request, res: Response) => {
    const rule = await forbiddenRulesService.create(req.body, req.user?.id);
    return sendSuccess(res, 'Forbidden rule created successfully', rule, 201);
  },

  list: async (req: Request, res: Response) => {
    const query = req.query as unknown as SearchForbiddenRulesQuery;
    const result = await forbiddenRulesService.list(query);
    return sendSuccess(res, 'Forbidden rules retrieved successfully', result);
  },

  getById: async (req: Request, res: Response) => {
    const rule = await forbiddenRulesService.getById(req.params.id);
    return sendSuccess(res, 'Forbidden rule retrieved successfully', rule);
  },

  update: async (req: Request, res: Response) => {
    const rule = await forbiddenRulesService.update(req.params.id, req.body);
    return sendSuccess(res, 'Forbidden rule updated successfully', rule);
  },

  delete: async (req: Request, res: Response) => {
    const result = await forbiddenRulesService.delete(req.params.id);
    return sendSuccess(res, 'Forbidden rule deleted successfully', result);
  },

  toggleStatus: async (req: Request, res: Response) => {
    const rule = await forbiddenRulesService.toggleStatus(req.params.id);
    return sendSuccess(res, 'Forbidden rule status toggled', rule);
  },

  syncToMemory: async (_req: Request, res: Response) => {
    const result = await forbiddenRulesService.syncToGlobalMemory();
    return sendSuccess(res, 'Forbidden rules synced to M-INTERDITS', result);
  },

  seedDefaults: async (_req: Request, res: Response) => {
    const result = await forbiddenRulesService.seedDefaults();
    return sendSuccess(res, 'Default forbidden rules seeded', result, 201);
  },

  // ─── PUBLIC / AGENTS ────────────────────────────────────────────────────────
  active: async (_req: Request, res: Response) => {
    const rules = await forbiddenRulesService.getActive();
    return sendSuccess(res, 'Active forbidden rules retrieved', rules);
  },

  byCategory: async (req: Request, res: Response) => {
    const rules = await forbiddenRulesService.getByCategory(
      req.params.category as Parameters<typeof forbiddenRulesService.getByCategory>[0]
    );
    return sendSuccess(res, 'Forbidden rules retrieved by category', rules);
  },

  /** Returns the synthesized negative_prompt text from active rules */
  buildNegativePrompt: async (req: Request, res: Response) => {
    const category = req.query.category as ForbiddenRuleCategory | undefined;
    const severity = req.query.severity as ForbiddenRuleSeverity | undefined;
    const minSeverity = req.query.minSeverity as ForbiddenRuleSeverity | undefined;

    const text = await forbiddenRulesService.buildNegativePromptFromRules({ category, severity, minSeverity });
    return sendSuccess(res, 'Negative prompt built from active rules', { negative_prompt: text });
  }
};
