# Endpoint de Análise Financeira Mensal por Categoria - Contexto de Desenvolvimento

# OS-244

## 🎯 Objetivo

Criar um endpoint que retorna análise financeira consolidada do mês atual de um orçamento específico, organizando gastos e receitas por categoria. O endpoint fornece totais consolidados (gastos, receitas e déficit) e detalhamento por categoria para análise de despesas e receitas.

**Motivação:**
Usuários precisam de uma visão consolidada mensal para:

- Entender onde o dinheiro está sendo gasto
- Comparar receitas vs despesas no período
- Identificar categorias com maior impacto financeiro
- Avaliar saúde financeira do orçamento

**Cenários de uso:**

- Dashboard financeiro mensal
- Relatórios de análise de gastos
- Planejamento e ajuste de orçamento

## 📋 Requisitos Funcionais

### Funcionalidades Principais

- **Análise Mensal Automática**: Endpoint retorna dados do mês atual (corrente) calculado automaticamente
- **Filtro por Orçamento**: Endpoint aceita parâmetro `budgetId` para filtrar por orçamento específico
- **Totais Consolidados**: Retorna total de gastos (despesas), total de receitas e diferença (déficit = gastos - receitas)
- **Agrupamento por Categoria**: Lista gastos organizados por categoria (apenas categorias com movimentação)
- **Agrupamento de Receitas**: Lista receitas organizadas por categoria (apenas categorias com movimentação)

### Comportamentos Esperados

- **Filtro de Transações**: Considera apenas transações realizadas (status = COMPLETED)
- **Exclusão de Transferências**: Exclui transações do tipo TRANSFER
- **Autorização**: Valida autorização do usuário para acessar o orçamento solicitado
- **Período Automático**: Calcula automaticamente o período do mês atual (primeiro dia do mês até último dia)
- **Formato de Período**: Retorna período no formato "YYYY-MM" (ex: "2025-01")

### Estrutura de Resposta Esperada

```json
{
  "period": "2025-01",
  "totalExpenses": 5000,
  "totalIncome": 8000,
  "deficit": -3000,
  "expensesByCategory": [
    {
      "categoryId": "uuid",
      "categoryName": "Alimentação",
      "amount": 2000,
      "transactionCount": 15
    }
  ],
  "incomeByCategory": [
    {
      "categoryId": "uuid",
      "categoryName": "Salário",
      "amount": 8000,
      "transactionCount": 1
    }
  ]
}
```

## 🏗️ Considerações Técnicas

### Arquitetura

- **Padrão Query Handler**: Seguir padrão existente de Query Handlers para endpoints de leitura
- **DAO Pattern**: Criar DAO específico para agregações financeiras mensais
- **SQL Nativo**: Usar SQL nativo para queries de agregação (seguindo padrão do projeto)
- **Autorização**: Usar `IBudgetAuthorizationService` para validar acesso ao orçamento

### Tecnologias e Dependências

- **PostgreSQL**: Queries SQL nativas para agregações
- **TypeScript**: Tipagem forte para interfaces e DTOs
- **Padrões Existentes**: Reutilizar padrões de `BudgetOverviewDao` e `DashboardInsightsDao`

### Padrões a Seguir

- **Estrutura de Rotas**: Seguir padrão `/budget/:budgetId/...` para endpoints de orçamento
- **Nomenclatura**: Usar kebab-case para nomes de arquivos e classes
- **Tratamento de Erros**: Usar `Either` pattern e erros específicos do domínio
- **Métricas**: Incluir métricas de observabilidade (queryLatencyMs, queriesTotal)

## 🧪 Estratégia de Testes

### Testes Necessários

- **Testes Unitários**:

  - Query Handler com validação de autorização
  - DAO com queries SQL corretas
  - Cálculo de período mensal
  - Formatação de resposta

- **Testes de Integração**:
  - Endpoint completo com dados reais
  - Validação de autorização
  - Filtros de transações (status, tipo)
  - Agrupamento por categoria

### Critérios de Aceitação

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

## 🔗 Dependências e Impactos

### Sistemas Afetados

- **Rotas de Query**: Adicionar nova rota em `budgets-query-route-registry.ts`
- **DAOs**: Criar novo DAO para análise financeira mensal
- **Query Handlers**: Criar novo Query Handler
- **Contratos**: Criar interfaces para DAO e Query Handler

### Integrações Necessárias

- **IBudgetAuthorizationService**: Validação de acesso ao orçamento
- **IPostgresConnectionAdapter**: Execução de queries SQL
- **Sistema de Métricas**: Observabilidade de queries

## 🚧 Restrições e Considerações

### Limitações Técnicas

- **Período Fixo**: Endpoint retorna apenas mês atual (não aceita parâmetro de período)
- **Apenas COMPLETED**: Transações com outros status são ignoradas
- **Sem TRANSFER**: Transações do tipo TRANSFER são excluídas
- **Categorias com Movimentação**: Apenas categorias que têm transações no período aparecem
- **Categorias Deletadas**: Categorias deletadas não são incluídas (filtrar `c.is_deleted = false`)
- **Valores de Transação**: `amount` é sempre positivo no banco; despesas devem ser tratadas como negativas na query
- **Timezone**: Cálculo do mês atual usa UTC
- **Ordenação**: Categorias ordenadas por valor de forma crescente

### Riscos

- **Performance**: Queries de agregação podem ser lentas com muitos dados
  - **Mitigação**: Usar índices apropriados e otimizar queries SQL
- **Categorias sem Nome**: Categorias deletadas não devem aparecer (filtrar `c.is_deleted = false`)
  - **Mitigação**: JOIN com categorias e filtrar categorias deletadas
- **Tratamento de Valores**: Despesas precisam ser negativas na resposta
  - **Mitigação**: Usar `-SUM(amount)` para EXPENSE e `SUM(amount)` para INCOME

## 📚 Referências

- Issue/Card: [OS-244](https://orca-sonhos.atlassian.net/browse/OS-244)
- Padrões de Query: `src/infrastructure/database/pg/daos/budget/dashboard-insights/DashboardInsightsDao.ts`
- Padrão de Overview: `src/application/queries/budget/budget-overview/BudgetOverviewQueryHandler.ts`
- Meta Specs: `/home/danilo/workspace/projeto-orca-sonhos/orca-sonhos-meta-specs`
