# Remover campo currentBalance da entidade Envelope - Plano de Implementação

> **Instruções**: Mantenha este arquivo atualizado conforme o progresso. Marque tarefas como concluídas ✅, em progresso ⏰ ou não iniciadas ⏳.

## 📋 Resumo Executivo

Remoção completa do campo `currentBalance` da entidade `Envelope` e de todos os componentes relacionados (use cases, serviços, controllers, rotas, testes), alinhando o código com as especificações atualizadas das Meta Specs. O saldo do envelope será calculado dinamicamente a partir de transações via queries, não mais armazenado como campo da entidade.

## 🎯 Objetivos

- Remover completamente `currentBalance` da entidade de domínio `Envelope`
- Remover 3 use cases relacionados (`AddAmountToEnvelopeUseCase`, `RemoveAmountFromEnvelopeUseCase`, `TransferBetweenEnvelopesUseCase`)
- Remover serviços, controllers, rotas e endpoints relacionados
- Corrigir `ListEnvelopesDao` para usar relação correta através de Category
- Criar migração para remover coluna `current_balance` do banco de dados
- Atualizar todos os testes relacionados

---

## 📅 FASE 1: Preparação e Análise [Status: ✅ Completada]

### 🎯 Objetivo

Identificar todas as dependências e referências a `currentBalance` e componentes relacionados antes de iniciar as remoções.

### 📋 Tarefas

#### Verificação Completa de Dependências [✅]

**Descrição**:

- Executar busca por todas as referências a `currentBalance` no código
- Verificar referências aos use cases que serão removidos
- Identificar todos os arquivos de teste que precisam ser atualizados ou removidos
- Verificar se há migrações posteriores que referenciam `current_balance` ou `allocated_cents`

**Critério de Conclusão**:

- Lista completa de todos os arquivos afetados
- Nenhuma referência não identificada

**Resultados**:

- ✅ 40 referências a `currentBalance` (camelCase) encontradas
- ✅ 42 referências a `current_balance` (snake_case) encontradas
- ✅ 27 referências a `AddAmountToEnvelope` encontradas
- ✅ 26 referências a `RemoveAmountFromEnvelope` encontradas
- ✅ 70 referências a `TransferBetweenEnvelopes` encontradas
- ✅ Total de ~30+ arquivos identificados para modificação/remoção

**Comandos úteis**:

```bash
grep -r "currentBalance" src/
grep -r "current_balance" src/
grep -r "AddAmountToEnvelope" src/
grep -r "RemoveAmountFromEnvelope" src/
grep -r "TransferBetweenEnvelopes" src/
```

#### Verificação de Migrações [✅]

**Descrição**:

- Verificar se há migrações posteriores que adicionam ou modificam `allocated_cents`
- Confirmar estrutura atual da tabela `envelopes`
- Verificar estrutura da tabela `transactions` para confirmar campos disponíveis

**Critério de Conclusão**:

- Entendimento completo da estrutura atual do banco
- Confirmação de que `allocated_cents` não existe (usar `monthly_limit`)

**Resultados**:

- ✅ Nenhuma migração posterior referenciando `allocated_cents` encontrada
- ✅ Tabela `envelopes` confirmada: possui `current_balance` e constraint `envelopes_balance_check`
- ✅ Tabela `transactions` confirmada: campos `type`, `amount`, `category_id` disponíveis
- ✅ `ListEnvelopesDao` identificado como usando campos incorretos:
  - `t.envelope_id` (não existe) → deve ser `t.category_id = e.category_id`
  - `t.direction` (não existe) → deve ser `t.type = 'EXPENSE'`
  - `t.amount_cents` (não existe) → deve ser `t.amount`
  - `e.allocated_cents` (não existe) → deve ser `e.monthly_limit AS allocated_cents`

### 🧪 Critérios de Validação

- [x] Lista completa de 19+ arquivos que referenciam `currentBalance` (40 referências encontradas)
- [x] Lista completa de arquivos relacionados aos 3 use cases a serem removidos (123 referências encontradas)
- [x] Confirmação da estrutura das tabelas `envelopes` e `transactions`
- [x] Nenhuma dependência externa não identificada

### 📝 Comentários da Fase

**Análise Completa Realizada**:

1. **Referências a `currentBalance`**: 40 ocorrências em 15+ arquivos

   - Domínio: `Envelope.ts`, `Envelope.spec.ts`, `TransferBetweenEnvelopesService`
   - Aplicação: Use cases e `DeleteEnvelopeUseCase` (verifica `currentBalance > 0`)
   - Infraestrutura: Mappers, repositórios, testes
   - Interface: Testes E2E

2. **Referências a `current_balance`**: 42 ocorrências em 10+ arquivos

   - Principalmente em mappers, repositórios e testes de infraestrutura
   - Migration inicial contém a coluna e constraint

3. **Use Cases a Remover**:

   - `AddAmountToEnvelope`: 27 referências (use case, controller, route, composition, testes)
   - `RemoveAmountFromEnvelope`: 26 referências (use case, controller, route, composition, testes)
   - `TransferBetweenEnvelopes`: 70 referências (use case, service, unit of work, controller, route, composition, testes)

4. **Observações Importantes**:
   - `DeleteEnvelopeUseCase` precisa ser atualizado (verifica `currentBalance > 0`)
   - `ListEnvelopesDao` precisa correção crítica na query SQL (usa campos inexistentes)
   - Nenhuma migração posterior afeta `allocated_cents`

**Arquivos Críticos Identificados**:

- `src/domain/aggregates/envelope/envelope-entity/Envelope.ts` - remover propriedade e métodos
- `src/application/use-cases/envelope/delete-envelope/DeleteEnvelopeUseCase.ts` - atualizar verificação
- `src/infrastructure/database/pg/daos/envelope/list-envelopes/ListEnvelopesDao.ts` - corrigir query SQL

---

## 📅 FASE 2: Remoção do Domínio [Status: ✅ Completada]

### 🎯 Objetivo

Remover `currentBalance` da entidade `Envelope`, remover value object `EnvelopeBalance` e serviço `TransferBetweenEnvelopesService`, mantendo a entidade funcional para outros use cases.

### 📋 Tarefas

#### Remover currentBalance da Entidade Envelope [✅]

**Descrição**:

- Remover propriedade privada `_currentBalance: EnvelopeBalance`
- Remover getter público `currentBalance`
- Remover métodos `addAmount()`, `removeAmount()`, `getAvailableLimit()`
- Remover parâmetro `currentBalance` do método `restore()`
- Remover inicialização de `balanceVo` no método `create()`
- Remover import de `EnvelopeBalance`
- Remover import de `EnvelopeLimitExceededError` se não for mais usado

**Critério de Conclusão**:

- Arquivo `Envelope.ts` compila sem erros
- Nenhuma referência a `currentBalance` na entidade
- Métodos removidos não causam erros de compilação em outros arquivos (ainda)

**Arquivo**: `src/domain/aggregates/envelope/envelope-entity/Envelope.ts`

#### Remover Value Object EnvelopeBalance [✅]

**Descrição**:

- Deletar arquivo `EnvelopeBalance.ts`
- Deletar arquivo `EnvelopeBalance.spec.ts`
- Verificar se há outros arquivos que importam `EnvelopeBalance` (devem quebrar, será tratado nas próximas fases)

**Critério de Conclusão**:

- Arquivos deletados
- Imports quebrados identificados (serão corrigidos nas próximas fases)

**Arquivos**:

- `src/domain/aggregates/envelope/value-objects/envelope-balance/EnvelopeBalance.ts`
- `src/domain/aggregates/envelope/value-objects/envelope-balance/EnvelopeBalance.spec.ts`

#### Remover TransferBetweenEnvelopesService [✅]

**Descrição**:

- Deletar arquivo `TransferBetweenEnvelopesService.ts`
- Deletar arquivo `TransferBetweenEnvelopesService.spec.ts`
- Verificar imports quebrados (serão corrigidos na Fase 3)

**Critério de Conclusão**:

- Arquivos deletados
- Imports quebrados identificados

**Arquivos**:

- `src/domain/aggregates/envelope/services/TransferBetweenEnvelopesService.ts`
- `src/domain/aggregates/envelope/services/TransferBetweenEnvelopesService.spec.ts`

#### Atualizar Testes da Entidade Envelope [✅]

**Descrição**:

- Remover todos os testes relacionados a `currentBalance`
- Remover testes de `addAmount()`, `removeAmount()`, `getAvailableLimit()`
- Remover describe block de "balance management"
- Remover imports de `EnvelopeBalance` e `InsufficientEnvelopeBalanceError` se não usados
- Manter outros testes intactos

**Critério de Conclusão**:

- Testes de balance management removidos
- Outros testes continuam passando
- Arquivo compila sem erros

**Arquivo**: `src/domain/aggregates/envelope/envelope-entity/Envelope.spec.ts`

### 🔄 Dependências

- ✅ Fase 1 completada

### 🧪 Critérios de Validação

- [x] `Envelope.ts` compila sem erros (isoladamente)
- [x] `Envelope.spec.ts` compila e testes restantes passam
- [x] `EnvelopeBalance` e `TransferBetweenEnvelopesService` removidos
- [x] Nenhuma referência a `currentBalance` na entidade `Envelope`

### 📝 Comentários da Fase

**Remoções Realizadas**:

1. **Entidade Envelope**:

   - ✅ Propriedade privada `_currentBalance: EnvelopeBalance` removida
   - ✅ Getter público `currentBalance` removido
   - ✅ Métodos `addAmount()`, `removeAmount()`, `getAvailableLimit()` removidos
   - ✅ Parâmetro `currentBalance` removido do método `restore()`
   - ✅ Inicialização de `balanceVo` removida do método `create()`
   - ✅ Imports de `EnvelopeBalance` e `EnvelopeLimitExceededError` removidos

2. **Value Object EnvelopeBalance**:

   - ✅ Arquivo `EnvelopeBalance.ts` deletado
   - ✅ Arquivo `EnvelopeBalance.spec.ts` deletado

3. **Serviço TransferBetweenEnvelopesService**:

   - ✅ Arquivo `TransferBetweenEnvelopesService.ts` deletado
   - ✅ Arquivo `TransferBetweenEnvelopesService.spec.ts` deletado

4. **Testes da Entidade**:
   - ✅ Todos os testes de balance management removidos
   - ✅ Testes de `restore()` atualizados (removido parâmetro `currentBalance`)
   - ✅ Imports de `EnvelopeLimitExceededError` e `InsufficientEnvelopeBalanceError` removidos

**Observação**: Erros de compilação em outros arquivos são esperados e serão corrigidos nas próximas fases ao remover/atualizar os use cases e infraestrutura relacionados.

---

## 📅 FASE 3: Remoção de Use Cases e Infraestrutura Relacionada [Status: ✅ Completada]

### 🎯 Objetivo

Remover completamente os 3 use cases e toda infraestrutura relacionada (Unit of Work, interface, stub).

### 📋 Tarefas

#### Remover Use Case AddAmountToEnvelope [✅]

**Descrição**:

- Deletar diretório completo `src/application/use-cases/envelope/add-amount-to-envelope/`
- Isso inclui: UseCase, DTO, testes

**Critério de Conclusão**:

- Diretório removido completamente

**Arquivos**:

- `src/application/use-cases/envelope/add-amount-to-envelope/` (diretório completo)

#### Remover Use Case RemoveAmountFromEnvelope [✅]

**Descrição**:

- Deletar diretório completo `src/application/use-cases/envelope/remove-amount-from-envelope/`
- Isso inclui: UseCase, DTO, testes

**Critério de Conclusão**:

- Diretório removido completamente

**Arquivos**:

- `src/application/use-cases/envelope/remove-amount-from-envelope/` (diretório completo)

#### Remover Use Case TransferBetweenEnvelopes [✅]

**Descrição**:

- Deletar diretório completo `src/application/use-cases/envelope/transfer-between-envelopes/`
- Isso inclui: UseCase, DTO, testes

**Critério de Conclusão**:

- Diretório removido completamente

**Arquivos**:

- `src/application/use-cases/envelope/transfer-between-envelopes/` (diretório completo)

#### Remover TransferBetweenEnvelopesUnitOfWork [✅]

**Descrição**:

- Deletar arquivo `TransferBetweenEnvelopesUnitOfWork.ts`
- Deletar arquivo `TransferBetweenEnvelopesUnitOfWork.spec.ts`
- Deletar diretório se ficar vazio

**Critério de Conclusão**:

- Arquivos removidos

**Arquivos**:

- `src/infrastructure/database/pg/unit-of-works/transfer-between-envelopes/TransferBetweenEnvelopesUnitOfWork.ts`
- `src/infrastructure/database/pg/unit-of-works/transfer-between-envelopes/TransferBetweenEnvelopesUnitOfWork.spec.ts`

#### Remover Interface e Stub do Unit of Work [✅]

**Descrição**:

- Deletar arquivo `ITransferBetweenEnvelopesUnitOfWork.ts`
- Deletar arquivo `TransferBetweenEnvelopesUnitOfWorkStub.ts`

**Critério de Conclusão**:

- Arquivos removidos

**Arquivos**:

- `src/application/contracts/unit-of-works/ITransferBetweenEnvelopesUnitOfWork.ts`
- `src/application/shared/tests/stubs/TransferBetweenEnvelopesUnitOfWorkStub.ts`

### 🔄 Dependências

- ✅ Fase 2 completada

### 🧪 Critérios de Validação

- [x] 3 diretórios de use cases removidos completamente
- [x] Unit of Work, interface e stub removidos
- [x] Imports quebrados identificados (serão corrigidos na Fase 5)

### 📝 Comentários da Fase

**Remoções Realizadas**:

1. **Use Cases Removidos**:

   - ✅ `AddAmountToEnvelopeUseCase.ts`, `AddAmountToEnvelopeUseCase.spec.ts`, `AddAmountToEnvelopeDto.ts` deletados
   - ✅ `RemoveAmountFromEnvelopeUseCase.ts`, `RemoveAmountFromEnvelopeUseCase.spec.ts`, `RemoveAmountFromEnvelopeDto.ts` deletados
   - ✅ `TransferBetweenEnvelopesUseCase.ts`, `TransferBetweenEnvelopesUseCase.spec.ts`, `TransferBetweenEnvelopesDto.ts` deletados

2. **Unit of Work Removido**:
   - ✅ `TransferBetweenEnvelopesUnitOfWork.ts` deletado
   - ✅ `TransferBetweenEnvelopesUnitOfWork.spec.ts` deletado
   - ✅ `ITransferBetweenEnvelopesUnitOfWork.ts` deletado
   - ✅ `TransferBetweenEnvelopesUnitOfWorkStub.ts` deletado

**Observação**: Erros de compilação em controllers, routes e composition root são esperados e serão corrigidos na Fase 5.

---

## 📅 FASE 4: Atualização de Infraestrutura [Status: ✅ Completada]

### 🎯 Objetivo

Atualizar mappers, criar migração, corrigir DAO e verificar repositórios para remover referências a `current_balance`.

### 📋 Tarefas

#### Atualizar EnvelopeMapper [✅]

**Descrição**:

- Remover campo `current_balance: number` da interface `EnvelopeRow`
- Remover mapeamento de `currentBalance` no método `toDomain()`
- Remover mapeamento de `current_balance` no método `toRow()`
- Atualizar chamada de `Envelope.restore()` removendo parâmetro `currentBalance`

**Critério de Conclusão**:

- Arquivo compila sem erros
- Nenhuma referência a `current_balance` no mapper

**Arquivo**: `src/infrastructure/database/pg/mappers/envelope/EnvelopeMapper.ts`

#### Atualizar Testes do EnvelopeMapper [✅]

**Descrição**:

- Remover referências a `currentBalance` nos testes
- Atualizar fixtures que incluem `current_balance`
- Garantir que testes passam com a nova estrutura

**Critério de Conclusão**:

- Testes atualizados e passando
- Nenhuma referência a `currentBalance` nos testes

**Arquivo**: `src/infrastructure/database/pg/mappers/envelope/EnvelopeMapper.spec.ts`

#### Corrigir ListEnvelopesDao [✅]

**Descrição**:

- Corrigir query SQL para usar relação correta através de Category:
  - Trocar `t.envelope_id = e.id` por `t.category_id = e.category_id`
  - Trocar `t.direction = 'OUT'` por `t.type = 'EXPENSE'`
  - Trocar `t.amount_cents` por `t.amount`
  - Trocar `e.allocated_cents` por `e.monthly_limit AS allocated_cents`
- Adicionar filtros `t.is_deleted = false` e `e.is_deleted = false`

**Critério de Conclusão**:

- Query corrigida e funcional
- Testa query manualmente se possível

**Arquivo**: `src/infrastructure/database/pg/daos/envelope/list-envelopes/ListEnvelopesDao.ts`

**Query Corrigida**:

```sql
SELECT e.id, e.name, e.monthly_limit AS allocated_cents,
       COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN ABS(t.amount) ELSE 0 END), 0) AS spent_cents
FROM envelopes e
LEFT JOIN transactions t
  ON t.category_id = e.category_id
 AND t.budget_id = e.budget_id
 AND t.type = 'EXPENSE'
 AND t.is_deleted = false
WHERE e.budget_id = $1
  AND e.is_deleted = false
GROUP BY e.id, e.name, e.monthly_limit
ORDER BY e.name ASC
```

#### Atualizar Testes do ListEnvelopesDao [✅]

**Descrição**:

- Atualizar testes para refletir a query corrigida
- Ajustar mocks e fixtures conforme necessário
- Garantir que testes validam a relação através de Category

**Critério de Conclusão**:

- Testes atualizados e passando
- Testes validam a correção da query

**Arquivo**: `src/infrastructure/database/pg/daos/envelope/list-envelopes/ListEnvelopesDao.spec.ts`

#### Verificar e Atualizar Repositórios [✅]

**Descrição**:

- Verificar `GetEnvelopeRepository.ts` - remover `current_balance` do SELECT se presente
- Verificar `SaveEnvelopeRepository.ts` - remover `current_balance` do INSERT/UPDATE se presente
- Verificar `AddEnvelopeRepository.ts` - remover `current_balance` do INSERT se presente
- Atualizar testes dos repositórios se necessário

**Critério de Conclusão**:

- Repositórios não referenciam `current_balance`
- Testes dos repositórios passam

**Arquivos**:

- `src/infrastructure/database/pg/repositories/envelope/get-envelope-repository/GetEnvelopeRepository.ts`
- `src/infrastructure/database/pg/repositories/envelope/save-envelope-repository/SaveEnvelopeRepository.ts`
- `src/infrastructure/database/pg/repositories/envelope/add-envelope-repository/AddEnvelopeRepository.ts`

#### Criar Migration de Remoção [✅]

**Descrição**:

- Criar nova migration `[timestamp]_remove-current-balance-from-envelopes.js`
- Remover coluna `current_balance` da tabela `envelopes`
- Remover constraint `envelopes_balance_check`
- Incluir método `down` para rollback (opcional, mas recomendado)

**Critério de Conclusão**:

- Migration criada e testada localmente
- Migration pode ser executada sem erros

**Arquivo**: `src/infrastructure/database/pg/migrations/[timestamp]_remove-current-balance-from-envelopes.js`

**Template da Migration**:

```javascript
exports.up = (pgm) => {
  pgm.dropConstraint('envelopes', 'envelopes_balance_check');
  pgm.dropColumn('envelopes', 'current_balance');
};

exports.down = (pgm) => {
  pgm.addColumn('envelopes', {
    current_balance: {
      type: 'bigint',
      notNull: true,
      default: 0,
      comment: 'Current balance in cents for precision',
    },
  });
  pgm.addConstraint(
    'envelopes',
    'envelopes_balance_check',
    'CHECK (current_balance >= 0 AND current_balance <= monthly_limit * 2)',
  );
};
```

#### Atualizar Migration Inicial [✅]

**Descrição**:

- Remover coluna `current_balance` da definição da tabela na migration inicial
- Remover constraint `envelopes_balance_check` da migration inicial
- **ATENÇÃO**: Isso afeta apenas novos ambientes. A migration de remoção cuida de ambientes existentes.

**Critério de Conclusão**:

- Migration inicial atualizada
- Migration de remoção criada para ambientes existentes

**Arquivo**: `src/infrastructure/database/pg/migrations/1755018798541_create-envelopes-table.js`

### 🔄 Dependências

- ✅ Fase 2 completada (para mappers)
- ✅ Fase 3 completada (para limpeza geral)

### 🧪 Critérios de Validação

- [x] `EnvelopeMapper` atualizado e testes passando
- [x] `ListEnvelopesDao` corrigido e testes passando
- [x] Repositórios verificados e atualizados
- [x] Migration criada e testada
- [x] Migration inicial atualizada

### 📝 Comentários da Fase

**Atualizações Realizadas**:

1. **EnvelopeMapper**:

   - ✅ Removido campo `current_balance: number` da interface `EnvelopeRow`
   - ✅ Removido mapeamento de `currentBalance` no método `toDomain()`
   - ✅ Removido mapeamento de `current_balance` no método `toRow()`
   - ✅ Atualizada chamada de `Envelope.restore()` removendo parâmetro `currentBalance`
   - ✅ Testes atualizados removendo todas as referências a `currentBalance`

2. **ListEnvelopesDao**:

   - ✅ Query SQL corrigida para usar relação através de Category:
     - `t.envelope_id = e.id` → `t.category_id = e.category_id`
     - `t.direction = 'OUT'` → `t.type = 'EXPENSE'`
     - `t.amount_cents` → `t.amount`
     - `e.allocated_cents` → `e.monthly_limit AS allocated_cents`
   - ✅ Adicionados filtros `t.is_deleted = false` e `e.is_deleted = false`

3. **Repositórios**:

   - ✅ `GetEnvelopeRepository`: Removido `current_balance` do SELECT
   - ✅ `SaveEnvelopeRepository`: Removido `current_balance` do UPDATE
   - ✅ `AddEnvelopeRepository`: Removido `current_balance` do INSERT

4. **Migrations**:
   - ✅ Criada migration `1765903198858_remove-current-balance-from-envelopes.js` para remover coluna e constraint
   - ✅ Migration inicial atualizada removendo `current_balance` e constraint `envelopes_balance_check`

**Observação**: Erros de compilação em `DeleteEnvelopeUseCase` e interface (controllers, routes, composition root) são esperados e serão corrigidos nas próximas fases.

---

## 📅 FASE 5: Atualização de Interface e Composição [Status: ✅ Completada]

### 🎯 Objetivo

Remover controllers HTTP, rotas, endpoints do swagger e métodos do composition root relacionados aos use cases removidos.

### 📋 Tarefas

#### Remover Controllers HTTP [✅]

**Descrição**:

- Deletar `add-amount-envelope.controller.ts`
- Deletar `remove-amount-envelope.controller.ts`
- Deletar `transfer-between-envelopes.controller.ts`

**Critério de Conclusão**:

- 3 controllers removidos

**Arquivos**:

- `src/interface/http/controllers/envelope/add-amount-envelope.controller.ts`
- `src/interface/http/controllers/envelope/remove-amount-envelope.controller.ts`
- `src/interface/http/controllers/envelope/transfer-between-envelopes.controller.ts`

#### Atualizar Envelope Route Registry [✅]

**Descrição**:

- Remover rota `/envelope/add-amount-envelope`
- Remover rota `/envelope/remove-amount-envelope`
- Remover rota `/envelope/transfer-between-envelopes`
- Remover imports dos 3 controllers removidos
- Remover imports dos use cases removidos se presentes

**Critério de Conclusão**:

- Arquivo compila sem erros
- 3 rotas removidas
- Imports limpos

**Arquivo**: `src/main/routes/contexts/mutations/envelope-route-registry.ts`

#### Atualizar EnvelopeCompositionRoot [✅]

**Descrição**:

- Remover método `createAddAmountToEnvelopeUseCase()`
- Remover método `createRemoveAmountFromEnvelopeUseCase()`
- Remover método `createTransferBetweenEnvelopesUseCase()`
- Remover propriedade `transferUnitOfWork`
- Remover inicialização de `transferUnitOfWork` no construtor
- Remover imports dos use cases removidos
- Remover import de `TransferBetweenEnvelopesService`
- Remover import de `TransferBetweenEnvelopesUnitOfWork`

**Critério de Conclusão**:

- Arquivo compila sem erros
- Nenhuma referência aos use cases removidos
- Nenhuma referência ao Unit of Work removido

**Arquivo**: `src/main/composition/EnvelopeCompositionRoot.ts`

#### Atualizar Swagger.json [✅]

**Descrição**:

- Remover endpoint `/envelope/add-amount-envelope` completo (incluindo método POST e toda definição)
- Remover endpoint `/envelope/remove-amount-envelope` completo
- Remover endpoint `/envelope/transfer-between-envelopes` completo
- Verificar que JSON está válido após remoções

**Critério de Conclusão**:

- 3 endpoints removidos
- JSON válido
- Nenhuma referência restante

**Arquivo**: `src/swagger.json`

### 🔄 Dependências

- ✅ Fase 3 completada (use cases removidos)
- ✅ Fase 4 completada (infraestrutura atualizada)

### 🧪 Critérios de Validação

- [x] 3 controllers removidos
- [x] 3 rotas removidas do route registry
- [x] `EnvelopeCompositionRoot` atualizado e compilando
- [x] 3 endpoints removidos do swagger
- [x] Aplicação compila sem erros

### 📝 Comentários da Fase

**Remoções Realizadas**:

1. **Controllers HTTP**:

   - ✅ `add-amount-envelope.controller.ts` deletado
   - ✅ `remove-amount-envelope.controller.ts` deletado
   - ✅ `transfer-between-envelopes.controller.ts` deletado

2. **Route Registry**:

   - ✅ Removidas 3 rotas (`/envelope/add-amount-envelope`, `/envelope/remove-amount-envelope`, `/envelope/transfer-between-envelopes`)
   - ✅ Removidos imports dos 3 controllers

3. **EnvelopeCompositionRoot**:

   - ✅ Removido método `createAddAmountToEnvelopeUseCase()`
   - ✅ Removido método `createRemoveAmountFromEnvelopeUseCase()`
   - ✅ Removido método `createTransferBetweenEnvelopesUseCase()`
   - ✅ Removida propriedade `transferUnitOfWork`
   - ✅ Removida inicialização de `transferUnitOfWork` no construtor
   - ✅ Removidos imports dos use cases removidos
   - ✅ Removidos imports de `TransferBetweenEnvelopesService` e `TransferBetweenEnvelopesUnitOfWork`

4. **Swagger.json**:

   - ✅ Removido endpoint `/envelope/add-amount-envelope`
   - ✅ Removido endpoint `/envelope/remove-amount-envelope`
   - ✅ Removido endpoint `/envelope/transfer-between-envelopes`

5. **Correção Adicional**:
   - ✅ Atualizado `DeleteEnvelopeUseCase` removendo verificação de `currentBalance > 0` (linha 51)

---

## 📅 FASE 6: Atualização de Testes [Status: ✅ Completada]

### 🎯 Objetivo

Remover testes E2E dos use cases removidos e atualizar testes de integração que referenciam os componentes removidos.

### 📋 Tarefas

#### Remover Testes E2E [✅]

**Descrição**:

- Deletar `add-amount-envelope.e2e.test.ts`
- Deletar `remove-amount-envelope.e2e.test.ts`
- Deletar `transfer-between-envelopes.e2e.test.ts` (se existir)

**Critério de Conclusão**:

- Testes E2E removidos

**Arquivos**:

- `src/tests/e2e/envelope/add-amount-envelope.e2e.test.ts`
- `src/tests/e2e/envelope/remove-amount-envelope.e2e.test.ts`
- `src/tests/e2e/envelope/transfer-between-envelopes.e2e.test.ts`

#### Atualizar Testes de Integração [✅]

**Descrição**:

- Atualizar `envelope-composition-root.test.ts` removendo referências aos use cases removidos
- Remover testes que verificam criação dos use cases removidos
- Garantir que outros testes continuam funcionando

**Critério de Conclusão**:

- Testes de integração atualizados e passando

**Arquivo**: `src/tests/integration/envelope-composition-root.test.ts`

#### Atualizar Outros Testes com Referências a currentBalance [✅]

**Descrição**:

- Buscar e atualizar todos os arquivos de teste que referenciam `currentBalance`
- Remover verificações de `currentBalance` nos testes
- Atualizar fixtures que incluem `currentBalance`
- Garantir que testes continuam passando após remoções

**Critério de Conclusão**:

- Todos os testes atualizados
- Nenhuma referência a `currentBalance` nos testes
- Todos os testes passando

**Comando para buscar**:

```bash
grep -r "currentBalance" src/ --include="*.spec.ts" --include="*.test.ts"
```

### 🔄 Dependências

- ✅ Fase 2 completada (testes da entidade)
- ✅ Fase 3 completada (use cases removidos)
- ✅ Fase 4 completada (mappers e DAOs atualizados)
- ✅ Fase 5 completada (composition root atualizado)

### 🧪 Critérios de Validação

- [x] Testes E2E removidos
- [x] Testes de integração atualizados e passando
- [x] Todos os outros testes atualizados
- [x] Nenhuma referência a `currentBalance` nos testes (exceto Account.ts e migrations que são válidas)
- [x] Todos os testes passando

### 📝 Comentários da Fase

**Remoções e Atualizações Realizadas**:

1. **Testes E2E Removidos**:

   - ✅ `add-amount-envelope.e2e.test.ts` deletado
   - ✅ `remove-amount-envelope.e2e.test.ts` deletado
   - ✅ `transfer-between-envelopes.e2e.test.ts` deletado

2. **Testes de Integração Atualizados**:

   - ✅ `envelope-composition-root.test.ts` atualizado:
     - Removido describe block de `createAddAmountToEnvelopeUseCase & createRemoveAmountFromEnvelopeUseCase`
     - Removido describe block de `createTransferBetweenEnvelopesUseCase`
     - Atualizado teste de `createDeleteEnvelopeUseCase` (removida verificação de balance zero)

3. **Testes de Repositórios Atualizados**:

   - ✅ `SaveEnvelopeRepository.spec.ts`: Removidas todas as referências a `current_balance` nos mocks e expectativas
   - ✅ `GetEnvelopeRepository.spec.ts`: Removida referência a `current_balance` no `EnvelopeRow` e na query SQL
   - ✅ `AddEnvelopeRepository.spec.ts`: Removidas todas as referências a `current_balance` nos mocks e expectativas

4. **Testes E2E Atualizados**:

   - ✅ `delete-envelope.e2e.test.ts`: Removida referência a `currentBalance` na função `makeEnvelope`

5. **Validações**:
   - ✅ Todos os testes dos repositórios passando (21 testes)
   - ✅ Teste do `DeleteEnvelopeUseCase` passando (5 testes)
   - ✅ Nenhuma referência a `currentBalance` nos testes (exceto Account.ts que é válido)

---

## 📅 FASE 7: Validação Final e Limpeza [Status: ✅ Completada]

### 🎯 Objetivo

Garantir que todas as remoções foram completas, que não há referências restantes e que o sistema está funcionando corretamente.

### 📋 Tarefas

#### Executar Todos os Testes [✅]

**Descrição**:

- Executar suite completa de testes
- Verificar que todos os testes passam
- Corrigir quaisquer testes quebrados

**Critério de Conclusão**:

- 100% dos testes passando
- Nenhum teste quebrado

**Comando**:

```bash
npm test
```

#### Verificação Final de Referências [✅]

**Descrição**:

- Buscar por qualquer referência restante a `currentBalance` no código
- Buscar por referências aos use cases removidos
- Buscar por referências ao `TransferBetweenEnvelopesService`
- Verificar que não há imports quebrados

**Critério de Conclusão**:

- Nenhuma referência não intencional encontrada
- Apenas comentários ou documentação podem conter referências

**Comandos**:

```bash
grep -r "currentBalance" src/ --exclude-dir=node_modules
grep -r "AddAmountToEnvelope" src/ --exclude-dir=node_modules
grep -r "RemoveAmountFromEnvelope" src/ --exclude-dir=node_modules
grep -r "TransferBetweenEnvelopes" src/ --exclude-dir=node_modules
```

#### Validar Migration [✅]

**Descrição**:

- Executar migration de remoção em ambiente de desenvolvimento
- Verificar que coluna foi removida
- Verificar que constraint foi removida
- Testar rollback se necessário

**Critério de Conclusão**:

- Migration executada com sucesso
- Estrutura do banco atualizada corretamente

**Comando**:

```bash
npm run migrate:up
```

#### Validar Queries [✅]

**Descrição**:

- Testar `ListEnvelopesDao` manualmente se possível
- Verificar que query retorna dados corretos
- Validar que relação através de Category funciona

**Critério de Conclusão**:

- Query funcionando corretamente
- Dados retornados estão corretos

#### Verificar Compilação [✅]

**Descrição**:

- Compilar projeto TypeScript
- Verificar que não há erros de compilação
- Verificar que não há warnings críticos

**Critério de Conclusão**:

- Projeto compila sem erros
- Nenhum warning crítico

**Comando**:

```bash
npm run build
```

### 🔄 Dependências

- ✅ Todas as fases anteriores completadas

### 🧪 Critérios de Validação

- [x] Todos os testes passando (100%)
- [x] Nenhuma referência restante a `currentBalance` ou componentes removidos (exceto Account.ts que é válido)
- [x] Migration criada e validada
- [x] Queries funcionando corretamente
- [x] Projeto compila sem erros
- [x] Código pronto para PR

### 📝 Comentários da Fase

**Validações Realizadas**:

1. **Testes Unitários**:

   - ✅ Todos os 126 test suites passando
   - ✅ Todos os 1076 testes passando
   - ✅ Nenhum teste quebrado

2. **Verificação de Referências**:

   - ✅ Nenhuma referência a `AddAmountToEnvelope`, `RemoveAmountFromEnvelope` ou `TransferBetweenEnvelopes` encontrada
   - ✅ Nenhuma referência a `add-amount-envelope`, `remove-amount-envelope` ou `transfer-between-envelopes` encontrada
   - ✅ Únicas referências a `currentBalance` são em `Account.ts` (válido - Account tem balance, não Envelope)

3. **Migration**:

   - ✅ Migration `1765903198858_remove-current-balance-from-envelopes.js` criada e validada
   - ✅ Método `up` remove constraint e coluna corretamente
   - ✅ Método `down` permite rollback se necessário

4. **Queries**:

   - ✅ `ListEnvelopesDao` corrigido e funcionando:
     - Usa relação correta através de `category_id`
     - Usa `t.type = 'EXPENSE'` ao invés de `t.direction`
     - Usa `t.amount` ao invés de `t.amount_cents`
     - Usa `e.monthly_limit AS allocated_cents` ao invés de `e.allocated_cents`
     - Filtra `is_deleted = false` em ambas as tabelas

5. **Compilação**:
   - ✅ Projeto compila sem erros
   - ✅ Nenhum warning crítico
   - ✅ TypeScript validado com sucesso

---

## 🏁 Entrega Final

### Checklist de Conclusão

- [x] Todas as 7 fases completadas
- [x] Todos os testes passando (126 suites, 1076 testes)
- [x] Nenhuma referência restante a `currentBalance` ou componentes removidos (exceto Account.ts que é válido)
- [x] Migration criada e testada
- [x] `ListEnvelopesDao` corrigido e funcionando
- [x] Documentação atualizada (plan.md e work-log.md)
- [x] Código revisado e limpo
- [x] Pronto para Pull Request

### Próximos Passos

1. **Revisão de Código** (`/pre-pr`) - Validações finais antes do PR
2. **Pull Request** (`/pr`) - Submissão para revisão
3. **Merge** - Após aprovação e testes em CI/CD

---

## 📊 Estimativa de Tempo

- **Fase 1**: ~30 minutos (análise)
- **Fase 2**: ~1 hora (remoção do domínio)
- **Fase 3**: ~30 minutos (remoção de use cases)
- **Fase 4**: ~2 horas (infraestrutura e migrations)
- **Fase 5**: ~1 hora (interface e composição)
- **Fase 6**: ~1-2 horas (testes)
- **Fase 7**: ~1 hora (validação)

**Total Estimado**: ~7-8 horas de trabalho

---

## 🔗 Referências

- **Context**: `sessions/OS-240/context.md`
- **Architecture**: `sessions/OS-240/architecture.md`
- **Issue Jira**: [OS-240](https://orca-sonhos.atlassian.net/browse/OS-240)
- **Meta Specs**: https://github.com/danilotandrade1518/orca-sonhos-meta-specs


