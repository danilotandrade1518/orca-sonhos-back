import { Umzug, JSONStorage } from 'umzug';
import mysql from 'mysql2/promise';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const direction = process.argv[2] === 'down' ? 'down' : 'up';

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'orcasonhos',
    port: Number(process.env.DB_PORT) || 3306,
  });

  const umzug = new Umzug({
    migrations: {
      glob: path.join(__dirname, './*.migration.{ts,js}'),
    },
    context: connection,
    storage: new JSONStorage({
      path: path.join(__dirname, '.umzug.json'),
    }),
    logger: console,
  });

  try {
    if (direction === 'up') {
      await umzug.up();
      console.log('Migrations executadas com sucesso!');
    } else {
      await umzug.down({ to: 0 });
      console.log('Rollback das migrations executado com sucesso!');
    }
    await connection.end();
  } catch (err) {
    console.error('Erro ao executar migrations:', err);
    process.exit(1);
  }
})();
