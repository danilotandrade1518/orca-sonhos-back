import { QueryResultRow } from 'pg';

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

export interface IPostgresConnectionAdapter {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;

  queryOne<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T | null>;

  transaction<T>(callback: (client: unknown) => Promise<T>): Promise<T>;

  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
  getPoolSize(): number;
  getIdleCount(): number;
  getWaitingCount(): number;
}
