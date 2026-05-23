import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { logger } from './utils/logger';
import { settingsService } from './modules/settings/settings.service';
import { forbiddenRulesService } from './modules/forbidden-rules/forbiddenRules.service';
import { adminService } from './modules/admin/admin.service';

// ─── Cleanup auto des projets bloqués ──────────────────────────────────────
// Toutes les 10 min, ramène les projets coincés dans un état transitoire
// (GENERATING > 5 min, ANALYZING > 10 min, QUESTIONING > 60 min) à un état
// stable (FAILED ou DRAFT). Désactivable via AppSetting `auto_cleanup_enabled=false`.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | undefined;

async function runScheduledCleanup() {
  try {
    const enabledRaw = await settingsService.getRaw('auto_cleanup_enabled');
    if (enabledRaw && enabledRaw.trim().toLowerCase() === 'false') return;
    const result = await adminService.cleanupStaleProjects();
    if (result.total > 0) {
      logger.info('[scheduled-cleanup] reset stale projects', result.reset);
    }
  } catch (err) {
    logger.warn('[scheduled-cleanup] error (non-blocking):', err instanceof Error ? err.message : err);
  }
}

const server = app.listen(env.PORT, '0.0.0.0', async () => {
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

  // Cleanup auto — un premier passage juste après le boot, puis toutes les 10 min.
  cleanupTimer = setInterval(runScheduledCleanup, CLEANUP_INTERVAL_MS);
  cleanupTimer.unref?.(); // ne bloque pas l'arrêt du process
  void runScheduledCleanup();
  logger.info(`[scheduled-cleanup] enabled — every ${CLEANUP_INTERVAL_MS / 60_000} min`);
});

const shutdown = async () => {
  logger.info('Shutting down server...');
  if (cleanupTimer) clearInterval(cleanupTimer);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
