# Planejamento de Views, Queries e Contratos de Leitura (MVP SPA)

> Objetivo: Mapear páginas (wireframes conceituais), blocos de dados (Data Blocks), endpoints de leitura necessários e shape preliminar das respostas para permitir implementação backend independente do frontend.

## 1. Páginas MVP

| Página                   | Objetivo Primário                                  | Prioridade | Observações                          |
| ------------------------ | -------------------------------------------------- | ---------- | ------------------------------------ |
| Dashboard                | Visão resumida financeira do orçamento selecionado | Alta       | Concentra múltiplos blocos agregados |
| Budgets (Lista / Switch) | Selecionar e visualizar orçamentos disponíveis     | Alta       | Gate para demais páginas             |
| Accounts                 | Listar contas e saldos                             | Alta       | Dados já usados em overview          |
| Transactions             | Listar e filtrar transações (paginação)            | Alta       | Maior volume de dados                |
| Dashboard Metas          | Metas & progresso                                  | Média      | Central no MVP, Fase 1               |
| Envelopes                | Visualizar alocação vs gasto                       | Média      | Pode entrar após baseline            |
| Categories               | Listar categorias (referência)                     | Média      | Cacheável                            |
| Profile (/me)            | Exibir usuário atual / logout                      | Média      | Já existe /me (reutilizar)           |

## 2. Data Blocks por Página

Cada bloco define: _nome_, _campos_, _fonte_, _derivados_, _endpoint sugerido_.

### 2.1 Dashboard

1. budgetsQuickList

- Campos: [{ id, name, type }]
- Fonte: budgets do usuário (BudgetRepository / participants join)
- Endpoint: GET /budgets

2. summaryTotals

- Campos: { accountsBalanceTotal, monthIncome, monthExpense, netMonth }
- Derivados: netMonth = monthIncome - monthExpense
- Fonte: contas + transações filtradas por mês corrente
- Endpoint: GET /budget/:budgetId/overview (agregado)

3. recentTransactions

- Campos: [{ id, date, description, amount, direction, accountId, categoryId }]
- Limite: 5–10 últimas
- Endpoint: GET /transactions?budgetId=...&limit=10&sort=date_desc

4. envelopesProgress (opcional MVP inicial)

- Campos: [{ id, name, allocated, spent, remaining }]
- remaining = allocated - spent
- Endpoint: GET /envelopes?budgetId=...

5. goalsProgress (Dashboard Metas)

- Campos: [{ id, name, targetAmount, currentAmount, percentAchieved, dueDate, status }]
- percentAchieved = currentAmount / targetAmount (0–1, tratar targetAmount=0)
- status: ACTIVE | ACHIEVED | OVERDUE
- Fonte: agregação de metas do usuário/orçamento
- Endpoint: GET /goals?budgetId=...

6. alerts (futuro)

- Campos: [{ type, message, severity }]
- Gerado: lógica futura

### 2.2 Budgets (Lista)

- budgetList: [{ id, name, type, participantsCount }]
- Endpoint: GET /budgets

### 2.3 Accounts

- accountsList: [{ id, name, type, balance }]
- Endpoint: GET /accounts?budgetId=...

### 2.4 Transactions

- transactionsPage
  - Campos item: { id, date, description, amount, direction, accountId, categoryId }
  - Meta: { page, pageSize, hasNext }
  - Filtros: accountId?, categoryId?, dateFrom?, dateTo?
  - Endpoint: GET /transactions?budgetId=...&page=1&pageSize=20
- transactionFilters (estáticos pré-carregados)
  - accountsMini: [{ id, name }]
  - categoriesMini: [{ id, name }]
  - Endpoints: /accounts & /categories (ou incluir no primeiro load de página via parallel queries no front)

### 2.5 Envelopes

- envelopesList: [{ id, name, allocated, spent, remaining, percentUsed }]
- percentUsed = spent / allocated (0–1, tratar allocated=0)
- Endpoint: GET /envelopes?budgetId=...

### 2.6 Goals (Metas)

- goalsList: [{ id, name, targetAmount, currentAmount, percentAchieved, dueDate, status }]
- percentAchieved = currentAmount / targetAmount (0–1, tratar targetAmount=0)
- status: ACTIVE | ACHIEVED | OVERDUE
- Endpoint: GET /goals?budgetId=...

### 2.7 Categories

- categoriesList: [{ id, name, type (INCOME|EXPENSE) }]
- Endpoint: GET /categories
- Cache-Control: private, max-age=300

### 2.8 Profile

- currentUser: { userId, email? (se claim), displayName? (futuro) }
- Endpoint: GET /me (já implementado)

## 3. Proposta de Endpoints de Leitura

| Endpoint                       | Descrição                              | Autorização                         | Cache | Paginação |
| ------------------------------ | -------------------------------------- | ----------------------------------- | ----- | --------- |
| GET /budgets                   | Orçamentos do usuário                  | user required                       | no    | n/a       |
| GET /budget/:budgetId/overview | Totais + contas resumo + participantes | acesso ao budget                    | no    | n/a       |
| GET /accounts                  | Contas de um budget                    | acesso ao budget                    | no    | n/a       |
| GET /transactions              | Transações com filtros                 | acesso ao budget                    | no    | sim       |
| GET /envelopes                 | Envelopes do budget                    | acesso ao budget                    | no    | n/a       |
| GET /goals                     | Metas do orçamento                     | acesso ao budget                    | no    | n/a       |
| GET /categories                | Categorias globais/reference           | user required                       | no    | n/a       |
| GET /me                        | Info principal                         | opcional (retorna anonymous se não) | no    | n/a       |

## 4. Shapes Preliminares (JSON)

### 4.1 GET /budgets

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "type": "PERSONAL|SHARED",
      "participantsCount": 3
    }
  ],
  "meta": { "count": 2 }
}
```

### 4.2 GET /budget/{id}/overview

```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "type": "PERSONAL|SHARED",
    "participants": [{ "id": "uuid" }],
    "totals": {
      "accountsBalance": 125000, // cents
      "monthIncome": 520000,
      "monthExpense": 310000,
      "netMonth": 210000
    },
    "accounts": [
      { "id": "uuid", "name": "Carteira", "type": "CHECKING", "balance": 5000 }
    ]
  }
}
```

### 4.3 GET /accounts?budgetId=...

```json
{
  "data": [
    { "id": "uuid", "name": "string", "type": "CHECKING", "balance": 5000 }
  ],
  "meta": { "count": 4 }
}
```

### 4.4 GET /transactions

```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2025-08-20",
      "description": "Supermercado",
      "amount": { "cents": -4500, "currency": "BRL" },
      "direction": "OUT|IN",
      "accountId": "uuid",
      "categoryId": "uuid"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "hasNext": true }
}
```

### 4.5 GET /envelopes

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Alimentação",
      "allocated": 100000,
      "spent": 45000,
      "remaining": 55000,
      "percentUsed": 0.45
    }
  ]
}
```

### 4.6 GET /goals

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Viagem",
      "targetAmount": 1000000,
      "currentAmount": 250000,
      "percentAchieved": 0.25,
      "dueDate": "2025-12-31",
      "status": "ACTIVE"
    }
  ]
}
```

### 4.7 GET /categories

```json
{ "data": [{ "id": "uuid", "name": "Salário", "type": "INCOME" }] }
```

### 4.8 GET /me

(Existente) Exemplo:

```json
{ "data": { "userId": "sub-claim" } }
```

## 5. QueryHandlers Planejados

| Handler                      | Input                    | Output          | DAO(s)                                                  | Complexidade      |
| ---------------------------- | ------------------------ | --------------- | ------------------------------------------------------- | ----------------- |
| ListBudgetsQueryHandler      | userId                   | budgets[]       | BudgetsDao                                              | Baixa             |
| BudgetOverviewQueryHandler (Implemented)   | budgetId,userId          | overview        | BudgetsDao + AccountsDao + TransactionsDao (sum mensal) | Média             |
| ListAccountsQueryHandler     | budgetId,userId          | accounts[]      | AccountsDao                                             | Baixa             |
| ListTransactionsQueryHandler | budgetId,userId, filtros | page transações | TransactionsDao                                         | Média (paginação) |
| ListEnvelopesQueryHandler    | budgetId,userId          | envelopes[]     | EnvelopesDao                                            | Baixa             |
| ListGoalsQueryHandler        | budgetId,userId          | goals[]         | GoalsDao                                                | Baixa             |
| ListCategoriesQueryHandler (Implemented)   | (userId opcional)        | categorias[]    | CategoriesDao                                           | Baixa             |

## 6. Métricas & Observabilidade

- Contador: queries_total{query="ListTransactions", success, http_status}
- Histograma: query_latency_ms{query}
- Adicionar no módulo: `src/shared/observability/query-metrics.ts`

## 7. Paginação

- Inicial: OFFSET/LIMIT
- Query params aceitos: page (default=1), pageSize (default=20, max=100)
- Cálculo OFFSET = (page-1)\*pageSize
- Futuro: keyset para transações (date,id) se performance necessária

## 8. Autorização

- Middleware auth já extrai principal
- Cada QueryHandler valida acesso ao budget (quando aplicável) via serviço (BudgetAuthorizationService) ou consulta existencial
- Caso sem permissão: 403 (FORBIDDEN) padronizado

## 9. Caching / Headers

Nenhum endpoint será cacheado inicialmente. Estratégias de cache (Cache-Control, helpers) serão avaliadas e implementadas conforme a plataforma evoluir e surgirem necessidades de performance ou escalabilidade.

## 10. Sequência de Implementação

1. Infra base queries: interfaces, registry, métricas.
2. ListBudgetsQuery + rota GET /budgets + testes.
3. ListAccountsQuery + ListTransactionsQuery + paginação util.
4. BudgetOverviewQuery consolidando agregados.
5. Categories / Envelopes.
6. Caching headers + métricas finais + documentação swagger.

## 11. Swagger / Documentação

Adicionar seções no `swagger.json` para cada novo endpoint com schemas `BudgetListItem`, `BudgetOverview`, `TransactionItem`, etc.

## 12. Riscos / Mitigações

| Risco                             | Mitigação                                            |
| --------------------------------- | ---------------------------------------------------- |
| N+1 em overview (loops por conta) | Queries agregadas (JOIN + GROUP) / CTE               |
| Transações lentas sem índices     | Criar índices (budget_id, date) e (account_id, date) |
| Paginação custo alto p/ COUNT(\*) | Remover total / usar hasNext via LIMIT+1             |
| Vazamento de campos internos      | DTO explícito / map restrictivo                      |

## 13. Ações Imediatas (Prontas para Coding)

- Criar pasta: `src/application/queries/_core` com interface `IQueryHandler<I,O>`.
- Criar pasta: `src/application/queries/budget/list-budgets` (handler + spec).
- Criar DAO: `src/infrastructure/database/pg/daos/budget/BudgetsDao.ts` com método `findByUser(userId)`.
- Criar registry queries: `registerQueryRoutes` análogo a mutations.
- Adicionar rota GET /budgets no express adapter.
- Testes unit e integração (usar testcontainers ou DB mock já existente).

## 14. Open Questions

| Questão                                                        | Status                                                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Dashboard consolidado em único endpoint ou múltiplas chamadas? | Decisão provisória: usar overview + recentTransactions                                       |
| Precisamos de totalItems em /transactions?                     | Adiar até demanda UX                                                                         |
| Envelopes dependem de cálculos não prontos?                    | Verificar se regras já no domínio; senão somar spent via transações filtradas por envelopeId |

---

**Este documento é vivo**: atualizar conforme implementações avançarem ou ajustes de UX surgirem.
