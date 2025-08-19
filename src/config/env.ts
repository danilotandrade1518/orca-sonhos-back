import { z } from 'zod';

// New namespaced variables (HTTP_, DB_, LOG_). Legacy ones kept for transitional compatibility.
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  HTTP_PORT: z
    .string()
    .regex(/^[0-9]+$/)
    .default('3000'),
  DB_HOST: z.string().min(1),
  DB_PORT: z
    .string()
    .regex(/^[0-9]+$/)
    .default('5432'),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CATEGORY_ID_ADJUSTMENT: z
    .string()
    .uuid()
    .default('00000000-0000-0000-0000-000000000001'),
  CATEGORY_ID_TRANSFER: z
    .string()
    .uuid()
    .default('00000000-0000-0000-0000-000000000002'),
  AUTH_REQUIRED: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  AUTH_JWKS_URI: z.string().url().optional(),
  AUTH_ISSUER: z.string().optional(),
  AUTH_AUDIENCE: z.string().optional(),
  AUTH_USER_ID_CLAIM: z.string().default('sub'),
  APPINSIGHTS_CONNECTION_STRING: z.string().optional(),
  APPINSIGHTS_ROLE_NAME: z.string().default('orca-sonhos-api'),
  APPINSIGHTS_SAMPLING_PERCENTAGE: z
    .string()
    .regex(/^(100|[0-9]{1,2})(\.[0-9]+)?$/)
    .optional(),
  APPINSIGHTS_DISABLED: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

type EnvVars = Record<string, string | undefined>;

export function loadEnv(raw: EnvVars = process.env): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(
        (i: { path: (string | number)[]; message: string }) =>
          `${i.path.join('.')}: ${i.message}`,
      )
      .join('; ');
    throw new Error(`Invalid environment variables: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

// For tests: allow resetting cached environment between test cases.
export function resetEnvCache() {
  cached = null;
}
