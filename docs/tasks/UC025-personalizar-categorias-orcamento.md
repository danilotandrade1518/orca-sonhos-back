# UC025: Personalizar Categorias por Orçamento - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC025 - Personalizar Categorias por Orçamento
- **Priority**: Baixa
- **Complexity**: Média
- **Status**: Não Implementado
- **Domain**: Category + Budget
- **Estimated Effort**: 2 dias

## 🎯 **Objetivo**
Permitir que usuários administradores personalizem quais categorias estarão disponíveis em cada orçamento específico, criando categorias customizadas e habilitando/desabilitando categorias padrão.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/budget/value-objects/category-customization/CategoryCustomization.ts`
- [ ] `src/domain/aggregates/budget/value-objects/category-customization/CategoryCustomization.spec.ts`
- [ ] `src/domain/aggregates/budget/events/BudgetCategoriesCustomizedEvent.ts`
- [ ] `src/domain/aggregates/category/enums/CategoryScope.ts`
- [ ] Extensão: `src/domain/aggregates/budget/budget-entity/Budget.ts` (método `customizeCategories()`)
- [ ] Extensão: `src/domain/aggregates/category/category-entity/Category.ts` (escopo BUDGET_SPECIFIC)
- [ ] Testes: `src/domain/aggregates/budget/budget-entity/Budget.spec.ts`
- [ ] Testes: `src/domain/aggregates/category/category-entity/Category.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/budget/customize-categories/CustomizeBudgetCategoriesUseCase.ts`
- [ ] `src/application/use-cases/budget/customize-categories/CustomizeBudgetCategoriesDto.ts`
- [ ] `src/application/use-cases/budget/customize-categories/CustomizeBudgetCategoriesUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/budget/ICustomizeBudgetCategoriesRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **CategoryCustomization Value Object**
```typescript
// Validações obrigatórias:
- Lista de categorias habilitadas válida
- Lista de categorias desabilitadas válida
- Não pode ter conflito (mesma categoria em ambas)
- Pelo menos 1 categoria deve estar habilitada
```

### **CategoryScope Enum**
```typescript
enum CategoryScope {
  GLOBAL = 'GLOBAL',        // Categoria padrão do sistema
  BUDGET_SPECIFIC = 'BUDGET_SPECIFIC'  // Categoria específica do orçamento
}
```

### **Budget.customizeCategories() Method**
```typescript
// Funcionalidade:
- Aceita configuração de categorias personalizadas
- Valida se usuário é administrador
- Configura categorias habilitadas/desabilitadas
- Permite criar categorias específicas do orçamento
- Dispara BudgetCategoriesCustomizedEvent
```

### **Category Extensions**
```typescript
// Funcionalidade:
- Adicionar campo scope (GLOBAL/BUDGET_SPECIFIC)
- Adicionar budgetId para categorias específicas
- Validar se categoria pode ser usada no orçamento
```

## 📋 **Use Case Specifications**

### **Input (CustomizeBudgetCategoriesDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  enabledGlobalCategories: string[];   // IDs das categorias globais habilitadas
  disabledGlobalCategories: string[];  // IDs das categorias globais desabilitadas
  customCategories: {       // Categorias específicas do orçamento
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    type: CategoryType;
  }[];
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ser administrador do orçamento
- [ ] Orçamento deve existir
- [ ] Categorias globais referenciadas devem existir
- [ ] Não pode haver conflito entre habilitadas/desabilitadas
- [ ] Pelo menos 1 categoria deve ficar habilitada
- [ ] Nomes de categorias customizadas devem ser únicos no orçamento
- [ ] Categorias customizadas devem ter dados válidos

### **Fluxo Principal**
1. Validar autorização do usuário (administrador)
2. Buscar orçamento no repositório
3. Validar categorias globais referenciadas
4. Validar configuração (sem conflitos)
5. Criar categorias customizadas se informadas
6. Configurar personalização no orçamento
7. Persistir alterações via Unit of Work
8. Publicar evento de personalização
9. Retornar confirmação

### **Business Rules**
- [ ] Apenas administradores podem personalizar categorias
- [ ] Pelo menos 1 categoria deve ficar disponível
- [ ] Categorias customizadas são específicas do orçamento
- [ ] Configuração é por orçamento (não afeta outros)
- [ ] Transações existentes mantêm suas categorias
- [ ] Operação atômica via Unit of Work

## 🚫 **Error Scenarios**
- [ ] `InsufficientPermissionsError` - Usuário não é administrador
- [ ] `BudgetNotFoundError` - Orçamento não encontrado
- [ ] `CategoryNotFoundError` - Categoria global não encontrada
- [ ] `CategoryConfigurationConflictError` - Conflito na configuração
- [ ] `InvalidCustomCategoryError` - Dados inválidos para categoria customizada
- [ ] `DuplicateCustomCategoryNameError` - Nome duplicado para categoria customizada
- [ ] `NoCategoriesEnabledError` - Nenhuma categoria ficaria habilitada

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] CategoryCustomization com configurações válidas
- [ ] CategoryCustomization com conflitos (erro)
- [ ] Budget.customizeCategories() com dados válidos
- [ ] Budget.customizeCategories() por não-administrador (erro)
- [ ] Category com escopo BUDGET_SPECIFIC

### **Use Case Tests**
- [ ] Personalização bem-sucedida habilitando/desabilitando categorias
- [ ] Personalização bem-sucedida criando categorias customizadas
- [ ] Falha por usuário não-administrador
- [ ] Falha por orçamento não encontrado
- [ ] Falha por categoria global não encontrada
- [ ] Falha por conflito na configuração
- [ ] Falha por nenhuma categoria habilitada
- [ ] Falha por nome duplicado de categoria customizada

## 🔗 **Dependencies**
- ✅ Budget aggregate (já implementado)
- ✅ Category aggregate (já implementado)
- ✅ Budget authorization service
- ✅ Unit of Work pattern
- ✅ Event publisher

## 📊 **Acceptance Criteria**
- [ ] Administrador pode habilitar/desabilitar categorias globais
- [ ] Administrador pode criar categorias específicas do orçamento
- [ ] Configuração não afeta outros orçamentos
- [ ] Pelo menos 1 categoria sempre fica disponível
- [ ] Transações existentes mantêm suas categorias
- [ ] Evento de personalização é disparado
- [ ] Categorias customizadas são únicas por orçamento

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
- Categorias desabilitadas ficam ocultas mas não são excluídas
- Transações existentes não são afetadas
- Considerar migração de dados para categorias desabilitadas
- Implementar validação ao criar transações (categoria disponível)
- Interface deve mostrar apenas categorias habilitadas + customizadas
