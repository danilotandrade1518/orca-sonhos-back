#!/usr/bin/env sh
set -eu

echo "⏳ Aguardando Postgres ficar pronto..."
node <<'NODE'
const { Client } = require('pg');

const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const deadline = Date.now() + 60_000;

async function waitForDb() {
  while (Date.now() < deadline) {
    const c = new Client(config);
    try {
      await c.connect();
      await c.end();
      console.log('✅ Postgres pronto');
      return;
    } catch (_e) {
      try { await c.end(); } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.error('❌ Timeout aguardando Postgres (60s)');
  process.exit(1);
}

waitForDb();
NODE

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

echo "🔄 Rodando migrations..."
npm run migrate

echo "🌱 Rodando seeds E2E..."
node scripts/e2e/seed-users.js

echo "🚀 Iniciando API (dev)..."
exec npm run dev


