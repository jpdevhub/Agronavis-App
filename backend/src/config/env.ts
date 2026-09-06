import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

/** Loads the ONE .env at the repository root. */
function findRepoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i += 1) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(pkg, 'utf8')) as { workspaces?: unknown };
        if (parsed.workspaces) return dir;
      } catch {
        /* not the root, keep walking */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return from;
}

const repoRoot = findRepoRoot(__dirname);
// `override: false` — a real environment variable (CI, Docker, Render, Fly)
// always beats the local file.
dotenv.config({ path: path.join(repoRoot, '.env'), override: false });

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    API_VERSION: z.string().default('v1'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

    ALLOWED_ORIGINS: z.string().default('http://localhost:8081'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

    // ── Supabase — the only datastore ──────────────────────────────────────
    SUPABASE_URL: z.string().url('SUPABASE_URL must be your https://<ref>.supabase.co URL'),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(20, 'SUPABASE_SERVICE_ROLE_KEY is required — the API cannot read the database without it'),
    /** Only needed by projects still issuing legacy HS256 access tokens. */
    SUPABASE_JWT_SECRET: z.string().optional(),

    // ── Third-party APIs (secrets — never reach the client) ────────────────
    OPENWEATHER_API_KEY: z.string().optional(),
    AGMARKNET_API_KEY: z.string().optional(),
    TOTP_ENCRYPTION_KEY: z.string().optional(),

    // ── Background jobs ───────────────────────────────────────────────────
    ENABLE_JOBS: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
    WEATHER_POLL_CRON: z.string().default('*/30 * * * *'),
    MARKET_POLL_CRON: z.string().default('15 * * * *'),
  })
  .transform((raw) => ({
    ...raw,
    isProduction: raw.NODE_ENV === 'production',
    isTest: raw.NODE_ENV === 'test',
    allowedOrigins: raw.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    /** JWKS endpoint for asymmetric (ES256/RS256) Supabase access tokens. */
    supabaseJwksUrl: new URL('/auth/v1/.well-known/jwks.json', raw.SUPABASE_URL).toString(),
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  · ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(
    `\nInvalid environment. Fix these in ${path.join(repoRoot, '.env')} (see .env.example):\n${issues}\n`,
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
export const REPO_ROOT = repoRoot;

/** Warn loudly about optional keys whose absence silently degrades a feature. */
export function reportOptionalEnv(warn: (msg: string) => void): void {
  if (!env.OPENWEATHER_API_KEY) warn('OPENWEATHER_API_KEY is not set — weather endpoints will fail');
  if (!env.AGMARKNET_API_KEY) warn('AGMARKNET_API_KEY is not set — mandi prices will be empty');
  if (!env.TOTP_ENCRYPTION_KEY) warn('TOTP_ENCRYPTION_KEY is not set — two-factor auth is disabled');
}
