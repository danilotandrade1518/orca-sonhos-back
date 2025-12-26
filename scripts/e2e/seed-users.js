const { Client } = require('pg');

const USERS = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Developer User',
    email: 'dev@orca-sonhos.com',
    phone: '+5511999990000',
  },
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Ana Silva',
    email: 'ana@example.com',
    phone: '+5511999999999',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '+5511888888888',
  },
];

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await client.connect();

  try {
    for (const u of USERS) {
      await client.query(
        `
          INSERT INTO users (id, name, email, phone)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email) DO UPDATE
          SET id = EXCLUDED.id,
              name = EXCLUDED.name,
              phone = EXCLUDED.phone,
              updated_at = current_timestamp
        `,
        [u.id, u.name, u.email, u.phone]
      );
    }
     
    console.log(`✅ Seed E2E: inseridos/atualizados ${USERS.length} usuários`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
   
  console.error('❌ Seed E2E falhou:', err);
  process.exit(1);
});


