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
const DEFAULT_NEON_AUTH_ISSUER =
  'https://ep-blue-night-akk7bv95.neonauth.c-3.us-west-2.aws.neon.tech/neondb/auth';
const DEFAULT_NEON_AUTH_JWKS_URL = `${DEFAULT_NEON_AUTH_ISSUER}/.well-known/jwks.json`;

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
  AI_DEFAULT_TEXT_MODEL: emptyToUndefined,
  AI_DEFAULT_VISION_MODEL: emptyToUndefined,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('studio-flyer-ai'),

  // Neon Auth — JWT verification via JWKS (OIDC standard).
  // Set NEON_AUTH_ENABLED=true and provide issuer + JWKS URL from your
  // Neon project (console.neon.tech → Auth → endpoints).
  NEON_AUTH_ENABLED: z
    .preprocess(
      (val) => {
        if (val === undefined || val === '') {
          return process.env.NODE_ENV === 'production' ? 'true' : 'false';
        }
        return typeof val === 'string' ? val.toLowerCase() : val;
      },
      z.enum(['true', 'false'])
    )
    .transform((v) => v === 'true'),
  /** Issuer URL — value of the `iss` claim in tokens. Example:
   *  https://ep-xxx.neonauth.<region>.aws.neon.tech/<db>/auth */
  NEON_AUTH_ISSUER: z
    .preprocess((val) => (val === '' ? undefined : val), z.string().url().optional())
    .default(DEFAULT_NEON_AUTH_ISSUER),
  /** JWKS URL — public keys used to verify token signatures. Example:
   *  https://ep-xxx.neonauth.<region>.aws.neon.tech/<db>/auth/.well-known/jwks.json */
  NEON_AUTH_JWKS_URL: z
    .preprocess((val) => (val === '' ? undefined : val), z.string().url().optional())
    .default(DEFAULT_NEON_AUTH_JWKS_URL),
  /** Optional `aud` claim to enforce. */
  NEON_AUTH_AUDIENCE: emptyToUndefined,

  // Stripe configurations
  STRIPE_SECRET_KEY: emptyToUndefined,
  STRIPE_WEBHOOK_SECRET: emptyToUndefined,
  STRIPE_PRICE_STARTER_MONTHLY: emptyToUndefined,
  STRIPE_PRICE_STARTER_YEARLY: emptyToUndefined,
  STRIPE_PRICE_PRO_MONTHLY: emptyToUndefined,
  STRIPE_PRICE_PRO_YEARLY: emptyToUndefined,
  STRIPE_PRICE_BUSINESS_MONTHLY: emptyToUndefined,
  STRIPE_PRICE_BUSINESS_YEARLY: emptyToUndefined,
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsedEnv.data;
