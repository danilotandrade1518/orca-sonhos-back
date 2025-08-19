import { Pool, PoolClient } from 'pg';
import { logger } from '@shared/logging/logger';
import { timedQuery } from '@shared/observability/db-timing';

import {
  DatabaseConfig,
  IDatabaseClient,
  IPostgresConnectionAdapter,
  QueryResultRow,
} from '../../infrastructure/adapters/IPostgresConnectionAdapter';

class DatabaseClientAdapter implements IDatabaseClient {
  constructor(private poolClient: PoolClient) {}

  async query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResultRow<T>> {
    let rows: T[] = [];
    let rowCount = 0;
    const exec = async () => {
      const r = await this.poolClient.query(text, params);
      rows = r.rows as T[];
      rowCount = r.rowCount ?? 0;
      return r;
    };
    await timedQuery({
      logger,
      sql: text,
      label: 'client_query',
      exec,
      rowCount: () => rowCount,
    });
    return { rows, rowCount };
  }

  release(): void {
    this.poolClient.release();
  }
}

export class PostgresConnectionAdapter implements IPostgresConnectionAdapter {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      if (process.env.NODE_ENV !== 'test') {
        process.exit(-1);
      }
    });
  }

  async query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResultRow<T>> {
    const client = await this.pool.connect();
    try {
      let rows: T[] = [];
      let rowCount = 0;
      const exec = async () => {
        const r = await client.query(text, params);
        rows = r.rows as T[];
        rowCount = r.rowCount ?? 0;
        return r;
      };
      await timedQuery({
        logger,
        sql: text,
        label: 'pool_query',
        exec,
        rowCount: () => rowCount,
      });
      return { rows, rowCount };
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: unknown) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await timedQuery({
        logger,
        sql: 'BEGIN',
        label: 'tx_begin',
        exec: () => client.query('BEGIN'),
      });
      const result = await callback(client as unknown);
      await timedQuery({
        logger,
        sql: 'COMMIT',
        label: 'tx_commit',
        exec: () => client.query('COMMIT'),
      });
      return result;
    } catch (error) {
      await timedQuery({
        logger,
        sql: 'ROLLBACK',
        label: 'tx_rollback',
        exec: () => client.query('ROLLBACK'),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getClient(): Promise<IDatabaseClient> {
    const poolClient = await this.pool.connect();
    return new DatabaseClientAdapter(poolClient);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
