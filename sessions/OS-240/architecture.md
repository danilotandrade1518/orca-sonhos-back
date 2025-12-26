# Remover campo currentBalance da entidade Envelope - Arquitetura Técnica

## 🏗️ Visão Geral da Implementação

### Estado Atual

- A entidade `Envelope` possui campo `_currentBalance` do tipo `EnvelopeBalance`
- Use cases `AddAmountToEnvelopeUseCase`, `RemoveAmountFromEnvelopeUseCase` e `TransferBetweenEnvelopesUseCase` manipulam o saldo diretamente
- A tabela `envelopes` possui coluna `current_balance` com constraint `envelopes_balance_check`
- O `ListEnvelopesDao` está usando campos incorretos (`t.envelope_id`, `t.direction`, `t.amount_cents`) que não existem

### Mudanças Propostas

1. **Remoção completa do campo `currentBalance`** da entidade de domínio
2. **Remoção dos métodos** `addAmount()`, `removeAmount()` e `getAvailableLimit()` da entidade
3. **Remoção dos use cases** relacionados (`AddAmountToEnvelopeUseCase`, `RemoveAmountFromEnvelopeUseCase`, `TransferBetweenEnvelopesUseCase`)
4. **Remoção do value object** `EnvelopeBalance` e seus testes
5. **Migração de banco de dados** para remover coluna `current_balance` e constraint
6. **Correção do `ListEnvelopesDao`** para usar relação correta através de Category
7. **Atualização de todos os testes** relacionados

### Impactos

- **Domínio**: Entidade `Envelope` simplificada, sem lógica de manipulação de saldo
- **Aplicação**: 3 use cases removidos completamente, junto com Unit of Work, interface e stub relacionados
- **Composição**: `EnvelopeCompositionRoot` simplificado, removendo métodos de criação dos use cases
- **Interface HTTP**: 3 controllers removidos, 3 rotas removidas, 3 endpoints removidos do swagger
- **Infraestrutura**: Mapper atualizado, migração criada, DAO corrigido
- **Testes**: Múltiplos arquivos de teste atualizados ou removidos

## 🔧 Componentes e Estrutura

### Arquivos Principais a Modificar

#### Domínio

- `src/domain/aggregates/envelope/envelope-entity/Envelope.ts`

  - Remover propriedade `_currentBalance: EnvelopeBalance`
  - Remover getter `currentBalance`
  - Remover métodos `addAmount()`, `removeAmount()`, `getAvailableLimit()`
  - Remover parâmetro `currentBalance` do método `restore()`
  - Remover inicialização de `balanceVo` no método `create()`
  - Remover import de `EnvelopeBalance`

- `src/domain/aggregates/envelope/envelope-entity/Envelope.spec.ts`

  - Remover todos os testes relacionados a `currentBalance`
  - Remover testes de `addAmount()`, `removeAmount()`, `getAvailableLimit()`
  - Remover testes de balance management

- `src/domain/aggregates/envelope/value-objects/envelope-balance/EnvelopeBalance.ts`

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

- `src/domain/aggregates/envelope/value-objects/envelope-balance/EnvelopeBalance.spec.ts`

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

- `src/domain/aggregates/envelope/services/TransferBetweenEnvelopesService.ts`

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE** (depende de `addAmount` e `removeAmount`)

- `src/domain/aggregates/envelope/services/TransferBetweenEnvelopesService.spec.ts`
  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

#### Aplicação

- `src/application/use-cases/envelope/add-amount-to-envelope/`

  - **DIRETÓRIO COMPLETO A SER REMOVIDO**

- `src/application/use-cases/envelope/remove-amount-from-envelope/`

  - **DIRETÓRIO COMPLETO A SER REMOVIDO**

- `src/application/use-cases/envelope/transfer-between-envelopes/`
  - **DIRETÓRIO COMPLETO A SER REMOVIDO** (inclui `TransferBetweenEnvelopesUseCase`, DTO e testes)

#### Infraestrutura

- `src/infrastructure/database/pg/mappers/envelope/EnvelopeMapper.ts`

  - Remover campo `current_balance` da interface `EnvelopeRow`
  - Remover mapeamento de `currentBalance` no método `toDomain()`
  - Remover mapeamento de `current_balance` no método `toRow()`

- `src/infrastructure/database/pg/mappers/envelope/EnvelopeMapper.spec.ts`

  - Atualizar testes removendo referências a `currentBalance`

- `src/infrastructure/database/pg/migrations/1755018798541_create-envelopes-table.js`

  - Remover coluna `current_balance` da definição da tabela
  - Remover constraint `envelopes_balance_check`

- `src/infrastructure/database/pg/migrations/[timestamp]_remove-current-balance-from-envelopes.js`

  - **NOVA MIGRAÇÃO A SER CRIADA** para remover coluna e constraint em produção

- `src/infrastructure/database/pg/daos/envelope/list-envelopes/ListEnvelopesDao.ts`

  - **CORREÇÃO CRÍTICA**: Corrigir query SQL para usar relação correta
  - Trocar `t.envelope_id = e.id` por `t.category_id = e.category_id`
  - Trocar `t.direction = 'OUT'` por `t.type = 'EXPENSE'`
  - Trocar `t.amount_cents` por `t.amount`
  - Verificar se `e.allocated_cents` existe ou deve ser removido da query

- `src/infrastructure/database/pg/daos/envelope/list-envelopes/ListEnvelopesDao.spec.ts`

  - Atualizar testes para refletir a correção da query

- `src/infrastructure/database/pg/repositories/envelope/get-envelope-repository/GetEnvelopeRepository.ts`

  - Verificar se precisa de ajustes (provavelmente não, apenas remove campo do SELECT)

- `src/infrastructure/database/pg/repositories/envelope/save-envelope-repository/SaveEnvelopeRepository.ts`

  - Verificar se precisa de ajustes (provavelmente não, apenas remove campo do INSERT/UPDATE)

- `src/infrastructure/database/pg/repositories/envelope/add-envelope-repository/AddEnvelopeRepository.ts`

  - Verificar se precisa de ajustes

- `src/infrastructure/database/pg/unit-of-works/transfer-between-envelopes/TransferBetweenEnvelopesUnitOfWork.ts`

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE** (depende do use case removido)

- `src/infrastructure/database/pg/unit-of-works/transfer-between-envelopes/TransferBetweenEnvelopesUnitOfWork.spec.ts`

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

- `src/application/contracts/unit-of-works/ITransferBetweenEnvelopesUnitOfWork.ts`

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

- `src/application/shared/tests/stubs/TransferBetweenEnvelopesUnitOfWorkStub.ts`
  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

#### Interface HTTP

- `src/interface/http/controllers/envelope/add-amount-envelope.controller.ts`

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

- `src/interface/http/controllers/envelope/remove-amount-envelope.controller.ts`

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

- `src/main/routes/contexts/mutations/envelope-route-registry.ts`

  - Remover rotas `/envelope/add-amount-envelope`, `/envelope/remove-amount-envelope`, `/envelope/transfer-between-envelopes`
  - Remover imports dos controllers relacionados

- `src/main/composition/EnvelopeCompositionRoot.ts`

  - Remover método `createAddAmountToEnvelopeUseCase()`
  - Remover método `createRemoveAmountFromEnvelopeUseCase()`
  - Remover método `createTransferBetweenEnvelopesUseCase()`
  - Remover propriedade `transferUnitOfWork`
  - Remover inicialização de `transferUnitOfWork` no construtor
  - Remover imports dos use cases removidos
  - Remover import de `TransferBetweenEnvelopesService`
  - Remover import de `TransferBetweenEnvelopesUnitOfWork`

- `src/swagger.json`
  - Remover endpoint `/envelope/add-amount-envelope`
  - Remover endpoint `/envelope/remove-amount-envelope`
  - Remover endpoint `/envelope/transfer-between-envelopes`

#### Testes

- `src/tests/e2e/envelope/add-amount-envelope.e2e.test.ts`

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

- `src/tests/e2e/envelope/remove-amount-envelope.e2e.test.ts`

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

- `src/tests/e2e/envelope/transfer-between-envelopes.e2e.test.ts` (se existir)

  - **ARQUIVO A SER REMOVIDO COMPLETAMENTE**

- `src/tests/integration/envelope-composition-root.test.ts`

  - Atualizar removendo referências aos use cases removidos

- Todos os outros arquivos de teste que referenciam `currentBalance` (19 arquivos encontrados)

### Novos Arquivos a Criar

- `src/infrastructure/database/pg/migrations/[timestamp]_remove-current-balance-from-envelopes.js`
  - Migration para remover coluna `current_balance` e constraint `envelopes_balance_check`

### Estrutura de Diretórios

Nenhuma mudança estrutural, apenas remoção de arquivos e diretórios.

## 🏛️ Padrões Arquiteturais

### Padrões Seguidos

- **Clean Architecture**: Mantém separação de camadas
- **DDD**: Mantém agregados e entidades de domínio
- **CQRS**: Queries continuam funcionando, apenas comandos são removidos

### Decisões Arquiteturais

- **Decisão**: Remover completamente use cases ao invés de adaptá-los
- **Alternativas**: Adaptar use cases para criar transações
- **Justificativa**: Conforme especificado pelo usuário, os use cases devem ser removidos. O cálculo de saldo será feito via queries no futuro.

- **Decisão**: Corrigir `ListEnvelopesDao` para usar relação através de Category
- **Alternativas**: Criar nova tabela de relacionamento
- **Justificativa**: A relação já existe através de Category, apenas o código estava incorreto

## 📦 Dependências e Integrações

### Dependências Existentes

- `node-pg-migrate`: Para criar migration de remoção
- `jest`: Para atualizar testes

### Novas Dependências

Nenhuma nova dependência necessária.

### Integrações

- **Nenhuma integração externa afetada**: A remoção é interna ao sistema

## 🔄 Fluxo de Dados

### Antes (Estado Atual)

```
Use Case → Envelope.addAmount() → _currentBalance.add() → Saldo atualizado na entidade → Salvo no banco
```

### Depois (Estado Futuro)

```
Query → ListEnvelopesDao → JOIN com transactions via category_id → Cálculo dinâmico de spent
```

## 🧪 Considerações de Teste

### Testes Unitários

- **Envelope.spec.ts**: Remover todos os testes de balance management
- **EnvelopeMapper.spec.ts**: Atualizar para não incluir `currentBalance`
- **ListEnvelopesDao.spec.ts**: Atualizar para refletir query corrigida

### Testes de Integração

- **envelope-composition-root.test.ts**: Remover referências aos use cases removidos

### Testes E2E

- Remover testes E2E dos use cases removidos
- Verificar se outros testes E2E precisam de ajustes

### Mocks e Fixtures

- Atualizar fixtures que incluem `currentBalance`

## ⚖️ Trade-offs e Riscos

### Trade-offs Aceitos

- **Perda de funcionalidade**: Os use cases de adicionar/remover saldo são removidos
- **Cálculo dinâmico**: Saldo será calculado apenas em queries, não mais armazenado

### Riscos Identificados

- **Breaking changes**: Código que depende de `currentBalance` pode quebrar
- **Mitigação**: Buscar e atualizar todos os 19 arquivos que referenciam `currentBalance`

- **Query incorreta**: `ListEnvelopesDao` pode estar retornando dados incorretos
- **Mitigação**: Corrigir query para usar relação correta através de Category

- **Testes quebrados**: Muitos testes podem quebrar após remoções
- **Mitigação**: Atualizar sistematicamente todos os testes relacionados

## 📋 Lista de Implementação

### Fase 1: Preparação e Análise

- [ ] Listar todos os arquivos que referenciam `currentBalance` (já identificados 19)
- [ ] Verificar se há migrações posteriores que adicionam `allocated_cents`
- [ ] Revisar todos os testes relacionados

### Fase 2: Remoção do Domínio

- [ ] Remover propriedade `_currentBalance` e getter `currentBalance` de `Envelope.ts`
- [ ] Remover métodos `addAmount()`, `removeAmount()`, `getAvailableLimit()` de `Envelope.ts`
- [ ] Atualizar método `restore()` removendo parâmetro `currentBalance`
- [ ] Atualizar método `create()` removendo inicialização de `balanceVo`
- [ ] Remover arquivo `EnvelopeBalance.ts` e `EnvelopeBalance.spec.ts`
- [ ] Remover arquivo `TransferBetweenEnvelopesService.ts` e seu teste
- [ ] Atualizar `Envelope.spec.ts` removendo testes relacionados

### Fase 3: Remoção de Use Cases e Serviços Relacionados

- [ ] Remover diretório `add-amount-to-envelope/` (use case, DTO, testes)
- [ ] Remover diretório `remove-amount-from-envelope/` (use case, DTO, testes)
- [ ] Remover diretório `transfer-between-envelopes/` (use case, DTO, testes)
- [ ] Remover `TransferBetweenEnvelopesService.ts` e `TransferBetweenEnvelopesService.spec.ts`
- [ ] Remover `TransferBetweenEnvelopesUnitOfWork.ts` e seu teste
- [ ] Remover `ITransferBetweenEnvelopesUnitOfWork.ts`
- [ ] Remover `TransferBetweenEnvelopesUnitOfWorkStub.ts`

### Fase 4: Atualização de Infraestrutura

- [ ] Atualizar `EnvelopeMapper.ts` removendo `current_balance`
- [ ] Atualizar `EnvelopeMapper.spec.ts`
- [ ] Criar migration `remove-current-balance-from-envelopes.js`
- [ ] Atualizar migration inicial removendo `current_balance` e constraint
- [ ] Corrigir `ListEnvelopesDao.ts` para usar relação através de Category
- [ ] Atualizar `ListEnvelopesDao.spec.ts`
- [ ] Verificar e atualizar repositórios se necessário

### Fase 5: Atualização de Interface e Composição

- [ ] Remover `add-amount-envelope.controller.ts`
- [ ] Remover `remove-amount-envelope.controller.ts`
- [ ] Remover `transfer-between-envelopes.controller.ts`
- [ ] Atualizar `envelope-route-registry.ts` removendo 3 rotas e imports
- [ ] Atualizar `EnvelopeCompositionRoot.ts` removendo 3 métodos, propriedade e imports
- [ ] Atualizar `swagger.json` removendo 3 endpoints

### Fase 6: Atualização de Testes

- [ ] Remover testes E2E dos use cases removidos
- [ ] Atualizar `envelope-composition-root.test.ts`
- [ ] Atualizar todos os outros testes que referenciam `currentBalance`

### Fase 7: Validação Final

- [ ] Executar todos os testes
- [ ] Verificar que não há referências restantes a `currentBalance`
- [ ] Verificar que migration funciona corretamente
- [ ] Validar que queries continuam funcionando

## 📚 Referências

- **Meta Specs**: https://github.com/danilotandrade1518/orca-sonhos-meta-specs
- **Issue Jira**: [OS-240](https://orca-sonhos.atlassian.net/browse/OS-240)
- **Arquivos principais**:
  - `src/domain/aggregates/envelope/envelope-entity/Envelope.ts`
  - `src/infrastructure/database/pg/daos/envelope/list-envelopes/ListEnvelopesDao.ts`
  - `src/infrastructure/database/pg/migrations/1755018798541_create-envelopes-table.js`
  - `src/infrastructure/database/pg/migrations/1755018798542_create-transactions-table.js`

## 🔍 Detalhamento da Correção do ListEnvelopesDao

### Query Atual (Incorreta)

```sql
SELECT e.id, e.name, e.allocated_cents,
       COALESCE(SUM(CASE WHEN t.direction = 'OUT' THEN ABS(t.amount_cents) ELSE 0 END), 0) AS spent_cents
FROM envelopes e
LEFT JOIN transactions t
  ON t.envelope_id = e.id  -- ❌ Campo não existe
 AND t.budget_id = e.budget_id
 AND t.direction = 'OUT'   -- ❌ Campo não existe
WHERE e.budget_id = $1
GROUP BY e.id, e.name, e.allocated_cents
ORDER BY e.name ASC
```

### Query Corrigida

```sql
SELECT e.id, e.name, e.monthly_limit AS allocated_cents,  -- monthly_limit representa o allocated
       COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN ABS(t.amount) ELSE 0 END), 0) AS spent_cents
FROM envelopes e
LEFT JOIN transactions t
  ON t.category_id = e.category_id  -- ✅ Relação através de Category
 AND t.budget_id = e.budget_id
 AND t.type = 'EXPENSE'             -- ✅ Usar type ao invés de direction
 AND t.is_deleted = false           -- ✅ Filtrar transações não deletadas
WHERE e.budget_id = $1
  AND e.is_deleted = false          -- ✅ Filtrar envelopes não deletados
GROUP BY e.id, e.name, e.monthly_limit
ORDER BY e.name ASC
```

### Observações

- `allocated` na interface `EnvelopeListItem` corresponde ao `monthly_limit` do envelope
- O `ListEnvelopesQueryHandler` usa `allocated` para calcular `remaining = allocated - spent`
- Adicionar filtros de `is_deleted` para garantir consistência
- A query deve retornar `allocated_cents` como alias para manter compatibilidade com a interface


