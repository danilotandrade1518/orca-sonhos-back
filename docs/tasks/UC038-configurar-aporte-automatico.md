# UC038: Configurar Aporte Automático - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC038 - Configurar Aporte Automático
- **Priority**: Média
- **Complexity**: Média
- **Status**: Não Implementado
- **Domain**: Goal
- **Estimated Effort**: 2-3 dias

## 🎯 **Objetivo**
Permitir configurar aportes automáticos recorrentes para uma meta financeira, automatizando o processo de economia e facilitando o alcance dos objetivos financeiros.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/goal/value-objects/automatic-contribution/AutomaticContribution.ts`
- [ ] `src/domain/aggregates/goal/value-objects/automatic-contribution/AutomaticContribution.spec.ts`
- [ ] `src/domain/aggregates/goal/value-objects/contribution-frequency/ContributionFrequency.ts`
- [ ] `src/domain/aggregates/goal/value-objects/contribution-frequency/ContributionFrequency.spec.ts`
- [ ] `src/domain/aggregates/goal/enums/FrequencyType.ts`
- [ ] `src/domain/aggregates/goal/events/AutomaticContributionConfiguredEvent.ts`
- [ ] Extensão: `src/domain/aggregates/goal/goal-entity/Goal.ts` (método `configureAutomaticContribution()`)
- [ ] Testes: `src/domain/aggregates/goal/goal-entity/Goal.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/goal/configure-automatic-contribution/ConfigureAutomaticContributionUseCase.ts`
- [ ] `src/application/use-cases/goal/configure-automatic-contribution/ConfigureAutomaticContributionDto.ts`
- [ ] `src/application/use-cases/goal/configure-automatic-contribution/ConfigureAutomaticContributionUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/goal/IConfigureAutomaticContributionRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **AutomaticContribution Value Object**
```typescript
// Validações obrigatórias:
- Valor deve ser positivo
- Precisão de 2 casas decimais
- Não pode ser zero
- Frequência deve ser válida
- Data de início deve ser futura ou presente
```

### **ContributionFrequency Value Object**
```typescript
// Validações obrigatórias:
- Tipo de frequência válido (MONTHLY, WEEKLY, BIWEEKLY, QUARTERLY)
- Dia da execução válido (1-31 para mensal, 1-7 para semanal)
- Intervalo positivo (a cada X períodos)
- Data de próxima execução calculada automaticamente
```

### **FrequencyType Enum**
```typescript
enum FrequencyType {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY'
}
```

### **Goal.configureAutomaticContribution() Method**
```typescript
// Funcionalidade:
- Aceita configuração de aporte automático
- Valida se meta está ativa
- Configura valor, frequência e conta de origem
- Calcula próxima data de execução
- Dispara AutomaticContributionConfiguredEvent
```

## 📋 **Use Case Specifications**

### **Input (ConfigureAutomaticContributionDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  goalId: string;           // ID da meta
  contributionAmount: number; // Valor do aporte
  frequencyType: FrequencyType; // Tipo de frequência
  executionDay: number;     // Dia de execução (1-31 ou 1-7)
  sourceAccountId: string;  // Conta de origem dos aportes
  startDate: string;        // Data de início (ISO 8601)
  endDate?: string;         // Data de fim opcional
  isActive: boolean;        // Se está ativo
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Meta deve existir e estar ativa
- [ ] Valor do aporte deve ser positivo
- [ ] Frequência deve ser válida
- [ ] Conta de origem deve existir e pertencer ao orçamento
- [ ] Data de início não pode ser passada
- [ ] Dia de execução deve ser válido para a frequência

### **Fluxo Principal**
1. Validar autorização do usuário no orçamento
2. Buscar meta no repositório
3. Validar se meta está ativa
4. Buscar e validar conta de origem
5. Validar configuração de aporte automático
6. Configurar aporte automático na meta (domain)
7. Calcular próxima data de execução
8. Persistir configuração via Unit of Work
9. Publicar evento de configuração
10. Retornar confirmação com próximas datas

### **Business Rules**
- [ ] Meta deve estar ativa para configurar aportes
- [ ] Apenas uma configuração automática por meta
- [ ] Conta de origem deve ter saldo na execução
- [ ] Configuração pode ser pausada/retomada
- [ ] Aportes param quando meta é atingida
- [ ] Operação atômica via Unit of Work

## 🚫 **Error Scenarios**
- [ ] `GoalNotFoundError` - Meta não encontrada
- [ ] `GoalNotActiveError` - Meta não está ativa
- [ ] `InsufficientPermissionsError` - Usuário sem permissão
- [ ] `InvalidContributionAmountError` - Valor inválido
- [ ] `InvalidFrequencyConfigurationError` - Configuração de frequência inválida
- [ ] `AccountNotFoundError` - Conta de origem não encontrada
- [ ] `InvalidStartDateError` - Data de início inválida
- [ ] `AutomaticContributionAlreadyConfiguredError` - Já existe configuração

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] AutomaticContribution com valores válidos
- [ ] AutomaticContribution com valores inválidos (zero, negativo)
- [ ] ContributionFrequency com diferentes tipos
- [ ] ContributionFrequency com dias inválidos para frequência
- [ ] Goal.configureAutomaticContribution() com meta ativa
- [ ] Goal.configureAutomaticContribution() com meta inativa (erro)

### **Use Case Tests**
- [ ] Configuração bem-sucedida com frequência mensal
- [ ] Configuração bem-sucedida com frequência semanal
- [ ] Falha por meta não encontrada
- [ ] Falha por meta inativa
- [ ] Falha por valor inválido
- [ ] Falha por conta não encontrada
- [ ] Falha por configuração já existente
- [ ] Falha por data de início passada

## 🔗 **Dependencies**
- ✅ Goal aggregate (já implementado)
- ✅ Account aggregate (para validar conta origem)
- ✅ Budget authorization service
- ✅ Unit of Work pattern
- ✅ Event publisher
- ❌ Sistema de execução automática (scheduler)

## 📊 **Acceptance Criteria**
- [ ] Usuário pode configurar aportes automáticos para metas
- [ ] Sistema valida conta de origem e valor
- [ ] Diferentes frequências são suportadas (semanal, mensal, etc.)
- [ ] Data de próxima execução é calculada automaticamente
- [ ] Configuração pode ser ativada/desativada
- [ ] Evento de configuração é disparado
- [ ] Sistema programa execução automática futura
- [ ] Aportes param quando meta é atingida

## 🚀 **Definition of Done**
- [ ] Todos os domain objects implementados e testados
- [ ] Use case implementado com validações completas
- [ ] Integração com Unit of Work funcionando
- [ ] Sistema de cálculo de próximas datas funcionando
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Sistema de execução automática pode ser implementado posteriormente
- Considerar timezone do usuário para execução
- Aportes automáticos param quando meta é atingida
- Implementar logs de auditoria para configurações
- Permitir edição/cancelamento de configurações futuras
