# UC015: Agendar Transação Futura - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC015 - Agendar Transação Futura
- **Priority**: Média
- **Complexity**: Média
- **Status**: Não Implementado
- **Domain**: Transaction
- **Estimated Effort**: 2-3 dias

## 🎯 **Objetivo**
Permitir que o usuário agende transações para serem executadas automaticamente em datas futuras, com opção de recorrência, facilitando o controle de gastos e receitas regulares.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/transaction/value-objects/scheduled-date/ScheduledDate.ts`
- [ ] `src/domain/aggregates/transaction/value-objects/scheduled-date/ScheduledDate.spec.ts`
- [ ] `src/domain/aggregates/transaction/value-objects/recurrence-pattern/RecurrencePattern.ts`
- [ ] `src/domain/aggregates/transaction/value-objects/recurrence-pattern/RecurrencePattern.spec.ts`
- [ ] `src/domain/aggregates/transaction/enums/TransactionStatus.ts` (adicionar SCHEDULED)
- [ ] `src/domain/aggregates/transaction/enums/RecurrenceType.ts`
- [ ] `src/domain/aggregates/transaction/events/TransactionScheduledEvent.ts`
- [ ] Extensão: `src/domain/aggregates/transaction/transaction-entity/Transaction.ts` (factory `createScheduled()`)
- [ ] Testes: `src/domain/aggregates/transaction/transaction-entity/Transaction.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/transaction/schedule-transaction/ScheduleTransactionUseCase.ts`
- [ ] `src/application/use-cases/transaction/schedule-transaction/ScheduleTransactionDto.ts`
- [ ] `src/application/use-cases/transaction/schedule-transaction/ScheduleTransactionUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/transaction/IScheduleTransactionRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **ScheduledDate Value Object**
```typescript
// Validações obrigatórias:
- Data deve ser futura (não no passado)
- Data deve ser válida (não aceitar datas impossíveis)
- Formato ISO 8601
- Considerar timezone do usuário
```

### **RecurrencePattern Value Object**
```typescript
// Validações obrigatórias:
- Tipo de recorrência válido (NONE, DAILY, WEEKLY, MONTHLY, YEARLY)
- Intervalo positivo (a cada X dias/semanas/meses)
- Data de fim da recorrência (opcional)
- Quantidade máxima de ocorrências (opcional)
```

### **RecurrenceType Enum**
```typescript
enum RecurrenceType {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}
```

### **TransactionStatus Enum (Extension)**
```typescript
// Adicionar ao enum existente:
SCHEDULED = 'SCHEDULED'
```

### **Transaction.createScheduled() Factory**
```typescript
// Funcionalidade:
- Aceita data futura e padrão de recorrência
- Valida se data é futura
- Cria transação com status SCHEDULED
- Configura agendamento e recorrência
- Dispara TransactionScheduledEvent
```

## 📋 **Use Case Specifications**

### **Input (ScheduleTransactionDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  accountId: string;        // ID da conta
  categoryId: string;       // ID da categoria
  amount: number;           // Valor da transação
  description: string;      // Descrição
  scheduledDate: string;    // Data de execução (futura)
  type: TransactionType;    // DEBIT ou CREDIT
  recurrenceType?: RecurrenceType; // Tipo de recorrência
  recurrenceInterval?: number;     // Intervalo (padrão 1)
  recurrenceEndDate?: string;      // Data fim da recorrência
  maxOccurrences?: number;         // Máximo de ocorrências
  tags?: string[];          // Tags opcionais
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Data agendada deve ser futura
- [ ] Conta deve existir e pertencer ao orçamento
- [ ] Categoria deve existir e pertencer ao orçamento
- [ ] Valor deve ser positivo
- [ ] Descrição obrigatória
- [ ] Tipo de transação válido
- [ ] Se recorrente, padrão deve ser válido

### **Fluxo Principal**
1. Validar autorização do usuário no orçamento
2. Validar data de agendamento (futura)
3. Buscar e validar conta
4. Buscar e validar categoria
5. Validar padrão de recorrência (se informado)
6. Criar transação agendada
7. Configurar sistema de execução automática
8. Persistir via Unit of Work
9. Publicar evento de agendamento
10. Retornar dados da transação agendada

### **Business Rules**
- [ ] Data deve ser futura (não passada)
- [ ] Recorrência é opcional (padrão NONE)
- [ ] Intervalo mínimo de recorrência: 1
- [ ] Data fim deve ser posterior à data inicial
- [ ] Máximo de 100 ocorrências por agendamento
- [ ] Operação atômica via Unit of Work

## 🚫 **Error Scenarios**
- [ ] `InvalidScheduledDateError` - Data não é futura
- [ ] `AccountNotFoundError` - Conta não encontrada
- [ ] `CategoryNotFoundError` - Categoria não encontrada
- [ ] `InsufficientPermissionsError` - Usuário sem permissão
- [ ] `InvalidAmountError` - Valor inválido
- [ ] `InvalidRecurrencePatternError` - Padrão de recorrência inválido
- [ ] `RequiredFieldError` - Campo obrigatório vazio

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] ScheduledDate com datas futuras válidas
- [ ] ScheduledDate com datas passadas (erro)
- [ ] RecurrencePattern com padrões válidos
- [ ] RecurrencePattern com padrões inválidos
- [ ] Transaction.createScheduled() com dados válidos
- [ ] Transaction.createScheduled() com data passada (erro)

### **Use Case Tests**
- [ ] Agendamento simples (sem recorrência) bem-sucedido
- [ ] Agendamento recorrente bem-sucedido
- [ ] Falha por data passada
- [ ] Falha por conta não encontrada
- [ ] Falha por categoria não encontrada
- [ ] Falha por padrão de recorrência inválido
- [ ] Falha por falta de permissão

## 🔗 **Dependencies**
- ✅ Transaction aggregate (já implementado)
- ✅ Account aggregate (já implementado)
- ✅ Category aggregate (já implementado)
- ✅ Budget authorization service
- ✅ Unit of Work pattern
- ✅ Event publisher
- ❌ Sistema de execução automática (scheduler)

## 📊 **Acceptance Criteria**
- [ ] Usuário pode agendar transações para datas futuras
- [ ] Sistema valida se data é futura
- [ ] Usuário pode configurar recorrência opcional
- [ ] Transação fica com status SCHEDULED
- [ ] Evento de agendamento é disparado
- [ ] Sistema programa execução automática
- [ ] Recorrência funciona conforme configurado

## 🚀 **Definition of Done**
- [ ] Todos os domain objects implementados e testados
- [ ] Use case implementado com validações completas
- [ ] Integração com Unit of Work funcionando
- [ ] Sistema de agendamento configurado
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Sistema de execução automática pode ser implementado posteriormente
- Considerar timezone do usuário para agendamentos
- Recorrências complexas podem ser expandidas no futuro
- Implementar logs de auditoria para agendamentos
- Validar conflitos com feriados/fins de semana
