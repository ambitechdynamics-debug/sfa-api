import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const MAX_DB_ATTEMPTS = 3;
const DB_RETRY_DELAY_MS = 500;

export const DATABASE_UNAVAILABLE_MESSAGE =
  'Base de données temporairement indisponible. Réessayez dans quelques secondes.';

type PrismaConnectionError = {
  name?: string;
  message?: string;
  code?: string;
  errorCode?: string;
};

export const isPrismaConnectionError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as PrismaConnectionError;
  const message = candidate.message ?? '';

  return (
    candidate.name === 'PrismaClientInitializationError' ||
    candidate.code === 'P1001' ||
    candidate.errorCode === 'P1001' ||
    message.includes("Can't reach database server") ||
    message.includes('Timed out fetching a new connection')
  );
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          let lastError: unknown;

          for (let attempt = 1; attempt <= MAX_DB_ATTEMPTS; attempt += 1) {
            try {
              return await query(args);
            } catch (error) {
              lastError = error;

              if (!isPrismaConnectionError(error) || attempt === MAX_DB_ATTEMPTS) {
                throw error;
              }

              logger.warn('Prisma connection failed; retrying with a fresh connection', {
                attempt,
                maxAttempts: MAX_DB_ATTEMPTS
              });

              await client.$disconnect().catch(() => undefined);
              await wait(attempt * DB_RETRY_DELAY_MS);
            }
          }

          throw lastError;
        }
      }
    }
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
