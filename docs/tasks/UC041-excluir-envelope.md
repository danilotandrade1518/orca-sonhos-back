# UC041: Excluir Envelope - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC041 - Excluir Envelope
- **Priority**: Baixa
- **Complexity**: Média
- **Status**: Não Implementado
- **Domain**: Envelope
- **Estimated Effort**: 1.5 dias

## 🎯 **Objetivo**
Permitir excluir um envelope existente, verificando se pode ser removido (não possui transações ou saldo) ou se deve ser apenas marcado como inativo, mantendo integridade dos dados históricos.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] Extensão: `src/domain/aggregates/envelope/envelope-entity/Envelope.ts` (métodos `delete()` e `deactivate()`)
- [ ] `src/domain/aggregates/envelope/envelope-entity/EnvelopeStatus.ts` (enum)
- [ ] Testes: `src/domain/aggregates/envelope/envelope-entity/Envelope.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/envelope/delete-envelope/DeleteEnvelopeUseCase.ts`
- [ ] `src/application/use-cases/envelope/delete-envelope/DeleteEnvelopeDto.ts`
- [ ] `src/application/use-cases/envelope/delete-envelope/DeleteEnvelopeUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/envelope/IDeleteEnvelopeRepository.ts`
- [ ] Extensão: `src/application/contracts/repositories/transaction/ITransactionRepository.ts` (busca por envelope)

## 🧱 **Domain Objects Detalhados**

### **EnvelopeStatus Enum**
```typescript
// Estados possíveis do envelope:
enum EnvelopeStatus {
  ACTIVE = 'active',      // Envelope ativo e utilizável
  INACTIVE = 'inactive'   // Envelope desativado (soft delete)
}
```

### **Envelope Methods**
```typescript
// Envelope.delete() - Exclusão física
- Verifica se pode ser excluído (sem saldo/transações)
- Remove envelope permanentemente

// Envelope.deactivate() - Exclusão lógica
- Marca envelope como inativo
- Preserva dados históricos
```

## 📋 **Use Case Specifications**

### **Input (DeleteEnvelopeDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  envelopeId: string;       // ID do envelope
  forceDelete?: boolean;    // Força exclusão física (opcional, default: false)
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Envelope deve existir e pertencer ao orçamento
- [ ] Se forceDelete=false, verificar se envelope pode ser excluído
- [ ] Se forceDelete=true, permitir desativação

### **Fluxo Principal - Exclusão Física**
1. Validar acesso do usuário ao orçamento
2. Buscar envelope no repositório
3. Verificar se envelope pode ser excluído fisicamente:
   - Saldo deve ser zero
   - Não deve ter transações associadas
   - Não deve ter contribuições futuras agendadas
4. Excluir envelope (domain)
5. Remover do repositório via Unit of Work
7. Retornar confirmação

### **Fluxo Alternativo - Desativação**
1. Validar acesso do usuário ao orçamento
2. Buscar envelope no repositório
3. Se envelope possui saldo ou transações:
4. Desativar envelope (domain)
5. Atualizar status via Unit of Work
7. Retornar status de desativação

### **Business Rules**
- [ ] Envelope sem saldo e sem transações pode ser excluído fisicamente
- [ ] Envelope com saldo ou transações deve ser apenas desativado
- [ ] Envelope desativado não aparece em listagens padrão
- [ ] Envelope desativado preserva histórico para relatórios
- [ ] Exclusão física remove todas as referências
- [ ] Operação atômica via Unit of Work

## 🚫 **Error Scenarios**
- [ ] `EnvelopeNotFoundError` - Envelope não encontrado
- [ ] `UnauthorizedAccessError` - Usuário sem acesso ao orçamento
- [ ] `EnvelopeHasBalanceError` - Envelope possui saldo (para exclusão física)
- [ ] `EnvelopeHasTransactionsError` - Envelope possui transações (para exclusão física)
- [ ] `EnvelopeHasPendingContributionsError` - Envelope possui contribuições futuras

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] Envelope.delete() com envelope vazio (sem saldo/transações)
- [ ] Envelope.delete() com saldo positivo (erro)
- [ ] Envelope.delete() com transações associadas (erro)
- [ ] Envelope.deactivate() marca status como INACTIVE
- [ ] Envelope.deactivate() preserva dados existentes

### **Use Case Tests**
- [ ] Exclusão física bem-sucedida de envelope vazio
- [ ] Desativação bem-sucedida de envelope com saldo
- [ ] Desativação bem-sucedida de envelope com transações
- [ ] Falha por envelope não encontrado
- [ ] Falha por falta de acesso
- [ ] Falha por tentar excluir envelope com saldo
- [ ] Falha por tentar excluir envelope com transações
- [ ] forceDelete=false usa lógica inteligente (física vs desativação)
- [ ] forceDelete=true força desativação quando necessário

### **Integration Tests**
- [ ] Verificação de transações no repositório funciona
- [ ] Envelope desativado não aparece em GetActiveEnvelopes
- [ ] Envelope desativado aparece em relatórios históricos
- [ ] Exclusão física remove todas as referências

## 🔗 **Dependencies**
- ✅ Envelope aggregate (criado em UC039)
- ✅ Transaction repository (para verificar associações)
- ✅ Budget authorization service
- ✅ Unit of Work pattern

## 📊 **Acceptance Criteria**
- [ ] Envelope vazio pode ser excluído fisicamente
- [ ] Envelope com dados é desativado (soft delete)
- [ ] Usuário é informado sobre o tipo de exclusão realizada
- [ ] Dados históricos são preservados na desativação
- [ ] Envelope desativado não aparece em operações normais
- [ ] Relatórios históricos incluem envelopes desativados
- [ ] Operação é reversível (pode reativar envelope)
- [ ] Validações impedem perda de dados

## 🚀 **Definition of Done**
- [ ] EnvelopeStatus enum implementado
- [ ] Métodos delete() e deactivate() implementados
- [ ] Use case implementado com validações completas
- [ ] Verificação de transações funcionando
- [ ] Soft delete implementado corretamente
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Interface claramente informa tipo de exclusão

## 📝 **Notes**
- Sempre preferir desativação à exclusão física
- Considerar implementar reativação de envelopes
- Interface deve explicar diferença entre exclusão e desativação
- Relatórios devem poder incluir/excluir envelopes inativos
- Considerar impacto em metas e orçamentos ao desativar envelope
- Implementar auditoria para operações de exclusão/desativação
