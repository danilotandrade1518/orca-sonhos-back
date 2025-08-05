# UC012: Reconciliar Saldo - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC012 - Reconciliar Saldo
- **Priority**: Média
- **Complexity**: Baixa
- **Status**: Não Implementado
- **Domain**: Account
- **Estimated Effort**: 1-2 dias

## 🎯 **Objetivo**
Permitir ajustar o saldo da conta baseado no extrato bancário real, criando uma transação de reconciliação quando há diferença entre o saldo sistema e saldo real.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/account/value-objects/reconciliation-amount/ReconciliationAmount.ts`
- [ ] `src/domain/aggregates/account/value-objects/reconciliation-amount/ReconciliationAmount.spec.ts`
- [ ] `src/domain/aggregates/account/value-objects/reconciliation-justification/ReconciliationJustification.ts`
- [ ] `src/domain/aggregates/account/value-objects/reconciliation-justification/ReconciliationJustification.spec.ts`
- [ ] Extensão: `src/domain/aggregates/account/account-entity/Account.ts` (método `reconcile()`)
- [ ] Testes: `src/domain/aggregates/account/account-entity/Account.spec.ts` (casos de reconciliação)

### **Application Layer**
- [ ] `src/application/use-cases/account/reconcile-account/ReconcileAccountUseCase.ts`
- [ ] `src/application/use-cases/account/reconcile-account/ReconcileAccountDto.ts`
- [ ] `src/application/use-cases/account/reconcile-account/ReconcileAccountUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/account/IReconcileAccountRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **ReconciliationAmount Value Object**
```typescript
// Validações obrigatórias:
- Valor deve ser numérico
- Pode ser positivo ou negativo
- Não pode ser zero (se for zero, não há o que reconciliar)
- Precisão de 2 casas decimais
```

### **ReconciliationJustification Value Object**
```typescript
// Validações obrigatórias:
- Texto obrigatório (mínimo 10 caracteres)
- Máximo 500 caracteres
- Não permite apenas espaços em branco
```

### **Account.reconcile() Method**
```typescript
// Funcionalidade:
- Aceita valor real da conta e justificativa
- Calcula diferença entre saldo atual e valor real
- Cria transação de ajuste se houver diferença
- Atualiza saldo da conta
```

## 📋 **Use Case Specifications**

### **Input (ReconcileAccountDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento  
  accountId: string;        // ID da conta
  realBalance: number;      // Saldo real da conta
  justification: string;    // Justificativa da reconciliação
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Conta deve existir no orçamento
- [ ] Saldo real deve ser diferente do saldo atual
- [ ] Justificativa deve ser válida
- [ ] Diferença deve ser significativa (> 0.01)

### **Fluxo Principal**
1. Validar acesso do usuário ao orçamento
2. Buscar conta no repositório
3. Calcular diferença entre saldo atual e real
4. Validar se reconciliação é necessária
5. Executar reconciliação no domain
6. Persistir alterações
7. Retornar confirmação

### **Business Rules**
- [ ] Apenas contas ativas podem ser reconciliadas
- [ ] Diferença mínima de R$ 0,01 para reconciliação
- [ ] Histórico de reconciliações deve ser mantido
- [ ] Transação de ajuste deve ser claramente identificada

## 🚫 **Error Scenarios**
- [ ] `AccountNotFoundError` - Conta não encontrada
- [ ] `UnauthorizedAccessError` - Usuário sem acesso ao orçamento
- [ ] `InvalidReconciliationAmountError` - Valor inválido
- [ ] `ReconciliationNotNecessaryError` - Saldos já conferem
- [ ] `AccountRepositoryError` - Erro de persistência

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] ReconciliationAmount com valores válidos
- [ ] ReconciliationAmount com valores inválidos
- [ ] ReconciliationJustification com textos válidos
- [ ] ReconciliationJustification com textos inválidos
- [ ] Account.reconcile() com diferença positiva
- [ ] Account.reconcile() com diferença negativa
- [ ] Account.reconcile() sem diferença (erro)

### **Use Case Tests**
- [ ] Reconciliação bem-sucedida com diferença positiva
- [ ] Reconciliação bem-sucedida com diferença negativa
- [ ] Falha por conta inexistente
- [ ] Falha por falta de acesso
- [ ] Falha por valor inválido
- [ ] Falha por justificativa inválida

## 🔗 **Dependencies**
- ✅ Account aggregate (já implementado)
- ✅ Budget authorization service (já implementado)
- ✅ Transaction aggregate (para criar ajuste)

## 📊 **Acceptance Criteria**
- [ ] Usuário pode reconciliar conta informando saldo real
- [ ] Sistema calcula automaticamente a diferença
- [ ] Transação de ajuste é criada quando necessário
- [ ] Saldo da conta é atualizado corretamente
- [ ] Justificativa é obrigatória e válida
- [ ] Histórico de reconciliações é mantido

## 🚀 **Definition of Done**
- [ ] Todos os domain objects implementados e testados
- [ ] Use case implementado com validações completas
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Reconciliação deve criar transação do tipo ADJUSTMENT
- Diferenças pequenas (< R$ 0,01) devem ser ignoradas
- Justificativa será útil para auditoria posterior
- Considerar limite de reconciliações por período no futuro
