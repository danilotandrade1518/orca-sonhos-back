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
- [x] `src/domain/aggregates/transaction/value-objects/cancellation-reason/CancellationReason.ts`
- [x] `src/domain/aggregates/transaction/value-objects/cancellation-reason/CancellationReason.spec.ts`
- [x] `src/domain/aggregates/transaction/events/ScheduledTransactionCancelledEvent.ts`
- [x] Extensão: `src/domain/aggregates/transaction/transaction-entity/Transaction.ts` (método `cancel()`)
- [x] Testes: `src/domain/aggregates/transaction/transaction-entity/Transaction.spec.ts`

### **Application Layer**
- [x] `src/application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionUseCase.ts`
- [x] `src/application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionDto.ts`
- [x] `src/application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionUseCase.spec.ts`

### **Contracts (Repositories)**
- [x] `src/application/contracts/repositories/transaction/ICancelScheduledTransactionRepository.ts`

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
- [x] Usuário deve ter acesso ao orçamento
- [x] Transação deve existir e estar agendada
- [x] Transação deve pertencer ao orçamento
- [x] Motivo do cancelamento deve ser válido
- [x] Transação não pode ter sido executada
- [x] Data de execução deve ser futura

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
- [x] Apenas transações SCHEDULED podem ser canceladas
- [x] Transação não pode ter sido executada
- [x] Data de execução deve ser futura
- [x] Motivo é obrigatório para auditoria
- [x] Cancelamento é irreversível
- [x] Operação atômica via Unit of Work

## 🚫 **Error Scenarios**
- [x] `ScheduledTransactionNotFoundError` - Transação não encontrada
- [x] `TransactionNotScheduledError` - Transação não está agendada
- [x] `TransactionAlreadyExecutedError` - Transação já foi executada
- [x] `InsufficientPermissionsError` - Usuário sem permissão
- [x] `InvalidCancellationReasonError` - Motivo inválido
- [x] `TransactionCannotBeCancelledError` - Transação não pode ser cancelada

## 🧪 **Test Cases**

### **Domain Tests**
- [x] CancellationReason com textos válidos
- [x] CancellationReason com textos inválidos
- [x] Transaction.cancel() com transação agendada válida
- [x] Transaction.cancel() com transação não agendada (erro)
- [x] Transaction.cancel() com transação já executada (erro)

### **Use Case Tests**
- [x] Cancelamento bem-sucedido com dados válidos
- [x] Falha por transação não encontrada
- [x] Falha por transação não agendada
- [x] Falha por transação já executada
- [x] Falha por motivo inválido
- [x] Falha por falta de permissão
- [x] Falha por data de execução passada

## 🔗 **Dependencies**
- ✅ Transaction aggregate (já implementado)
- ✅ Budget authorization service
- ✅ Unit of Work pattern
- ✅ Event publisher
- ✅ Transaction scheduling system

## 📊 **Acceptance Criteria**
- [x] Usuário pode cancelar transações agendadas
- [x] Sistema valida se transação está agendada
- [x] Transações executadas não podem ser canceladas
- [x] Motivo do cancelamento é obrigatório
- [x] Status muda para CANCELLED
- [x] Evento de cancelamento é disparado
- [x] Transação não será mais executada automaticamente

## 🚀 **Definition of Done**
- [x] Todos os domain objects implementados e testados
- [x] Use case implementado com validações completas
- [x] Integração com Unit of Work funcionando
- [x] Cobertura de testes > 90%
- [x] Documentação atualizada
- [x] Code review aprovado
- [x] Testes de integração passando
- [x] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Cancelamento é irreversível - considerar confirmação no frontend
- Implementar logs de auditoria para cancelamentos
- Considerar notificações para cancelamentos importantes
- Avaliar impacto em relatórios de transações futuras
- Transações recorrentes podem ter lógica específica
