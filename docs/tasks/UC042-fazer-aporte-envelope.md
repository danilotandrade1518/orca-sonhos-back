# UC042: Fazer Aporte no Envelope - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC042 - Fazer Aporte no Envelope
- **Priority**: Média
- **Complexity**: Média
- **Status**: Não Implementado
- **Domain**: Envelope
- **Estimated Effort**: 2 dias

## 🎯 **Objetivo**
Permitir fazer aportes manuais ou automáticos em um envelope, aumentando seu saldo disponível e registrando a operação para controle e histórico, integrando com o sistema de transações.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/envelope/value-objects/EnvelopeContribution.ts`
- [ ] `src/domain/aggregates/envelope/value-objects/ContributionSource.ts`
- [ ] `src/domain/aggregates/envelope/events/EnvelopeContributionMadeEvent.ts`
- [ ] Extensão: `src/domain/aggregates/envelope/envelope-entity/Envelope.ts` (método `makeContribution()`)
- [ ] Testes: `src/domain/aggregates/envelope/envelope-entity/Envelope.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/envelope/make-contribution/MakeEnvelopeContributionUseCase.ts`
- [ ] `src/application/use-cases/envelope/make-contribution/MakeEnvelopeContributionDto.ts`
- [ ] `src/application/use-cases/envelope/make-contribution/MakeEnvelopeContributionUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] Extensão: `src/application/contracts/repositories/envelope/IEnvelopeRepository.ts` (atualizar saldo)

## 🧱 **Domain Objects Detalhados**

### **EnvelopeContribution Value Object**
```typescript
// Propriedades:
- amount: Money (valor do aporte)
- source: ContributionSource (origem do aporte)
- description: string (descrição opcional)
- contributedAt: Date (data do aporte)
- contributionId: string (ID único da contribuição)
```

### **ContributionSource Enum**
```typescript
enum ContributionSource {
  MANUAL = 'manual',           // Aporte manual pelo usuário
  MONTHLY_ALLOCATION = 'monthly_allocation',  // Alocação mensal automática
  GOAL_TRANSFER = 'goal_transfer',           // Transferência de meta
  BUDGET_SURPLUS = 'budget_surplus',         // Sobra do orçamento
  EXTERNAL_TRANSFER = 'external_transfer'    // Transferência externa
}
```

### **Envelope.makeContribution() Method**
```typescript
// Funcionalidade:
- Valida valor do aporte (deve ser positivo)
- Cria EnvelopeContribution
- Adiciona ao histórico de contribuições
- Atualiza saldo atual do envelope
- Dispara EnvelopeContributionMadeEvent
```

## 📋 **Use Case Specifications**

### **Input (MakeEnvelopeContributionDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  envelopeId: string;       // ID do envelope
  amount: number;           // Valor do aporte
  source: string;           // Origem do aporte (ContributionSource)
  description?: string;     // Descrição opcional
  sourceAccountId?: string; // ID da conta origem (se aplicável)
  sourceTransactionId?: string; // ID da transação origem (se aplicável)
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Envelope deve existir e estar ativo
- [ ] Valor deve ser positivo
- [ ] Source deve ser válido (enum ContributionSource)
- [ ] Se sourceAccountId informado, conta deve existir e ter saldo suficiente
- [ ] Se sourceTransactionId informado, transação deve existir

### **Fluxo Principal**
1. Validar autorização do usuário no orçamento
2. Buscar envelope no repositório
3. Validar dados do aporte
4. Verificar conta origem (se informada)
5. Criar contribuição no envelope (domain)
6. Criar transação relacionada (se necessário)
7. Atualizar saldos via Unit of Work
8. Publicar evento de contribuição
9. Retornar detalhes da contribuição

### **Business Rules**
- [ ] Valor da contribuição deve ser positivo
- [ ] Envelope deve estar ativo para receber aportes
- [ ] Aportes manuais requerem conta origem válida
- [ ] Aportes automáticos (alocação mensal) não requerem conta origem
- [ ] Histórico de contribuições é mantido para auditoria
- [ ] Operação atômica via Unit of Work
- [ ] Saldo do envelope é atualizado imediatamente

## 🚫 **Error Scenarios**
- [ ] `EnvelopeNotFoundError` - Envelope não encontrado
- [ ] `InactiveEnvelopeError` - Envelope inativo
- [ ] `InsufficientPermissionsError` - Usuário sem permissão
- [ ] `InvalidContributionAmountError` - Valor inválido (zero ou negativo)
- [ ] `InvalidContributionSourceError` - Origem inválida
- [ ] `AccountNotFoundError` - Conta origem não encontrada
- [ ] `InsufficientBalanceError` - Saldo insuficiente na conta origem
- [ ] `TransactionNotFoundError` - Transação origem não encontrada

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] EnvelopeContribution criado com dados válidos
- [ ] EnvelopeContribution com valor inválido (erro)
- [ ] Envelope.makeContribution() atualiza saldo corretamente
- [ ] Envelope.makeContribution() adiciona ao histórico
- [ ] Envelope.makeContribution() dispara evento correto
- [ ] ContributionSource enum com valores corretos

### **Use Case Tests**
- [ ] Aporte manual bem-sucedido com conta origem
- [ ] Aporte automático bem-sucedido (alocação mensal)
- [ ] Aporte com transferência de meta bem-sucedido
- [ ] Falha por envelope não encontrado
- [ ] Falha por envelope inativo
- [ ] Falha por valor inválido
- [ ] Falha por origem inválida
- [ ] Falha por conta origem não encontrada
- [ ] Falha por saldo insuficiente
- [ ] Falha por falta de permissão

### **Integration Tests**
- [ ] Saldo do envelope é persistido corretamente
- [ ] Transação relacionada é criada quando necessário
- [ ] Saldo da conta origem é decrementado
- [ ] Evento é publicado para listeners
- [ ] Histórico de contribuições é mantido

## 🔗 **Dependencies**
- ✅ Envelope aggregate (criado em UC039)
- ✅ Account aggregate (para validar conta origem)
- ✅ Transaction aggregate (para criar transação relacionada)
- ✅ Money value object
- ✅ Budget authorization service
- ✅ Unit of Work pattern
- ✅ Event publisher

## 📊 **Acceptance Criteria**
- [ ] Usuário pode fazer aporte manual informando conta origem
- [ ] Sistema pode fazer aportes automáticos (alocação mensal)
- [ ] Saldo do envelope é atualizado imediatamente
- [ ] Conta origem tem saldo decrementado (se aplicável)
- [ ] Histórico de contribuições é mantido
- [ ] Transação relacionada é criada quando necessário
- [ ] Eventos são disparados para integração
- [ ] Validações impedem aportes inválidos

## 🚀 **Definition of Done**
- [ ] EnvelopeContribution value object implementado
- [ ] ContributionSource enum implementado
- [ ] Método makeContribution() implementado no Envelope
- [ ] Use case implementado com validações completas
- [ ] Integração com contas e transações funcionando
- [ ] Histórico de contribuições implementado
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem impacto negativo em funcionalidades existentes

## 📝 **Notes**
- Aportes automáticos (alocação mensal) devem ser executados por job/scheduler
- Considerar limite máximo para aportes (configurável)
- Interface deve mostrar histórico de contribuições
- Implementar validação de conciliação entre envelope e conta
- Considerar categorização de aportes para relatórios
- Permitir estorno de aportes (caso de uso futuro)
