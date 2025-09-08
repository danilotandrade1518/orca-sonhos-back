# OS-9: Implementar vínculo Goal-Account com modelo de reservas 1:1

Se você está trabalhando nesta funcionalidade, certifique-se de atualizar este arquivo plan.md conforme progride.

## FASE 1: Fundação - Domain Layer e Contratos [Concluída ✅]

Implementar modificações nos agregados e criar contratos base necessários para o modelo de reservas.

### Modificar Goal Aggregate [Concluída ✅]

**Arquivo**: `src/domain/aggregates/goal/goal-entity/Goal.ts`
- ✅ Adicionar `sourceAccountId: EntityId` na estrutura interna
- ✅ Adicionar getter `sourceAccountId`
- ✅ Modificar `CreateGoalDTO` para incluir `sourceAccountId: string`
- ✅ Modificar `RestoreGoalDTO` para incluir `sourceAccountId: string`
- ✅ Implementar `removeAmount(amount: number): Either<DomainError, void>`
- ✅ Atualizar `addAmount()` para permitir over-reserving (removendo validação targetAmount)
- ✅ Atualizar factory method `create()` para aceitar sourceAccountId
- ✅ Atualizar factory method `restore()` para lidar com sourceAccountId

**Decisões tomadas:**
- Removida validação de over-reserva em addAmount() conforme especificação
- RemoveAmount valida que não pode remover mais que o valor atual (currentAmount >= 0)

### Modificar Account Aggregate [Concluída ✅]

**Arquivo**: `src/domain/aggregates/account/account-entity/Account.ts`
- ✅ Implementar `getAvailableBalance(totalReservedForGoals: number): Either<DomainError, number>`
- ✅ Adicionar método privado `allowsNegativeBalance(): boolean`
- ✅ Criar validações para saldo disponível considerando reservas
- ✅ Validação retorna erro se saldo insuficiente e conta não permite negativo

**Decisões tomadas:**
- getAvailableBalance() usa AccountType.allowsNegativeBalance para validação
- Retorna InsufficientBalanceError quando saldo insuficiente e conta não permite negativo

### Criar Domain Errors [Concluída ✅]

- ✅ **InsufficientAccountBalanceError**: `src/domain/aggregates/goal/errors/InsufficientAccountBalanceError.ts`
- ✅ **GoalAccountMismatchError**: `src/domain/aggregates/goal/errors/GoalAccountMismatchError.ts`
- ✅ **InvalidReserveAmountError**: `src/domain/aggregates/goal/errors/InvalidReserveAmountError.ts`

**Decisões tomadas:**
- Todos os erros seguem padrão existente com fieldName específico
- InsufficientAccountBalanceError aponta para 'sourceAccount'
- GoalAccountMismatchError aponta para 'budgetId' 
- InvalidReserveAmountError aponta para 'amount'

### Criar Contratos de Repositório [Concluída ✅]

**Arquivo**: `src/application/contracts/repositories/goal/IGetGoalsByAccountRepository.ts`
- ✅ Interface criada seguindo padrão dos repositórios existentes
- ✅ Retorna `Either<RepositoryError, Goal[]>` conforme padrão do projeto

## FASE 2: Unit of Work e Repositórios [Não Iniciada ⏳]

Implementar a infraestrutura necessária para operações transacionais envolvendo múltiplos agregados.

### Criar Contratos Unit of Work [Não Iniciada ⏳]

- **IAddAmountToGoalUnitOfWork**: `src/application/contracts/unit-of-works/IAddAmountToGoalUnitOfWork.ts`
- **IRemoveAmountFromGoalUnitOfWork**: `src/application/contracts/unit-of-works/IRemoveAmountFromGoalUnitOfWork.ts`

### Implementar Repositório GetGoalsByAccount [Não Iniciada ⏳]

**Arquivo**: `src/infrastructure/database/pg/repositories/goal/get-goals-by-account-repository/GetGoalsByAccountRepository.ts`
- Implementar query SQL para buscar Goals por sourceAccountId
- Seguir padrão dos repositórios existentes
- Implementar tratamento de erros e mapeamento de dados

### Implementar Unit of Works [Não Iniciada ⏳]

- **AddAmountToGoalUnitOfWork**: `src/infrastructure/database/pg/unit-of-works/add-amount-to-goal/AddAmountToGoalUnitOfWork.ts`
- **RemoveAmountFromGoalUnitOfWork**: `src/infrastructure/database/pg/unit-of-works/remove-amount-from-goal/RemoveAmountToGoalUnitOfWork.ts`

Cada Unit of Work deve:
- Iniciar transação
- Executar operações nos agregados
- Salvar mudanças de forma atômica
- Fazer rollback em caso de erro

## FASE 3: Use Cases - Lógica de Aplicação [Não Iniciada ⏳]

Implementar e modificar os Use Cases para trabalhar com o novo modelo de reservas.

### Modificar AddAmountToGoalUseCase [Não Iniciada ⏳]

**Arquivo**: `src/application/use-cases/goal/add-amount-to-goal/AddAmountToGoalUseCase.ts`

**Novo Fluxo**:
1. **Autorização**: Verificar acesso ao Budget via IBudgetAuthorizationService
2. **Buscar Goal**: Validar existência e estado ativo
3. **Buscar Account**: Validar existência via sourceAccountId  
4. **Validar Budget**: Goal e Account devem pertencer ao mesmo Budget
5. **Calcular Reservas**: Buscar todas Goals da Account e somar currentAmount
6. **Validar Saldo**: Account deve ter saldo disponível suficiente
7. **Unit of Work**: Executar transação atômica atualizando Goal

**Dependências**:
- IGetGoalRepository (existente)
- IGetAccountRepository (existente) 
- IGetGoalsByAccountRepository (novo)
- IAddAmountToGoalUnitOfWork (novo)
- IBudgetAuthorizationService (existente)

### Criar RemoveAmountFromGoalUseCase [Não Iniciada ⏳]

**Arquivo**: `src/application/use-cases/goal/remove-amount-from-goal/RemoveAmountFromGoalUseCase.ts`
**Arquivo DTO**: `src/application/use-cases/goal/remove-amount-from-goal/RemoveAmountFromGoalDto.ts`

**Fluxo**:
1. **Autorização**: Verificar acesso ao Budget
2. **Buscar Goal**: Validar existência e estado ativo  
3. **Buscar Account**: Validar existência via sourceAccountId
4. **Validar Budget**: Goal e Account devem pertencer ao mesmo Budget
5. **Goal Domain**: Executar removeAmount() - libera reserva
6. **Unit of Work**: Executar transação atômica

**Dependências**: Similares ao AddAmountToGoalUseCase

### Modificar AddAmountToGoalDto [Não Iniciada ⏳]

**Arquivo**: `src/application/use-cases/goal/add-amount-to-goal/AddAmountToGoalDto.ts`
- Adicionar userId para autorização (se não existir)

## FASE 4: Endpoints e Controllers [Não Iniciada ⏳]

Implementar os endpoints HTTP seguindo o padrão REST/Command estabelecido no projeto.

### Modificar Goal Controller [Não Iniciada ⏳]

**Arquivo**: `src/interface/http/controllers/goal/GoalController.ts`
- Modificar endpoint `POST /goal/add-amount-to-goal` para usar novo Use Case
- Adicionar endpoint `POST /goal/remove-amount-from-goal`
- Implementar middleware de autenticação
- Implementar tratamento de erros específicos (InsufficientBalance, etc.)

### Validação de Requests [Não Iniciada ⏳]

- Validar schemas dos requests usando Zod (padrão do projeto)
- Implementar DTOs de request/response
- Validar tipos e formato dos dados de entrada

## FASE 5: Testes [Não Iniciada ⏳]

Implementar testes unitários e de integração seguindo os padrões estabelecidos no projeto.

### Testes Unitários - Domain [Não Iniciada ⏳]

- **Goal.spec.ts**: Testar novos métodos addAmount/removeAmount com sourceAccountId
- **Account.spec.ts**: Testar getAvailableBalance com cenários de reserva
- Testar invariantes de domínio e validações de business rules

### Testes Unitários - Use Cases [Não Iniciada ⏳]

- **AddAmountToGoalUseCase.spec.ts**: Cenários de sucesso e erro
- **RemoveAmountFromGoalUseCase.spec.ts**: Cenários de sucesso e erro  
- Mock de dependências (repositories, unit of works, auth service)
- Testar validações de autorização e business rules

### Testes de Integração [Não Iniciada ⏳]

- **Unit of Work Integration**: Testar transações atômicas
- **Repository Integration**: Testar queries e persistência
- **Controller Integration**: Testar endpoints end-to-end
- Usar banco de teste para cenários realísticos

## FASE 6: Configuração e Deploy [Não Iniciada ⏳]

Finalizar configurações necessárias para deploy e uso da funcionalidade.

### Dependency Injection [Não Iniciada ⏳]

**Arquivo**: Configuração de DI (verificar padrão do projeto)
- Registrar novos repositórios (IGetGoalsByAccountRepository)
- Registrar novos Unit of Works
- Configurar bindings das interfaces

### Validação Final [Não Iniciada ⏳]

- **Smoke Tests**: Testar cenários críticos no ambiente de desenvolvimento
- **Performance**: Verificar queries de Goals por Account
- **Error Handling**: Validar se todos os erros retornam Either adequadamente

### Documentação [Não Iniciada ⏳]

- Atualizar OpenAPI/Swagger se usado no projeto
- Documentar novos endpoints na documentação da API
- Atualizar README se necessário

---

## Notas de Implementação

### Dependências Sequenciais:
- **FASE 1 → FASE 2**: Agregados devem estar prontos antes dos repositórios
- **FASE 2 → FASE 3**: Infraestrutura deve estar pronta antes dos Use Cases  
- **FASE 3 → FASE 4**: Use Cases devem estar prontos antes dos controllers
- **FASE 1-4 → FASE 5**: Implementação deve estar completa antes dos testes
- **FASE 5 → FASE 6**: Testes devem passar antes do deploy

### Tarefas que Podem ser Paralelas:
- Dentro da FASE 1: Domain Errors podem ser implementados paralelamente aos agregados
- Dentro da FASE 2: Repositórios e Unit of Works podem ser desenvolvidos em paralelo
- Dentro da FASE 5: Testes unitários e de integração podem ser executados em paralelo

### Riscos e Mitigações:
- **Complexidade Unit of Work**: Usar padrão existente de transferência entre contas como referência
- **Performance Queries**: Implementar índices adequados para sourceAccountId
- **Concorrência**: Unit of Work deve gerenciar locks adequadamente
- **Rollback**: Testar cenários de rollback em Unit of Works

### Estimativas por Fase:
- **FASE 1**: 2h (modificações de domain são críticas)
- **FASE 2**: 2h (infraestrutura e persistência)  
- **FASE 3**: 2h (lógica de aplicação complexa)
- **FASE 4**: 1-2h (endpoints e validações)
- **FASE 5**: 2h (testes abrangentes necessários)
- **FASE 6**: 1h (configuração e validação final)

**Total Estimado**: 10-12h de desenvolvimento