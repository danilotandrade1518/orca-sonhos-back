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

export type QueryResultRow<T> = { rows: T[]; rowCount: number };

export interface IDatabaseClient {
  query<T = unknown>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResultRow<T> | null>;
  release(): void;
}

export interface IPostgresConnectionAdapter {
  query<T = unknown>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResultRow<T> | null>;
  transaction<T>(callback: (client: unknown) => Promise<T>): Promise<T>;
  getClient(): Promise<IDatabaseClient>;
}
