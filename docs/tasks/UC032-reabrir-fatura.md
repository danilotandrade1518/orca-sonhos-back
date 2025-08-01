# UC032: Reabrir Fatura - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC032 - Reabrir Fatura
- **Priority**: Baixa
- **Complexity**: Baixa
- **Status**: Não Implementado
- **Domain**: CreditCardBill
- **Estimated Effort**: 1 dia

## 🎯 **Objetivo**
Permitir reabrir uma fatura que foi marcada como paga por engano, revertendo o pagamento e atualizando o status da fatura de volta para aberto.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/credit-card-bill/value-objects/reopening-justification/ReopeningJustification.ts`
- [ ] `src/domain/aggregates/credit-card-bill/value-objects/reopening-justification/ReopeningJustification.spec.ts`
- [ ] `src/domain/aggregates/credit-card-bill/events/CreditCardBillReopenedEvent.ts`
- [ ] Extensão: `src/domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill.ts` (método `reopen()`)
- [ ] Testes: `src/domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/credit-card-bill/reopen-bill/ReopenCreditCardBillUseCase.ts`
- [ ] `src/application/use-cases/credit-card-bill/reopen-bill/ReopenCreditCardBillDto.ts`
- [ ] `src/application/use-cases/credit-card-bill/reopen-bill/ReopenCreditCardBillUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/credit-card-bill/IReopenCreditCardBillRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **ReopeningJustification Value Object**
```typescript
// Validações obrigatórias:
- Texto obrigatório (mínimo 10 caracteres)
- Máximo 500 caracteres
- Não permite apenas espaços em branco
- Deve explicar motivo da reabertura
```

### **CreditCardBill.reopen() Method**
```typescript
// Funcionalidade:
- Aceita justificativa para reabertura
- Valida se fatura pode ser reaberta (status PAID)
- Valida prazo para reabertura (ex: 30 dias)
- Atualiza status para OPEN
- Remove dados de pagamento
- Dispara CreditCardBillReopenedEvent
```

## 📋 **Use Case Specifications**

### **Input (ReopenCreditCardBillDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  creditCardBillId: string; // ID da fatura
  justification: string;    // Justificativa para reabertura
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Fatura deve existir e estar paga
- [ ] Justificativa deve ser válida
- [ ] Reabertura deve estar dentro do prazo permitido
- [ ] Fatura deve pertencer ao orçamento
- [ ] Conta original deve existir

### **Fluxo Principal**
1. Validar autorização do usuário no orçamento
2. Buscar fatura do cartão
3. Validar se fatura pode ser reaberta
4. Validar prazo para reabertura
5. Buscar transação de pagamento original
6. Reabrir fatura (domain)
7. Estornar transação de pagamento
8. Persistir alterações via Unit of Work
9. Publicar evento de reabertura
10. Retornar confirmação

### **Business Rules**
- [ ] Apenas faturas pagas podem ser reabertas
- [ ] Prazo máximo de 30 dias após pagamento
- [ ] Justificativa é obrigatória
- [ ] Transação de pagamento deve ser estornada
- [ ] Operação deve ser atômica (Unit of Work)

## 🚫 **Error Scenarios**
- [ ] `CreditCardBillNotFoundError` - Fatura não encontrada
- [ ] `CreditCardBillNotPaidError` - Fatura não está paga
- [ ] `ReopeningPeriodExpiredError` - Prazo para reabertura expirado
- [ ] `InsufficientPermissionsError` - Usuário sem permissão
- [ ] `InvalidReopeningJustificationError` - Justificativa inválida
- [ ] `PaymentTransactionNotFoundError` - Transação de pagamento não encontrada

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] ReopeningJustification com textos válidos
- [ ] ReopeningJustification com textos inválidos
- [ ] CreditCardBill.reopen() com fatura paga válida
- [ ] CreditCardBill.reopen() com fatura não paga (erro)
- [ ] CreditCardBill.reopen() fora do prazo (erro)

### **Use Case Tests**
- [ ] Reabertura bem-sucedida com dados válidos
- [ ] Falha por fatura não encontrada
- [ ] Falha por fatura não paga
- [ ] Falha por prazo expirado
- [ ] Falha por justificativa inválida
- [ ] Falha por falta de permissão
- [ ] Falha por transação não encontrada

## 🔗 **Dependencies**
- ✅ CreditCardBill aggregate (já implementado)
- ✅ Account aggregate (para estorno)
- ✅ Transaction aggregate (para estornar pagamento)
- ✅ Budget authorization service
- ✅ Unit of Work pattern
- ✅ Event publisher

## 📊 **Acceptance Criteria**
- [ ] Usuário pode reabrir fatura paga com justificativa
- [ ] Sistema valida prazo para reabertura (30 dias)
- [ ] Status da fatura volta para OPEN
- [ ] Transação de pagamento é estornada
- [ ] Valor volta para a conta de origem
- [ ] Evento de reabertura é disparado
- [ ] Justificativa é registrada para auditoria

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
- Prazo de 30 dias pode ser configurável no futuro
- Estorno deve criar transação do tipo CREDIT
- Considerar limite de reaberturas por fatura
- Implementar logs de auditoria para reaberturas
- Validar se conta original ainda existe antes do estorno
