# UC040: Editar Envelope - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC040 - Editar Envelope
- **Priority**: Baixa
- **Complexity**: Baixa
- **Status**: Não Implementado
- **Domain**: Envelope
- **Estimated Effort**: 1 dia

## 🎯 **Objetivo**
Permitir editar configurações de um envelope existente, como nome, descrição, alocação mensal e categorias associadas, mantendo a flexibilidade do sistema de envelope budgeting.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] Extensão: `src/domain/aggregates/envelope/envelope-entity/Envelope.ts` (método `update()`)
- [ ] Testes: `src/domain/aggregates/envelope/envelope-entity/Envelope.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/envelope/update-envelope/UpdateEnvelopeUseCase.ts`
- [ ] `src/application/use-cases/envelope/update-envelope/UpdateEnvelopeDto.ts`
- [ ] `src/application/use-cases/envelope/update-envelope/UpdateEnvelopeUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/envelope/IUpdateEnvelopeRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **Envelope.update() Method**
```typescript
// Funcionalidade:
- Aceita novos dados para atualização
- Valida se nome continua único no orçamento
- Atualiza propriedades modificáveis
- Preserva saldo atual e histórico
```

### **Campos Editáveis**
```typescript
// Propriedades que podem ser editadas:
- name: EnvelopeName (deve manter unicidade)
- description: string (opcional)
- monthlyAllocation: MonthlyAllocation
- associatedCategories: CategoryId[]
- color: string (opcional)
- icon: string (opcional)
```

## 📋 **Use Case Specifications**

### **Input (UpdateEnvelopeDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  envelopeId: string;       // ID do envelope
  name?: string;            // Novo nome (opcional)
  description?: string;     // Nova descrição (opcional)
  monthlyAllocation?: number; // Nova alocação mensal (opcional)
  associatedCategories?: string[]; // Novas categorias associadas (opcional)
  color?: string;           // Nova cor (opcional)
  icon?: string;            // Novo ícone (opcional)
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Envelope deve existir e pertencer ao orçamento
- [ ] Se nome informado, deve ser único no orçamento
- [ ] Se alocação mensal informada, deve ser não-negativa
- [ ] Se categorias informadas, devem existir no orçamento
- [ ] Pelo menos um campo deve ser informado para atualização

### **Fluxo Principal**
1. Validar acesso do usuário ao orçamento
2. Buscar envelope no repositório
3. Validar dados informados para atualização
4. Verificar unicidade do nome (se alterado)
5. Validar categorias associadas (se alteradas)
6. Atualizar envelope (domain)
7. Persistir alterações via Unit of Work
9. Retornar dados atualizados do envelope

### **Business Rules**
- [ ] Nome deve ser único no orçamento (se alterado)
- [ ] Saldo do envelope não é alterado na edição
- [ ] Histórico de transações é preservado
- [ ] Alocação mensal pode ser zero (envelope sem alocação automática)
- [ ] Categorias associadas podem ser removidas/adicionadas
- [ ] Operação atômica via Unit of Work

## 🚫 **Error Scenarios**
- [ ] `EnvelopeNotFoundError` - Envelope não encontrado
- [ ] `UnauthorizedAccessError` - Usuário sem acesso ao orçamento
- [ ] `DuplicateEnvelopeNameError` - Nome já existe no orçamento
- [ ] `InvalidEnvelopeNameError` - Nome inválido
- [ ] `InvalidMonthlyAllocationError` - Alocação mensal inválida
- [ ] `CategoryNotFoundError` - Categoria associada não encontrada
- [ ] `NoFieldsToUpdateError` - Nenhum campo informado para atualização

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] Envelope.update() com nome válido e único
- [ ] Envelope.update() com nome duplicado (erro)
- [ ] Envelope.update() com alocação mensal válida
- [ ] Envelope.update() com alocação mensal inválida (erro)
- [ ] Envelope.update() preserva saldo e histórico
- [ ] Envelope.update() com categorias válidas

### **Use Case Tests**
- [ ] Atualização bem-sucedida apenas do nome
- [ ] Atualização bem-sucedida apenas da alocação mensal
- [ ] Atualização bem-sucedida de múltiplos campos
- [ ] Atualização bem-sucedida das categorias associadas
- [ ] Falha por envelope não encontrado
- [ ] Falha por nome duplicado
- [ ] Falha por alocação mensal inválida
- [ ] Falha por categoria não encontrada
- [ ] Falha por nenhum campo informado
- [ ] Falha por falta de acesso

## 🔗 **Dependencies**
- ✅ Envelope aggregate (criado em UC039)
- ✅ Category aggregate (para validar associações)
- ✅ Budget authorization service
- ✅ Unit of Work pattern

## 📊 **Acceptance Criteria**
- [ ] Usuário pode editar nome do envelope (mantendo unicidade)
- [ ] Usuário pode alterar alocação mensal
- [ ] Usuário pode modificar categorias associadas
- [ ] Saldo atual do envelope é preservado
- [ ] Histórico de transações é mantido
- [ ] Validações impedem dados inválidos
- [ ] Pelo menos um campo deve ser alterado

## 🚀 **Definition of Done**
- [ ] Método update() implementado no Envelope entity
- [ ] Use case implementado com validações completas
- [ ] Integração com Unit of Work funcionando
- [ ] Validação de unicidade de nome funcionando
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Edição não afeta saldo ou histórico do envelope
- Nome deve permanecer único dentro do orçamento
- Categorias associadas podem ser completamente alteradas
- Considerar validação de conflitos com configurações automáticas
- Interface deve mostrar claramente campos obrigatórios vs opcionais
