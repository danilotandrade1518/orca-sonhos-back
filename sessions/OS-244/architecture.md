# Endpoint de Análise Financeira Mensal por Categoria - Arquitetura Técnica

## 🏗️ Visão Geral da Implementação

### Estado Atual

O sistema já possui:

- `BudgetOverviewDao`: Agrega totais mensais de receitas e despesas
- `DashboardInsightsDao`: Agrega gastos por categoria (apenas EXPENSE)
- Padrão estabelecido de Query Handlers com autorização
- Estrutura de rotas em `budgets-query-route-registry.ts`

### Mudanças Propostas

Criar novo endpoint `/budget/:budgetId/monthly-analysis` que:

- Agrega receitas e despesas por categoria
- Retorna totais consolidados e déficit
- Formata período como "YYYY-MM"
- Ordena categorias por valor crescente

### Impactos

- **Novo DAO**: `MonthlyFinancialAnalysisDao` para queries de agregação
- **Novo Query Handler**: `MonthlyFinancialAnalysisQueryHandler` para lógica de negócio
- **Nova Rota**: Adicionar em `budgets-query-route-registry.ts`
- **Novo Contrato**: Interface `IMonthlyFinancialAnalysisDao`

## 🔧 Componentes e Estrutura

### Arquivos Principais a Modificar

- `src/main/routes/contexts/queries/budgets-query-route-registry.ts`: Adicionar nova rota GET `/budget/:budgetId/monthly-analysis`

### Novos Arquivos a Criar

1. **Contrato DAO**:

   - `src/application/contracts/daos/budget/IMonthlyFinancialAnalysisDao.ts`: Interface do DAO

2. **DAO Implementation**:

   - `src/infrastructure/database/pg/daos/budget/monthly-financial-analysis/MonthlyFinancialAnalysisDao.ts`: Implementação SQL

3. **Query Handler**:
   - `src/application/queries/budget/monthly-financial-analysis/MonthlyFinancialAnalysisQueryHandler.ts`: Lógica de negócio
   - `src/application/queries/budget/monthly-financial-analysis/MonthlyFinancialAnalysisQueryHandler.spec.ts`: Testes unitários

### Estrutura de Diretórios

```
src/
├── application/
│   ├── contracts/
│   │   └── daos/
│   │       └── budget/
│   │           └── IMonthlyFinancialAnalysisDao.ts (NOVO)
│   └── queries/
│       └── budget/
│           └── monthly-financial-analysis/ (NOVO)
│               ├── MonthlyFinancialAnalysisQueryHandler.ts
│               └── MonthlyFinancialAnalysisQueryHandler.spec.ts
└── infrastructure/
    └── database/
        └── pg/
            └── daos/
                └── budget/
                    └── monthly-financial-analysis/ (NOVO)
                        └── MonthlyFinancialAnalysisDao.ts
```

## 🏛️ Padrões Arquiteturais

### Padrões Seguidos

- **Query Handler Pattern**: Seguir padrão de `BudgetOverviewQueryHandler`
- **DAO Pattern**: Seguir padrão de `BudgetOverviewDao` e `DashboardInsightsDao`
- **SQL Nativo**: Queries SQL diretas (sem ORM)
- **Autorização**: Usar `IBudgetAuthorizationService.canAccessBudget()`
- **Either Pattern**: Tratamento de erros via Either (no Query Handler)
- **Métricas**: Incluir observabilidade (queryLatencyMs, queriesTotal)

### Decisões Arquiteturais

- **Decisão**: Criar DAO separado ao invés de reutilizar `DashboardInsightsDao`
- **Alternativas**:
  - Estender `DashboardInsightsDao` existente
  - Reutilizar queries de `BudgetOverviewDao`
- **Justificativa**:

  - Separação de responsabilidades (Single Responsibility)
  - Queries específicas para este caso de uso
  - Facilita manutenção e testes

- **Decisão**: Formatar período como string "YYYY-MM" no Query Handler
- **Alternativas**:
  - Retornar Date objects
  - Formatar no frontend
- **Justificativa**:

  - Especificação exige formato "YYYY-MM"
  - Facilita uso no frontend
  - Consistente com outros endpoints

- **Decisão**: Ordenar categorias por valor crescente
- **Alternativas**:
  - Ordenar por nome
  - Ordenar por quantidade de transações
- **Justificativa**:
  - Especificação do usuário
  - Facilita identificação de categorias com maior impacto

## 📦 Dependências e Integrações

### Dependências Existentes

- `IPostgresConnectionAdapter`: Para execução de queries SQL
- `IBudgetAuthorizationService`: Para validação de acesso ao orçamento
- `IQueryHandler`: Interface base para Query Handlers
- `DefaultResponseBuilder`: Para formatação de resposta HTTP

### Novas Dependências

- Nenhuma nova dependência externa necessária

### Integrações

- **PostgreSQL**: Queries SQL para agregações
- **Sistema de Métricas**: Observabilidade de queries

## 🔄 Fluxo de Dados

```
1. Request HTTP GET /budget/:budgetId/monthly-analysis
   ↓
2. Route Handler (budgets-query-route-registry.ts)
   - Extrai budgetId dos params
   - Extrai userId do principal
   - Valida autenticação
   ↓
3. MonthlyFinancialAnalysisQueryHandler.execute()
   - Valida query (budgetId, userId)
   - Valida autorização via IBudgetAuthorizationService
   - Calcula período do mês atual (UTC)
   - Chama DAO para buscar dados
   ↓
4. MonthlyFinancialAnalysisDao.fetchAnalysis()
   - Executa queries SQL:
     a) Totais de receitas e despesas
     b) Receitas agrupadas por categoria
     c) Despesas agrupadas por categoria
   - Retorna dados agregados
   ↓
5. Query Handler formata resposta
   - Calcula déficit (totalExpenses - totalIncome)
   - Formata período como "YYYY-MM"
   - Ordena categorias por valor crescente
   ↓
6. DefaultResponseBuilder.ok()
   - Formata resposta HTTP padrão
   - Inclui métricas de observabilidade
   ↓
7. Response HTTP 200 com dados
```

## 🧪 Considerações de Teste

### Testes Unitários

**MonthlyFinancialAnalysisQueryHandler.spec.ts**:

- Validação de query inválida (budgetId ou userId ausente)
- Validação de autorização (usuário sem acesso)
- Cálculo correto do período mensal (UTC)
- Cálculo correto do déficit
- Formatação correta do período "YYYY-MM"
- Ordenação crescente de categorias
- Tratamento de orçamento não encontrado

**MonthlyFinancialAnalysisDao.spec.ts**:

- Query SQL correta para totais
- Query SQL correta para receitas por categoria
- Query SQL correta para despesas por categoria
- Filtros corretos (status COMPLETED, excluir TRANSFER)
- Exclusão de categorias deletadas
- Tratamento correto de valores (despesas negativas)

### Testes de Integração

- Endpoint completo com dados reais
- Validação de autorização end-to-end
- Filtros de transações funcionando
- Agrupamento por categoria correto
- Ordenação funcionando
- Formato de resposta correto

### Mocks e Fixtures

- Mock de `IPostgresConnectionAdapter`
- Mock de `IBudgetAuthorizationService`
- Fixtures de transações (INCOME, EXPENSE, COMPLETED)
- Fixtures de categorias (ativas e deletadas)

## ⚖️ Trade-offs e Riscos

### Trade-offs Aceitos

- **Performance**: Queries de agregação podem ser lentas com muitos dados

  - **Mitigação**: Índices existentes em `transactions` já otimizam queries
  - **Aceito**: Para MVP, performance é aceitável

- **Duplicação de Lógica**: Alguma lógica similar a `BudgetOverviewDao`
  - **Mitigação**: Reutilizar padrões, mas manter separação de responsabilidades
  - **Aceito**: Clareza e manutenibilidade valem mais que DRY neste caso

### Riscos Identificados

- **Categorias sem Transações**: Categorias que existem mas não têm transações no período

  - **Mitigação**: Query SQL já filtra apenas categorias com movimentação (GROUP BY)
  - **Status**: ✅ Resolvido

- **Categorias Deletadas**: Transações podem referenciar categorias deletadas

  - **Mitigação**: JOIN com `categories` e filtrar `c.is_deleted = false`
  - **Status**: ✅ Resolvido

- **Timezone**: Cálculo do mês pode variar por timezone

  - **Mitigação**: Usar UTC explicitamente (como em `BudgetOverviewQueryHandler`)
  - **Status**: ✅ Resolvido

- **Valores Negativos**: Despesas precisam ser negativas na resposta
  - **Mitigação**: Usar `-SUM(amount)` para EXPENSE na query SQL
  - **Status**: ✅ Resolvido

## 📋 Lista de Implementação

### Fase 1: Contratos e Interfaces

- [ ] Criar `IMonthlyFinancialAnalysisDao.ts` com interfaces:
  - `CategoryFinancialAggregate` (categoryId, categoryName, amount, transactionCount)
  - `MonthlyFinancialAnalysisResult` (period, totalExpenses, totalIncome, deficit, expensesByCategory, incomeByCategory)
  - `IMonthlyFinancialAnalysisDao.fetchAnalysis()`

### Fase 2: DAO Implementation

- [ ] Criar `MonthlyFinancialAnalysisDao.ts`
- [ ] Implementar query para totais (receitas e despesas)
- [ ] Implementar query para receitas por categoria
- [ ] Implementar query para despesas por categoria
- [ ] Filtrar categorias deletadas (`c.is_deleted = false`)
- [ ] Tratar despesas como negativas (`-SUM(amount)` para EXPENSE)
- [ ] Excluir transações TRANSFER
- [ ] Filtrar apenas status COMPLETED

### Fase 3: Query Handler

- [ ] Criar `MonthlyFinancialAnalysisQueryHandler.ts`
- [ ] Implementar validação de query
- [ ] Implementar validação de autorização
- [ ] Calcular período mensal (UTC)
- [ ] Chamar DAO
- [ ] Calcular déficit (totalExpenses - totalIncome)
- [ ] Formatar período como "YYYY-MM"
- [ ] Ordenar categorias por valor crescente

### Fase 4: Rota HTTP

- [ ] Adicionar rota em `budgets-query-route-registry.ts`
- [ ] Configurar método GET
- [ ] Configurar path `/budget/:budgetId/monthly-analysis`
- [ ] Extrair budgetId dos params
- [ ] Extrair userId do principal
- [ ] Instanciar Query Handler
- [ ] Adicionar métricas de observabilidade

### Fase 5: Testes

- [ ] Testes unitários do Query Handler
- [ ] Testes unitários do DAO
- [ ] Testes de integração do endpoint

### Fase 6: Documentação

- [ ] Atualizar Swagger/OpenAPI
- [ ] Documentar formato de resposta
- [ ] Documentar erros possíveis

## 📚 Referências

- [Meta Specs - Query Strategy](../../../orca-sonhos-meta-specs/technical/backend-architecture/query-strategy.md)
- [Meta Specs - API Endpoints](../../../orca-sonhos-meta-specs/technical/backend-architecture/api-endpoints.md)
- [Meta Specs - Authorization](../../../orca-sonhos-meta-specs/technical/backend-architecture/authorization.md)
- [BudgetOverviewDao](../../src/infrastructure/database/pg/daos/budget/budget-overview/BudgetOverviewDao.ts)
- [DashboardInsightsDao](../../src/infrastructure/database/pg/daos/budget/dashboard-insights/DashboardInsightsDao.ts)
- [BudgetOverviewQueryHandler](../../src/application/queries/budget/budget-overview/BudgetOverviewQueryHandler.ts)

## 🔍 Detalhes de Implementação SQL

### Query para Totais

```sql
SELECT
  COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN -amount ELSE 0 END), 0) AS total_expenses
FROM transactions
WHERE budget_id = $1
  AND is_deleted = false
  AND status = 'COMPLETED'
  AND type != 'TRANSFER'
  AND transaction_date >= $2
  AND transaction_date < $3
```

### Query para Receitas por Categoria

```sql
SELECT
  t.category_id,
  c.name AS category_name,
  COALESCE(SUM(t.amount), 0) AS amount,
  COUNT(*) AS transaction_count
FROM transactions t
INNER JOIN categories c ON c.id = t.category_id
WHERE t.budget_id = $1
  AND t.is_deleted = false
  AND t.status = 'COMPLETED'
  AND t.type = 'INCOME'
  AND t.type != 'TRANSFER'
  AND c.is_deleted = false
  AND t.transaction_date >= $2
  AND t.transaction_date < $3
  AND t.category_id IS NOT NULL
GROUP BY t.category_id, c.name
ORDER BY amount ASC
```

### Query para Despesas por Categoria

```sql
SELECT
  t.category_id,
  c.name AS category_name,
  COALESCE(SUM(-t.amount), 0) AS amount,
  COUNT(*) AS transaction_count
FROM transactions t
INNER JOIN categories c ON c.id = t.category_id
WHERE t.budget_id = $1
  AND t.is_deleted = false
  AND t.status = 'COMPLETED'
  AND t.type = 'EXPENSE'
  AND t.type != 'TRANSFER'
  AND c.is_deleted = false
  AND t.transaction_date >= $2
  AND t.transaction_date < $3
  AND t.category_id IS NOT NULL
GROUP BY t.category_id, c.name
ORDER BY amount ASC
```

**Nota**: As queries podem ser otimizadas combinando em uma única query com UNION ou usando CTEs, mas para clareza e manutenibilidade, manteremos separadas inicialmente.

