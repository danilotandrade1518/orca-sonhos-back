# PostgreSQL Infrastructure

Esta pasta contém toda a infraestrutura relacionada ao PostgreSQL para o projeto OrçaSonhos.

## Estrutura

```
pg/
├── connection/
│   ├── PostgreSQLConnection.ts   # Classe principal de conexão com pool
│   └── DatabaseConfig.ts         # Configuração de ambiente
├── migrations/                   # Migrations do banco de dados
├── mappers/                     # Mapeadores Domain ↔ Database
└── README.md                    # Este arquivo
```

## Configuração

### Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
# Database Configuration - PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orcasonhos_dev
DB_USER=postgres
DB_PASSWORD=your_password_here

# Optional Database Settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECTION_TIMEOUT_MS=2000
```

### Uso da Conexão

```typescript
import { PostgreSQLConnection } from './connection/PostgreSQLConnection';
import { getDatabaseConfig } from './connection/DatabaseConfig';

// Inicializar conexão (singleton)
const config = getDatabaseConfig();
const db = PostgreSQLConnection.getInstance(config);

// Fazer queries
const users = await db.query('SELECT * FROM users WHERE active = $1', [true]);

// Transações
await db.transaction(async (client) => {
  await client.query('INSERT INTO accounts (name) VALUES ($1)', ['Account 1']);
  await client.query('INSERT INTO transactions (amount) VALUES ($1)', [100]);
});
```

## Migrations

### Comandos Disponíveis

```bash
# Criar nova migration
npm run migrate:create <nome-da-migration>

# Executar migrations pendentes
npm run migrate

# Reverter última migration
npm run migrate:down
```

### Exemplo de Migration

```typescript
// src/infrastructure/database/pg/migrations/001_create_budgets_table.ts
import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('budgets', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('budgets');
}
```

## Padrões

### Tipos de Dados Recomendados

- **IDs**: `uuid` com `gen_random_uuid()`
- **Valores Monetários**: `DECIMAL(15,2)`
- **Timestamps**: `timestamptz`
- **Enums**: `CREATE TYPE enum_name AS ENUM (...)`
- **JSON**: `jsonb` para dados semi-estruturados
- **Textos**: `varchar(n)` para campos limitados, `text` para campos livres

### Convenções de Nomenclatura

- **Tabelas**: snake_case plural (`budgets`, `user_accounts`)
- **Colunas**: snake_case (`created_at`, `owner_id`)
- **Índices**: `idx_tabela_colunas` (`idx_budgets_owner_id`)
- **Foreign Keys**: `fk_tabela_referencia` (`fk_accounts_budget`)
- **Enums**: `tabela_campo_enum` (`transaction_status_enum`)

### Performance

- Use `EXPLAIN ANALYZE` para analisar queries
- Crie índices para colunas frequentemente consultadas
- Use `jsonb` com índices GIN para dados semi-estruturados
- Considere particionamento para tabelas grandes (transactions)

## Monitoramento

A classe `PostgreSQLConnection` fornece métodos para monitoramento:

```typescript
const db = PostgreSQLConnection.getInstance();

console.log('Pool size:', db.getPoolSize());
console.log('Idle connections:', db.getIdleCount());
console.log('Waiting connections:', db.getWaitingCount());
```
