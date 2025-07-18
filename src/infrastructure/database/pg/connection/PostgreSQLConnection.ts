import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class PostgreSQLConnection {
  private pool: Pool;
  private static instance: PostgreSQLConnection;

  private constructor(config: DatabaseConfig) {
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
      process.exit(-1);
    });
  }

  public static getInstance(config?: DatabaseConfig): PostgreSQLConnection {
    if (!PostgreSQLConnection.instance) {
      if (!config) {
        throw new Error(
          'Database configuration is required for first initialization',
        );
      }
      PostgreSQLConnection.instance = new PostgreSQLConnection(config);
    }
    return PostgreSQLConnection.instance;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result: QueryResult<T> = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async queryOne<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  getPoolSize(): number {
    return this.pool.totalCount;
  }

  getIdleCount(): number {
    return this.pool.idleCount;
  }

  getWaitingCount(): number {
    return this.pool.waitingCount;
  }
}
