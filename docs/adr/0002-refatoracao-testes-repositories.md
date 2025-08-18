# ADR 0002: Uso de Either nos Repositories com Jest Stubs

## Status

Aceito

## Contexto

Inicialmente, implementamos repositories que retornavam `Promise<void>` e lançavam exceções. Porém, ao analisar a arquitetura do projeto, percebemos que:

1. Todo o domain layer utiliza `Either` extensivamente
2. O projeto segue uma abordagem domain-driven design
3. Functional programming é um princípio adotado
4. Type safety e controle explícito de erros são prioritários

## Decisão

Refatoramos para usar `Either` nos repositories:

1. **Either nos Repositories**: Repositories retornam `Promise<Either<RepositoryError, T>>`
2. **Jest Stubs**: Substituir mocks customizados por stubs simples + Jest spies
3. **Centralizar Stubs**: Mover stubs para `application/shared/tests/stubs/`
4. **RepositoryError**: Criar erro específico para camada de infraestrutura

## Implementação

### Estrutura de Erro

```typescript
export class RepositoryError extends DomainError {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
```

### Repository Interface

```typescript
export interface IAddBudgetRepository {
  execute(budget: Budget): Promise<Either<RepositoryError, void>>;
}
```

### Repository Implementation (Infraestrutura)

```typescript
export class BudgetRepository implements IAddBudgetRepository {
  async execute(budget: Budget): Promise<Either<RepositoryError, void>> {
    const either = new Either<RepositoryError, void>();
    try {
      await this.database.save(budget);
      either.setData(undefined);
    } catch (error) {
      const repositoryError = new RepositoryError(
        'Failed to save budget',
        error,
      );
      either.addError(repositoryError);
    }
    return either;
  }
}
```

### Use Case

```typescript
const persistResult = await this.addBudgetRepository.execute(budget);
if (persistResult.hasError) {
  const errorMessages = persistResult.errors.map((error) => error.message);
  return ResponseBuilder.failure(errorMessages);
}
return ResponseBuilder.success(budget.id);
```

### Testes com Jest Stubs

```typescript
// Stub simples
export class AddBudgetRepositoryStub implements IAddBudgetRepository {
  async execute(_budget: Budget): Promise<Either<RepositoryError, void>> {
    const either = new Either<RepositoryError, void>();
    either.setData(undefined);
    return either;
  }
}

// Teste simulando erro
const repositoryError = new RepositoryError('Database connection failed');
const failureEither = new Either<RepositoryError, void>();
failureEither.addError(repositoryError);

const executeSpy = jest
  .spyOn(repositoryStub, 'execute')
  .mockResolvedValue(failureEither);
```

## Benefícios

1. **Consistência Arquitetural**: Alinhado com todo o domain layer
2. **Type Safety**: Tipos de erro explícitos em compile-time
3. **Functional Programming**: Mantém princípios funcionais
4. **Controle Explícito**: Força tratamento explícito de erros
5. **Testabilidade**: Mocks mais expressivos e type-safe
6. **Documentação**: Erros ficam autodocumentados nas interfaces

## Consequências

- Repositories de infraestrutura encapsulam try/catch internamente
- Use cases verificam `hasError` ao invés de usar try/catch
- Testes utilizam Jest stubs + mock para simular Either de falha
- Stubs são compartilhados e reutilizáveis
- Maior consistência com padrões DDD e functional programming

## Dados

- Data: 2024-12-19
- Testes passando: 232/232
- Arquivos alterados:
  - `IAddBudgetRepository.ts` - Interface com Either
  - `RepositoryError.ts` - Erro específico criado
  - `CreateBudgetUseCase.ts` - Verificação de Either
  - `CreateBudgetUseCase.spec.ts` - Testes com Jest stubs
  - `AddBudgetRepositoryStub.ts` - Stub com Either
