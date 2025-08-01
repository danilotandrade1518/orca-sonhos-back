# UC031: Marcar Fatura como Paga - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC031 - Marcar Fatura como Paga
- **Priority**: Média
- **Complexity**: Baixa
- **Status**: Não Implementado
- **Domain**: CreditCardBill
- **Estimated Effort**: 1-2 dias

## 🎯 **Objetivo**
Permitir marcar uma fatura do cartão de crédito como paga, registrando o pagamento e atualizando o status da fatura, além de debitar o valor da conta de origem.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/credit-card-bill/value-objects/payment-amount/PaymentAmount.ts`
- [ ] `src/domain/aggregates/credit-card-bill/value-objects/payment-amount/PaymentAmount.spec.ts`
- [ ] `src/domain/aggregates/credit-card-bill/value-objects/payment-date/PaymentDate.ts`
- [ ] `src/domain/aggregates/credit-card-bill/value-objects/payment-date/PaymentDate.spec.ts`
- [ ] `src/domain/aggregates/credit-card-bill/events/CreditCardBillPaidEvent.ts`
- [ ] `src/domain/aggregates/credit-card-bill/enums/CreditCardBillStatus.ts` (adicionar PAID)
- [ ] Extensão: `src/domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill.ts` (método `markAsPaid()`)
- [ ] Testes: `src/domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/credit-card-bill/mark-bill-as-paid/MarkCreditCardBillAsPaidUseCase.ts`
- [ ] `src/application/use-cases/credit-card-bill/mark-bill-as-paid/MarkCreditCardBillAsPaidDto.ts`
- [ ] `src/application/use-cases/credit-card-bill/mark-bill-as-paid/MarkCreditCardBillAsPaidUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/credit-card-bill/IMarkCreditCardBillAsPaidRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **PaymentAmount Value Object**
```typescript
// Validações obrigatórias:
- Valor deve ser positivo
- Precisão de 2 casas decimais
- Não pode ser zero
- Deve ser numérico válido
```

### **PaymentDate Value Object**
```typescript
// Validações obrigatórias:
- Data não pode ser futura
- Data não pode ser anterior ao período da fatura
- Deve ser uma data válida
- Formato ISO 8601
```

### **CreditCardBillStatus Enum**
```typescript
// Adicionar ao enum existente:
PAID = 'PAID'
```

### **CreditCardBill.markAsPaid() Method**
```typescript
// Funcionalidade:
- Aceita valor do pagamento e data
- Valida se fatura pode ser paga (status OPEN)
- Atualiza status para PAID
- Registra data e valor do pagamento
- Dispara CreditCardBillPaidEvent
```

## 📋 **Use Case Specifications**

### **Input (MarkCreditCardBillAsPaidDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  creditCardBillId: string; // ID da fatura
  paymentAmount: number;    // Valor pago
  paymentDate: Date;        // Data do pagamento
  sourceAccountId: string;  // Conta de origem do pagamento
  description?: string;     // Descrição opcional
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Fatura deve existir e estar em aberto
- [ ] Valor do pagamento deve ser válido
- [ ] Data do pagamento deve ser válida
- [ ] Conta de origem deve existir e ter saldo suficiente
- [ ] Fatura deve pertencer ao orçamento

### **Fluxo Principal**
1. Validar autorização do usuário no orçamento
2. Buscar fatura do cartão
3. Validar se fatura pode ser paga
4. Buscar conta de origem
5. Validar saldo da conta
6. Marcar fatura como paga (domain)
7. Criar transação de débito na conta
8. Persistir alterações via Unit of Work
9. Publicar evento de pagamento
10. Retornar confirmação

### **Business Rules**
- [ ] Apenas faturas em aberto podem ser pagas
- [ ] Valor do pagamento deve ser positivo
- [ ] Data não pode ser futura
- [ ] Conta deve ter saldo suficiente
- [ ] Operação deve ser atômica (Unit of Work)

## 🚫 **Error Scenarios**
- [ ] `CreditCardBillNotFoundError` - Fatura não encontrada
- [ ] `CreditCardBillAlreadyPaidError` - Fatura já paga
- [ ] `InsufficientPermissionsError` - Usuário sem permissão
- [ ] `InvalidPaymentAmountError` - Valor de pagamento inválido
- [ ] `InvalidPaymentDateError` - Data de pagamento inválida
- [ ] `InsufficientBalanceError` - Saldo insuficiente na conta
- [ ] `AccountNotFoundError` - Conta de origem não encontrada

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] PaymentAmount com valores válidos
- [ ] PaymentAmount com valores inválidos (zero, negativo)
- [ ] PaymentDate com datas válidas
- [ ] PaymentDate com datas inválidas (futura, muito antiga)
- [ ] CreditCardBill.markAsPaid() com fatura válida
- [ ] CreditCardBill.markAsPaid() com fatura já paga (erro)

### **Use Case Tests**
- [ ] Pagamento bem-sucedido com dados válidos
- [ ] Falha por fatura não encontrada
- [ ] Falha por fatura já paga
- [ ] Falha por valor inválido
- [ ] Falha por data inválida
- [ ] Falha por saldo insuficiente
- [ ] Falha por falta de permissão

## 🔗 **Dependencies**
- ✅ CreditCardBill aggregate (já implementado)
- ✅ Account aggregate (para débito)
- ✅ Transaction aggregate (para criar transação)
- ✅ Budget authorization service
- ✅ Unit of Work pattern
- ✅ Event publisher

## 📊 **Acceptance Criteria**
- [ ] Usuário pode marcar fatura como paga informando valor e data
- [ ] Sistema valida se fatura pode ser paga
- [ ] Valor é debitado da conta de origem
- [ ] Status da fatura é atualizado para PAID
- [ ] Transação de débito é criada automaticamente
- [ ] Evento de pagamento é disparado
- [ ] Operação é atômica (falha tudo ou nada)

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
- Transação criada deve ter tipo EXPENSE e categoria "Pagamento Cartão"
- Descrição padrão: "Pagamento fatura cartão [Nome do Cartão]"
- Considerar validação de valor mínimo/máximo no futuro
- Implementar logs de auditoria para pagamentos
