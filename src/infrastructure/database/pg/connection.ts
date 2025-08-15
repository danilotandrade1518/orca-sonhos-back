import { Pool } from 'pg';
import { loadEnv } from '../../../config/env';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const env = loadEnv();
    pool = new Pool({
      host: env.DB_HOST,
      port: Number(env.DB_PORT),
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function checkDbConnection(timeoutMs = 1000): Promise<boolean> {
  try {
    const p = getDbPool();
    await Promise.race([
      p.query('SELECT 1'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs),
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}
