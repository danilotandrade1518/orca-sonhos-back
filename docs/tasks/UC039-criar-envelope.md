# UC039: Criar Envelope - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC039 - Criar Envelope
- **Priority**: Baixa
- **Complexity**: Média
- **Status**: Não Implementado
- **Domain**: Envelope (Novo Domain)
- **Estimated Effort**: 2-3 dias

## 🎯 **Objetivo**
Permitir criar envelopes virtuais para organizar e controlar gastos por finalidade específica, implementando o método de orçamento por envelopes (envelope budgeting).

## 📁 **Arquivos a Implementar**

### **Domain Layer (Novo Aggregate)**
- [ ] `src/domain/aggregates/envelope/envelope-entity/Envelope.ts`
- [ ] `src/domain/aggregates/envelope/envelope-entity/Envelope.spec.ts`
- [ ] `src/domain/aggregates/envelope/value-objects/envelope-name/EnvelopeName.ts`
- [ ] `src/domain/aggregates/envelope/value-objects/envelope-name/EnvelopeName.spec.ts`
- [ ] `src/domain/aggregates/envelope/value-objects/monthly-allocation/MonthlyAllocation.ts`
- [ ] `src/domain/aggregates/envelope/value-objects/monthly-allocation/MonthlyAllocation.spec.ts`
- [ ] `src/domain/aggregates/envelope/value-objects/envelope-balance/EnvelopeBalance.ts`
- [ ] `src/domain/aggregates/envelope/value-objects/envelope-balance/EnvelopeBalance.spec.ts`
- [ ] `src/domain/aggregates/envelope/enums/EnvelopeStatus.ts`
- [ ] `src/domain/aggregates/envelope/events/EnvelopeCreatedEvent.ts`

### **Application Layer**
- [ ] `src/application/use-cases/envelope/create-envelope/CreateEnvelopeUseCase.ts`
- [ ] `src/application/use-cases/envelope/create-envelope/CreateEnvelopeDto.ts`
- [ ] `src/application/use-cases/envelope/create-envelope/CreateEnvelopeUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/envelope/ICreateEnvelopeRepository.ts`
- [ ] `src/application/contracts/repositories/envelope/IEnvelopeRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **Envelope Entity**
```typescript
// Propriedades principais:
- id: EnvelopeId
- budgetId: BudgetId
- name: EnvelopeName
- description?: string
- monthlyAllocation: MonthlyAllocation
- balance: EnvelopeBalance
- status: EnvelopeStatus
- associatedCategories: CategoryId[]
- createdAt: Date
- updatedAt: Date
```

### **EnvelopeName Value Object**
```typescript
// Validações obrigatórias:
- Nome obrigatório (mínimo 2 caracteres)
- Máximo 50 caracteres
- Deve ser único no orçamento
- Não permite apenas espaços
```

### **MonthlyAllocation Value Object**
```typescript
// Validações obrigatórias:
- Valor deve ser não-negativo
- Precisão de 2 casas decimais
- Pode ser zero (envelope sem alocação automática)
- Representa valor mensal destinado ao envelope
```

### **EnvelopeBalance Value Object**
```typescript
// Validações obrigatórias:
- Valor pode ser positivo, zero ou negativo
- Precisão de 2 casas decimais
- Representa saldo atual do envelope
- Atualizado com aportes e gastos
```

### **EnvelopeStatus Enum**
```typescript
enum EnvelopeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}
```

## 📋 **Use Case Specifications**

### **Input (CreateEnvelopeDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  name: string;             // Nome do envelope
  description?: string;     // Descrição opcional
  monthlyAllocation: number; // Valor mensal destinado
  associatedCategories?: string[]; // IDs das categorias associadas
  color?: string;           // Cor para identificação visual
  icon?: string;            // Ícone para identificação visual
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Nome deve ser válido e único no orçamento
- [ ] Valor mensal deve ser não-negativo
- [ ] Categorias associadas devem existir no orçamento
- [ ] Orçamento deve existir e estar ativo

### **Fluxo Principal**
1. Validar acesso do usuário ao orçamento
2. Validar dados do envelope
3. Verificar unicidade do nome no orçamento
4. Validar categorias associadas (se informadas)
5. Criar envelope com saldo inicial zero
6. Persistir envelope via Unit of Work
7. Publicar evento de criação
8. Retornar dados do envelope criado

### **Business Rules**
- [ ] Nome deve ser único no orçamento
- [ ] Saldo inicial é sempre zero
- [ ] Alocação mensal é opcional (pode ser zero)
- [ ] Pode ser associado a múltiplas categorias
- [ ] Status inicial é ACTIVE
- [ ] Operação atômica via Unit of Work

## 🚫 **Error Scenarios**
- [ ] `UnauthorizedAccessError` - Usuário sem acesso ao orçamento
- [ ] `BudgetNotFoundError` - Orçamento não encontrado
- [ ] `DuplicateEnvelopeNameError` - Nome já existe no orçamento
- [ ] `InvalidEnvelopeNameError` - Nome inválido
- [ ] `InvalidMonthlyAllocationError` - Valor mensal inválido
- [ ] `CategoryNotFoundError` - Categoria associada não encontrada
- [ ] `RequiredFieldError` - Campo obrigatório vazio

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] EnvelopeName com nomes válidos
- [ ] EnvelopeName com nomes inválidos (vazio, muito longo)
- [ ] MonthlyAllocation com valores válidos (zero, positivos)
- [ ] MonthlyAllocation com valores inválidos (negativos)
- [ ] EnvelopeBalance com diferentes valores
- [ ] Envelope.create() com dados válidos
- [ ] Envelope.create() com dados inválidos

### **Use Case Tests**
- [ ] Criação bem-sucedida com dados mínimos
- [ ] Criação bem-sucedida com todos os campos
- [ ] Criação com categorias associadas
- [ ] Falha por nome duplicado no orçamento
- [ ] Falha por nome inválido
- [ ] Falha por valor mensal inválido
- [ ] Falha por categoria não encontrada
- [ ] Falha por falta de acesso
- [ ] Falha por orçamento não encontrado

## 🔗 **Dependencies**
- ✅ Budget aggregate (já implementado)
- ✅ Category aggregate (para associações)
- ✅ Budget authorization service
- ✅ Unit of Work pattern
- ✅ Event publisher
- ❌ Novo domain Envelope (a ser criado)

## 📊 **Acceptance Criteria**
- [ ] Usuário pode criar envelope com nome único
- [ ] Envelope inicia com saldo zero
- [ ] Alocação mensal pode ser configurada
- [ ] Envelope pode ser associado a categorias
- [ ] Nome deve ser único no orçamento
- [ ] Evento de criação é disparado
- [ ] Envelope criado aparece na lista do orçamento
- [ ] Status inicial é ACTIVE

## 🚀 **Definition of Done**
- [ ] Novo domain Envelope implementado completamente
- [ ] Todos os value objects implementados e testados
- [ ] Use case implementado com validações completas
- [ ] Integração com Unit of Work funcionando
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Este é um novo domain, requer estrutura completa
- Envelope budgeting é método popular de controle financeiro
- Considerar cores e ícones para UI futura
- Implementar validação de limite total vs alocações
- Preparar base para operações futuras (aportes, gastos, transferências)
- Associação com categorias facilita automação futura
