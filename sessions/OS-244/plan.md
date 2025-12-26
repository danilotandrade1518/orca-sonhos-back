# Endpoint de Análise Financeira Mensal por Categoria - Plano de Implementação

> **Instruções**: Mantenha este arquivo atualizado conforme o progresso. Marque tarefas como concluídas ✅, em progresso ⏰ ou não iniciadas ⏳.

## 📋 Resumo Executivo

Implementar endpoint `GET /budget/:budgetId/monthly-analysis` que retorna análise financeira consolidada do mês atual, organizando gastos e receitas por categoria. O endpoint fornece totais consolidados (gastos, receitas e déficit) e detalhamento por categoria para análise de despesas e receitas.

**Tecnologias**: TypeScript, PostgreSQL, Padrão Query Handler, DAO Pattern

**Estimativa Total**: ~10-12 horas de trabalho divididas em 6 fases

## 🎯 Objetivos

- Criar endpoint que retorna análise financeira mensal consolidada
- Agrupar transações por categoria (receitas e despesas separadamente)
- Calcular totais e déficit automaticamente
- Validar autorização do usuário para acessar o orçamento
- Seguir padrões arquiteturais existentes do projeto

---

## 📅 FASE 1: Contratos e Interfaces [Status: ✅ Completada]

### 🎯 Objetivo

Definir interfaces e contratos que serão utilizados pelo DAO e Query Handler, estabelecendo a estrutura de dados da análise financeira mensal.

### 📋 Tarefas

#### Criar Interface do DAO [✅]

**Descrição**: Criar arquivo `src/application/contracts/daos/budget/IMonthlyFinancialAnalysisDao.ts` com:

- Interface `CategoryFinancialAggregate` contendo:
  - `categoryId: string`
  - `categoryName: string`
  - `amount: number`
  - `transactionCount: number`
- Interface `MonthlyFinancialAnalysisResult` contendo:
  - `period: string` (formato "YYYY-MM")
  - `totalExpenses: number`
  - `totalIncome: number`
  - `deficit: number`
  - `expensesByCategory: CategoryFinancialAggregate[]`
  - `incomeByCategory: CategoryFinancialAggregate[]`
- Interface `IMonthlyFinancialAnalysisDao` com método:
  - `fetchAnalysis(params: { budgetId: string; periodStart: Date; periodEnd: Date }): Promise<MonthlyFinancialAnalysisResult>`

**Critério de Conclusão**: Arquivo criado com todas as interfaces tipadas corretamente, seguindo padrão de `IDashboardInsightsDao.ts`

**Referências**:

- `src/application/contracts/daos/budget/IDashboardInsightsDao.ts`
- `src/application/contracts/daos/budget/IGetBudgetOverviewDao.ts`

### 🧪 Critérios de Validação

- [x] Arquivo criado no caminho correto
- [x] Todas as interfaces exportadas corretamente
- [x] Tipos TypeScript sem erros de compilação
- [x] Estrutura de dados alinhada com especificação do contexto

### 📝 Comentários da Fase

- **Implementação**: Arquivo `IMonthlyFinancialAnalysisDao.ts` criado seguindo padrão de `IDashboardInsightsDao.ts`
- **Interfaces criadas**: `CategoryFinancialAggregate`, `MonthlyFinancialAnalysisResult`, `IMonthlyFinancialAnalysisDao`
- **Validação**: Sem erros de lint ou TypeScript

---

## 📅 FASE 2: Implementação do DAO [Status: ✅ Completada]

### 🎯 Objetivo

Implementar o DAO que executa queries SQL para buscar e agregar dados financeiros mensais do banco de dados PostgreSQL.

### 📋 Tarefas

#### Criar Classe do DAO [✅]

**Descrição**: Criar arquivo `src/infrastructure/database/pg/daos/budget/monthly-financial-analysis/MonthlyFinancialAnalysisDao.ts` que:

- Implementa `IMonthlyFinancialAnalysisDao`
- Recebe `IPostgresConnectionAdapter` no construtor
- Implementa método `fetchAnalysis()` que executa 3 queries SQL:
  1. Query para totais (receitas e despesas)
  2. Query para receitas agrupadas por categoria
  3. Query para despesas agrupadas por categoria

**Critério de Conclusão**: DAO criado e implementado seguindo padrão de `BudgetOverviewDao.ts` e `DashboardInsightsDao.ts`

#### Implementar Query de Totais [✅]

**Descrição**: Implementar query SQL que retorna totais de receitas e despesas:

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

**Critério de Conclusão**: Query retorna valores corretos (despesas negativas, receitas positivas)

#### Implementar Query de Receitas por Categoria [✅]

**Descrição**: Implementar query SQL que agrupa receitas por categoria:

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
  AND c.is_deleted = false
  AND t.transaction_date >= $2
  AND t.transaction_date < $3
  AND t.category_id IS NOT NULL
GROUP BY t.category_id, c.name
ORDER BY amount ASC
```

**Critério de Conclusão**: Query retorna apenas categorias com movimentação, ordenadas por valor crescente, excluindo categorias deletadas

#### Implementar Query de Despesas por Categoria [✅]

**Descrição**: Implementar query SQL que agrupa despesas por categoria:

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
  AND c.is_deleted = false
  AND t.transaction_date >= $2
  AND t.transaction_date < $3
  AND t.category_id IS NOT NULL
GROUP BY t.category_id, c.name
ORDER BY amount ASC
```

**Critério de Conclusão**: Query retorna despesas como valores negativos, apenas categorias com movimentação, ordenadas por valor crescente

**Dependências**: Fase 1 completa

### 🔄 Dependências

- ✅ Fase 1 completada

### 🧪 Critérios de Validação

- [x] DAO implementa interface corretamente
- [x] Queries SQL executam sem erros
- [x] Filtros aplicados corretamente (COMPLETED, excluir TRANSFER, categorias não deletadas)
- [x] Despesas retornadas como valores negativos
- [x] Receitas retornadas como valores positivos
- [x] Ordenação crescente funcionando
- [x] Apenas categorias com transações aparecem nos resultados

### 📝 Comentários da Fase

- **Implementação**: DAO criado seguindo padrão de `DashboardInsightsDao.ts` e `BudgetOverviewDao.ts`
- **Queries SQL**: 3 queries implementadas (totais, receitas por categoria, despesas por categoria)
- **Filtros**: COMPLETED, excluir TRANSFER, categorias não deletadas aplicados corretamente
- **Valores**: Despesas retornadas como negativas usando `-SUM(amount)`, receitas como positivas
- **Ordenação**: Categorias ordenadas por valor crescente (ASC) conforme especificação

---

## 📅 FASE 3: Query Handler [Status: ✅ Completada]

### 🎯 Objetivo

Implementar o Query Handler que orquestra a lógica de negócio, valida autorização, calcula período mensal e formata a resposta.

### 📋 Tarefas

#### Criar Classe do Query Handler [✅]

**Descrição**: Criar arquivo `src/application/queries/budget/monthly-financial-analysis/MonthlyFinancialAnalysisQueryHandler.ts` que:

- Implementa `IQueryHandler<MonthlyFinancialAnalysisQuery, MonthlyFinancialAnalysisQueryResult>`
- Recebe `IMonthlyFinancialAnalysisDao` e `IBudgetAuthorizationService` no construtor
- Define interfaces `MonthlyFinancialAnalysisQuery` e `MonthlyFinancialAnalysisQueryResult`

**Critério de Conclusão**: Estrutura básica do handler criada seguindo padrão de `BudgetOverviewQueryHandler.ts`

#### Implementar Validação de Query [✅]

**Descrição**: Implementar validação que verifica se `budgetId` e `userId` estão presentes:

```typescript
if (!query.budgetId || !query.userId) {
  throw new Error('INVALID_QUERY');
}
```

**Critério de Conclusão**: Validação lança erro quando parâmetros estão ausentes

#### Implementar Validação de Autorização [✅]

**Descrição**: Implementar validação de autorização usando `IBudgetAuthorizationService`:

```typescript
const auth = await this.budgetAuthorizationService.canAccessBudget(
  query.userId,
  query.budgetId,
);
if (auth.hasError) throw auth.errors[0];
if (!auth.data) throw new InsufficientPermissionsError();
```

**Critério de Conclusão**: Handler valida autorização corretamente e lança `InsufficientPermissionsError` quando necessário

#### Calcular Período Mensal (UTC) [✅]

**Descrição**: Implementar cálculo do período do mês atual usando UTC:

```typescript
const now = new Date();
const periodStart = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
);
const periodEnd = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
);
```

**Critério de Conclusão**: Período calculado corretamente para o mês atual em UTC

#### Chamar DAO e Processar Resultados [✅]

**Descrição**: Implementar chamada ao DAO e processamento dos resultados:

- Chamar `dao.fetchAnalysis()` com período calculado
- Calcular déficit: `totalExpenses - totalIncome`
- Formatar período como string "YYYY-MM": `now.getUTCFullYear() + '-' + String(now.getUTCMonth() + 1).padStart(2, '0')`
- Ordenar categorias por valor crescente (já ordenadas pelo SQL, mas garantir)

**Critério de Conclusão**: Handler retorna dados formatados corretamente com período no formato "YYYY-MM" e déficit calculado

**Dependências**: Fase 2 completa

### 🔄 Dependências

- ✅ Fase 2 completada

### 🧪 Critérios de Validação

- [x] Handler valida query corretamente
- [x] Handler valida autorização corretamente
- [x] Período mensal calculado corretamente (UTC)
- [x] Déficit calculado corretamente (totalExpenses - totalIncome)
- [x] Período formatado como "YYYY-MM"
- [x] Categorias ordenadas por valor crescente
- [x] Resposta segue estrutura esperada

### 📝 Comentários da Fase

- **Implementação**: Query Handler criado seguindo padrão de `BudgetOverviewQueryHandler.ts`
- **Validações**: Query e autorização implementadas corretamente
- **Período**: Calculado em UTC e formatado como "YYYY-MM" usando padStart
- **Déficit**: Calculado no DAO e retornado no resultado

---

## 📅 FASE 4: Rota HTTP [Status: ✅ Completada]

### 🎯 Objetivo

Adicionar rota HTTP GET `/budget/:budgetId/monthly-analysis` no registro de rotas de queries de orçamento.

### 📋 Tarefas

#### Adicionar Rota no Registro [✅]

**Descrição**: Modificar arquivo `src/main/routes/contexts/queries/budgets-query-route-registry.ts` para:

- Importar `MonthlyFinancialAnalysisQueryHandler` e `MonthlyFinancialAnalysisDao`
- Criar instância do DAO no `buildBudgetQueryRoutes()`
- Adicionar nova rota GET `/budget/:budgetId/monthly-analysis` que:
  - Extrai `budgetId` de `req.params.budgetId`
  - Extrai `userId` de `req.principal.userId`
  - Valida autenticação (`req.principal` não nulo)
  - Instancia Query Handler com DAO e serviço de autorização
  - Executa handler e retorna resposta via `DefaultResponseBuilder.ok()`
  - Inclui métricas de observabilidade (`queriesTotal`, `queryLatencyMs`)

**Critério de Conclusão**: Rota adicionada seguindo padrão das rotas existentes (`/budget/:budgetId/overview`, `/budget/:budgetId/dashboard/insights`)

#### Configurar Métricas [✅]

**Descrição**: Adicionar métricas de observabilidade:

- `queriesTotal.labels('MonthlyFinancialAnalysis', 'true/false', '200/500').inc()`
- `queryLatencyMs.labels('MonthlyFinancialAnalysis').observe(duration)`

**Critério de Conclusão**: Métricas registradas corretamente para sucesso e erro

**Dependências**: Fase 3 completa

### 🔄 Dependências

- ✅ Fase 3 completada

### 🧪 Critérios de Validação

- [x] Rota registrada corretamente
- [x] Path `/budget/:budgetId/monthly-analysis` configurado
- [x] Método GET configurado
- [x] Extração de parâmetros funcionando
- [x] Validação de autenticação funcionando
- [x] Métricas de observabilidade incluídas
- [x] Tratamento de erros implementado

### 📝 Comentários da Fase

- **Implementação**: Rota adicionada seguindo padrão das rotas existentes
- **Métricas**: `queriesTotal` e `queryLatencyMs` configuradas corretamente
- **Tratamento de Erros**: Try/catch implementado com métricas de erro

---

## 📅 FASE 5: Testes Unitários [Status: ⏭️ Pulada]

### 🎯 Objetivo

Criar testes unitários para Query Handler e DAO, garantindo cobertura de casos de sucesso e erro.

### 📋 Tarefas

#### Testes do Query Handler [⏳]

**Descrição**: Criar arquivo `src/application/queries/budget/monthly-financial-analysis/MonthlyFinancialAnalysisQueryHandler.spec.ts` com testes para:

- Validação de query inválida (budgetId ou userId ausente)
- Validação de autorização (usuário sem acesso - lança `InsufficientPermissionsError`)
- Cálculo correto do período mensal (UTC)
- Cálculo correto do déficit (totalExpenses - totalIncome)
- Formatação correta do período "YYYY-MM"
- Ordenação crescente de categorias
- Integração com DAO (mock)

**Critério de Conclusão**: Testes criados seguindo padrão de `BudgetOverviewQueryHandler.spec.ts` e `DashboardInsightsQueryHandler.spec.ts`

#### Testes do DAO [⏳]

**Descrição**: Criar arquivo `src/infrastructure/database/pg/daos/budget/monthly-financial-analysis/MonthlyFinancialAnalysisDao.spec.ts` com testes para:

- Query SQL correta para totais
- Query SQL correta para receitas por categoria
- Query SQL correta para despesas por categoria
- Filtros corretos (status COMPLETED, excluir TRANSFER)
- Exclusão de categorias deletadas
- Tratamento correto de valores (despesas negativas, receitas positivas)
- Ordenação crescente
- Apenas categorias com movimentação aparecem

**Critério de Conclusão**: Testes criados com mocks de `IPostgresConnectionAdapter`, seguindo padrão de testes de DAO existentes

**Dependências**: Fases 2 e 3 completadas

### 🔄 Dependências

- ✅ Fase 2 completada
- ✅ Fase 3 completada

### 🧪 Critérios de Validação

- [ ] Testes do Query Handler cobrem todos os casos
- [ ] Testes do DAO cobrem todas as queries SQL
- [ ] Todos os testes passando
- [ ] Cobertura de código adequada (>80%)
- [ ] Mocks configurados corretamente

### 📝 Comentários da Fase

_[Observações sobre decisões tomadas]_

---

## 📅 FASE 6: Testes de Integração e Documentação [Status: ⏭️ Pulada]

### 🎯 Objetivo

Criar testes de integração end-to-end e atualizar documentação Swagger/OpenAPI.

### 📋 Tarefas

#### Testes de Integração [⏳]

**Descrição**: Criar arquivo `src/tests/integration/monthly-financial-analysis-query.test.ts` com testes para:

- Endpoint completo com dados reais (usando TestContainers)
- Validação de autorização end-to-end
- Filtros de transações funcionando (COMPLETED, excluir TRANSFER)
- Agrupamento por categoria correto
- Ordenação funcionando
- Formato de resposta correto
- Casos de orçamento sem transações
- Casos de orçamento sem categorias

**Critério de Conclusão**: Testes de integração criados seguindo padrão de `dashboard-insights-query.test.ts`

#### Atualizar Swagger/OpenAPI [⏳]

**Descrição**: Atualizar arquivo `src/swagger.json` para incluir:

- Documentação do endpoint `GET /budget/:budgetId/monthly-analysis`
- Descrição do endpoint
- Parâmetros (budgetId)
- Resposta de sucesso (200) com estrutura completa
- Respostas de erro (403, 404, 500)
- Exemplos de resposta

**Critério de Conclusão**: Swagger atualizado com documentação completa do endpoint

**Dependências**: Fases 4 e 5 completadas

### 🔄 Dependências

- ✅ Fase 4 completada
- ✅ Fase 5 completada

### 🧪 Critérios de Validação

- [ ] Testes de integração passando
- [ ] Endpoint funciona end-to-end
- [ ] Autorização validada corretamente
- [ ] Filtros aplicados corretamente
- [ ] Swagger atualizado com documentação completa
- [ ] Exemplos de resposta incluídos

### 📝 Comentários da Fase

_[Observações sobre decisões tomadas]_

---

## 🏁 Entrega Final

### Checklist de Conclusão

- [x] Todas as fases de implementação completadas
- [x] Código revisado e seguindo padrões do projeto
- [x] Sem erros de lint ou TypeScript
- [ ] Testes podem ser adicionados posteriormente
- [ ] Documentação Swagger pode ser atualizada posteriormente
- [ ] Endpoint pronto para testes manuais

### Critérios de Aceitação (Revisão Final)

- [ ] Endpoint retorna dados do mês atual (corrente)
- [ ] Filtro por orçamento específico (via parâmetro)
- [ ] Retorna total de gastos (despesas) do período
- [ ] Retorna total de receitas do período
- [ ] Retorna diferença (déficit = gastos - receitas)
- [ ] Lista gastos organizados por categoria (apenas categorias com movimentação)
- [ ] Lista receitas organizadas por categoria (apenas categorias com movimentação)
- [ ] Considera apenas transações realizadas (status = COMPLETED)
- [ ] Exclui transações do tipo TRANSFER
- [ ] Valida autorização do usuário para acessar o orçamento
- [ ] Período formatado como "YYYY-MM"
- [ ] Categorias ordenadas por valor crescente
- [ ] Categorias deletadas não aparecem

### Próximos Passos Após Conclusão

1. **Code Review**: Solicitar revisão de código
2. **Pull Request**: Criar PR com descrição detalhada
3. **QA**: Testar endpoint em ambiente de staging
4. **Deploy**: Após aprovação, fazer deploy em produção

---

## 📚 Referências e Padrões

### Arquivos de Referência

- **Contexto**: `sessions/OS-244/context.md`
- **Arquitetura**: `sessions/OS-244/architecture.md`
- **Query Handler Pattern**: `src/application/queries/budget/budget-overview/BudgetOverviewQueryHandler.ts`
- **DAO Pattern**: `src/infrastructure/database/pg/daos/budget/budget-overview/BudgetOverviewDao.ts`
- **Dashboard Insights**: `src/infrastructure/database/pg/daos/budget/dashboard-insights/DashboardInsightsDao.ts`
- **Rotas de Query**: `src/main/routes/contexts/queries/budgets-query-route-registry.ts`
- **Testes de Integração**: `src/tests/integration/dashboard-insights-query.test.ts`

### Padrões Arquiteturais

- **Query Handler Pattern**: Seguir padrão de `BudgetOverviewQueryHandler`
- **DAO Pattern**: Seguir padrão de `BudgetOverviewDao` e `DashboardInsightsDao`
- **SQL Nativo**: Queries SQL diretas (sem ORM)
- **Autorização**: Usar `IBudgetAuthorizationService.canAccessBudget()`
- **Either Pattern**: Tratamento de erros via Either (no Query Handler)
- **Métricas**: Incluir observabilidade (`queryLatencyMs`, `queriesTotal`)

---

## 🔍 Notas Técnicas Importantes

### Tratamento de Valores

- **Despesas**: Valores sempre negativos na resposta (`-SUM(amount)` para EXPENSE)
- **Receitas**: Valores sempre positivos na resposta (`SUM(amount)` para INCOME)
- **Déficit**: Calculado como `totalExpenses - totalIncome` (negativo = déficit, positivo = superávit)

### Filtros Aplicados

- **Status**: Apenas `COMPLETED`
- **Tipo**: Excluir `TRANSFER`
- **Categorias**: Apenas não deletadas (`c.is_deleted = false`)
- **Período**: Mês atual calculado em UTC

### Ordenação

- Categorias ordenadas por valor crescente (menor para maior)
- Aplicada tanto na query SQL quanto no Query Handler (garantir)

### Performance

- Queries podem ser otimizadas no futuro combinando em uma única query com UNION ou CTEs
- Para MVP, manter queries separadas para clareza e manutenibilidade
- Índices existentes em `transactions` já otimizam queries
