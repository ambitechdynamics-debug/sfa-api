import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { logger } from './utils/logger';
import { settingsService } from './modules/settings/settings.service';
import { forbiddenRulesService } from './modules/forbidden-rules/forbiddenRules.service';

const server = app.listen(env.PORT, async () => {
  logger.info(`STUDIO FLYER AI backend listening on port ${env.PORT}`);
  // Seed default app settings (no-op if already seeded)
  try {
    const { created } = await settingsService.seed();
    if (created > 0) logger.info(`AppSettings: ${created} default keys seeded`);
  } catch (err) {
    logger.error('AppSettings seed failed (non-blocking):', err);
  }
  // Seed default forbidden rules (no-op if already seeded)
  try {
    const { created } = await forbiddenRulesService.seedDefaults();
    if (created > 0) logger.info(`ForbiddenRules: ${created} default rules seeded`);
  } catch (err) {
    logger.error('ForbiddenRules seed failed (non-blocking):', err);
  }
});

const shutdown = async () => {
  logger.info('Shutting down server...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
