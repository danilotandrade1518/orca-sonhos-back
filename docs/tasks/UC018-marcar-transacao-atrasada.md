# UC018: Marcar Transação como Atrasada - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC018 - Marcar Transação como Atrasada
- **Priority**: Baixa
- **Complexity**: Baixa
- **Status**: Não Implementado
- **Domain**: Transaction
- **Estimated Effort**: 1 dia

## 🎯 **Objetivo**
Permitir que o sistema marque automaticamente transações agendadas como atrasadas quando a data de execução passou e a transação não foi executada, facilitando o controle de pendências.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/transaction/enums/TransactionStatus.ts` (adicionar LATE)
- [ ] `src/domain/aggregates/transaction/events/TransactionMarkedAsLateEvent.ts`
- [ ] Extensão: `src/domain/aggregates/transaction/transaction-entity/Transaction.ts` (método `markAsLate()`)
- [ ] Testes: `src/domain/aggregates/transaction/transaction-entity/Transaction.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/transaction/mark-transaction-late/MarkTransactionLateUseCase.ts`
- [ ] `src/application/use-cases/transaction/mark-transaction-late/MarkTransactionLateDto.ts`
- [ ] `src/application/use-cases/transaction/mark-transaction-late/MarkTransactionLateUseCase.spec.ts`
- [ ] `src/application/services/transaction/TransactionSchedulerService.ts` (verificação automática)
- [ ] `src/application/services/transaction/TransactionSchedulerService.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/transaction/IMarkTransactionLateRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **TransactionStatus Enum (Extension)**
```typescript
// Adicionar ao enum existente:
LATE = 'LATE'
```

### **Transaction.markAsLate() Method**
```typescript
// Funcionalidade:
- Valida se transação pode ser marcada como atrasada (status SCHEDULED)
- Valida se data de execução já passou
- Atualiza status para LATE
- Registra data em que foi marcada como atrasada
- Dispara TransactionMarkedAsLateEvent
```

### **TransactionSchedulerService**
```typescript
// Funcionalidade:
- Busca transações agendadas com data vencida
- Marca automaticamente como atrasadas
- Executa verificação periódica (daily job)
- Coordena com sistema de notificações
```

## 📋 **Use Case Specifications**

### **Input (MarkTransactionLateDto)**
```typescript
{
  transactionId: string;    // ID da transação agendada
  lateDate?: Date;         // Data em que foi marcada como atrasada (padrão hoje)
}
```

### **Validações Obrigatórias**
- [ ] Transação deve existir e estar agendada (SCHEDULED)
- [ ] Data de execução deve ter passado
- [ ] Transação não pode ter sido executada ou cancelada
- [ ] Data de marcação como atrasada deve ser válida

### **Fluxo Principal**
1. Sistema executa verificação automática diária
2. Buscar transações agendadas com data vencida
3. Para cada transação encontrada:
   - Validar se pode ser marcada como atrasada
   - Marcar transação como atrasada (domain)
   - Persistir alteração
   - Publicar evento de atraso
4. Gerar relatório de transações marcadas como atrasadas

### **Business Rules**
- [ ] Apenas transações SCHEDULED podem ser marcadas como atrasadas
- [ ] Data de execução deve ter passado (hoje > data agendada)
- [ ] Transação não executada nem cancelada
- [ ] Verificação automática diária
- [ ] Notificação automática ao usuário responsável

## 🚫 **Error Scenarios**
- [ ] `TransactionNotScheduledError` - Transação não está agendada
- [ ] `TransactionNotOverdueError` - Data de execução ainda não passou
- [ ] `TransactionAlreadyExecutedError` - Transação já foi executada
- [ ] `TransactionAlreadyCancelledError` - Transação já foi cancelada
- [ ] `InvalidLateDateError` - Data de marcação inválida

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] Transaction.markAsLate() com transação agendada válida
- [ ] Transaction.markAsLate() com transação não agendada (erro)
- [ ] Transaction.markAsLate() com data não vencida (erro)
- [ ] Transaction.markAsLate() com transação já executada (erro)

### **Use Case Tests**
- [ ] Marcação automática bem-sucedida de transação vencida
- [ ] Falha por transação não agendada
- [ ] Falha por data não vencida
- [ ] Falha por transação já executada/cancelada
- [ ] Verificação automática com múltiplas transações

### **Service Tests**
- [ ] TransactionSchedulerService busca transações vencidas
- [ ] Service marca múltiplas transações como atrasadas
- [ ] Service não marca transações ainda não vencidas
- [ ] Service gera relatório de transações processadas

## 🔗 **Dependencies**
- ✅ Transaction aggregate (já implementado)
- ✅ Event publisher
- ❌ Sistema de notificações (pode ser stub inicial)
- ❌ Scheduler para execução automática diária

## 📊 **Acceptance Criteria**
- [ ] Sistema marca automaticamente transações vencidas como atrasadas
- [ ] Verificação executa diariamente de forma automática
- [ ] Status muda de SCHEDULED para LATE
- [ ] Evento de atraso é disparado
- [ ] Data de marcação é registrada
- [ ] Usuário é notificado sobre transações atrasadas
- [ ] Transações atrasadas aparecem em relatórios específicos

## 🚀 **Definition of Done**
- [ ] Extensão do enum TransactionStatus implementada
- [ ] Método markAsLate() implementado e testado
- [ ] Use case implementado com validações completas
- [ ] TransactionSchedulerService implementado
- [ ] Sistema de verificação automática configurado
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Verificação automática pode ser implementada com cron job
- Considerar timezone do usuário para cálculo de atraso
- Transações atrasadas podem ser executadas posteriormente
- Implementar logs de auditoria para marcações automáticas
- Sistema de notificações pode ser expandido no futuro
