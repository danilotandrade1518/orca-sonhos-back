# UC016: Registrar Transação Passada - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC016 - Registrar Transação Passada
- **Priority**: Média
- **Complexity**: Baixa
- **Status**: Não Implementado
- **Domain**: Transaction
- **Estimated Effort**: 0.5 dia

## 🎯 **Objetivo**
Permitir que o usuário registre transações que já aconteceram em datas passadas, como gastos esquecidos ou receitas não registradas, mantendo o histórico financeiro completo.

## 📁 **Arquivos a Implementar**

### **Application Layer**
- [ ] `src/application/use-cases/transaction/register-past-transaction/RegisterPastTransactionUseCase.ts`
- [ ] `src/application/use-cases/transaction/register-past-transaction/RegisterPastTransactionDto.ts`
- [ ] `src/application/use-cases/transaction/register-past-transaction/RegisterPastTransactionUseCase.spec.ts`

### **Domain Layer (Extensions)**
- [ ] Extensão: `src/domain/aggregates/transaction/transaction-entity/Transaction.ts` (factory para transações passadas)
- [ ] Testes: `src/domain/aggregates/transaction/transaction-entity/Transaction.spec.ts`

## 🧱 **Domain Objects Detalhados**

### **Transaction Factory Method**
```typescript
// Funcionalidade:
- Transaction.createPastTransaction()
- Aceita data no passado
- Valida limite máximo (ex: 1 ano)
- Não permite data futura
- Aplica mesmas validações de transação normal
```

## 📋 **Use Case Specifications**

### **Input (RegisterPastTransactionDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  accountId: string;        // ID da conta
  categoryId: string;       // ID da categoria
  amount: number;           // Valor da transação
  description: string;      // Descrição
  transactionDate: string;  // Data da transação (passada)
  type: TransactionType;    // DEBIT ou CREDIT
  tags?: string[];          // Tags opcionais
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Data deve estar no passado
- [ ] Data não pode ser anterior a 1 ano
- [ ] Conta deve existir e pertencer ao orçamento
- [ ] Categoria deve existir e pertencer ao orçamento
- [ ] Valor deve ser positivo
- [ ] Descrição obrigatória
- [ ] Tipo de transação válido

### **Fluxo Principal**
1. Validar acesso do usuário ao orçamento
2. Validar data da transação (passado, dentro do limite)
3. Buscar e validar conta
4. Buscar e validar categoria
5. Criar transação com data passada
6. Aplicar transação na conta (atualizar saldo)
7. Persistir via Unit of Work
8. Retornar dados da transação

### **Business Rules**
- [ ] Data máxima no passado: 1 ano
- [ ] Não permite data futura
- [ ] Aplicação imediata no saldo da conta
- [ ] Mesmas validações de transação normal
- [ ] Operação atômica via Unit of Work

## 🚫 **Error Scenarios**
- [ ] `InvalidTransactionDateError` - Data inválida (futura ou muito antiga)
- [ ] `AccountNotFoundError` - Conta não encontrada
- [ ] `CategoryNotFoundError` - Categoria não encontrada
- [ ] `UnauthorizedAccessError` - Usuário sem acesso ao orçamento
- [ ] `InvalidAmountError` - Valor inválido
- [ ] `RequiredFieldError` - Campo obrigatório vazio

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] Transaction.createPastTransaction() com data válida (passada)
- [ ] Transaction.createPastTransaction() com data futura (erro)
- [ ] Transaction.createPastTransaction() com data muito antiga (erro)
- [ ] Transaction.createPastTransaction() com dados válidos

### **Use Case Tests**
- [ ] Registro bem-sucedido com data passada válida
- [ ] Falha por data futura
- [ ] Falha por data muito antiga (> 1 ano)
- [ ] Falha por conta não encontrada
- [ ] Falha por categoria não encontrada
- [ ] Falha por valor inválido
- [ ] Falha por falta de acesso
- [ ] Verificação de aplicação no saldo da conta

## 🔗 **Dependencies**
- ✅ Transaction aggregate (já implementado)
- ✅ Account aggregate (já implementado)
- ✅ Category aggregate (já implementado)
- ✅ Budget authorization service
- ✅ Unit of Work pattern

## 📊 **Acceptance Criteria**
- [ ] Usuário pode registrar transações com data passada
- [ ] Sistema valida limite de 1 ano no passado
- [ ] Data futura é rejeitada
- [ ] Transação é aplicada no saldo atual da conta
- [ ] Transação aparece no histórico com data correta
- [ ] Validações normais são aplicadas

## 🚀 **Definition of Done**
- [ ] Factory method para transações passadas implementado
- [ ] Use case implementado com validações completas
- [ ] Integração com Unit of Work funcionando
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Limite de 1 ano pode ser configurável no futuro
- Considerar validação de feriados/fins de semana
- Implementar logs de auditoria para transações passadas
- Avaliar impacto em relatórios históricos
- Transação passada não afeta transações agendadas futuras
