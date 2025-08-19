# OrçaSonhos Backend

API de gestão financeira familiar, focada em orçamentos, metas e controle de gastos.

## Como rodar

```bash
# Instale as dependências
npm install

# Rode em modo desenvolvimento
npm run dev

# Com Docker
# (garante que o banco MySQL também suba)
docker-compose up --build
```

## Testes

```bash
# Testes unitários (arquivos .spec.ts)
npm run test:watch

# Testes integrados (arquivos .test.ts)
npm run test:integration

# Cobertura de testes
npm test:coverage
```

## Scripts úteis

- `npm run lint` — Lint do código
- `npm run format` — Formata o código com Prettier

## Contribuição

- Siga o padrão de código (ESLint/Prettier)
- Crie testes para novas funcionalidades
- Use variáveis de ambiente conforme `.env.example`

### Observabilidade (MVP)

Variáveis relevantes:

- `DB_SLOW_QUERY_MS` (default 200): limiar em ms acima do qual uma query é logada como lenta (`category":"db.slow_query"`). Abaixo disso é logada em nível debug (`category":"db.query"`).

Logs de mutações seguem par `mutation.start` / `mutation.end` com `durationMs` e `outcome`.

### Application Insights

Opcionalmente é possível habilitar o Azure Application Insights definindo as variáveis:

| Variável                          | Descrição                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `APPINSIGHTS_CONNECTION_STRING`   | Connection string do recurso Application Insights (quando ausente, a instrumentação é ignorada). |
| `APPINSIGHTS_ROLE_NAME`           | Nome lógico (cloud role) para filtrar no portal (default: `orca-sonhos-api`).                    |
| `APPINSIGHTS_SAMPLING_PERCENTAGE` | Percentual de amostragem (0-100). Quando não definido, usa default do SDK.                       |
| `APPINSIGHTS_DISABLED`            | Quando `true`, força desativação mesmo com connection string.                                    |

O SDK é inicializado de forma idempotente em `src/shared/observability/app-insights.ts` e chamado no bootstrap (`src/index.ts`). Console logs, requests, dependências (PostgreSQL) e exceções são coletados automaticamente. Live Metrics está desabilitado por padrão.

## Migrations

- As migrations do banco são gerenciadas com [umzug](https://github.com/sequelize/umzug).
- Para rodar as migrations, utilize o script npm correspondente (ver abaixo).
