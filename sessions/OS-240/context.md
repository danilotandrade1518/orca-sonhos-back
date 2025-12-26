# Remover campo currentBalance da entidade Envelope - Contexto de Desenvolvimento

# OS-240

## 🎯 Objetivo

Remover o campo `currentBalance` da entidade de domínio `Envelope` e de todos os use cases relacionados, alinhando o código com as especificações atualizadas das Meta Specs. O saldo do envelope deve ser calculado dinamicamente a partir de transações ou outra fonte de verdade, ao invés de ser armazenado como campo da entidade.

## 📋 Requisitos Funcionais

### Funcionalidades Principais

- **Remoção do campo currentBalance**: Eliminar completamente o campo `currentBalance` da entidade `Envelope` e toda infraestrutura relacionada
- **Atualização de use cases**: Adaptar os use cases `AddAmountToEnvelopeUseCase`, `RemoveAmountFromEnvelopeUseCase` e `TransferBetweenEnvelopesUseCase` para não dependerem de `currentBalance`
- **Migração de banco de dados**: Remover a coluna `current_balance` da tabela `envelopes` e constraints relacionadas
- **Atualização de testes**: Ajustar todos os testes que dependem de `currentBalance`

### Comportamentos Esperados

- A entidade `Envelope` não deve mais ter propriedade `currentBalance` ou métodos `addAmount()`/`removeAmount()` que manipulam saldo diretamente
- O método `getAvailableLimit()` deve ser adaptado para calcular o limite disponível sem depender de `currentBalance`
- Os use cases devem funcionar corretamente após a remoção (precisamos esclarecer como)
- Todos os testes devem passar após as mudanças

## 🏗️ Considerações Técnicas

### Arquitetura

- **Clean Architecture + DDD**: Manter os princípios de Clean Architecture e Domain-Driven Design
- **CQRS**: O projeto utiliza CQRS, então queries podem calcular saldo dinamicamente
- **Agregado Envelope**: A entidade `Envelope` é um agregado raiz que precisa manter consistência

### Tecnologias e Dependências

- **PostgreSQL**: Banco de dados relacional
- **node-pg-migrate**: Para migrações de banco de dados
- **TypeScript**: Linguagem do projeto
- **Jest**: Framework de testes

### Padrões a Seguir

- Manter padrões existentes do projeto
- Seguir convenções de nomenclatura e estrutura de diretórios
- Manter cobertura de testes

## 🧪 Estratégia de Testes

### Testes Necessários

- **Testes unitários**: Atualizar testes da entidade `Envelope` removendo verificações de `currentBalance`
- **Testes de use cases**: Adaptar testes dos use cases afetados
- **Testes de integração**: Verificar que queries continuam funcionando corretamente
- **Testes E2E**: Validar fluxos completos após remoção

### Critérios de Aceitação

- [ ] Propriedade `_currentBalance` e getter `currentBalance` removidos da entidade `Envelope`
- [ ] Métodos `addAmount()`, `removeAmount()` e `getAvailableLimit()` removidos da entidade `Envelope`
- [ ] Parâmetro `currentBalance` removido do método `restore()` da entidade `Envelope`
- [ ] Value object `EnvelopeBalance` e seu teste removidos completamente
- [ ] `TransferBetweenEnvelopesService` e seu teste removidos completamente
- [ ] 3 use cases removidos completamente (`AddAmountToEnvelopeUseCase`, `RemoveAmountFromEnvelopeUseCase`, `TransferBetweenEnvelopesUseCase`)
- [ ] `TransferBetweenEnvelopesUnitOfWork`, interface e stub removidos completamente
- [ ] 3 controllers HTTP removidos completamente
- [ ] 3 rotas removidas do `envelope-route-registry.ts`
- [ ] Métodos de criação dos use cases removidos do `EnvelopeCompositionRoot.ts`
- [ ] 3 endpoints removidos do `swagger.json`
- [ ] `EnvelopeMapper` atualizado para não mapear `current_balance`
- [ ] Migração de banco de dados criada para remover coluna `current_balance` da tabela `envelopes`
- [ ] Constraint `envelopes_balance_check` removida da migração
- [ ] `ListEnvelopesDao` corrigido para usar relação correta através de Category
- [ ] Todos os testes relacionados atualizados ou removidos
- [ ] Todos os arquivos que referenciam `currentBalance` verificados e atualizados

## 🔗 Dependências e Impactos

### Sistemas Afetados

- **Domínio**: Entidade `Envelope`, value object `EnvelopeBalance`, `TransferBetweenEnvelopesService` (todos a serem removidos/atualizados)
- **Aplicação**: 3 use cases de envelope a serem removidos completamente (`AddAmountToEnvelopeUseCase`, `RemoveAmountFromEnvelopeUseCase`, `TransferBetweenEnvelopesUseCase`)
- **Infraestrutura**: Mappers, repositórios, migrações de banco de dados, `TransferBetweenEnvelopesUnitOfWork` (a ser removido)
- **Composição**: `EnvelopeCompositionRoot` (métodos de criação dos use cases a serem removidos)
- **Interface**: 3 controllers HTTP a serem removidos, 3 rotas a serem removidas, 3 endpoints do swagger a serem removidos
- **Testes**: Todos os testes relacionados a envelopes e aos use cases removidos

### Integrações Necessárias

- Verificar se há APIs externas ou frontend que dependem de `currentBalance`
- Verificar se há queries que calculam saldo dinamicamente (já existe `ListEnvelopesDao` que calcula `spent_cents`)

## 🚧 Restrições e Considerações

### Limitações Técnicas

- **Migração de dados**: Se houver dados existentes com `current_balance`, precisamos definir estratégia de migração
- **Compatibilidade**: Verificar se há código que depende de `currentBalance` antes de remover
- **Performance**: Cálculo dinâmico pode ter impacto de performance (precisa ser avaliado)

### Riscos

- **Breaking changes**: Remoção pode quebrar funcionalidades existentes se não for feita cuidadosamente
- **Cálculo de saldo**: Precisamos garantir que o cálculo dinâmico funcione corretamente
- **Use cases**: Os use cases `addAmount` e `removeAmount` podem precisar ser completamente reescritos ou removidos

## 📚 Referências

- Issue Jira: [OS-240](https://orca-sonhos.atlassian.net/browse/OS-240)
- Meta Specs: https://github.com/danilotandrade1518/orca-sonhos-meta-specs
- Arquivos principais a modificar:

  - `src/domain/aggregates/envelope/envelope-entity/Envelope.ts`
  - `src/infrastructure/database/pg/mappers/envelope/EnvelopeMapper.ts`
  - `src/infrastructure/database/pg/migrations/1755018798541_create-envelopes-table.js`
  - `src/infrastructure/database/pg/daos/envelope/list-envelopes/ListEnvelopesDao.ts`

- Arquivos/diretórios a remover completamente:
  - `src/application/use-cases/envelope/add-amount-to-envelope/` (diretório completo)
  - `src/application/use-cases/envelope/remove-amount-from-envelope/` (diretório completo)
  - `src/application/use-cases/envelope/transfer-between-envelopes/` (diretório completo)
  - `src/domain/aggregates/envelope/services/TransferBetweenEnvelopesService.ts` e seu teste
  - `src/infrastructure/database/pg/unit-of-works/transfer-between-envelopes/` (diretório completo)
  - `src/application/contracts/unit-of-works/ITransferBetweenEnvelopesUnitOfWork.ts`
  - `src/application/shared/tests/stubs/TransferBetweenEnvelopesUnitOfWorkStub.ts`
  - `src/interface/http/controllers/envelope/add-amount-envelope.controller.ts`
  - `src/interface/http/controllers/envelope/remove-amount-envelope.controller.ts`
  - `src/interface/http/controllers/envelope/transfer-between-envelopes.controller.ts`
  - `src/tests/e2e/envelope/add-amount-envelope.e2e.test.ts`
  - `src/tests/e2e/envelope/remove-amount-envelope.e2e.test.ts`
  - `src/tests/e2e/envelope/transfer-between-envelopes.e2e.test.ts`

## ✅ Decisões Estratégicas Definidas

### 1. Use Cases `addAmount` e `removeAmount`

- **Decisão**: Devem ser **completamente removidos**
- **Justificativa**: Não fazem mais sentido na nova arquitetura onde saldo é calculado dinamicamente

### 2. Cálculo Dinâmico de Saldo

- **Decisão**: Será criada uma query futuramente para o saldo do envelope, mas **não deve ser tratado neste momento**
- **Observação**: O `ListEnvelopesDao` já calcula `spent_cents` de transações, mas está usando campos incorretos (`t.envelope_id`, `t.direction`, `t.amount_cents`) que não existem na tabela

### 3. Método `getAvailableLimit()`

- **Decisão**: Deve ser **removido**
- **Justificativa**: Depende de `currentBalance` que será removido

### 4. Estratégia de Migração de Dados

- **Decisão**: Não precisamos nos preocupar com migração de dados, apenas alterar a estrutura do banco via migration
- **Ação**: Criar migration para remover coluna `current_balance` e constraint relacionada

### 5. Value Object `EnvelopeBalance`

- **Decisão**: Deve ser **removido**
- **Justificativa**: Não será mais necessário após remoção de `currentBalance`

### 6. Correção da Relação Envelope-Transação

- **Problema Identificado**: O código está desatualizado. O `ListEnvelopesDao` usa `t.envelope_id` que não existe
- **Relação Correta**: A relação entre Envelope e Transação se dá por meio da categoria:
  - Transaction possui `category_id` (FK para categories)
  - Envelope possui `category_id` (FK para categories)
  - Relação indireta: Transaction -> Category <- Envelope
- **Correção Necessária**: Atualizar `ListEnvelopesDao` para usar `t.category_id = e.category_id` ao invés de `t.envelope_id = e.id`
- **Outras Correções no DAO**:
  - `t.direction` não existe → usar `t.type = 'EXPENSE'` para gastos
  - `t.amount_cents` não existe → usar `t.amount`
  - `e.allocated_cents` não existe na migração → usar `e.monthly_limit AS allocated_cents` (o campo `allocated` na interface corresponde ao `monthly_limit`)


