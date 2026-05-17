import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { prisma } from './config/database';
import { GeneratedPosterStatus } from '@prisma/client';
import { notFoundMiddleware, errorMiddleware } from './middlewares/error.middleware';
import artisticBaseRoutes from './modules/artistic-base/artisticBase.routes';
import authRoutes from './modules/auth/auth.routes';
import filesRoutes from './modules/files/files.routes';
import memoryRoutes from './modules/memory/memory.routes';
import projectsRoutes from './modules/projects/projects.routes';
import usersRoutes from './modules/users/users.routes';
import agentsRoutes from './modules/agents/agents.routes';
import orchestratorRoutes from './modules/orchestrator/promptOrchestrator.routes';
import adminRoutes from './modules/admin/admin.routes';
import agentsDynamicRoutes from './modules/agents-dynamic/agentsDynamic.routes';
import settingsRoutes from './modules/settings/settings.routes';
import forbiddenRulesRoutes from './modules/forbidden-rules/forbiddenRules.routes';
import imageGenRoutes from './modules/image-generation/imageGen.routes';
import uxMetricsRoutes from './modules/ux-metrics/uxMetrics.routes';
import metricsRoutes from './modules/metrics/metrics.routes';
import chatRoutes from './modules/chat/chat.routes';
import conversationsRoutes from './modules/conversations/conversations.routes';
const app = express();

app.use(helmet());
// CORS — APP_URL accepts a comma-separated list of allowed origins, so we can
// expose the same backend to both the public client (port 3001 / Vercel) and
// the admin dashboard (port 3000 / Vercel) without code changes.
const ALLOWED_ORIGINS = new Set([
  ...env.APP_URL.split(',').map((o) => o.trim()).filter(Boolean),
  'http://localhost:3000',
  'http://localhost:3001',
  'https://studio-flyer.vercel.app',
  'https://admin-seven-teal-10.vercel.app',
]);

function isAllowedOrigin(origin: string) {
  if (ALLOWED_ORIGINS.has(origin)) return true;

  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('-ambitechdynamics-debugs-projects.vercel.app');
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / curl (no Origin header) and any whitelisted origin.
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'STUDIO FLYER AI backend is running',
    data: {
      uptime: process.uptime()
    }
  });
});

app.get('/api/showcase/visuals', async (_req, res, next) => {
  try {
    const posters = await prisma.generatedPoster.findMany({
      where: {
        status: GeneratedPosterStatus.GENERATED,
        OR: [
          { isExample: true },
          { qualityScore: { gte: 80 } }
        ]
      },
      orderBy: [
        { isExample: 'desc' },
        { qualityScore: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 12,
      select: {
        id: true,
        imageUrl: true,
        promptUsed: true,
        qualityScore: true,
        isExample: true,
        createdAt: true,
        project: {
          select: {
            title: true,
            category: true,
          }
        }
      }
    });

    const visuals = posters.map(poster => ({
      id: poster.id,
      title: poster.project?.title || poster.promptUsed || 'Affiche Studio Flyer AI',
      imageUrl: poster.imageUrl,
      category: poster.project?.category || 'Création',
      createdAt: poster.createdAt.toISOString(),
      isFeatured: poster.isExample,
      qualityScore: poster.qualityScore || 0,
    }));

    res.json(visuals);
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/projects', memoryRoutes);
app.use('/api/projects', orchestratorRoutes);
app.use('/api/projects', imageGenRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/agents-dynamic', agentsDynamicRoutes);
// ⚠️  Les routes qui définissent des sous-chemins sous /api/admin/* doivent être
// montées AVANT app.use('/api/admin', adminRoutes) pour éviter que le routeur
// admin n'intercepte et ne renvoie un 404 avant d'atteindre leurs handlers.
app.use('/api', artisticBaseRoutes);
app.use('/api', forbiddenRulesRoutes);
app.use('/api', filesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/ux-metrics', uxMetricsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationsRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
