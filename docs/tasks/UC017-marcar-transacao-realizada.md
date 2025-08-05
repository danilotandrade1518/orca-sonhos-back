# UC017: Marcar Transação como Realizada - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC017 - Marcar Transação como Realizada
- **Priority**: Média
- **Complexity**: Baixa
- **Status**: Não Implementado
- **Domain**: Transaction
- **Estimated Effort**: 1 dia

## 🎯 **Objetivo**
Permitir que o usuário marque uma transação agendada como executada/realizada, atualizando o status e aplicando os efeitos da transação no saldo da conta.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/transaction/value-objects/execution-date/ExecutionDate.ts`
- [ ] `src/domain/aggregates/transaction/value-objects/execution-date/ExecutionDate.spec.ts`
- [ ] `src/domain/aggregates/transaction/enums/TransactionStatus.ts` (adicionar EXECUTED)
- [ ] Extensão: `src/domain/aggregates/transaction/transaction-entity/Transaction.ts` (método `markAsExecuted()`)
- [ ] Testes: `src/domain/aggregates/transaction/transaction-entity/Transaction.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/transaction/mark-transaction-executed/MarkTransactionExecutedUseCase.ts`
- [ ] `src/application/use-cases/transaction/mark-transaction-executed/MarkTransactionExecutedDto.ts`
- [ ] `src/application/use-cases/transaction/mark-transaction-executed/MarkTransactionExecutedUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/transaction/IMarkTransactionExecutedRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **ExecutionDate Value Object**
```typescript
// Validações obrigatórias:
- Data não pode ser futura
- Data deve ser válida
- Formato ISO 8601
- Data deve ser igual ou posterior à data agendada
```

### **TransactionStatus Enum (Extension)**
```typescript
// Adicionar ao enum existente:
EXECUTED = 'EXECUTED'
```

### **Transaction.markAsExecuted() Method**
```typescript
// Funcionalidade:
- Aceita data de execução
- Valida se transação pode ser executada (status SCHEDULED)
- Valida se data de execução é válida
- Atualiza status para EXECUTED
- Registra data de execução
```

## 📋 **Use Case Specifications**

### **Input (MarkTransactionExecutedDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  transactionId: string;    // ID da transação agendada
  executionDate?: Date;     // Data de execução (padrão hoje)
  notes?: string;           // Observações opcionais
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Transação deve existir e estar agendada (SCHEDULED)
- [ ] Transação deve pertencer ao orçamento
- [ ] Data de execução deve ser válida (não futura)
- [ ] Data deve ser igual ou posterior à data agendada
- [ ] Conta deve ter saldo suficiente (para DEBIT)

### **Fluxo Principal**
1. Validar acesso do usuário ao orçamento
2. Buscar transação agendada
3. Validar se transação pode ser executada
4. Validar data de execução
5. Buscar conta para aplicar transação
6. Validar saldo suficiente (se DEBIT)
7. Marcar transação como executada (domain)
8. Aplicar transação no saldo da conta
9. Persistir alterações via Unit of Work
10. Retornar confirmação

### **Business Rules**
- [ ] Apenas transações SCHEDULED podem ser executadas
- [ ] Data de execução não pode ser anterior à data agendada
- [ ] Data de execução não pode ser futura
- [ ] Conta deve ter saldo suficiente para débitos
- [ ] Execução atualiza saldo imediatamente
- [ ] Operação atômica via Unit of Work

## 🚫 **Error Scenarios**
- [ ] `ScheduledTransactionNotFoundError` - Transação não encontrada
- [ ] `TransactionNotScheduledError` - Transação não está agendada
- [ ] `TransactionAlreadyExecutedError` - Transação já foi executada
- [ ] `InvalidExecutionDateError` - Data de execução inválida
- [ ] `InsufficientBalanceError` - Saldo insuficiente para débito
- [ ] `UnauthorizedAccessError` - Usuário sem acesso ao orçamento
- [ ] `AccountNotFoundError` - Conta não encontrada

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] ExecutionDate com datas válidas (passado/presente)
- [ ] ExecutionDate com datas futuras (erro)
- [ ] Transaction.markAsExecuted() com transação agendada válida
- [ ] Transaction.markAsExecuted() com transação não agendada (erro)
- [ ] Transaction.markAsExecuted() com transação já executada (erro)

### **Use Case Tests**
- [ ] Execução bem-sucedida de transação agendada (CREDIT)
- [ ] Execução bem-sucedida de transação agendada (DEBIT)
- [ ] Falha por transação não encontrada
- [ ] Falha por transação não agendada
- [ ] Falha por transação já executada
- [ ] Falha por data de execução inválida
- [ ] Falha por saldo insuficiente
- [ ] Falha por falta de acesso

## 🔗 **Dependencies**
- ✅ Transaction aggregate (já implementado)
- ✅ Account aggregate (para aplicar no saldo)
- ✅ Budget authorization service
- ✅ Unit of Work pattern
- ❌ UC015 (Agendar Transação) deve estar implementado

## 📊 **Acceptance Criteria**
- [ ] Usuário pode executar transações agendadas
- [ ] Sistema valida se transação está agendada
- [ ] Data de execução é validada e registrada
- [ ] Saldo da conta é atualizado imediatamente
- [ ] Status muda para EXECUTED
- [ ] Validação de saldo suficiente para débitos
- [ ] Transação executada não pode ser executada novamente

## 🚀 **Definition of Done**
- [ ] Todos os domain objects implementados e testados
- [ ] Use case implementado com validações completas
- [ ] Integração com Account para atualização de saldo
- [ ] Integração com Unit of Work funcionando
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Data de execução padrão é a data atual
- Considerar timezone do usuário
- Implementar logs de auditoria para execuções
- Validar se conta ainda existe antes da execução
- Considerar notificações para execuções automáticas futuras
