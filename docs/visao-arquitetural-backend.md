# Visão Arquitetural do Backend

## 1. Visão Geral

Este documento descreve a arquitetura do backend do projeto OrçaSonhos, baseado em Node.js, Express, TypeScript, Clean Architecture e MySQL.
Iremos utilizar alguns conceitos que vêm do DDD, que são:

- Aggregates
- Entities
- Value Objects
- Repositories
- Domain Events

Iremos ainda utilizar a ideia central do CQRS, com domain events implementados usando EventEmitter2.
A ideia aqui é tratar tudo que for mutação de estado em usecases/domain, e tudo que for query em QueryHandlers.
Não teremos inicialmente de forma obrigatória, projeção de views, apenas iremos consultar o banco diretamente pelos QueryHandlers.

## 2. Organização dos Diretórios

- `/src`
  - `/domain` — Agregados, Value Objects globais e regras de negócio
    - `/aggregates` — Cada agregado possui uma pasta própria, contendo suas entidades e value objects específicos
    - `/shared/value-objects` — Value Objects globais, reutilizáveis em todo o domínio
    - `/shared/events` — Domain Events e interfaces base
  - `/application/usecases` — Casos de uso (aplicação)
  - `/application/queries` - Query Handlers
  - `/application/events` - Event Handlers e Event Publisher
  - `/infra` — Implementações de infraestrutura (banco, serviços externos)
  - `/interfaces/web` - Web controllers
  - `/config` — Configurações gerais do projeto

## 3. Responsabilidades das Camadas

- **Domain:** Agregados, entidades (dentro dos agregados), value objects (globais e específicos), domain events e regras de negócio puras, sem dependências externas.
- **Use Cases:** Orquestram as regras de negócio, coordenando entidades e serviços. Use Cases sempre normalmente irão utilizar Repositories para acesso ao banco da dados e Event Publishers para comunicação entre agregados.
- **Event Handlers:** Tratam dos side-effects causados por Domain Events, mantendo a comunicação entre agregados desacoplada.
- **Queries:** Tratam views do sistema. Query Handlers normalmente irão utilizar DAO's para acesso ao banco de dados.
- **Web:** Pontos de entrada/saída HTTP, adapta dados para os casos de uso.
- **Infra:** Implementação de repositórios, event publishers, integrações externas, persistência.

## 4. Domain Events

### 4.1. Conceito

Domain Events representam algo importante que aconteceu no domínio. Eles permitem comunicação desacoplada entre agregados, mantendo a consistência do sistema sem violar os princípios de isolamento dos agregados.

### 4.2. Tecnologia Escolhida: EventEmitter2

Para implementação dos Domain Events, escolhemos a biblioteca **EventEmitter2**, que oferece:

- **Wildcards**: Suporte a padrões como `transaction.*` para capturar todos os eventos de transação
- **Namespaces**: Organização hierárquica de eventos por agregados
- **TypeScript**: Excelente suporte nativo ao TypeScript
- **Performance**: Leve e rápido, baseado no EventEmitter nativo do Node.js
- **Simplicidade**: API familiar e fácil de usar

### 4.3. Implementação

#### Agregados como Event Accumulators
```typescript
export class Transaction {
  private _events: IDomainEvent[] = [];
  
  static create(dto: CreateTransactionDto): Either<DomainError, Transaction> {
    const transaction = new Transaction(/* ... */);
    transaction.addEvent(new TransactionCreatedEvent(transaction.id, transaction.accountId));
    return Either.success(transaction);
  }
  
  private addEvent(event: IDomainEvent): void {
    this._events.push(event);
  }
  
  getEvents(): IDomainEvent[] { return this._events; }
  clearEvents(): void { this._events = []; }
}
```

#### Use Cases como Event Orchestrators
```typescript
export class CreateTransactionUseCase {
  constructor(
    private transactionRepo: ITransactionRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async execute(dto: CreateTransactionDto): Promise<Either<ApplicationError, {id: string}>> {
    const transactionResult = Transaction.create(dto);
    if (transactionResult.hasError) return Either.error(/* ... */);
    
    const transaction = transactionResult.data!;
    await this.transactionRepo.save(transaction);
    
    // Publicar eventos após persistência bem-sucedida
    const events = transaction.getEvents();
    await this.eventPublisher.publishMany(events);
    transaction.clearEvents();
    
    return Either.success({ id: transaction.id });
  }
}
```

#### Event Handlers
```typescript
export class UpdateAccountBalanceHandler implements IEventHandler<TransactionCreatedEvent> {
  constructor(private accountRepo: IAccountRepository) {}

  async handle(event: TransactionCreatedEvent): Promise<void> {
    const account = await this.accountRepo.findById(event.accountId);
    if (account) {
      account.updateBalance(event.amount, event.type);
      await this.accountRepo.save(account);
    }
  }
}
```

#### EventEmitter2 Configuration
```typescript
// Configuração recomendada para o EventEmitter2
const emitter = new EventEmitter2({
  wildcard: true,        // Habilita wildcards (*)
  delimiter: '.',        // Separador para namespaces
  newListener: false,    // Não emite evento para novos listeners
  removeListener: false, // Não emite evento ao remover listeners
  maxListeners: 20,      // Máximo de listeners por evento
  verboseMemoryLeak: true // Alertas de memory leak
});

// Exemplos de uso com wildcards e namespaces
emitter.on('Transaction.*', handler);           // Todos eventos de Transaction
emitter.on('*.Created', handler);               // Todos eventos Created
emitter.on('TransactionCreatedEvent', handler); // Evento específico
```

### 4.4. Implementação Inicial

Inicialmente, os Domain Events serão implementados de forma interna à aplicação:

- **Event Publisher**: Implementação usando EventEmitter2 que chama handlers registrados
- **Event Handlers**: Processamento síncrono dos eventos
- **Sem Persistência**: Eventos não são persistidos (apenas processados)
- **Sem Filas Externas**: Não utilizaremos AWS SQS, RabbitMQ ou similares inicialmente

Esta abordagem visa simplicidade no início, permitindo evolução futura para soluções mais robustas conforme necessário.

## 5. Fluxo de Dados

### Mutação de estado com Domain Events

1. Uma requisição chega pela camada web (ex: controller Express).
2. O controller chama o caso de uso apropriado.
3. O caso de uso manipula entidades e agregados, que podem gerar Domain Events.
4. O caso de uso persiste as mudanças usando repositórios.
5. Após persistência bem-sucedida, o caso de uso publica os Domain Events.
6. Event Handlers processam os eventos, realizando side-effects (ex: atualizar saldos).
7. A resposta retorna pela cadeia até o usuário.

### View request

1. Uma requisição chega pela camada web (ex: controller Express).
2. O controller chama a query handler apropriada.
3. A query handler consulta o banco através dos DAO's apropriados.
4. A camada de Infra fornece as implementações concretas (ex: acesso ao MySQL através de DAO's ou Repositories).
5. A resposta retorna pela cadeia até o usuário.

## 6. Exemplo de Fluxo Completo

### Exemplo: Criação de Transação com Domain Events

1. O usuário faz uma requisição POST `/transactions`.
2. O controller na camada web recebe a requisição e transforma os dados.
3. O controller chama o UseCase `CreateTransactionUseCase`.
4. O UseCase cria a entidade `Transaction`, que gera um `TransactionCreatedEvent`.
5. O UseCase persiste a transação usando o `TransactionRepository`.
6. O UseCase publica o `TransactionCreatedEvent` via `IEventPublisher`.
7. O `UpdateAccountBalanceHandler` recebe o evento e atualiza o saldo da conta.
8. O resultado é retornado ao controller e, em seguida, ao usuário.

### Exemplo: Consulta de Usuário

1. O usuário faz uma requisição GET `/users/:id`.
2. O controller chama o QueryHandler `FindUserQueryHandler`.
3. O QueryHandler utiliza um DAO para buscar diretamente o usuário no banco.
4. O resultado é retornado ao controller e, em seguida, ao usuário.

## 7. DAO vs Repository

- **Repository:** Representa uma coleção de agregados (entidades) e encapsula regras de negócio relacionadas à persistência. Utilizado principalmente em operações de mutação (criação, atualização, remoção) e segue contratos definidos na camada de domínio.
- **DAO (Data Access Object):** Focado em consultas (queries) e otimizado para leitura de dados. Utilizado em Query Handlers para buscar informações diretamente do banco, podendo retornar dados em formatos específicos para views.

## 8. Padrões de Nomenclatura

- Classes: PascalCase (ex: `CriarUsuarioUseCase`, `UsuarioRepository`, `TransactionCreatedEvent`)
- Arquivos: PascalCase (ex: `CriarUsuarioUseCase.ts`, `UsuarioRepository.ts`, `TransactionCreatedEvent.ts`)
- Métodos: camelCase (ex: `criarUsuario`, `buscarPorId`, `handle`)
- Pastas: kebab-case (ex: `usecases`, `queries`, `infra`, `events`)
- Interfaces: prefixo `I` (ex: `IUsuarioRepository`, `IEventPublisher`, `IEventHandler`)
- Domain Events: sufixo `Event` (ex: `TransactionCreatedEvent`, `AccountBalanceUpdatedEvent`)

## 9. Tratamento de Erros

O tratamento de erros será realizado utilizando o padrão `Either`, evitando o uso de `throw/try/catch` exceto em situações explicitamente necessárias (ex: falhas inesperadas, integrações externas ou event handlers). Os métodos retornarão objetos do tipo `Either<Erro, Sucesso>`, facilitando o controle de fluxo e a previsibilidade dos resultados.

Para Domain Events, falhas em Event Handlers devem ser tratadas de forma que não afetem o fluxo principal da operação, sendo logadas apropriadamente para monitoramento.

## 10. Padrão de Imports e Path Alias

Para manter a organização e a clareza do projeto, adotaremos o seguinte padrão para imports:

- **Path Alias:** Devem ser utilizados apenas para importar arquivos entre diferentes camadas (por exemplo, importar algo da camada `domain` para a camada `application`).
- **Imports Relativos:** Devem ser utilizados para importar arquivos dentro da mesma camada (por exemplo, entre arquivos dentro de `usecases`, ou entre arquivos dentro de `aggregates`).

Este padrão visa facilitar a navegação, evitar ciclos de dependência e reforçar a separação entre as camadas da arquitetura.

## 11. Padrão de Ordenação de Métodos em Classes

Para manter a legibilidade e padronização do código, todas as classes devem seguir a seguinte ordem de declaração de métodos:

1. Métodos públicos (incluindo getters/setters)
2. Métodos estáticos
3. Métodos privados

Este padrão deve ser seguido em todas as classes do domínio, value objects, entidades, use cases, etc.

## 12. Organização dos Testes

Os testes devem ser organizados seguindo a mesma estrutura do código de produção, mantendo a proximidade com o código testado:

- **Testes Unitários:** Devem ser colocados na mesma pasta do arquivo testado, com o sufixo `.spec.ts`

  - Exemplo: `src/domain/aggregates/budget/Budget.ts` → `src/domain/aggregates/budget/Budget.spec.ts`
  - Exemplo: `src/domain/shared/value-objects/Money.ts` → `src/domain/shared/value-objects/Money.spec.ts`
  - Exemplo: `src/application/events/UpdateAccountBalanceHandler.ts` → `src/application/events/UpdateAccountBalanceHandler.spec.ts`

- **Testes de Integração:** Devem ser colocados em uma pasta `__tests__` dentro do módulo testado

  - Exemplo: `src/application/usecases/__tests__/CreateBudgetUseCase.spec.ts`

- **Testes E2E:** Devem ser colocados em uma pasta `__tests__` na raiz do projeto
  - Exemplo: `src/__tests__/e2e/budget.spec.ts`

Esta organização visa:

- Manter os testes próximos ao código testado
- Facilitar a manutenção e localização dos testes
- Seguir o princípio de coesão e acoplamento
- Manter a consistência com a arquitetura do projeto

---

**Este documento deve ser atualizado conforme a arquitetura evoluir. Todo o código do projeto será escrito em Inglês.**
