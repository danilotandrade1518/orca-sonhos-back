# Visão Arquitetural do Backend

## 1. Visão Geral

Este documento descreve a arquitetura do backend do projeto OrçaSonhos, baseado em Node.js, Express, TypeScript, Clean Architecture e PostgreSQL.
Iremos utilizar alguns conceitos que vêm do DDD, que são:

- Aggregates
- Entities
- Value Objects
- Repositories

Iremos ainda utilizar a ideia central do CQRS.
A ideia aqui é tratar tudo que for mutação de estado em usecases/domain, e tudo que for query em QueryHandlers.
Não teremos inicialmente de forma obrigatória, projeção de views, apenas iremos consultar o banco diretamente pelos QueryHandlers.

## 2. Organização dos Diretórios

- `/src`
  - `/domain` — Agregados, Value Objects globais e regras de negócio
    - `/aggregates` — Cada agregado possui uma pasta própria, contendo suas entidades e value objects específicos
    - `/shared/value-objects` — Value Objects globais, reutilizáveis em todo o domínio
  - `/application/usecases` — Casos de uso (aplicação)
  - `/application/queries` - Query Handlers
  - `/application/contracts` - Interfaces de Repositórios e Serviços
  - `/infra` — Implementações de infraestrutura (banco, serviços externos)
  - `/interfaces/web` - Web controllers
  - `/config` — Configurações gerais do projeto

## 3. Responsabilidades das Camadas

- **Domain:** Agregados, entidades (dentro dos agregados), value objects (globais e específicos) e regras de negócio puras, sem dependências externas.
- **Use Cases:** Orquestram as regras de negócio, coordenando entidades e serviços. Use Cases normalmente irão utilizar Repositories para acesso ao banco de dados, Unit of Work para operações transacionais complexas.
- **Queries:** Tratam views do sistema. Query Handlers normalmente irão utilizar DAO's para acesso ao banco de dados.
- **Web:** Pontos de entrada/saída HTTP, adapta dados para os casos de uso.
- **Infra:** Implementação de repositórios, unit of work, integrações externas, persistência.

### 3.1. Princípio da Granularidade Adequada

#### Repositories: Genéricos por Operação

- **IAddRepository**: Criação de entidades (INSERT)
- **ISaveRepository**: Atualização de entidades (UPDATE)
- **IGetRepository**: Busca por ID específico
- **IFindRepository**: Consultas específicas de negócio
- **IDeleteRepository**: Remoção de entidades (DELETE)

#### Use Cases: Específicos por Regra de Negócio

- **CreateTransactionUseCase**: Criar nova transação
- **MarkTransactionLateUseCase**: Marcar transação como atrasada
- **CancelScheduledTransactionUseCase**: Cancelar transação agendada
- **ReconcileAccountUseCase**: Reconciliar saldo da conta

Esta separação garante que:

- **Repositories** focam apenas em persistência
- **Use Cases** expressam claramente a operação de negócio
- **Entidades** encapsulam as regras de domínio
- **Maior reutilização** e **menor acoplamento**

## 4. Fluxo de Dados

### 4.1 Mutação de Estado

```
[Request] → [Controller] → [UseCase] → [Domain Services] → [Unit of Work] → [Database]
                     ↓
                [Response]
```

1. Uma requisição chega pela camada web (ex: controller Express).
2. O controller chama o caso de uso apropriado.
3. O caso de uso orquestra a operação usando Domain Services e Repositories.
4. Domain Services executam regras de negócio complexas.
5. Unit of Work garante atomicidade quando necessário.
6. Mudanças são persistidas no banco de dados.
7. A resposta retorna pela cadeia até o usuário.

### 4.2 Consultas (View Request)

```
[Request] → [Controller] → [Query Handler] → [DAO] → [Database]
                     ↓
                [Response]
```

1. Uma requisição chega pela camada web (ex: controller Express).
2. O controller chama a query handler apropriada.
3. A query handler consulta o banco através dos DAO's apropriados.
4. A camada de Infra fornece as implementações concretas (ex: acesso ao PostgreSQL através de DAO's).
5. A resposta retorna pela cadeia até o usuário.

## 7. DAO vs Repository

- **Repository:** Representa uma coleção de agregados (entidades) e encapsula regras de negócio relacionadas à persistência. Utilizado principalmente em operações de mutação (criação, atualização, remoção) e segue contratos definidos na camada de domínio.
- **DAO (Data Access Object):** Focado em consultas (queries) e otimizado para leitura de dados. Utilizado em Query Handlers para buscar informações diretamente do PostgreSQL, podendo retornar dados em formatos específicos para views.

### 7.1. Padrão Repository Refinado: Separação de Responsabilidades

Para garantir melhor aderência ao **Single Responsibility Principle** e maior clareza arquitetural, adotamos uma separação específica entre diferentes tipos de operações de repository:

#### Add vs Save Repositories

- **IAddRepository**: Interface para **criação** de novos agregados no sistema

  - Utilizado quando se trata de persistir entidades completamente novas
  - Exemplo: `IAddTransactionRepository` para criar novas transações
  - Use Cases típicos: `CreateTransactionUseCase`, `CreateAccountUseCase`

- **ISaveRepository**: Interface para **atualização** de agregados existentes
  - Utilizado quando se trata de modificar o estado de entidades já persistidas
  - Exemplo: `ISaveTransactionRepository` para atualizar transações existentes
  - Use Cases típicos: `MarkTransactionLateUseCase`, `CancelScheduledTransactionUseCase`

#### Exemplo de Implementação

```typescript
// Interface para criação de novas transações
export interface IAddTransactionRepository {
  execute(transaction: Transaction): Promise<Either<RepositoryError, void>>;
}

// Interface para atualização de transações existentes
export interface ISaveTransactionRepository {
  execute(transaction: Transaction): Promise<Either<RepositoryError, void>>;
}

// Use Case de criação utiliza Add Repository
export class CreateTransactionUseCase {
  constructor(
    private readonly addTransactionRepository: IAddTransactionRepository,
  ) {}

  async execute(dto: CreateTransactionDto) {
    const transaction = Transaction.create(dto);
    await this.addTransactionRepository.execute(transaction);
    // ... resto da implementação
  }
}

// Use Case de atualização utiliza Save Repository
export class MarkTransactionLateUseCase {
  constructor(
    private readonly getTransactionRepository: IGetTransactionRepository,
    private readonly saveTransactionRepository: ISaveTransactionRepository,
  ) {}

  async execute(dto: MarkTransactionLateDto) {
    const transaction = await this.getTransactionRepository.execute(
      dto.transactionId,
    );
    transaction.markAsLate();
    await this.saveTransactionRepository.execute(transaction);
    // ... resto da implementação
  }
}
```

#### Vantagens da Separação

1. **Clareza de Intenção**: Fica explícito se a operação é de criação ou atualização
2. **Single Responsibility**: Cada interface tem uma responsabilidade específica
3. **Testabilidade**: Stubs de teste mais específicos e focados
4. **Evolução**: Permite implementações diferentes para criação vs atualização se necessário
5. **Documentação Viva**: O código serve como documentação da intenção arquitetural

#### Repositórios de Consulta

- **IGetRepository**: Interface para busca de agregados específicos
  - Exemplo: `IGetTransactionRepository`, `IGetAccountRepository`
  - Retorna entidades completas do domínio
- **IFindRepository**: Interface para consultas específicas de negócio
  - Exemplo: `IAddTransactionRepository`
  - Pode retornar listas filtradas ou consultas complexas

Esta organização garante que cada repository tenha uma responsabilidade bem definida e que os Use Cases expressem claramente suas intenções através dos tipos de repository que utilizam.

### 7.2. Diretrizes Importantes

#### ⚠️ EVITAR: Repositories de Mutação Específicos

Não crie repositories para operações específicas de domínio:

```typescript
// ❌ EVITAR - Repository muito específico
export interface IMarkTransactionLateRepository {
  execute(transactionId: string): Promise<Either<RepositoryError, void>>;
}

// ❌ EVITAR - Repository assumindo lógica de domínio
export interface ICancelScheduledTransactionRepository {
  execute(
    transactionId: string,
    reason: string,
  ): Promise<Either<RepositoryError, void>>;
}
```

**Problemas:**

- Explosão de interfaces para cada operação específica
- Repository assumindo responsabilidades de domínio
- Violação do Single Responsibility Principle
- Dificuldade de manutenção e teste

#### ✅ PREFERIR: Use Cases Específicos + Repositories Genéricos

```typescript
// ✅ CORRETO: Use Case específico + Repositories genéricos
export class MarkTransactionLateUseCase {
  constructor(
    private readonly getTransactionRepository: IGetTransactionRepository,
    private readonly saveTransactionRepository: ISaveTransactionRepository,
  ) {}

  async execute(dto: MarkTransactionLateDto) {
    const transaction = await this.getTransactionRepository.execute(
      dto.transactionId,
    );
    transaction.markAsLate(); // ← Regra de domínio na entidade
    await this.saveTransactionRepository.execute(transaction); // ← Persistência genérica
  }
}
```

**Vantagens:**

- Repositories focados apenas em persistência
- Use Cases expressam claramente a operação de negócio
- Entidades encapsulam as regras de domínio
- Maior reutilização e menor acoplamento

## 8. Unit of Work Pattern

### 8.1. Conceito

O padrão **Unit of Work** mantém uma lista de objetos afetados por uma transação de negócio e coordena a escrita das mudanças, resolvendo problemas de concorrência. Em nosso contexto, é especialmente útil para operações que envolvem múltiplos agregados ou múltiplas operações que devem ser executadas atomicamente.

### 8.2. Quando Utilizar

O Unit of Work deve ser utilizado em cenários onde:

- **Operações Atômicas Complexas**: Quando uma operação de negócio requer múltiplas escritas no banco que devem ser executadas como uma única transação
- **Múltiplos Agregados**: Quando a operação envolve modificações em diferentes agregados que precisam ser consistentes
- **Rollback Automático**: Quando é necessário garantir que falhas em qualquer etapa revertam todas as operações
- **Operações de Transferência**: Como transferências entre contas, que envolvem débito em uma conta e crédito em outra

### 8.3. Quando NÃO Utilizar

Evite Unit of Work quando:

- **Operações Simples**: Para operações que envolvem apenas um agregado
- **Apenas Leitura**: Para operações de consulta (use Query Handlers)
- **Operações Independentes**: Quando não há necessidade de atomicidade entre operações

### 8.4. Implementação

#### Interface Base

```typescript
export interface IUnitOfWork {
  executeTransfer(
    params: TransferParams,
  ): Promise<Either<TransferExecutionError, void>>;
}
```

#### Implementação Concreta

```typescript
export class TransferBetweenAccountsUnitOfWork implements IUnitOfWork {
  private saveAccountRepository: SaveAccountRepository;
  private addTransactionRepository: AddTransactionRepository;

  constructor(private postgresConnectionAdapter: IPostgresConnectionAdapter) {
    this.saveAccountRepository = new SaveAccountRepository(
      postgresConnectionAdapter,
    );
    this.addTransactionRepository = new AddTransactionRepository(
      postgresConnectionAdapter,
    );
  }

  async executeTransfer(
    params: TransferParams,
  ): Promise<Either<TransferExecutionError, void>> {
    let client: IDatabaseClient | undefined;

    try {
      // 1. Obter conexão e iniciar transação
      client = await this.postgresConnectionAdapter.getClient();
      await client.beginTransaction();

      // 2. Executar operações usando a mesma conexão
      const saveFromResult = await this.saveAccountRepository.executeWithClient(
        client,
        params.fromAccount,
      );
      if (saveFromResult.hasError)
        throw new Error('Failed to save source account');

      const saveToResult = await this.saveAccountRepository.executeWithClient(
        client,
        params.toAccount,
      );
      if (saveToResult.hasError)
        throw new Error('Failed to save target account');

      const addDebitResult =
        await this.addTransactionRepository.executeWithClient(
          client,
          params.debitTransaction,
        );
      if (addDebitResult.hasError)
        throw new Error('Failed to add debit transaction');

      const addCreditResult =
        await this.addTransactionRepository.executeWithClient(
          client,
          params.creditTransaction,
        );
      if (addCreditResult.hasError)
        throw new Error('Failed to add credit transaction');

      // 3. Commit da transação
      await client.commitTransaction();
      return Either.success(undefined);
    } catch (error) {
      // 4. Rollback em caso de erro
      if (client) {
        try {
          await client.rollbackTransaction();
        } catch (rollbackError) {
          // Log rollback error but don't mask original error
        }
      }
      return Either.error(new TransferExecutionError(error.message, error));
    }
  }
}
```

### 8.5. Integração com Repositories

Os repositories devem suportar execução com client específico para trabalhar com Unit of Work:

```typescript
export class SaveAccountRepository {
  constructor(private postgresConnectionAdapter: IPostgresConnectionAdapter) {}

  // Método padrão (obtém própria conexão)
  async execute(account: Account): Promise<Either<RepositoryError, void>> {
    const client = await this.postgresConnectionAdapter.getClient();
    return this.executeWithClient(client, account);
  }

  // Método para Unit of Work (usa conexão fornecida)
  async executeWithClient(
    client: IDatabaseClient,
    account: Account,
  ): Promise<Either<RepositoryError, void>> {
    try {
      const accountDto = AccountMapper.domainToDto(account);
      await client.query(UPDATE_ACCOUNT_QUERY, [
        accountDto.name,
        accountDto.accountType,
        accountDto.id,
      ]);
      return Either.success(undefined);
    } catch (error) {
      return Either.error(new RepositoryError('Failed to save account', error));
    }
  }
}
```

### 8.6. Uso em Use Cases

```typescript
export class TransferBetweenAccountsUseCase {
  constructor(
    private unitOfWork: TransferBetweenAccountsUnitOfWork,
    private accountRepository: GetAccountRepository,
  ) {}

  async execute(
    dto: TransferBetweenAccountsDto,
  ): Promise<Either<ApplicationError, void>> {
    // 1. Buscar contas
    const fromAccount = await this.accountRepository.execute(dto.fromAccountId);
    const toAccount = await this.accountRepository.execute(dto.toAccountId);

    // 2. Aplicar regras de negócio
    fromAccount.debit(dto.amount);
    toAccount.credit(dto.amount);

    // 3. Criar transações
    const debitTransaction = Transaction.createDebit(/* ... */);
    const creditTransaction = Transaction.createCredit(/* ... */);

    // 4. Executar com Unit of Work
    const result = await this.unitOfWork.executeTransfer({
      fromAccount,
      toAccount,
      debitTransaction,
      creditTransaction,
    });

    return result;
  }
}
```

### 8.7. Vantagens

- **Atomicidade**: Garante que todas as operações sejam executadas ou nenhuma
- **Consistência**: Mantém o estado consistente mesmo em operações complexas
- **Isolamento**: Usa transações de banco para garantir isolamento
- **Rollback Automático**: Falhas em qualquer etapa revertem toda a operação
- **Reutilização**: Unit of Works podem ser reutilizados em diferentes Use Cases

### 8.8. Organização no Projeto

```
/src/infrastructure/database/pg/unit-of-works/
├── transfer-between-accounts/
│   ├── TransferBetweenAccountsUnitOfWork.ts
│   └── TransferBetweenAccountsUnitOfWork.spec.ts
└── bulk-transaction-import/
    ├── BulkTransactionImportUnitOfWork.ts
    └── BulkTransactionImportUnitOfWork.spec.ts
```

### 8.9. Testes

Unit of Works devem ter cobertura completa de testes, incluindo:

- **Cenários de Sucesso**: Verificação de execução completa
- **Cenários de Falha**: Simulação de falhas em cada etapa
- **Rollback**: Verificação de rollback automático
- **Ordem de Execução**: Validação da sequência correta das operações

```typescript
describe('TransferBetweenAccountsUnitOfWork', () => {
  it('should execute transfer successfully', async () => {
    // Arrange
    mockSaveAccountRepository.executeWithClient.mockResolvedValue(
      Either.success(undefined),
    );
    mockAddTransactionRepository.executeWithClient.mockResolvedValue(
      Either.success(undefined),
    );

    // Act
    const result = await unitOfWork.executeTransfer(transferParams);

    // Assert
    expect(result.hasError).toBe(false);
    expect(mockClient.commitTransaction).toHaveBeenCalled();
  });

  it('should rollback when repository fails', async () => {
    // Arrange
    mockSaveAccountRepository.executeWithClient.mockResolvedValueOnce(
      Either.error(new RepositoryError('Database error')),
    );

    // Act
    const result = await unitOfWork.executeTransfer(transferParams);

    // Assert
    expect(result.hasError).toBe(true);
    expect(mockClient.rollbackTransaction).toHaveBeenCalled();
  });
});
```

## 9. Padrões de Nomenclatura

- Classes: PascalCase (ex: `CriarUsuarioUseCase`, `UsuarioRepository`)
- Arquivos: PascalCase (ex: `CriarUsuarioUseCase.ts`, `UsuarioRepository.ts`)
- Métodos: camelCase (ex: `criarUsuario`, `buscarPorId`, `handle`)
- Pastas: kebab-case (ex: `usecases`, `queries`, `infra`, `unit-of-works`)
- Interfaces: prefixo `I` (ex: `IUsuarioRepository`)
- Unit of Work: sufixo `UnitOfWork` (ex: `TransferBetweenAccountsUnitOfWork`, `BulkTransactionImportUnitOfWork`)

## 10. Tratamento de Erros

O tratamento de erros será realizado utilizando o padrão `Either`, evitando o uso de `throw/try/catch` exceto em situações explicitamente necessárias (ex: falhas inesperadas). Os métodos retornarão objetos do tipo `Either<Erro, Sucesso>`, facilitando o controle de fluxo e a previsibilidade dos resultados.

## 11. Padrão de Imports e Path Alias

Para manter a organização e a clareza do projeto, adotaremos o seguinte padrão para imports:

- **Path Alias:** Devem ser utilizados apenas para importar arquivos entre diferentes camadas (por exemplo, importar algo da camada `domain` para a camada `application`).
- **Imports Relativos:** Devem ser utilizados para importar arquivos dentro da mesma camada (por exemplo, entre arquivos dentro de `usecases`, ou entre arquivos dentro de `aggregates`).

Este padrão visa facilitar a navegação, evitar ciclos de dependência e reforçar a separação entre as camadas da arquitetura.

## 12. Padrão de Ordenação de Métodos em Classes

Para manter a legibilidade e padronização do código, todas as classes devem seguir a seguinte ordem de declaração de métodos:

1. Métodos públicos (incluindo getters/setters)
2. Métodos estáticos
3. Métodos privados

Este padrão deve ser seguido em todas as classes do domínio, value objects, entidades, use cases, etc.

## 13. Organização dos Testes

Os testes devem ser organizados seguindo a mesma estrutura do código de produção, mantendo a proximidade com o código testado:

- **Testes Unitários:** Devem ser colocados na mesma pasta do arquivo testado, com o sufixo `.spec.ts`

  - Exemplo: `src/domain/aggregates/budget/Budget.ts` → `src/domain/aggregates/budget/Budget.spec.ts`
  - Exemplo: `src/domain/shared/value-objects/Money.ts` → `src/domain/shared/value-objects/Money.spec.ts`

- **Testes de Integração:** Devem ser colocados em uma pasta `__tests__` dentro do módulo testado

  - Exemplo: `src/application/usecases/__tests__/CreateBudgetUseCase.spec.ts`

- **Testes E2E:** Devem ser colocados em uma pasta `__tests__` na raiz do projeto
  - Exemplo: `src/__tests__/e2e/budget.spec.ts`

Esta organização visa:

- Manter os testes próximos ao código testado
- Facilitar a manutenção e localização dos testes
- Seguir o princípio de coesão e acoplamento
- Manter a consistência com a arquitetura do projeto

---

**Este documento deve ser atualizado conforme a arquitetura evoluir. Todo o código do projeto será escrito em Inglês.**

## 14. Padrão de Endpoints para Mutations (Decisão de API Command-Style)

### 14.1. Motivação

Adotamos um modelo de domínio rico (DDD) com agregados, invariantes e regras explícitas em Use Cases. A tentativa de expressar estas operações via REST puro (verbs + resources canônicos) resultaria em:

- Ambiguidade ou sobrecarga de verbos HTTP para operações específicas (ex: `mark-transaction-late`, `cancel-scheduled-transaction`, `transfer-between-envelopes`).
- Necessidade de múltiplos endpoints PATCH/PUT semanticamente distintos sobre o mesmo recurso.
- Maior risco de “anemic domain” ao tentar forçar operações complexas dentro de CRUD genérico.

Para preservar a clareza de intenção e alinhar com o modelo Command (próximo de CQRS), adotamos um estilo orientado a comandos para mutações.

### 14.2. Padrão Definido

- **Todos os endpoints de mutação usam HTTP POST.**
- **Formato da rota:** `/<aggregate|context>/<action-name>`
  - Exemplos:
    - `POST /budget/create-budget`
    - `POST /transaction/mark-transaction-late`
    - `POST /credit-card-bill/pay-credit-card-bill`
    - `POST /envelope/transfer-between-envelopes`
- O nome da ação reflete diretamente o caso de uso (classe do UseCase) com kebab-case.
- Request Body segue o DTO do Use Case. Response segue o `UseCaseResponse` encapsulado pelo `DefaultResponseBuilder`.

### 14.3. Escopo

Esta convenção aplica-se exclusivamente a operações de **mutação** (commands). Consultas (queries) poderão futuramente adotar um padrão distinto (ex: GET com filtros ou um endpoint `/query` específico) mantendo a separação CQRS.

### 14.4. Benefícios

| Aspecto                     | Benefício                                                               |
| --------------------------- | ----------------------------------------------------------------------- |
| Clareza semântica           | Cada endpoint comunica explicitamente a intenção do caso de uso         |
| Evolução                    | Facilita adicionar novas operações sem quebrar contratos REST genéricos |
| Alinhamento DDD             | Mantém o ubiquitous language entre domínio e interface                  |
| Simplicidade de Autorização | Policies podem mapear 1:1 para ações                                    |
| Consistência de Erros       | `Either` + `DefaultResponseBuilder` padronizados                        |

### 14.5. Trade-offs / Consequências

- Menos aderente a expectativas REST puras / ferramentas automáticas de geração.
- Pode exigir documentação mais explícita (OpenAPI, Swagger já adaptado).
- Aumento potencial de número de endpoints (um por ação) — mitigado por agrupamento por contexto.

### 14.6. Convenções de Nome

- `create-`, `update-`, `delete-` para CRUD direto.
- Verbos de negócio específicos (`mark-`, `pay-`, `reopen-`, `transfer-between-`, `add-amount-`, `remove-amount-`).
- Kebab-case sempre; evitar abreviações obscuras.

### 14.7. Idempotência

- Operações naturalmente idempotentes (ex: `reopen-credit-card-bill` dentro da janela válida) devem continuar seguras a reenvio — a lógica de domínio garante consistência.
- Para comandos não idempotentes (ex: `pay-credit-card-bill`) podem ser futuramente suportados headers como `Idempotency-Key` se necessário.

### 14.8. Versionamento Futuro

- Caso surja necessidade: prefixo opcional `/v1/` manteve-se adiado até primeira ruptura.
- Evoluções breaking criam novo action name OU novo namespace (`/v2/transaction/...`).

### 14.9. Autorização

- Autorização é aplicada por serviço (`IBudgetAuthorizationService`) no Use Case; camada HTTP não contém lógica de permissão.
- A consistência do verbo único (POST) reduz matriz de permissão ao par (contexto, ação).

### 14.10. Referência

- Decisão formalizada na ADR: `0008-padrao-endpoints-mutations-post-comando.md`.

---

> Esta seção será revisitada quando introduzirmos query endpoints especializados ou se adotarmos GraphQL / gRPC para leitura.
