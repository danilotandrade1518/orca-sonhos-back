import { Pool, PoolClient } from 'pg';

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
    const result = await this.poolClient.query(text, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? 0,
    };
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
      const result = await client.query(text, params);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount ?? 0,
      };
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: unknown) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client as unknown);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
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
