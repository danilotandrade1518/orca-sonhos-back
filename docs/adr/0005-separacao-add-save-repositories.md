# ADR-0005: Separação entre Add e Save Repositories

## Status

Aceito

## Contexto

Durante o desenvolvimento do sistema, observamos que o padrão Repository genérico estava violando o **Single Responsibility Principle** ao misturar operações de criação e atualização em uma única interface. Isso causava:

1. **Ambiguidade semântica**: Não ficava claro se um método `save()` era para criar ou atualizar
2. **Violação de responsabilidades**: Uma única interface tinha múltiplas responsabilidades
3. **Dificuldade de teste**: Stubs genéricos dificultavam testes específicos
4. **Falta de clareza arquitetural**: Use Cases não expressavam claramente suas intenções

Especificamente, o `CreateTransactionUseCase` estava utilizando `ISaveTransactionRepository`, que semanticamente deveria ser usado apenas para atualizações de entidades existentes.

## Decisão

Decidimos separar as responsabilidades dos repositories em interfaces específicas por operação:

### IAddRepository (Criação)
- **Propósito**: Persistir novas entidades no sistema
- **Semântica**: Operações de INSERT no banco de dados
- **Uso**: Use Cases de criação (Create*)
- **Exemplo**: `IAddTransactionRepository` usado por `CreateTransactionUseCase`

### ISaveRepository (Atualização)
- **Propósito**: Atualizar entidades existentes
- **Semântica**: Operações de UPDATE no banco de dados
- **Uso**: Use Cases de modificação (Update*, Mark*, Cancel*)
- **Exemplo**: `ISaveTransactionRepository` usado por `MarkTransactionLateUseCase`

### Repositórios de Consulta (Existentes)
- **IGetRepository**: Busca de entidades específicas por ID
- **IFindRepository**: Consultas específicas de negócio

### ⚠️ Anti-Padrão: Repositories de Mutação Específicos

**EVITAR** repositories de mutação com operações muito específicas:

```typescript
// ❌ EVITAR - Muito específico
export interface IMarkTransactionLateRepository {
  execute(transactionId: string): Promise<Either<RepositoryError, void>>;
}

export interface ICancelScheduledTransactionRepository {
  execute(transactionId: string, reason: string): Promise<Either<RepositoryError, void>>;
}
```

**Problemas desta abordagem:**
1. **Explosão de interfaces**: Cada operação específica geraria uma interface
2. **Violação de responsabilidades**: Repository assumindo lógica de domínio
3. **Dificuldade de manutenção**: Muitas interfaces para operações similares
4. **Acoplamento forte**: Repository acoplado a regras específicas de negócio

**✅ PREFERIR a abordagem atual:**
- Use Cases manipulam entidades aplicando regras de domínio
- Repositories genéricos (`IAdd`, `ISave`, `IGet`) para persistência
- Separação clara entre lógica de domínio e persistência

## Implementação

```typescript
// Antes - Interface genérica confusa
export interface ITransactionRepository {
  save(transaction: Transaction): Promise<Either<RepositoryError, void>>;
  findById(id: string): Promise<Either<RepositoryError, Transaction | null>>;
}

// Use Case ambíguo
export class CreateTransactionUseCase {
  constructor(
    private readonly saveTransactionRepository: ISaveTransactionRepository, // ❌ Confuso!
    private readonly eventPublisher: IEventPublisher,
  ) {}
}

// Depois - Interfaces específicas e claras
export interface IAddTransactionRepository {
  execute(transaction: Transaction): Promise<Either<RepositoryError, void>>;
}

export interface ISaveTransactionRepository {
  execute(transaction: Transaction): Promise<Either<RepositoryError, void>>;
}

export interface IGetTransactionRepository {
  execute(id: string): Promise<Either<RepositoryError, Transaction | null>>;
}
```

## Diretrizes de Design

### 1. Granularidade Adequada
- **Repositories**: Devem ser **genéricos por operação** (Add, Save, Get, Find)
- **Use Cases**: Devem ser **específicos por regra de negócio** (Create, MarkAsLate, Cancel)

### 2. Responsabilidades
- **Repository**: Apenas persistência e recuperação de dados
- **Use Case**: Orquestração e aplicação de regras de domínio
- **Entity/Aggregate**: Encapsulamento das regras de negócio

### 3. Exemplo Correto vs Incorreto

```typescript
// ✅ CORRETO: Use Case específico + Repository genérico
export class MarkTransactionLateUseCase {
  constructor(
    private readonly getTransactionRepository: IGetTransactionRepository,
    private readonly saveTransactionRepository: ISaveTransactionRepository,
  ) {}

  async execute(dto: MarkTransactionLateDto) {
    const transaction = await this.getTransactionRepository.execute(dto.transactionId);
    transaction.markAsLate(); // ← Regra de domínio na entidade
    await this.saveTransactionRepository.execute(transaction); // ← Persistência genérica
  }
}

// ❌ INCORRETO: Repository específico
export class MarkTransactionLateUseCase {
  constructor(
    private readonly markTransactionLateRepository: IMarkTransactionLateRepository, // ❌
  ) {}

  async execute(dto: MarkTransactionLateDto) {
    // Repository assumindo responsabilidade de domínio
    await this.markTransactionLateRepository.execute(dto.transactionId); // ❌
  }
}
```

### Use Cases Atualizados

```typescript
// CreateTransactionUseCase agora usa IAddTransactionRepository
export class CreateTransactionUseCase {
  constructor(
    private readonly addTransactionRepository: IAddTransactionRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}
}

// MarkTransactionLateUseCase usa ISaveTransactionRepository
export class MarkTransactionLateUseCase {
  constructor(
    private readonly getTransactionRepository: IGetTransactionRepository,
    private readonly saveTransactionRepository: ISaveTransactionRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}
}
```

## Consequências

### Positivas

1. **Clareza Semântica**: Cada repository expressa claramente sua intenção
2. **Single Responsibility**: Cada interface tem uma responsabilidade específica
3. **Melhor Testabilidade**: Stubs mais específicos e focados
4. **Documentação Viva**: O código documenta a intenção arquitetural
5. **Facilita Evolução**: Permite implementações diferentes para criação vs atualização
6. **Conformidade com Clean Architecture**: Interfaces bem definidas na camada de domínio

### Negativas

1. **Mais Interfaces**: Aumento no número de interfaces a serem mantidas
2. **Refatoração**: Necessidade de atualizar Use Cases e testes existentes
3. **Curva de Aprendizado**: Desenvolvedores precisam entender a distinção

### Neutras

1. **Implementações Concretas**: Na infraestrutura, podem reutilizar código interno
2. **Compatibilidade**: Não afeta a API externa do sistema

## Alternativas Consideradas

1. **Repository Genérico com Flags**: Manter interface única com parâmetros indicando operação
   - Rejeitado: Manteria ambiguidade e violaria SRP

2. **Métodos Separados na Mesma Interface**: `create()` e `update()` na mesma interface
   - Rejeitado: Violaria Interface Segregation Principle

3. **Command Pattern**: Usar commands para operações
   - Rejeitado: Complexidade desnecessária para o contexto atual

## Referências

- Clean Architecture - Robert C. Martin
- SOLID Principles
- Repository Pattern
- Domain-Driven Design - Eric Evans

## Data

4 de agosto de 2025

## Revisores

- Equipe de Desenvolvimento
