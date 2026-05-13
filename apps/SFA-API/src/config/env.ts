import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

function loadEnvFile(filePath: string, override = false) {
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override });
  }
}

function loadEnvFiles(dir: string, localOverride: boolean) {
  loadEnvFile(path.join(dir, '.env'));
  loadEnvFile(path.join(dir, '.env.local'), localOverride);
}

// Load app env first; allow local developer values to override app defaults.
loadEnvFiles(process.cwd(), true);

// Monorepo support: load parent env files for any still-missing values.
if (process.env.NODE_ENV !== 'production') {
  let currentDir = path.dirname(process.cwd());
  while (currentDir !== path.parse(currentDir).root) {
    loadEnvFiles(currentDir, false);
    currentDir = path.dirname(currentDir);
  }
}

/**
 * Helper to treat empty strings as undefined.
 * Useful when .env files have keys with no values (e.g., PORT=).
 */
const emptyToUndefined = z.preprocess((val) => (val === '' ? undefined : val), z.string().optional());
const emptyToUndefinedUrl = z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().int().positive().default(5000)
  ),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  APP_URL: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(1).default('http://localhost:3000')
  ),

  // AI Providers
  AI_API_KEY: emptyToUndefined,
  AI_API_URL: emptyToUndefinedUrl,
  AI_MODEL: emptyToUndefined,
  OPENAI_API_KEY: emptyToUndefined,
  ANTHROPIC_API_KEY: emptyToUndefined,
  GEMINI_API_KEY: emptyToUndefined,
  AI_DEFAULT_TEXT_PROVIDER: z.string().default('mock'),
  AI_DEFAULT_VISION_PROVIDER: z.string().default('mock'),
  AI_DEFAULT_TEXT_MODEL: z.string().default('gpt-4o'),
  AI_DEFAULT_VISION_MODEL: z.string().default('gpt-4o'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('studio-flyer-ai'),

  // Neon Auth — JWT verification via JWKS (OIDC standard).
  // Set NEON_AUTH_ENABLED=true and provide issuer + JWKS URL from your
  // Neon project (console.neon.tech → Auth → endpoints).
  NEON_AUTH_ENABLED: z
    .preprocess((val) => (typeof val === 'string' ? val.toLowerCase() : val), z.enum(['true', 'false']))
    .default('false')
    .transform((v) => v === 'true'),
  /** Issuer URL — value of the `iss` claim in tokens. Example:
   *  https://ep-xxx.neonauth.<region>.aws.neon.tech/<db>/auth */
  NEON_AUTH_ISSUER: emptyToUndefinedUrl,
  /** JWKS URL — public keys used to verify token signatures. Example:
   *  https://ep-xxx.neonauth.<region>.aws.neon.tech/<db>/auth/.well-known/jwks.json */
  NEON_AUTH_JWKS_URL: emptyToUndefinedUrl,
  /** Optional `aud` claim to enforce. */
  NEON_AUTH_AUDIENCE: emptyToUndefined,
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsedEnv.data;
