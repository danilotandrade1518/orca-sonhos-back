# Remover campo currentBalance da entidade Envelope - Log de Desenvolvimento

> **Propósito**: Registrar progresso essencial, decisões técnicas e próximos passos.

## 📋 Sessões de Trabalho

### 🗓️ Sessão 2025-01-27 - Início

**Fase**: FASE 1 - Preparação e Análise
**Objetivo**: Identificar todas as dependências e referências a `currentBalance` e componentes relacionados

#### ✅ Trabalho Realizado

- Executada busca completa por referências a `currentBalance` (40 ocorrências encontradas)
- Executada busca completa por referências a `current_balance` (42 ocorrências encontradas)
- Executada busca por referências aos use cases a serem removidos:
  - `AddAmountToEnvelope`: 27 ocorrências
  - `RemoveAmountFromEnvelope`: 26 ocorrências
  - `TransferBetweenEnvelopes`: 70 ocorrências
- Verificada estrutura das migrações:
  - `create-envelopes-table.js`: contém `current_balance` e constraint `envelopes_balance_check`
  - `create-transactions-table.js`: estrutura confirmada (campos `type`, `amount`, `category_id` disponíveis)
  - Nenhuma migração posterior referenciando `allocated_cents`
- Confirmado que `ListEnvelopesDao` está usando campos incorretos:
  - `t.envelope_id` (não existe) → deve ser `t.category_id = e.category_id`
  - `t.direction` (não existe) → deve ser `t.type = 'EXPENSE'`
  - `t.amount_cents` (não existe) → deve ser `t.amount`
  - `e.allocated_cents` (não existe) → deve ser `e.monthly_limit AS allocated_cents`

#### 📊 Arquivos Identificados para Modificação/Remoção

**Domínio**:

- `src/domain/aggregates/envelope/envelope-entity/Envelope.ts` (remoção de propriedade e métodos)
- `src/domain/aggregates/envelope/envelope-entity/Envelope.spec.ts` (atualização de testes)
- `src/domain/aggregates/envelope/value-objects/envelope-balance/EnvelopeBalance.ts` (DELETAR)
- `src/domain/aggregates/envelope/value-objects/envelope-balance/EnvelopeBalance.spec.ts` (DELETAR)
- `src/domain/aggregates/envelope/services/TransferBetweenEnvelopesService.ts` (DELETAR)
- `src/domain/aggregates/envelope/services/TransferBetweenEnvelopesService.spec.ts` (DELETAR)

**Aplicação**:

- `src/application/use-cases/envelope/add-amount-to-envelope/` (DELETAR diretório completo)
- `src/application/use-cases/envelope/remove-amount-from-envelope/` (DELETAR diretório completo)
- `src/application/use-cases/envelope/transfer-between-envelopes/` (DELETAR diretório completo)
- `src/application/contracts/unit-of-works/ITransferBetweenEnvelopesUnitOfWork.ts` (DELETAR)
- `src/application/shared/tests/stubs/TransferBetweenEnvelopesUnitOfWorkStub.ts` (DELETAR)
- `src/application/use-cases/envelope/delete-envelope/DeleteEnvelopeUseCase.ts` (atualizar - verifica currentBalance)

**Infraestrutura**:

- `src/infrastructure/database/pg/mappers/envelope/EnvelopeMapper.ts` (remover current_balance)
- `src/infrastructure/database/pg/mappers/envelope/EnvelopeMapper.spec.ts` (atualizar testes)
- `src/infrastructure/database/pg/repositories/envelope/get-envelope-repository/GetEnvelopeRepository.ts` (verificar SELECT)
- `src/infrastructure/database/pg/repositories/envelope/save-envelope-repository/SaveEnvelopeRepository.ts` (verificar UPDATE)
- `src/infrastructure/database/pg/repositories/envelope/add-envelope-repository/AddEnvelopeRepository.ts` (verificar INSERT)
- `src/infrastructure/database/pg/daos/envelope/list-envelopes/ListEnvelopesDao.ts` (CORRIGIR query SQL)
- `src/infrastructure/database/pg/daos/envelope/list-envelopes/ListEnvelopesDao.spec.ts` (atualizar testes)
- `src/infrastructure/database/pg/unit-of-works/transfer-between-envelopes/` (DELETAR diretório completo)
- `src/infrastructure/database/pg/migrations/1755018798541_create-envelopes-table.js` (remover current_balance e constraint)
- `src/infrastructure/database/pg/migrations/[timestamp]_remove-current-balance-from-envelopes.js` (CRIAR nova migration)

**Interface**:

- `src/interface/http/controllers/envelope/add-amount-envelope.controller.ts` (DELETAR)
- `src/interface/http/controllers/envelope/remove-amount-envelope.controller.ts` (DELETAR)
- `src/interface/http/controllers/envelope/transfer-between-envelopes.controller.ts` (DELETAR)
- `src/main/routes/contexts/mutations/envelope-route-registry.ts` (remover 3 rotas)
- `src/main/composition/EnvelopeCompositionRoot.ts` (remover 3 métodos e propriedade)
- `src/swagger.json` (remover 3 endpoints)

**Testes**:

- `src/tests/e2e/envelope/add-amount-envelope.e2e.test.ts` (DELETAR)
- `src/tests/e2e/envelope/remove-amount-envelope.e2e.test.ts` (DELETAR)
- `src/tests/e2e/envelope/transfer-between-envelopes.e2e.test.ts` (DELETAR)
- `src/tests/e2e/envelope/delete-envelope.e2e.test.ts` (atualizar - usa currentBalance)
- `src/tests/integration/envelope-composition-root.test.ts` (atualizar - testa use cases removidos)

#### 🤔 Decisões/Problemas

- **Decisão**: Confirmado que não há migrações posteriores referenciando `allocated_cents` - **Motivo**: Busca não encontrou referências
- **Decisão**: `ListEnvelopesDao` precisa de correção crítica na query SQL - **Motivo**: Usa campos que não existem na tabela `transactions`
- **Observação**: `DeleteEnvelopeUseCase` verifica `currentBalance > 0` antes de deletar - precisa ser atualizado

#### ⏭️ Próximos Passos

- Iniciar FASE 2: Remoção do Domínio
- Remover `currentBalance` da entidade `Envelope`
- Remover `EnvelopeBalance` value object
- Remover `TransferBetweenEnvelopesService`

---

### 🗓️ Sessão 2025-01-27 - Continuação

**Fase**: FASE 2 - Remoção do Domínio
**Objetivo**: Remover `currentBalance` da entidade `Envelope`, remover value object `EnvelopeBalance` e serviço `TransferBetweenEnvelopesService`

#### ✅ Trabalho Realizado

**Entidade Envelope**:

- ✅ Removida propriedade privada `_currentBalance: EnvelopeBalance`
- ✅ Removido getter público `currentBalance`
- ✅ Removidos métodos `addAmount()`, `removeAmount()`, `getAvailableLimit()`
- ✅ Removido parâmetro `currentBalance` do método `restore()`
- ✅ Removida inicialização de `balanceVo` no método `create()`
- ✅ Removidos imports de `EnvelopeBalance` e `EnvelopeLimitExceededError`

**Value Object EnvelopeBalance**:

- ✅ Deletado arquivo `EnvelopeBalance.ts`
- ✅ Deletado arquivo `EnvelopeBalance.spec.ts`

**Serviço TransferBetweenEnvelopesService**:

- ✅ Deletado arquivo `TransferBetweenEnvelopesService.ts`
- ✅ Deletado arquivo `TransferBetweenEnvelopesService.spec.ts`

**Testes da Entidade**:

- ✅ Removido describe block completo de "balance management"
- ✅ Removidos testes de `addAmount()`, `removeAmount()`, `getAvailableLimit()`
- ✅ Atualizados testes de `restore()` removendo parâmetro `currentBalance`
- ✅ Removidos imports de `EnvelopeLimitExceededError` e `InsufficientEnvelopeBalanceError`
- ✅ Removida verificação de `currentBalance` no teste de `create()`

#### 🤔 Decisões/Problemas

- **Observação**: Erros de compilação em outros arquivos são esperados e serão corrigidos nas próximas fases ao remover/atualizar os use cases e infraestrutura relacionados
- **Decisão**: Mantido arquivo `EnvelopeLimitExceededError.ts` mesmo não sendo mais usado - **Motivo**: Pode ser útil no futuro, não causa problemas

#### ⏭️ Próximos Passos

- Iniciar FASE 3: Remoção de Use Cases e Infraestrutura Relacionada
- Remover 3 use cases completos (`AddAmountToEnvelope`, `RemoveAmountFromEnvelope`, `TransferBetweenEnvelopes`)
- Remover Unit of Work relacionado

---

### 🗓️ Sessão 2025-01-27 - Continuação

**Fase**: FASE 3 - Remoção de Use Cases e Infraestrutura Relacionada
**Objetivo**: Remover completamente os 3 use cases e toda infraestrutura relacionada (Unit of Work, interface, stub)

#### ✅ Trabalho Realizado

**Use Cases Removidos**:

- ✅ `AddAmountToEnvelopeUseCase.ts`, `AddAmountToEnvelopeUseCase.spec.ts`, `AddAmountToEnvelopeDto.ts` deletados
- ✅ `RemoveAmountFromEnvelopeUseCase.ts`, `RemoveAmountFromEnvelopeUseCase.spec.ts`, `RemoveAmountFromEnvelopeDto.ts` deletados
- ✅ `TransferBetweenEnvelopesUseCase.ts`, `TransferBetweenEnvelopesUseCase.spec.ts`, `TransferBetweenEnvelopesDto.ts` deletados

**Unit of Work Removido**:

- ✅ `TransferBetweenEnvelopesUnitOfWork.ts` deletado
- ✅ `TransferBetweenEnvelopesUnitOfWork.spec.ts` deletado
- ✅ `ITransferBetweenEnvelopesUnitOfWork.ts` deletado
- ✅ `TransferBetweenEnvelopesUnitOfWorkStub.ts` deletado

#### 🤔 Decisões/Problemas

- **Observação**: Erros de compilação em controllers, routes e composition root são esperados e serão corrigidos na Fase 5
- **Observação**: `DeleteEnvelopeUseCase` ainda referencia `currentBalance` - será atualizado na Fase 4 ou 6

#### ⏭️ Próximos Passos

- Iniciar FASE 4: Atualização de Infraestrutura
- Atualizar `EnvelopeMapper` removendo `current_balance`
- Corrigir `ListEnvelopesDao` para usar relação correta através de Category
- Criar migration para remover coluna `current_balance`

---

## 🔄 Estado Atual

**Branch**: feature-OS-240
**Fase Atual**: FASE 3 - Remoção de Use Cases e Infraestrutura Relacionada [Status: ✅ Completada]
**Última Modificação**: Remoção completa dos 3 use cases e Unit of Work concluída
**Próxima Tarefa**: Iniciar FASE 4 - Atualização de Infraestrutura
