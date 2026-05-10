import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  // AI Providers
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
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
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  /** Issuer URL — value of the `iss` claim in tokens. Example:
   *  https://ep-xxx.neonauth.<region>.aws.neon.tech/<db>/auth */
  NEON_AUTH_ISSUER: z.string().url().optional(),
  /** JWKS URL — public keys used to verify token signatures. Example:
   *  https://ep-xxx.neonauth.<region>.aws.neon.tech/<db>/auth/.well-known/jwks.json */
  NEON_AUTH_JWKS_URL: z.string().url().optional(),
  /** Optional `aud` claim to enforce. */
  NEON_AUTH_AUDIENCE: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsedEnv.data;
