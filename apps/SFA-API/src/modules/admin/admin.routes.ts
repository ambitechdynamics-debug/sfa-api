import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { adminController } from './admin.controller';
import {
  createMemoryDefSchema,
  updateMemoryDefSchema,
  createAgentDefSchema,
  updateAgentDefSchema,
  createAgentMemoryLinkSchema,
  updateAgentMemoryLinkSchema,
  orchestratorPipelineConfigSchema,
  chatAgentConfigSchema,
  artisticVisionConfigSchema
} from './admin.validation';
import { AppError } from '../../utils/appError';

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new AppError('Accès interdit. Rôle administrateur requis.', 403));
  }
  next();
};

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

// ─── LLM Providers ──────────────────────────────────────────────────────────
router.get('/llm-providers', adminController.getLlmProviders);

// ─── Dashboard ──────────────────────────────────────────────────────────────
router.get('/stats', adminController.getStats);
router.get('/chart-data', adminController.getChartData);
router.get('/metrics/summary', adminController.getUxMetricsSummary);

// ─── Users ──────────────────────────────────────────────────────────────────
router.get('/users', adminController.listUsers);
router.post('/users/:userId/credits', adminController.adjustCredits);
router.delete('/users/:id', adminController.deleteUser);

// ─── Projects ───────────────────────────────────────────────────────────────
router.get('/projects', adminController.listProjects);
router.post('/projects/cleanup-stale', adminController.cleanupStaleProjects);
router.delete('/projects/:id', adminController.deleteProject);

// ─── Generated Posters ──────────────────────────────────────────────────────
router.get('/generated-posters', adminController.listPosters);
router.patch('/generated-posters/:id', adminController.updatePoster);
router.delete('/generated-posters/:id', adminController.deletePoster);

// ─── Files ──────────────────────────────────────────────────────────────────
router.get('/files', adminController.listFiles);
router.delete('/files/:id', adminController.deleteFile);

// ─── Agent Runs ─────────────────────────────────────────────────────────────
router.get('/agent-runs', adminController.listAgentRuns);

// ─── Prompts (M-PROMPT1 MemoryEntries) ──────────────────────────────────────
router.get('/prompts', adminController.listPrompts);

// ─── Subscriptions ───────────────────────────────────────────────────────────
router.get('/subscriptions', adminController.listSubscriptions)
router.patch('/subscriptions/:planId', adminController.updateSubscription)

// ─── Payments ───────────────────────────────────────────────────────────────
router.get('/payments', adminController.listPayments)
router.post('/payments/:id/refund', adminController.refundPayment)
router.post('/payments/:id/verify', adminController.verifyPayment);

// ─── Credit Transactions ────────────────────────────────────────────────────
router.get('/credits', adminController.listCreditTransactions);

// ─── Memory Definitions ─────────────────────────────────────────────────────
router.post('/memory-definitions', validate({ body: createMemoryDefSchema }), adminController.createMemoryDef);
router.get('/memory-definitions', adminController.listMemoryDefs);
router.get('/memory-definitions/:id', adminController.getMemoryDef);
router.patch('/memory-definitions/:id', validate({ body: updateMemoryDefSchema }), adminController.updateMemoryDef);
router.delete('/memory-definitions/:id', adminController.deleteMemoryDef);

// ─── Agent Definitions ──────────────────────────────────────────────────────
router.post('/agent-definitions', validate({ body: createAgentDefSchema }), adminController.createAgentDef);
router.get('/agent-definitions', adminController.listAgentDefs);
router.get('/agent-definitions/:id', adminController.getAgentDef);
router.patch('/agent-definitions/:id', validate({ body: updateAgentDefSchema }), adminController.updateAgentDef);
router.delete('/agent-definitions/:id', adminController.deleteAgentDef);

// ─── Agent Memory Links ──────────────────────────────────────────────────────
router.post('/agent-memory-links', validate({ body: createAgentMemoryLinkSchema }), adminController.createAgentMemoryLink);
router.get('/agent-memory-links', adminController.listAgentMemoryLinks);
router.get('/agent-definitions/:agentId/memories', adminController.getAgentMemoryLinksByAgent);
router.patch('/agent-memory-links/:id', validate({ body: updateAgentMemoryLinkSchema }), adminController.updateAgentMemoryLink);
router.delete('/agent-memory-links/:id', adminController.deleteAgentMemoryLink);

// ─── Orchestrator Pipeline ──────────────────────────────────────────────────
router.get('/orchestrator-pipeline', adminController.getOrchestratorPipeline);
router.put('/orchestrator-pipeline', validate({ body: orchestratorPipelineConfigSchema }), adminController.saveOrchestratorPipeline);
router.post('/orchestrator-pipeline/reset', adminController.resetOrchestratorPipeline);

// ─── Chat Agent Configuration ───────────────────────────────────────────────
router.get('/chat-agent-config', adminController.getChatAgentConfig);
router.put('/chat-agent-config', validate({ body: chatAgentConfigSchema }), adminController.saveChatAgentConfig);

// ─── Artistic Vision Configuration ──────────────────────────────────────────
router.get('/artistic-vision-config', adminController.getArtisticVisionConfig);
router.put('/artistic-vision-config', validate({ body: artisticVisionConfigSchema }), adminController.saveArtisticVisionConfig);

export default router;
