Agora# ADR 0008 - Padrão de Endpoints de Mutations: POST base-path/action

## Status

Accepted - 2025-08-17

## Contexto

O backend segue arquitetura DDD + Clean Architecture com Use Cases específicos por regra de negócio. As operações de mutação (commands) vão além de CRUD simples (ex: `mark-transaction-late`, `transfer-between-envelopes`, `pay-credit-card-bill`). Forçar essas operações em verbos REST canônicos (PUT/PATCH/DELETE) sobre um mesmo recurso gera ambiguidade, endpoints verborrágicos ou múltiplas semânticas num único verbo.

## Decisão

Adotar um estilo "command endpoint" para mutações:

- **Verbo HTTP fixo:** `POST`
- **Formato da rota:** `/<aggregate|context>/<action-kebab-case>`
- **Nome da ação:** reflete diretamente o caso de uso (classe) em kebab-case.
- **Request Body:** DTO do Use Case
- **Response:** `UseCaseResponse` padronizado via `DefaultResponseBuilder`

Exemplos:

- `POST /budget/create-budget`
- `POST /transaction/mark-transaction-late`
- `POST /credit-card-bill/pay-credit-card-bill`
- `POST /envelope/transfer-between-envelopes`

Consultas (queries) não fazem parte desta decisão e poderão adotar outro estilo (ex: GET /query handlers) futuramente.

## Alternativas Consideradas

1. **REST tradicional (CRUD + PATCH para ações):**
   - Complexidade de mapear múltiplas ações distintas para PATCH no mesmo resource.
   - Perda de clareza semântica e necessidade de campos "operation" no payload.
2. **GraphQL para commands:**
   - Overhead de introdução de stack adicional neste estágio do projeto.
3. **gRPC / RPC interno:**
   - Excesso de complexidade antes de necessidade real de multi-channel.

## Justificativa

- Mantém o ubiquitous language entre domínio e interface.
- Facilita auditoria e autorização: (contexto, ação) como chave.
- Simplifica padronização de erros e logging (um handler por use case).
- Evita endpoints REST heterogêneos e mal definidos para operações de negócio.

## Consequências

### Positivas

- Clareza de intenção.
- Fácil evolução: adicionar novos comandos sem quebrar contratos existentes.
- Reduz ambiguidade de semântica HTTP.

### Negativas

- Diverge de expectativas REST estritas / ferramentas de scaffolding.
- Pode gerar número maior de endpoints (um por ação).
- Necessita documentação explícita (Swagger/OpenAPI) para discoverability.

## Mitigações

- Automatizar geração de documentação dos comandos (futuro).
- Possível introdução de agrupamentos ou versionamento via prefixo `/v1/` quando necessário.

## Impacto em Segurança / Autorização

- Autorização baseada em action name clara e determinística.
- Facilita auditoria de eventos de comando.

## Próximos Passos

- Ajustar/confirmar mapeamento de rotas nos módulos HTTP.
- Incluir seção no Swagger descrevendo padrão global.
- Avaliar padrão distinto para queries em ADR futura.

## Referências

- Seção 14 do documento `visao-arquitetural-backend.md`.
- Tactical DDD patterns para modelagem de comandos explícitos.
