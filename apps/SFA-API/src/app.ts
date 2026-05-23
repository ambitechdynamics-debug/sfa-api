import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
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
import stripeRoutes from './modules/stripe/stripe.routes';
import creationOptionsRoutes from './modules/creation-options/creation-options.routes';
import showcaseRoutes from './modules/showcase/showcase.routes';
const app = express();

app.use(helmet());

const ALLOWED_ORIGINS = new Set([
  ...env.APP_URL.split(',').map((o) => o.trim()).filter(Boolean),
  'http://localhost:3000',
  'http://localhost:3001',
  'https://studio-flyer.vercel.app',
  'https://admin-seven-teal-10.vercel.app',
  'https://studio-flyer-ai-admin.vercel.app',
  'https://studio-flyer-ai-client.vercel.app',
  'https://studio-flyer-ai.vercel.app',
]);

function isAllowedOrigin(origin: string) {
  if (ALLOWED_ORIGINS.has(origin)) return true;

  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:') return false;
    return (
      hostname.endsWith('-ambitechdynamics-debugs-projects.vercel.app') ||
      (hostname.includes('studio-flyer-ai') && hostname.endsWith('.vercel.app'))
    );
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
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
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

// ─── Montage des routes — double prefix /api et /api/v1 ─────────────────────
// Les clients existants continuent d'utiliser /api/... sans coupure ; les
// nouveaux peuvent migrer progressivement vers /api/v1/... qui est désormais
// le chemin canonique. Quand tous les clients seront sur v1, on pourra
// déprécier puis retirer /api/ "nu".
//
// ⚠️ Les sous-routes sous /api/admin/* (ex: /api/admin/settings) doivent
// être déclarées AVANT adminRoutes dans la liste — Express respecte l'ordre
// de mount.
const ROUTE_MOUNTS = [
  { path: '/auth',           handler: authRoutes },
  { path: '/users',          handler: usersRoutes },
  { path: '/projects',       handler: projectsRoutes },
  { path: '/projects',       handler: memoryRoutes },
  { path: '/projects',       handler: orchestratorRoutes },
  { path: '/projects',       handler: imageGenRoutes },
  { path: '/agents',         handler: agentsRoutes },
  { path: '/agents-dynamic', handler: agentsDynamicRoutes },
  { path: '',                handler: artisticBaseRoutes },
  { path: '',                handler: forbiddenRulesRoutes },
  { path: '',                handler: filesRoutes },
  { path: '/admin/settings', handler: settingsRoutes }, // AVANT /admin
  { path: '/admin',          handler: adminRoutes },
  { path: '/ux-metrics',     handler: uxMetricsRoutes },
  { path: '/metrics',        handler: metricsRoutes },
  { path: '/chat',           handler: chatRoutes },
  { path: '/conversations',  handler: conversationsRoutes },
  { path: '/stripe',         handler: stripeRoutes },
  { path: '/creation-options', handler: creationOptionsRoutes },
  { path: '/showcase',       handler: showcaseRoutes },
];

for (const prefix of ['/api', '/api/v1']) {
  for (const { path, handler } of ROUTE_MOUNTS) {
    app.use(`${prefix}${path}`, handler);
  }
}

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
