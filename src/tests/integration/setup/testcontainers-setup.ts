import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

import { PostgresConnectionAdapter } from '../../../adapters/postgres/PostgresConnectionAdapter';
import { DatabaseConfig } from '../../../infrastructure/adapters/IPostgresConnectionAdapter';
import { spawn } from 'child_process';
import path from 'path';

export class TestContainersSetup {
  private static container: StartedPostgreSqlContainer;
  private static connection: PostgresConnectionAdapter;
  private static databaseConnectionUri: string;

  static async setup(): Promise<PostgresConnectionAdapter> {
    console.log('🐳 Starting PostgreSQL TestContainer...');

    this.container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('orca_sonhos_test')
      .withUsername('test_user')
      .withPassword('test_password')
      .withExposedPorts(5432)
      .start();

    const host = this.container.getHost();
    const port = this.container.getMappedPort(5432);

    this.databaseConnectionUri = this.container.getConnectionUri();

    console.log('✅ PostgreSQL TestContainer started');
    console.log(`📡 Connection: ${host}:${port}/orca_sonhos_test`);

    const config: DatabaseConfig = {
      host,
      port,
      database: 'orca_sonhos_test',
      user: 'test_user',
      password: 'test_password',
    };

    // Set test environment to prevent process.exit
    process.env.NODE_ENV = 'test';

    this.connection = new PostgresConnectionAdapter(config);

    await this.runMigrations();

    return this.connection;
  }

  static async runMigrations(): Promise<void> {
    console.log('🔄 Running migrations...');

    return new Promise((resolve, reject) => {
      const migrate = spawn('npm', ['run', 'migrate'], {
        stdio: 'pipe',
        cwd: path.resolve(__dirname, '../../../../'),
        env: {
          ...process.env,
          DATABASE_URL: this.databaseConnectionUri,
        },
      });

      let output = '';
      let errorOutput = '';

      migrate.stdout?.on('data', (data) => {
        output += data.toString();
      });

      migrate.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      migrate.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Migrations completed successfully');
          resolve();
        } else {
          console.error('Migration failed with code:', code);
          console.error('Output:', output);
          console.error('Error Output:', errorOutput);
          reject(
            new Error(
              `Migration process exited with code ${code}. Error: ${errorOutput}`,
            ),
          );
        }
      });

      migrate.on('error', (error) => {
        console.error('Migration spawn error:', error);
        reject(error);
      });
    });
  }

  static async cleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
    }
  }

  static async teardown(): Promise<void> {
    console.log('🧹 Cleaning up TestContainer...');

    await this.cleanup();

    if (this.container) {
      await this.container.stop();
      console.log('✅ PostgreSQL TestContainer stopped');
    }
  }

  static async resetDatabase(): Promise<void> {
    if (this.connection) {
      await this.connection.query(
        'TRUNCATE TABLE budgets RESTART IDENTITY CASCADE;',
      );
    }
  }

  static getConnection(): PostgresConnectionAdapter {
    if (!this.connection) {
      throw new Error('TestContainer not initialized. Call setup() first.');
    }
    return this.connection;
  }
}
