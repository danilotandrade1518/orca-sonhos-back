import { DatabaseConfig } from './PostgreSQLConnection';

export const getDatabaseConfig = (): DatabaseConfig => {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }

  return {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    max: process.env.DB_MAX_CONNECTIONS
      ? parseInt(process.env.DB_MAX_CONNECTIONS, 10)
      : 20,
    idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT_MS
      ? parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10)
      : 30000,
    connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT_MS
      ? parseInt(process.env.DB_CONNECTION_TIMEOUT_MS, 10)
      : 2000,
  };
};
