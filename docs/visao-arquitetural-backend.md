# Visão Arquitetural do Backend

## 1. Visão Geral

Este documento descreve a arquitetura do backend do projeto OrçaSonhos, baseado em Node.js, Express, TypeScript, Clean Architecture e MySQL.
Iremos utilizar alguns conceitos que vêm do DDD, que são:
- Aggregates
- Entities
- Value Objects
- Repositories

Iremos ainda utilizar a ideia central do CQRS, porém sem domain events inicialmente.
A ideia aqui é tratar tudo que for mutação de estado em usecases/domain, e tudo que for query em QueryHandlers.
Não teremos inicialmente de forma obrigatória, projeção de views, apenas iremos consultar o banco diretamente pelos QueryHandlers.

## 2. Organização dos Diretórios

- `/src`
  - `/domain` — Agregados, Value Objects globais e regras de negócio
    - `/aggregates` — Cada agregado possui uma pasta própria, contendo suas entidades e value objects específicos
    - `/shared/value-objects` — Value Objects globais, reutilizáveis em todo o domínio
  - `/application/usecases` — Casos de uso (aplicação)
  - `/application/queries` - Query Handlers
  - `/infra` — Implementações de infraestrutura (banco, serviços externos)
  - `/interfaces/web` - Web controllers
  - `/config` — Configurações gerais do projeto

## 3. Responsabilidades das Camadas

- **Domain:** Agregados, entidades (dentro dos agregados), value objects (globais e específicos) e regras de negócio puras, sem dependências externas.
- **Use Cases:** Orquestram as regras de negócio, coordenando entidades e serviços. Use Cases sempre normalmente irão utilizar Repositories para acesso ao banco da dados.
- **Queries:** Tratam views do sistema. Query Handlers normalmente irão utilizar DAO's para acesso ao banco de dados.
- **Web:** Pontos de entrada/saída HTTP, adapta dados para os casos de uso.
- **Infra:** Implementação de repositórios, integrações externas, persistência.

## 4. Fluxo de Dados

- Mutação de estado
1. Uma requisição chega pela camada web (ex: controller Express).
2. O controller chama o caso de uso apropriado.
3. O caso de uso manipula entidades e utiliza repositórios/serviços definidos por interfaces.
4. A camada de Infra fornece as implementações concretas (ex: acesso ao MySQL).
5. A resposta retorna pela cadeia até o usuário.

- View request
1. Uma requisição chega pela camada web (ex: controller Express).
2. O controller chama a query handler apropriada.
3. A query handler consulta o banco através do's DAO's apropriados.
4. A camada de Infra fornece as implementações concretas (ex: acesso ao MySQL através de DAO's ou Repositories).
5. A resposta retorna pela cadeia até o usuário.

## 5. Exemplo de Fluxo Completo

### Exemplo: Criação de Usuário

1. O usuário faz uma requisição POST `/users`.
2. O controller na camada web recebe a requisição e realiza processo de transformação dos dados, caso necessário.
3. O controller instancia e chama o UseCase `CreateUserUseCase`.
4. O UseCase cria a entidade `User`, valida regras de negócio e utiliza o `UserRepository` para persistir no banco.
5. O `UserRepository` (implementado na camada infra) executa a operação no MySQL.
6. O resultado (sucesso ou erro) é retornado pelo UseCase ao controller, que responde ao usuário.

### Exemplo: Consulta de Usuário

1. O usuário faz uma requisição GET `/users/:id`.
2. O controller chama o QueryHandler `FindUserQueryHandler`.
3. O QueryHandler utiliza um DAO para buscar diretamente o usuário no banco.
4. O resultado é retornado ao controller e, em seguida, ao usuário.

## 6. DAO vs Repository

- **Repository:** Representa uma coleção de agregados (entidades) e encapsula regras de negócio relacionadas à persistência. Utilizado principalmente em operações de mutação (criação, atualização, remoção) e segue contratos definidos na camada de domínio.
- **DAO (Data Access Object):** Focado em consultas (queries) e otimizado para leitura de dados. Utilizado em Query Handlers para buscar informações diretamente do banco, podendo retornar dados em formatos específicos para views.

## 7. Padrões de Nomenclatura

- Classes: PascalCase (ex: `CriarUsuarioUseCase`, `UsuarioRepository`)
- Arquivos: PascalCase (ex: `CriarUsuarioUseCase.ts`, `UsuarioRepository.ts`)
- Métodos: camelCase (ex: `criarUsuario`, `buscarPorId`)
- Pastas: kebab-case (ex: `usecases`, `queries`, `infra`)
- Interfaces: prefixo `I` (ex: `IUsuarioRepository`)

## 8. Tratamento de Erros

O tratamento de erros será realizado utilizando o padrão `Either`, evitando o uso de `throw/try/catch` exceto em situações explicitamente necessárias (ex: falhas inesperadas ou integrações externas). Os métodos retornarão objetos do tipo `Either<Erro, Sucesso>`, facilitando o controle de fluxo e a previsibilidade dos resultados.

---

**Este documento deve ser atualizado conforme a arquitetura evoluir. Todo o código do projeto será escrito em Inglês.** 