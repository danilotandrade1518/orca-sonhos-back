# ADR-0006: Remoção de Domain Events

**Status:** Aceito  
**Data:** 2024-12-19  
**Decisores:** Equipe de Desenvolvimento  
**Contexto Técnico:** Simplificação arquitetural e aplicação do princípio YAGNI  

## Contexto

Durante o desenvolvimento do projeto Orca Sonhos, implementamos inicialmente uma arquitetura que incluía Domain Events usando EventEmitter2, seguindo práticas avançadas de Domain-Driven Design (DDD). Após análise prática do projeto e suas necessidades reais, identificamos que esta complexidade adicional não está sendo justificada pelos benefícios obtidos.

### Situação Atual

- **Domain Events implementados**: Utilizando EventEmitter2 para comunicação desacoplada entre agregados
- **Event Handlers**: Para processing de side effects como atualização de saldos
- **Event Accumulators**: Agregados coletando eventos para posterior publicação
- **Event Publishers**: Coordenação de publicação de eventos nos Use Cases

### Complexidade Identificada

1. **Overhead arquitetural**: Múltiplas camadas de abstração para problemas simples
2. **Trade-off com Unit of Work**: Redundância entre Domain Events e Unit of Work para atomicidade
3. **Complexidade de testes**: Necessidade de mockar e verificar eventos em todos os testes
4. **Dificuldade de debugging**: Fluxo indireto dificulta rastreamento de operações

## Análise do Problema

### Cenários de Uso dos Domain Events

1. **Atualização de saldos após transações**
   - Atual: Transaction dispara TransactionCreatedEvent → Handler atualiza Account
   - Simples: Use Case atualiza Account diretamente ou via Unit of Work

2. **Operações cross-aggregate**
   - Atual: Evento comunica entre agregados
   - Simples: Unit of Work para operações atômicas, Domain Services para regras complexas

3. **Side effects e integrações**
   - Atual: Event Handlers para envio de notificações, logs, etc.
   - Simples: Chamar serviços diretamente nos Use Cases quando necessário

### Benefícios Esperados vs Realidade

| Benefício Esperado | Realidade do Projeto |
|-------------------|---------------------|
| Desacoplamento entre agregados | A maioria das operações é simples e não precisa deste nível de desacoplamento |
| Facilitar testes | Na verdade, complicou os testes com necessidade de verificar eventos |
| Extensibilidade | Premature optimization - não temos necessidades complexas ainda |
| Auditoria e monitoramento | Pode ser implementado de forma mais simples quando necessário |

## Decisão

**Decidimos remover completamente os Domain Events do projeto**, simplificando a arquitetura para focar nas necessidades reais atuais.

### O que será removido:

1. **Infraestrutura de eventos**
   - Interfaces: `IDomainEvent`, `IEventHandler`, `IEventPublisher`
   - Implementações: `EventPublisher` com EventEmitter2
   - Configurações: Setup do EventEmitter2

2. **Event Handlers**
   - `UpdateAccountBalanceHandler`
   - Outros handlers implementados

3. **Event Accumulators nos agregados**
   - Métodos `addEvent()`, `getEvents()`, `clearEvents()`
   - Arrays de eventos em entidades

4. **Publicação de eventos nos Use Cases**
   - Lógica de publicação após persistência
   - Dependências de `IEventPublisher`

### O que será mantido/implementado:

1. **Unit of Work** para operações atômicas complexas
2. **Domain Services** para regras de negócio cross-aggregate
3. **Use Cases** orquestrando operações diretamente
4. **Repositories** com responsabilidades claras de persistência

## Consequências

### Positivas

- ✅ **Simplicidade**: Código mais direto e fácil de entender
- ✅ **Facilidade de debugging**: Fluxo linear e previsível
- ✅ **Testes mais simples**: Não precisa verificar eventos, apenas resultado final
- ✅ **Menos abstrações**: Redução de interfaces e implementações desnecessárias
- ✅ **Manutenibilidade**: Menos código para manter e evoluir
- ✅ **Onboarding**: Mais fácil para novos desenvolvedores entenderem o código

### Negativas

- ❌ **Menos desacoplamento**: Agregados podem ter dependências mais diretas
- ❌ **Repetição potencial**: Pode haver duplicação de lógica entre Use Cases
- ❌ **Refactoring futuro**: Se precisarmos de eventos no futuro, será necessário refatoração

### Neutras

- 🔄 **Performance**: Impacto neutro, possivelmente ligeira melhoria por menos overhead
- 🔄 **Testabilidade**: Testes diferentes, mas não necessariamente piores

## Estratégia de Implementação

### Fase 1: Remoção da infraestrutura
1. Remover interfaces e implementações de eventos
2. Limpar dependências do EventEmitter2
3. Atualizar documentação arquitetural

### Fase 2: Refatoração dos Use Cases
1. Simplificar Use Cases removendo lógica de eventos
2. Implementar operações diretas ou via Unit of Work
3. Atualizar testes correspondentes

### Fase 3: Limpeza dos agregados
1. Remover event accumulators das entidades
2. Simplificar métodos de criação e atualização
3. Focar regras de negócio essenciais

## Alternativas Consideradas

### 1. Manter apenas eventos essenciais
**Rejeitada**: Ainda adiciona complexidade sem benefício claro

### 2. Implementar eventos síncronos simples
**Rejeitada**: Unit of Work já resolve as necessidades de atomicidade

### 3. Eventos futuros com observabilidade
**Aceita como evolução futura**: Quando tivermos necessidades reais de monitoramento e auditoria

## Plano de Evolução Futura

Esta decisão não é permanente. Quando o projeto crescer e tivermos necessidades reais de:

- **Integrações externas complexas** (webhooks, filas)
- **Auditoria detalhada** de todas as operações
- **Monitoramento avançado** de eventos de negócio
- **Arquitetura distribuída** com múltiplos serviços

Poderemos **reintroduzir Domain Events** de forma gradual e justificada, aplicando o conhecimento adquirido sobre as necessidades reais do sistema.

## Princípios Aplicados

- **YAGNI (You Aren't Gonna Need It)**: Não implementar funcionalidades antes de precisar
- **KISS (Keep It Simple, Stupid)**: Manter a solução simples e direta
- **Pragmatismo**: Focar nas necessidades reais do projeto
- **Evolução incremental**: Adicionar complexidade apenas quando justificada

---

**Referências:**
- ADR-0003: Escolha EventEmitter2 Domain Events (agora obsoleto)
- Clean Architecture principles
- Domain-Driven Design patterns
- Princípios SOLID e YAGNI
