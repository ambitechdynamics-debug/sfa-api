import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { adminService } from './admin.service';

export const adminController = {
  // Memory Definitions
  createMemoryDef: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.createMemoryDef(req.body);
    sendSuccess(res, 'MemoryDefinition created', result, 201);
  }),
  listMemoryDefs: asyncHandler(async (req: Request, res: Response) => {
    const results = await adminService.listMemoryDefs();
    sendSuccess(res, 'MemoryDefinitions retrieved', results);
  }),
  getMemoryDef: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.getMemoryDef(req.params.id);
    sendSuccess(res, 'MemoryDefinition retrieved', result);
  }),
  updateMemoryDef: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.updateMemoryDef(req.params.id, req.body);
    sendSuccess(res, 'MemoryDefinition updated', result);
  }),
  deleteMemoryDef: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.deleteMemoryDef(req.params.id);
    sendSuccess(res, 'MemoryDefinition deleted', result);
  }),

  // Agent Definitions
  createAgentDef: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.createAgentDef(req.body);
    sendSuccess(res, 'AgentDefinition created', result, 201);
  }),
  listAgentDefs: asyncHandler(async (req: Request, res: Response) => {
    const results = await adminService.listAgentDefs();
    sendSuccess(res, 'AgentDefinitions retrieved', results);
  }),
  getAgentDef: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.getAgentDef(req.params.id);
    sendSuccess(res, 'AgentDefinition retrieved', result);
  }),
  updateAgentDef: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.updateAgentDef(req.params.id, req.body);
    sendSuccess(res, 'AgentDefinition updated', result);
  }),
  deleteAgentDef: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.deleteAgentDef(req.params.id);
    sendSuccess(res, 'AgentDefinition deleted', result);
  }),

  // Agent Memory Links
  createAgentMemoryLink: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.createAgentMemoryLink(req.body);
    sendSuccess(res, 'AgentMemoryLink created', result, 201);
  }),
  listAgentMemoryLinks: asyncHandler(async (req: Request, res: Response) => {
    const results = await adminService.listAgentMemoryLinks();
    sendSuccess(res, 'AgentMemoryLinks retrieved', results);
  }),
  getAgentMemoryLinksByAgent: asyncHandler(async (req: Request, res: Response) => {
    const results = await adminService.getAgentMemoryLinksByAgent(req.params.agentId);
    sendSuccess(res, 'AgentMemoryLinks for agent retrieved', results);
  }),
  updateAgentMemoryLink: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.updateAgentMemoryLink(req.params.id, req.body);
    sendSuccess(res, 'AgentMemoryLink updated', result);
  }),
  deleteAgentMemoryLink: asyncHandler(async (req: Request, res: Response) => {
    const result = await adminService.deleteAgentMemoryLink(req.params.id);
    sendSuccess(res, 'AgentMemoryLink deleted', result);
  }),

  // ─── New Admin Endpoints ──────────────────────────────────────────────────

  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getStats();
    sendSuccess(res, 'Admin stats retrieved', stats);
  }),

  listUsers: asyncHandler(async (_req: Request, res: Response) => {
    const users = await adminService.listUsers();
    sendSuccess(res, 'Users retrieved', users);
  }),

  adjustCredits: asyncHandler(async (req: Request, res: Response) => {
    const { amount, reason } = req.body as { amount: number; reason?: string };
    const user = await adminService.adjustCredits(req.params.userId, amount, reason);
    sendSuccess(res, 'Credits adjusted', user);
  }),

  listProjects: asyncHandler(async (_req: Request, res: Response) => {
    const projects = await adminService.listProjects();
    sendSuccess(res, 'Projects retrieved', projects);
  }),

  listPosters: asyncHandler(async (_req: Request, res: Response) => {
    const posters = await adminService.listPosters();
    sendSuccess(res, 'Generated posters retrieved', posters);
  }),

  listFiles: asyncHandler(async (_req: Request, res: Response) => {
    const files = await adminService.listFiles();
    sendSuccess(res, 'Files retrieved', files);
  }),

  listAgentRuns: asyncHandler(async (_req: Request, res: Response) => {
    const runs = await adminService.listAgentRuns();
    sendSuccess(res, 'Agent runs retrieved', runs);
  }),

  listPrompts: asyncHandler(async (_req: Request, res: Response) => {
    const prompts = await adminService.listPrompts();
    sendSuccess(res, 'Prompts retrieved', prompts);
  }),

  listPayments: asyncHandler(async (_req: Request, res: Response) => {
    const payments = await adminService.listPayments();
    sendSuccess(res, 'Payments retrieved', payments);
  }),

  listCreditTransactions: asyncHandler(async (_req: Request, res: Response) => {
    const transactions = await adminService.listCreditTransactions();
    sendSuccess(res, 'Credit transactions retrieved', transactions);
  }),

  getChartData: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.getChartData();
    sendSuccess(res, 'Chart data retrieved', data);
  }),

  getUxMetricsSummary: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.getUxMetricsSummary();
    sendSuccess(res, 'UX metrics summary retrieved', data);
  }),

  deleteUser: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteUser(req.params.id);
    sendSuccess(res, 'User deleted', null);
  }),

  deleteProject: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteProject(req.params.id);
    sendSuccess(res, 'Project deleted', null);
  }),

  deleteFile: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deleteFile(req.params.id);
    sendSuccess(res, 'File deleted', null);
  }),

  deletePoster: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deletePoster(req.params.id);
    sendSuccess(res, 'Poster deleted', null);
  }),

  updatePoster: asyncHandler(async (req: Request, res: Response) => {
    const poster = await adminService.updatePoster(req.params.id, req.body);
    sendSuccess(res, 'Poster updated', poster);
  }),

  getLlmProviders: asyncHandler(async (_req: Request, res: Response) => {
    const providers = await adminService.getLlmProviders();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).json({
      success: true,
      providers,
      data: {
        providers
      }
    });
  }),
};
