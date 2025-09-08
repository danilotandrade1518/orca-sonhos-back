# Context - OS-9: Implementar vínculo Goal-Account com modelo de reservas 1:1

## Por que está sendo construído (Contexto)

- **Problema atual**: Goals e Accounts existem como agregados independentes sem vínculo, impossibilitando controle real de reservas financeiras
- **Necessidade do usuário**: Usuários precisam separar mentalmente e fisicamente dinheiro para suas metas financeiras
- **Gap do sistema**: Sistema atual não reflete como pessoas realmente gerenciam suas metas (reservando dinheiro específico)
- **Objetivo**: Implementar modelo que espelha o comportamento financeiro real dos usuários

## Qual é o resultado esperado (Objetivo)

### Funcionalidades principais a implementar:

1. **Vínculo Goal → Account**
   - `Goal.sourceAccountId` aponta para uma única Account de origem
   - Relacionamento 1:1 (uma Goal, uma Account de origem)
   - Validação de existência da Account durante criação/atualização da Goal
   - **Goal e Account devem pertencer ao mesmo Budget** (validação obrigatória)

2. **Modelo de Reservas**
   - `currentAmount` da Goal = quantia fisicamente reservada da Account
   - Account calcula saldo disponível descontando todas as reservas ativas
   - Fórmula: `Account.availableBalance = balance - totalReservedForGoals`

3. **Use Cases de Operação**
   - **AddAmountToGoalUseCase**: adiciona valor à meta E reserva na conta (valida se Account tem saldo disponível suficiente)
   - **RemoveAmountFromGoalUseCase**: remove valor da meta E libera reserva na conta (não pode remover mais do que currentAmount)
   - **Ambos Use Cases seguem o padrão Either<DomainError, T>** estabelecido no projeto

4. **Invariantes de Domínio**
   - `Account.availableBalance >= 0` (sempre)
   - `Goal.currentAmount <= Goal.targetAmount`
   - `Goal.currentAmount >= 0`
   - Account deve existir antes de Goal ser vinculada
   - **Goal e Account devem pertencer ao mesmo Budget**
   - Soma de todas as reservas <= Account.balance

## Como deve ser construído (Abordagem)

### Modificações Técnicas

#### Goal Aggregate
```typescript
class Goal {
  sourceAccountId: string;        // NOVO: referência à Account
  currentAmount: Money;          // Valor já reservado
  targetAmount: Money;           // Meta total
  
  addAmount(amount: Money): Either<DomainError, void>;    // NOVO
  removeAmount(amount: Money): Either<DomainError, void>; // NOVO
}
```

#### Account Aggregate
```typescript
class Account {
  balance: Money;                          // Saldo total existente
  
  getAvailableBalance(): Either<DomainError, Money> {    // NOVO método
    return Either.success(this.balance.subtract(this.getTotalReservedForGoals()));
  }
}
```

### Implementação
- Seguir padrões DDD estabelecidos (agregados, invariantes)
- Usar padrão de Use Cases específicos conforme arquitetura
- Implementar endpoints seguindo padrão POST `/goal/add-amount-to-goal` e `/goal/remove-amount-from-goal`
- **Autorização via IBudgetAuthorizationService**: validar que usuário pode acessar Budget E que Goal/Account pertencem ao mesmo Budget
- **Tratamento de erros via Either pattern** seguindo padrão estabelecido

## APIs/Ferramentas (Entendimento)

- **IBudgetAuthorizationService**: Serviço já existente para validação de permissões
- **Either<DomainError, T>**: Padrão já estabelecido no projeto para tratamento de erros
- **Unit of Work pattern**: Para operações atômicas envolvendo múltiplos agregados
- **Repository pattern**: Já implementado no projeto

## Como deve ser testado

- Testes unitários de agregados (Goal e Account)
- Testes de Use Cases com validações de invariantes
- Testes de integração com Unit of Work
- Testes de autorização via IBudgetAuthorizationService
- Testes de endpoints com casos de erro

## Dependências

- IBudgetAuthorizationService (já existente)
- Padrão Either (já estabelecido)
- Agregados Goal e Account (existentes, serão modificados)
- Sistema de autorização atual (será reutilizado)

## Restrições

- **Migração**: Não será implementada pois aplicação ainda não está em produção
- **Autorização**: Implementação via IBudgetAuthorizationService seguindo padrões existentes
- **Padrão Either**: Todos os novos métodos seguem padrão Either<DomainError, T> estabelecido
- **Relacionamento 1:1**: Uma Goal vincula-se a exatamente uma Account

## Status

✅ **Análise completa**
- Documento de arquitetura já aprovado no comentário do Jira
- Requisitos bem definidos e detalhados
- Padrões do projeto identificados e serão seguidos
- Invariantes de domínio claramente especificadas