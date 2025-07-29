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

export interface QueryResultRow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [column: string]: any;
}

export interface IDatabaseClient {
  query<T = QueryResultRow>(text: string, params?: unknown[]): Promise<T[]>;

  release(): void;
}

export interface IPostgresConnectionAdapter {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;

  queryOne<T = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T | null>;

  transaction<T>(callback: (client: unknown) => Promise<T>): Promise<T>;

  getClient(): Promise<IDatabaseClient>;
}
