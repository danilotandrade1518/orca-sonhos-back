# Documento de Arquitetura - OS-9: Implementar vínculo Goal-Account com modelo de reservas 1:1

## Visão Geral do Sistema

### Antes da Implementação
- Goals e Accounts existem como agregados independentes
- AddAmountToGoalUseCase apenas incrementa `accumulatedAmount` sem afetar saldos
- Account.balance representa saldo total sem considerar reservas
- Não há controle real de reservas financeiras

### Depois da Implementação
- Goal vincula-se à Account via `sourceAccountId` (relacionamento 1:1)
- Account.balance = saldo total, Account.getAvailableBalance() = saldo disponível
- AddAmountToGoalUseCase opera com Unit of Work, atualizando Goal + Account
- Sistema reflete comportamento financeiro real com reservas

## Componentes Afetados e Suas Relações

### Modificações nos Agregados

#### Goal Aggregate
**Arquivo**: `src/domain/aggregates/goal/goal-entity/Goal.ts`

**Mudanças Estruturais**:
```typescript
export interface CreateGoalDTO {
  name: string;
  totalAmount: number;
  accumulatedAmount?: number;
  deadline?: Date;
  budgetId: string;
  sourceAccountId: string; // NOVO campo obrigatório
}

export class Goal extends AggregateRoot implements IEntity {
  private constructor(
    private _name: EntityName,
    private _totalAmount: MoneyVo,
    private _deadline: Date | undefined,
    private readonly _budgetId: EntityId,
    private _accumulatedAmount: MoneyVo,
    private readonly _sourceAccountId: EntityId, // NOVO campo
    existingId?: EntityId,
  ) { ... }
  
  // NOVO getter
  get sourceAccountId(): string {
    return this._sourceAccountId.value?.id ?? '';
  }
  
  // Método existente mantido mas semântica alterada
  // currentAmount = valor reservado na Account
  addAmount(amount: number): Either<DomainError, void> { ... }
  
  // NOVO método
  removeAmount(amount: number): Either<DomainError, void> {
    // Validações: não pode remover mais que currentAmount
    // Não pode remover se Goal deletada
  }
}
```

#### Account Aggregate
**Arquivo**: `src/domain/aggregates/account/account-entity/Account.ts`

**Mudanças Estruturais**:
```typescript
export class Account extends AggregateRoot implements IEntity {
  // NOVO método para cálculo de saldo disponível
  getAvailableBalance(totalReservedForGoals: number): Either<DomainError, number> {
    const currentBalance = this._balance.value?.cents ?? 0;
    const availableBalance = currentBalance - totalReservedForGoals;
    
    if (availableBalance < 0 && !this.allowsNegativeBalance()) {
      return Either.error(new InsufficientBalanceError());
    }
    
    return Either.success(availableBalance);
  }
  
  private allowsNegativeBalance(): boolean {
    return this._type.value?.allowsNegativeBalance ?? false;
  }
}
```

### Use Cases

#### AddAmountToGoalUseCase (Modificado)
**Fluxo Atualizado**:
1. **Autorização**: Verificar se usuário pode acessar Budget
2. **Buscar Goal**: Validar existência e estado
3. **Buscar Account**: Validar existência via `sourceAccountId`
4. **Validar Budget**: Goal e Account devem pertencer ao mesmo Budget
5. **Calcular Reservas**: Somar todas Goals vinculadas à Account
6. **Validar Saldo**: Account deve ter saldo disponível suficiente
7. **Unit of Work**: Executar transação atômica
   - Goal.addAmount(amount)
   - Account (atualizada via repositories para recálculo)

#### RemoveAmountFromGoalUseCase (Novo)
**Responsabilidades**:
- Validar autorização e existência de Goal/Account
- Goal.removeAmount(amount) - libera reserva
- Unit of Work para consistência

## Padrões e Melhores Práticas

### Padrões Mantidos
- **Domain-Driven Design (DDD)**: Agregados, invariantes, repositórios
- **Either Pattern**: Tratamento funcional de erros `Either<DomainError, T>`
- **Repository Pattern**: Acesso a dados via interfaces
- **Use Case Pattern**: Lógica de aplicação organizada em casos de uso
- **Authorization Service**: Validação de permissões via IBudgetAuthorizationService

### Padrões Introduzidos
- **Unit of Work Pattern**: Para operações atômicas envolvendo múltiplos agregados
- **Reservation Model**: Controle de reservas financeiras

## Dependências e Tecnologias

### Dependências Internas (Existentes)
- IBudgetAuthorizationService
- Either<DomainError, T> pattern
- Repository interfaces
- AggregateRoot base class

### Novas Interfaces/Contratos
```typescript
// Unit of Works
export interface IAddAmountToGoalUnitOfWork {
  execute(params: {
    goal: Goal;
    sourceAccount: Account;
    totalReservedForGoals: number;
  }): Promise<Either<DomainError, void>>;
}

// Repositories
export interface IGetGoalsByAccountRepository {
  execute(accountId: string): Promise<Either<DomainError, Goal[]>>;
}
```

## Invariantes de Domínio

### Invariantes Goal
- `Goal.sourceAccountId` deve referenciar Account existente e ativa
- `Goal.currentAmount <= Goal.targetAmount` (permitindo over-reserva)
- `Goal.currentAmount >= 0`
- Goal e sourceAccount devem pertencer ao mesmo Budget

### Invariantes Account
- `Account.getAvailableBalance() >= 0` para contas que não permitem saldo negativo
- Soma de todas `Goal.currentAmount` vinculadas <= `Account.balance` para contas sem saldo negativo

## Restrições e Suposições

### Restrições
- **Migração**: Não implementar migração (aplicação não está em produção)
- **Relacionamento**: Estritamente 1:1 (Goal → Account)
- **Autorização**: Seguir padrão IBudgetAuthorizationService existente
- **Tratamento de Erros**: Obrigatório uso do padrão Either

### Suposições
- IBudgetAuthorizationService funciona corretamente
- Unit of Work será implementada com transações de banco
- Goals órfãs (Account deletada) serão tratadas por cascade

## Trade-offs e Alternativas

### Trade-offs Aceitos
1. **Over-reserva permitida**: `currentAmount > targetAmount` é válido
2. **Saldo negativo**: Não permitido para reservas (exceto contas específicas)
3. **Goals órfãs**: Goal será deletada quando Account for deletada

### Alternativas Rejeitadas
1. **Relacionamento N:N**: Complexidade desnecessária para o caso de uso
2. **Event Sourcing**: Overhead desnecessário para funcionalidade de reservas
3. **Saga Pattern**: Unit of Work é suficiente para a operação

## Lista de Arquivos a Serem Modificados/Criados

### Modificados
- `src/domain/aggregates/goal/goal-entity/Goal.ts`
- `src/domain/aggregates/account/account-entity/Account.ts`
- `src/application/use-cases/goal/add-amount-to-goal/AddAmountToGoalUseCase.ts`
- `src/application/use-cases/goal/add-amount-to-goal/AddAmountToGoalDto.ts`

### Criados
- `src/application/use-cases/goal/remove-amount-from-goal/RemoveAmountFromGoalUseCase.ts`
- `src/application/use-cases/goal/remove-amount-from-goal/RemoveAmountFromGoalDto.ts`
- `src/application/contracts/unit-of-works/IAddAmountToGoalUnitOfWork.ts`
- `src/application/contracts/unit-of-works/IRemoveAmountFromGoalUnitOfWork.ts`
- `src/infrastructure/database/pg/unit-of-works/add-amount-to-goal/AddAmountToGoalUnitOfWork.ts`
- `src/infrastructure/database/pg/unit-of-works/remove-amount-from-goal/RemoveAmountFromGoalUnitOfWork.ts`
- `src/application/contracts/repositories/goal/IGetGoalsByAccountRepository.ts`
- `src/infrastructure/database/pg/repositories/goal/get-goals-by-account-repository/GetGoalsByAccountRepository.ts`
- `src/domain/aggregates/goal/errors/InsufficientAccountBalanceError.ts`
- `src/domain/aggregates/goal/errors/GoalAccountMismatchError.ts`

## Decisões Arquiteturais Tomadas

1. **Migração**: Não se preocupar com migração de Goals existentes
2. **Use Case**: Atualizar AddAmountToGoalUseCase para alterar conta via Unity Of Work
3. **Saldo Disponível**: Calculado nos Use Cases que alteram Goal e salvo via Unity Of Work
4. **Over-reserva**: Permitida (`currentAmount` > `targetAmount`)
5. **Saldo Negativo**: Não permitido para reservas (exceto contas que suportam)
6. **Goals Órfãs**: Goal será deletada junto quando Account for deletada
7. **Endpoints**: Trabalhar com conceito de command (POST para todas mutações)

## Diagrama de Arquitetura

```mermaid
graph TB
    subgraph "Domain Layer"
        Goal[Goal Aggregate]
        Account[Account Aggregate]
        Goal --> Account : sourceAccountId
    end
    
    subgraph "Application Layer"
        AddUC[AddAmountToGoalUseCase]
        RemoveUC[RemoveAmountFromGoalUseCase]
        AddUOW[IAddAmountToGoalUnitOfWork]
        RemoveUOW[IRemoveAmountFromGoalUnitOfWork]
        Auth[IBudgetAuthorizationService]
    end
    
    subgraph "Infrastructure Layer"
        AddUOWImpl[AddAmountToGoalUnitOfWork]
        RemoveUOWImpl[RemoveAmountFromGoalUnitOfWork]
        GoalRepo[GoalRepository]
        AccountRepo[AccountRepository]
        GoalsByAccRepo[GetGoalsByAccountRepository]
    end
    
    AddUC --> Auth
    AddUC --> AddUOW
    RemoveUC --> Auth
    RemoveUC --> RemoveUOW
    
    AddUOW --> AddUOWImpl
    RemoveUOW --> RemoveUOWImpl
    
    AddUOWImpl --> GoalRepo
    AddUOWImpl --> AccountRepo
    AddUOWImpl --> GoalsByAccRepo
    RemoveUOWImpl --> GoalRepo
    RemoveUOWImpl --> AccountRepo
```

---

✅ **Arquitetura detalhada e pronta para implementação**

**Próximos passos**: Aprovação da arquitetura e início da implementação seguindo a ordem de dependências dos arquivos.