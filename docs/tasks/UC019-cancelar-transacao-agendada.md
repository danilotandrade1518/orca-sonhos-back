# UC019: Cancelar Transação Agendada - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC019 - Cancelar Transação Agendada
- **Priority**: Média
- **Complexity**: Baixa
- **Status**: Não Implementado
- **Domain**: Transaction
- **Estimated Effort**: 0.5 dia

## 🎯 **Objetivo**
Permitir que o usuário cancele transações que foram agendadas para datas futuras, removendo-as do sistema antes que sejam executadas automaticamente.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/transaction/value-objects/cancellation-reason/CancellationReason.ts`
- [ ] `src/domain/aggregates/transaction/value-objects/cancellation-reason/CancellationReason.spec.ts`
- [ ] `src/domain/aggregates/transaction/events/ScheduledTransactionCancelledEvent.ts`
- [ ] Extensão: `src/domain/aggregates/transaction/transaction-entity/Transaction.ts` (método `cancel()`)
- [ ] Testes: `src/domain/aggregates/transaction/transaction-entity/Transaction.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionUseCase.ts`
- [ ] `src/application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionDto.ts`
- [ ] `src/application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/transaction/ICancelScheduledTransactionRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **CancellationReason Value Object**
```typescript
// Validações obrigatórias:
- Texto obrigatório (mínimo 3 caracteres)
- Máximo 200 caracteres
- Não permite apenas espaços em branco
- Motivos comuns: "Mudança de planos", "Cancelamento de compra", etc.
```

### **Transaction.cancel() Method**
```typescript
// Funcionalidade:
- Aceita motivo do cancelamento
- Valida se transação pode ser cancelada (SCHEDULED status)
- Valida se não foi executada ainda
- Atualiza status para CANCELLED
- Registra data e motivo do cancelamento
- Dispara ScheduledTransactionCancelledEvent
```

## 📋 **Use Case Specifications**

### **Input (CancelScheduledTransactionDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  transactionId: string;    // ID da transação agendada
  cancellationReason: string; // Motivo do cancelamento
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Transação deve existir e estar agendada
- [ ] Transação deve pertencer ao orçamento
- [ ] Motivo do cancelamento deve ser válido
- [ ] Transação não pode ter sido executada
- [ ] Data de execução deve ser futura

### **Fluxo Principal**
1. Validar autorização do usuário no orçamento
2. Buscar transação agendada
3. Validar se transação pode ser cancelada
4. Validar motivo do cancelamento
5. Cancelar transação (domain)
6. Persistir alterações via Unit of Work
7. Publicar evento de cancelamento
8. Retornar confirmação

### **Business Rules**
- [ ] Apenas transações SCHEDULED podem ser canceladas
- [ ] Transação não pode ter sido executada
- [ ] Data de execução deve ser futura
- [ ] Motivo é obrigatório para auditoria
- [ ] Cancelamento é irreversível
- [ ] Operação atômica via Unit of Work

## 🚫 **Error Scenarios**
- [ ] `ScheduledTransactionNotFoundError` - Transação não encontrada
- [ ] `TransactionNotScheduledError` - Transação não está agendada
- [ ] `TransactionAlreadyExecutedError` - Transação já foi executada
- [ ] `InsufficientPermissionsError` - Usuário sem permissão
- [ ] `InvalidCancellationReasonError` - Motivo inválido
- [ ] `TransactionCannotBeCancelledError` - Transação não pode ser cancelada

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] CancellationReason com textos válidos
- [ ] CancellationReason com textos inválidos
- [ ] Transaction.cancel() com transação agendada válida
- [ ] Transaction.cancel() com transação não agendada (erro)
- [ ] Transaction.cancel() com transação já executada (erro)

### **Use Case Tests**
- [ ] Cancelamento bem-sucedido com dados válidos
- [ ] Falha por transação não encontrada
- [ ] Falha por transação não agendada
- [ ] Falha por transação já executada
- [ ] Falha por motivo inválido
- [ ] Falha por falta de permissão
- [ ] Falha por data de execução passada

## 🔗 **Dependencies**
- ✅ Transaction aggregate (já implementado)
- ✅ Budget authorization service
- ✅ Unit of Work pattern
- ✅ Event publisher
- ✅ Transaction scheduling system

## 📊 **Acceptance Criteria**
- [ ] Usuário pode cancelar transações agendadas
- [ ] Sistema valida se transação está agendada
- [ ] Transações executadas não podem ser canceladas
- [ ] Motivo do cancelamento é obrigatório
- [ ] Status muda para CANCELLED
- [ ] Evento de cancelamento é disparado
- [ ] Transação não será mais executada automaticamente

## 🚀 **Definition of Done**
- [ ] Todos os domain objects implementados e testados
- [ ] Use case implementado com validações completas
- [ ] Integração com Unit of Work funcionando
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Cancelamento é irreversível - considerar confirmação no frontend
- Implementar logs de auditoria para cancelamentos
- Considerar notificações para cancelamentos importantes
- Avaliar impacto em relatórios de transações futuras
- Transações recorrentes podem ter lógica específica
