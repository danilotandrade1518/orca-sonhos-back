# UC033: Controlar Limite do Cartão - Implementation Checklist

## 📋 **Informações Gerais**
- **Use Case**: UC033 - Controlar Limite do Cartão
- **Priority**: Média
- **Complexity**: Baixa-Média
- **Status**: Não Implementado
- **Domain**: CreditCard
- **Estimated Effort**: 1-2 dias

## 🎯 **Objetivo**
Monitorar automaticamente o uso do limite do cartão de crédito, enviando alertas quando se aproxima do limite configurado e bloqueando transações se necessário.

## 📁 **Arquivos a Implementar**

### **Domain Layer**
- [ ] `src/domain/aggregates/credit-card/value-objects/limit-usage/LimitUsage.ts`
- [ ] `src/domain/aggregates/credit-card/value-objects/limit-usage/LimitUsage.spec.ts`
- [ ] `src/domain/aggregates/credit-card/value-objects/limit-threshold/LimitThreshold.ts`
- [ ] `src/domain/aggregates/credit-card/value-objects/limit-threshold/LimitThreshold.spec.ts`
- [ ] `src/domain/aggregates/credit-card/events/CreditCardLimitWarningEvent.ts`
- [ ] `src/domain/aggregates/credit-card/events/CreditCardLimitExceededEvent.ts`
- [ ] Extensão: `src/domain/aggregates/credit-card/credit-card-entity/CreditCard.ts` (métodos de controle de limite)
- [ ] Testes: `src/domain/aggregates/credit-card/credit-card-entity/CreditCard.spec.ts`

### **Application Layer**
- [ ] `src/application/use-cases/credit-card/check-limit-usage/CheckCreditCardLimitUsageUseCase.ts`
- [ ] `src/application/use-cases/credit-card/check-limit-usage/CheckCreditCardLimitUsageDto.ts`
- [ ] `src/application/use-cases/credit-card/check-limit-usage/CheckCreditCardLimitUsageUseCase.spec.ts`
- [ ] `src/application/use-cases/credit-card/configure-limit-alerts/ConfigureLimitAlertsUseCase.ts`
- [ ] `src/application/use-cases/credit-card/configure-limit-alerts/ConfigureLimitAlertsDto.ts`
- [ ] `src/application/use-cases/credit-card/configure-limit-alerts/ConfigureLimitAlertsUseCase.spec.ts`

### **Contracts (Repositories)**
- [ ] `src/application/contracts/repositories/credit-card/ICheckCreditCardLimitRepository.ts`

## 🧱 **Domain Objects Detalhados**

### **LimitUsage Value Object**
```typescript
// Validações obrigatórias:
- Valor usado deve ser não-negativo
- Valor não pode exceder limite total configurado
- Percentual é calculado automaticamente
- Precisão de 2 casas decimais para valores
```

### **LimitThreshold Value Object**
```typescript
// Validações obrigatórias:
- Threshold deve estar entre 0 e 100 (percentual)
- Alertas padrão: 80% e 95%
- Usuário pode personalizar thresholds
- Pelo menos 1 threshold deve estar configurado
```

### **CreditCard Extensions**
```typescript
// Métodos adicionais:
- calculateLimitUsage(): calcula uso atual do limite
- checkLimitThresholds(): verifica se passou dos thresholds
- isLimitExceeded(): verifica se limite foi excedido
- configureAlertThresholds(): configura alertas personalizados
- validateTransaction(): valida se transação pode ser feita
```

## 📋 **Use Case Specifications**

### **Input (CheckCreditCardLimitUsageDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  creditCardId: string;     // ID do cartão
}
```

### **Input (ConfigureLimitAlertsDto)**
```typescript
{
  userId: string;           // ID do usuário
  budgetId: string;         // ID do orçamento
  creditCardId: string;     // ID do cartão
  warningThreshold: number; // % para alerta (ex: 80)
  criticalThreshold: number; // % para alerta crítico (ex: 95)
  blockWhenExceeded: boolean; // Bloquear quando exceder
}
```

### **Validações Obrigatórias**
- [ ] Usuário deve ter acesso ao orçamento
- [ ] Cartão deve existir e pertencer ao orçamento
- [ ] Thresholds devem estar entre 0-100
- [ ] Threshold crítico deve ser maior que warning
- [ ] Cartão deve ter limite configurado

### **Fluxo Principal (CheckLimitUsage)**
1. Validar autorização do usuário no orçamento
2. Buscar cartão de crédito
3. Calcular uso atual do limite
4. Verificar thresholds configurados
5. Disparar alertas se necessário
6. Retornar status do limite

### **Fluxo Principal (ConfigureLimitAlerts)**
1. Validar autorização do usuário no orçamento
2. Buscar cartão de crédito
3. Validar thresholds informados
4. Configurar alertas no cartão
5. Persistir configuração
6. Retornar confirmação

### **Business Rules**
- [ ] Alertas padrão em 80% e 95% do limite
- [ ] Usuário pode personalizar thresholds
- [ ] Cálculo baseado em transações da fatura atual
- [ ] Verificação automática a cada transação
- [ ] Bloqueio opcional quando limite excedido
- [ ] Histórico de alertas é mantido

## 🚫 **Error Scenarios**
- [ ] `CreditCardNotFoundError` - Cartão não encontrado
- [ ] `InsufficientPermissionsError` - Usuário sem permissão
- [ ] `InvalidThresholdError` - Threshold inválido (fora de 0-100)
- [ ] `ThresholdOrderError` - Critical menor que warning
- [ ] `NoLimitConfiguredError` - Cartão sem limite configurado
- [ ] `InvalidLimitUsageError` - Erro no cálculo de uso

## 🧪 **Test Cases**

### **Domain Tests**
- [ ] LimitUsage com valores válidos
- [ ] LimitUsage com valores inválidos (negativos)
- [ ] LimitThreshold com percentuais válidos (0-100)
- [ ] LimitThreshold com percentuais inválidos
- [ ] CreditCard.calculateLimitUsage() com transações
- [ ] CreditCard.checkLimitThresholds() com diferentes cenários
- [ ] CreditCard.configureAlertThresholds() com thresholds válidos

### **Use Case Tests**
- [ ] Verificação de limite bem-sucedida (abaixo dos thresholds)
- [ ] Verificação com alerta de warning (80%)
- [ ] Verificação com alerta crítico (95%)
- [ ] Verificação com limite excedido
- [ ] Configuração de alertas bem-sucedida
- [ ] Falha por cartão não encontrado
- [ ] Falha por thresholds inválidos
- [ ] Falha por falta de permissão

## 🔗 **Dependencies**
- ✅ CreditCard aggregate (já implementado)
- ✅ Transaction aggregate (para calcular uso)
- ✅ Budget authorization service
- ✅ Event publisher
- ❌ Sistema de notificações (para alertas)

## 📊 **Acceptance Criteria**
- [ ] Sistema monitora uso do limite automaticamente
- [ ] Alertas em 80% e 95% por padrão
- [ ] Usuário pode personalizar thresholds
- [ ] Eventos são disparados quando thresholds são atingidos
- [ ] Cálculo baseado na fatura atual
- [ ] Bloqueio opcional quando limite excedido
- [ ] Histórico de alertas é mantido

## 🚀 **Definition of Done**
- [ ] Todos os domain objects implementados e testados
- [ ] Use cases implementados com validações completas
- [ ] Integração com sistema de eventos funcionando
- [ ] Cálculo de limite funcionando corretamente
- [ ] Cobertura de testes > 90%
- [ ] Documentação atualizada
- [ ] Code review aprovado
- [ ] Testes de integração passando
- [ ] Sem breaking changes em APIs existentes

## 📝 **Notes**
- Verificação deve ser automática a cada transação
- Considerar diferentes tipos de limite (mensal, total)
- Implementar cache para cálculos frequentes
- Alertas podem ser enviados por email/push no futuro
- Considerar limite pré-autorizado vs disponível
