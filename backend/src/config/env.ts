import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('https://ncoleinterpress.com,https://app.ncoleinterpress.com,https://vendors.ncoleinterpress.com,https://admin.ncoleinterpress.com,https://rider.ncoleinterpress.com'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  MOMO_BASE_URL: z.string().optional(),
  MOMO_SUBSCRIPTION_KEY: z.string().optional(),
  MOMO_API_USER: z.string().optional(),
  MOMO_API_KEY: z.string().optional(),
  MOMO_TARGET_ENVIRONMENT: z.string().optional(),
  AIRTEL_BASE_URL: z.string().optional(),
  AIRTEL_CLIENT_ID: z.string().optional(),
  AIRTEL_CLIENT_SECRET: z.string().optional(),
  AIRTEL_ENVIRONMENT: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default('N_COLE Interpress <onboarding@resend.dev>'),
  APP_URL: z.string().default('https://ncoleinterpress.com'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

if (process.env.NODE_ENV !== 'test') console.log('DATABASE_URL loaded:', Boolean(process.env.DATABASE_URL));

