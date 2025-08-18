# ADR-0003: Escolha da biblioteca EventEmitter2 para implementação de Domain Events

## Status

✅ **Aceito** (7 de janeiro de 2025)

## Contexto

Com a evolução do projeto OrçaSonhos, identificamos a necessidade de implementar Domain Events para permitir comunicação desacoplada entre agregados. O sistema possui múltiplas invariantes de negócio que cruzam boundaries de agregados, como:

- Atualização de saldo de conta quando uma transação é criada
- Consumo de envelope de orçamento quando uma despesa é registrada
- Atualização de progresso de metas baseado em transações
- Criação de transação de pagamento quando fatura de cartão é paga

### Requisitos Identificados

- **Comunicação desacoplada** entre agregados
- **Implementação inicial simples** (in-process)
- **TypeScript support** nativo
- **Evolutivo** para soluções mais robustas no futuro
- **Testabilidade** e facilidade de debugging
- **Performance** adequada para MVP

## Decisão

Decidimos utilizar a biblioteca **EventEmitter2** para implementação dos Domain Events no OrçaSonhos.

## Alternativas Consideradas

### 1. EventEmitter2 ⭐⭐⭐⭐⭐ (ESCOLHIDA)

- **Pros**: Wildcards, namespaces, TypeScript nativo, zero dependencies, familiar
- **Cons**: Limitado a single process
- **Adequação**: Perfeita para MVP e pode evoluir

### 2. Node.js EventEmitter (Nativo) ⭐⭐⭐

- **Pros**: Zero dependencies, performance, bem conhecido
- **Cons**: Limitado (sem wildcards/namespaces), TypeScript support básico
- **Adequação**: Muito básico para nossas necessidades

### 3. @nestjs/cqrs ⭐⭐⭐⭐

- **Pros**: CQRS completo, decorators, type-safe
- **Cons**: Dependency do NestJS (usamos Express), mais pesado
- **Adequação**: Overkill para nossa arquitetura atual

### 4. Implementação Custom ⭐⭐⭐

- **Pros**: Controle total, learning experience
- **Cons**: Tempo de desenvolvimento, necessita testes extensivos, reinventar a roda
- **Adequação**: Não justifica o esforço

## Justificativa

### Por que EventEmitter2?

#### 1. **Funcionalidades Avançadas**

```typescript
// Wildcards para capturar grupos de eventos
emitter.on('Transaction.*', transactionAuditHandler);
emitter.on('*.Created', creationAuditHandler);

// Namespaces organizados por agregado
emitter.on('Budget.EnvelopeConsumed', budgetHandler);
emitter.on('Account.BalanceUpdated', notificationHandler);
```

#### 2. **TypeScript Support Excelente**

```typescript
// Type safety nativo
const emitter = new EventEmitter2();
emitter.on('TransactionCreatedEvent', (event: TransactionCreatedEvent) => {
  // event é tipado corretamente
});
```

#### 3. **Configuração Flexível**

```typescript
const emitter = new EventEmitter2({
  wildcard: true, // Habilita wildcards
  delimiter: '.', // Separador para namespaces
  maxListeners: 20, // Controle de memory leaks
  verboseMemoryLeak: true, // Alertas de vazamentos
});
```

#### 4. **Migration Path Clara**

A abstração via interfaces permite evolução futura:

```typescript
// Atual: EventEmitter2
export class EventEmitter2Publisher implements IEventPublisher

// Futuro: AWS SQS
export class SQSEventPublisher implements IEventPublisher

// Futuro: RabbitMQ
export class RabbitMQEventPublisher implements IEventPublisher
```

## Implementação

### Arquitetura de Domain Events

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Aggregates    │    │   Use Cases     │    │ Event Handlers  │
│                 │    │                 │    │                 │
│ - Accumulate    │───▶│ - Orchestrate   │───▶│ - Handle        │
│   Events        │    │ - Publish       │    │   Side-effects  │
│                 │    │   Events        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Domain Events   │    │ IEventPublisher │    │ EventEmitter2   │
│                 │    │                 │    │                 │
│ - Domain Data   │    │ - Interface     │    │ - Concrete      │
│ - Immutable     │    │ - Abstraction   │    │   Implementation│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Fluxo de Execução

1. **Agregado** gera Domain Event durante operação de negócio
2. **Use Case** persiste mudanças no repositório
3. **Use Case** publica eventos via `IEventPublisher`
4. **EventEmitter2Publisher** usa EventEmitter2 para notificar handlers
5. **Event Handlers** executam side-effects de forma assíncrona

## Consequências

### ✅ Positivas

- **Desacoplamento**: Agregados não conhecem uns aos outros
- **Testabilidade**: Fácil de mockar e testar eventos
- **Flexibilidade**: Novos handlers podem ser adicionados facilmente
- **Organizacão**: Wildcards e namespaces organizam eventos logicamente
- **Performance**: EventEmitter2 é rápido e leve
- **Debugging**: Fluxo síncrono facilita debugging inicial

### ⚠️ Limitações Conhecidas

- **Single Process**: Limitado a uma instância da aplicação
- **Sem Persistência**: Eventos são perdidos se aplicação falhar
- **Memory**: Todos os handlers executam no mesmo processo
- **Eventual Consistency**: Pode haver inconsistências temporárias

### 🔮 Plano de Evolução

#### Fase 1 (Atual): EventEmitter2 In-Process

- Implementação simples e direta
- Handlers síncronos
- Sem persistência de eventos

#### Fase 2 (Futuro): Event Store

```typescript
// Adicionar persistência de eventos
await this.eventStore.save(events);
await this.eventPublisher.publish(events);
```

#### Fase 3 (Escala): External Queues

```typescript
// Migrar para SQS/RabbitMQ mantendo interfaces
export class SQSEventPublisher implements IEventPublisher {
  async publish(event: IDomainEvent): Promise<void> {
    await this.sqs.sendMessage(event);
  }
}
```

## Métricas de Sucesso

- ✅ **Tempo de implementação**: < 2 semanas para infraestrutura base
- ✅ **Performance**: < 10ms overhead por evento
- ✅ **Cobertura de testes**: > 90% para event handlers
- ✅ **Facilidade de adição**: Novos eventos em < 1 dia

## Referências

- [EventEmitter2 Documentation](https://github.com/EventEmitter2/EventEmitter2)
- [Domain Events in DDD](https://martinfowler.com/eaaDev/DomainEvent.html)
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [ADR-0001: Definição da Stack Backend](./0001-definicao-stack-backend.md)

---

**Próximo ADR**: Será criado quando decidirmos sobre persistência de eventos ou migração para queues externas.
