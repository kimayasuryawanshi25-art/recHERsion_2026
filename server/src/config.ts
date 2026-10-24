import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DB_URL: z.string().default('file:local.db'),
  DATA_KEY: z.string().min(64, 'DATA_KEY must be a 64-character hex string (32 bytes)').default(
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  ),
  SESSION_SECRET: z.string().min(32).default(
    'herhealth_dev_session_secret_at_least_32_characters_long_for_security'
  ),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
});

const rawConfig = {
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
  NODE_ENV: process.env.NODE_ENV,
  DB_URL: process.env.DB_URL,
  DATA_KEY: process.env.DATA_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  AI_MODEL: process.env.AI_MODEL,
};

const parsed = ConfigSchema.safeParse(rawConfig);

if (!parsed.success) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Invalid server configuration in production: ${JSON.stringify(parsed.error.format())}`);
  }
}

export const config = parsed.success ? parsed.data : ConfigSchema.parse({});
