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
