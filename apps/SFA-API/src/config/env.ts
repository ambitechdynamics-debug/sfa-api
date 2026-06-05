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
const requiredInProduction = (name: string) =>
  z.preprocess(
    (val) => (val === '' ? undefined : val),
    process.env.NODE_ENV === 'production'
      ? z.string().min(1, `${name} is required`)
      : z.string().optional()
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().int().positive().default(5000)
  ),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  APP_URL: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(1).default('http://localhost:3000')
  ),

  // Clerk is the authentication provider for the end-user client app
  // (apps/client). The admin dashboard (apps/admin) uses a separate
  // email+password flow signed with ADMIN_JWT_SECRET — see auth.middleware.ts
  // (Clerk) and adminJwt.middleware.ts (admin JWT).
  CLERK_SECRET_KEY: requiredInProduction('CLERK_SECRET_KEY'),
  CLERK_PUBLISHABLE_KEY: emptyToUndefined,

  // Admin auth (email + password → JWT). Distinct from Clerk so the admin
  // dashboard can sign in without going through the user identity provider.
  ADMIN_JWT_SECRET: z.preprocess(
    (val) => (val === '' ? undefined : val),
    process.env.NODE_ENV === 'production'
      ? z.string().min(32, 'ADMIN_JWT_SECRET must be at least 32 chars in production')
      : z.string().min(8).default('local-dev-admin-jwt-secret-please-change')
  ),
  ADMIN_JWT_EXPIRES_IN: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(1).default('12h')
  ),

  // AI Providers — NB : ces variables ne sont plus lues au runtime (la source
  // unique est AppSetting, configurable dans /admin/settings). Conservées
  // facultativement dans le schéma pour la rétro-compat des .env legacy et
  // pour permettre une éventuelle utilisation hors-runtime (scripts).
  AI_API_KEY: emptyToUndefined,
  AI_API_URL: emptyToUndefinedUrl,
  AI_MODEL: emptyToUndefined,
  OPENAI_API_KEY: emptyToUndefined,
  ANTHROPIC_API_KEY: emptyToUndefined,
  GEMINI_API_KEY: emptyToUndefined,
  AI_DEFAULT_TEXT_PROVIDER: emptyToUndefined,
  AI_DEFAULT_VISION_PROVIDER: emptyToUndefined,
  AI_DEFAULT_TEXT_MODEL: emptyToUndefined,
  AI_DEFAULT_VISION_MODEL: emptyToUndefined,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('studio-flyer-ai'),

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
