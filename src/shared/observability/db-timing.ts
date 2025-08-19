import { ILogger } from '../logging/logger';

const slowThresholdMs = Number(process.env.DB_SLOW_QUERY_MS || '200');

export async function timedQuery<T>(params: {
  logger?: ILogger;
  sql: string;
  exec: () => Promise<T>;
  label?: string;
  rowCount?: () => number | undefined;
}): Promise<T> {
  const { logger, sql, exec, label, rowCount } = params;
  const start = process.hrtime.bigint();
  try {
    const result = await exec();
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    if (durationMs >= slowThresholdMs) {
      const rc = rowCount?.();
      logger?.warn({
        category: 'db.slow_query',
        durationMs: +durationMs.toFixed(3),
        sqlHash: hashSql(sql),
        label,
        rowCount: rc,
        thresholdMs: slowThresholdMs,
      });
    } else {
      logger?.debug({
        category: 'db.query',
        durationMs: +durationMs.toFixed(3),
        sqlHash: hashSql(sql),
        label,
      });
    }
    return result;
  } catch (err) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    logger?.error({
      category: 'db.query_error',
      durationMs: +durationMs.toFixed(3),
      sqlHash: hashSql(sql),
      label,
      errorType: 'DB_ERROR',
      msg: (err as Error).message,
    });
    throw err;
  }
}

function hashSql(sql: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < sql.length; i++) {
    h ^= sql.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'h' + (h >>> 0).toString(16);
}
