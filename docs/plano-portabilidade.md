# Plano de Implementação – Portabilidade (Container, VM, Serverless, Edge)

> Documento guia para a fase de consolidação da camada HTTP e preparação de execução multi-runtime. Estilo alinhado a `features.md`.

## Legenda de Status

- ✅ **Concluído**
- 🔄 **Parcial** (iniciado, faltam incrementos)
- 🚧 **Em Progresso Ativo**
- ❌ **Pendente** (ainda não iniciado)
- 💤 **Postergado** (fora do escopo imediato, mas registrado)

---
## 🎯 Objetivo Geral
Garantir que o backend possa executar de maneira consistente em múltiplos ambientes de execução (processo longo em container ou VM, funções serverless, edge runtimes) com **mínimo acoplamento a framework** e **contratos estáveis** entre camadas.

---
## 📦 Escopo Desta Fase
1. Consolidar camada HTTP agnóstica (controllers, middlewares, mapeamento de erros).
2. Isolar dependências de runtime (Express hoje; futuro: Fastify/opção serverless adapter / edge adapter).
3. Preparar infraestrutura lógica para:
   - Reuso de composição de casos de uso (composition roots) sem acoplamento ao runtime.
   - Estratégias de conexão e lifecycle para cenários stateful vs stateless.
4. Estabelecer diretrizes de build & empacotamento: container vs função.
5. Fundar base de observabilidade (tracing id, logging estruturado mínimo, health).

---
## ✅ Fundamentos Já Implementados
| Item | Arquivo / Local | Descrição | Status |
|------|-----------------|-----------|--------|
| Validação de Environment (schema) | `src/config/env.ts` | Carrega e valida variáveis via Zod | ✅ |
| Core HTTP Types | `src/interface/http/http-types.ts` | Abstração de Request/Response/Controller/Middleware | ✅ |
| Middleware de Request ID & Latência | `src/interface/http/middlewares/request-id-middleware.ts` | Correlation + métricas simples de tempo | ✅ |
| Middleware de Logging Estruturado | `src/interface/http/middlewares/logging-middleware.ts` | Log JSON por requisição | ✅ |
| Middleware de Erro (fallback 500) | `src/interface/http/middlewares/error-handler-middleware.ts` | Normalização básica de falhas | ✅ |
| Mapeador de Erros Domínio → HTTP | `src/interface/http/mappers/error-mapper.ts` | Converte erros conhecidos em 4xx | ✅ |
| Adapter Express Genérico | `src/interface/http/adapters/express-adapter.ts` | Composição de cadeia de middlewares e controllers | ✅ |
| Controller Create Budget | `src/interface/http/controllers/budget/create-budget.controller.ts` | Exposição do UC `CreateBudgetUseCase` | ✅ |
| Teste Unitário Controller | (spec existente do use case + mapping) | Verifica fluxo de execução | ✅ |
| Teste E2E HTTP (Supertest) | `src/tests/e2e/create-budget.e2e.test.ts` | Valida rota POST /budgets fim a fim (sem DB) | ✅ |

---
## 🌐 Matriz de Portabilidade (Visão Resumida)
| Eixo | Container / VM | Serverless (FaaS) | Edge Runtime |
|------|----------------|------------------|--------------|
| Boot / Lifecycle | Processo longo, pooling inicial | Execução fria/quente, precisa bootstrap rápido e cache estático | Startup ultra-curto, limitações de API Node | 
| Conexão DB | Pool compartilhado | Reuso condicional (global singleton) + evitar excesso de conexões | Possível restrição (usar HTTP gateway / proxy DB) |
| Logging | stdout (aggregator) | stdout + structured (cold start markers) | Minimal + streaming | 
| Observabilidade | Metrics + tracing agentes | Logs + traces encapsulados por invocação | Headers & edge trace simplificado |
| State In-Memory | Permitido (caches) | Apenas "quase-estático" entre invocações | Muito limitado, preferir KV externo |
| Empacotamento | Docker multi-stage | Bundle leve + handler | Bundle minificado + edge constraints |
| Timeout Handling | Nível infra (reverse proxy) | Handler interno + config FaaS | Minimizar tempo / streaming |

---
## 🗂 Backlog Detalhado por Eixo
### 1. Abstração de Runtime / Adapters
| Tarefa | Descrição | Status | Prioridade |
|--------|-----------|--------|------------|
| Adapter Express (base) | Já criado | ✅ | Alta (feito) |
| Interface Genérica de Server Adapter | Contrato para qualquer servidor registrar rotas/middlewares (`server-adapter.ts`) | ✅ | Alta |
| Adapter Serverless (AWS Lambda / Azure Functions shape) | Função handler que converte evento → HttpRequest | ❌ | Alta |
| Adapter Edge (Cloudflare / Vercel Edge) | Responder com Web Fetch API (Request/Response) | ❌ | Média |
| Extração de Roteamento para Módulo | Registrar rotas a partir de arrays versionáveis | 🔄 | Média |
| Suporte a Versionamento de Rotas (v1, v2) | Namespace/Prefix + negotiation | ❌ | Média |
| Middleware CORS configurável | Config baseado em env (`CORS_ENABLED`, `CORS_ORIGINS`, `CORS_METHODS`, `CORS_HEADERS`, `CORS_EXPOSE_HEADERS`) | ✅ | Média |
| Health & Liveness Endpoints | `/healthz`, `/readyz` + minimal checks | ✅ | Alta |
| Graceful Shutdown (Container/VM) | Capturar SIGTERM/SIGINT e fechar pool | ❌ | Alta |

### 2. Observabilidade
| Tarefa | Descrição | Status | Prioridade |
|--------|-----------|--------|------------|
| Trace ID em Responses | Implementado | ✅ | Alta |
| Logger Abstrato | Interface + implementação console (pluggable) (`src/shared/logging/logger.ts`) | ✅ | Alta |
| Structured Error Logging | Logar stack + campos estruturados (errorType, requestId) | ✅ | Alta |
| Métricas Básicas (contador req, latência) | Exportável via endpoint `/metrics` (Prometheus) | ❌ | Média |
| Correlation Propagation | Propagar `x-request-id` de entrada se enviado | ✅ | Média |
| Logger Contextual por Requisição | Injeção de logger no HttpRequest | ✅ | Média |

### 3. Gestão de Conexões / Recursos
| Tarefa | Descrição | Status | Prioridade |
| Pool DB Lazy Singleton | Criar conexão sob demanda reutilizável global (`getDbPool`) | ✅ | Alta |
| Estratégia Serverless Pool Reuse | Guardar pool em variável global (evitar cold start overhead) | ❌ | Alta |
| Circuit Breaker / Retry (infra adapters) | Repositórios críticos com política resiliente | ❌ | Baixa |
| TTL Cache Leve (opcional) | Cache de lookups de metadados (config) | 💤 | Baixa |

### 4. Configuração / Environment
| Tarefa | Descrição | Status | Prioridade |
| Revisar Schema `.env` p/ modos (dev/test/prod) | Variáveis condicionais | ❌ | Média |
| Namespacing de Variáveis (HTTP_, DB_, LOG_) | Completo (removido fallback legado) | ✅ | Baixa |
| Modo Read-Only Flag | Determina proibições (ex: sem mutation) | 💤 | Baixa |

### 5. Segurança
| Tarefa | Descrição | Status | Prioridade |
| Serviço de Autorização Real | Substituir stub `AllowAllBudgetAuthorizationService` | ❌ | Alta |
| Middleware de Autenticação (token) | Converter token → Principal | ❌ | Alta |
| Política de CORS Granular | Origem / Métodos / Headers configuráveis | ❌ | Média |
| Rate Limiting Adaptável | Em memória / token bucket externo (Redis) | 💤 | Baixa |
| Sanitização de Headers Sensíveis | Remover/mascarar logs | ❌ | Média |

### 6. Serialização & Formatos
| Tarefa | Descrição | Status | Prioridade |
| Consistência de Erros (schema único) | Formato documentado (`docs/error-format.md`) | ✅ | Alta |
| Normalização de Datas (ISO UTC) | Garantir saída padronizada | ❌ | Média |
| Suporte a Streaming / NDJSON (futuro) | Para relatórios longos | 💤 | Baixa |
| Content Negotiation Minimal | Aceitar `application/json` apenas (explicito) | ❌ | Baixa |

### 7. Resiliência & Performance
| Tarefa | Descrição | Status | Prioridade |
| Timeout Interno por Rota | Fail-fast vs saturação (middleware timeout) | ✅ | Média |
| Idempotência para POST Críticos (Serverless) | Chave Idempotency-Token opcional | 💤 (adiado) | Alta |
| Bulkhead / Queue (futuro) | Limitar concorrência pesada | 💤 | Baixa |
| Pré-aquecimento Serverless | Função de warmup opcional | 💤 | Baixa |

### 8. Build & Empacotamento
| Tarefa | Descrição | Status | Prioridade |
| Dockerfile Multi-stage Otimizado | Reduzir camada final (distroless/alpine) | ❌ | Alta |
| Script Build para Lambda/Functions | Empacotar handler + tree-shake | ❌ | Alta |
| Bundle Edge (ESM + Web APIs) | Ajustar target & remover Node-specific APIs | ❌ | Média |
| Análise de Tamanho do Bundle | Report após build | ❌ | Baixa |
| Automatizar CI (matrix container/serverless) | Pipeline multi-target | ❌ | Alta |

### 9. Testes & Qualidade
| Tarefa | Descrição | Status | Prioridade |
| Teste E2E Create Budget | Implementado | ✅ | Alta |
| Teste E2E Health | Após criação endpoint | ✅ | Alta |
| Teste E2E Erros (404/403) | Simular erros via stubs | ❌ | Média |
| Teste de Adapter Serverless | Chamar handler com evento simulado | ❌ | Alta |
| Teste de Adapter Edge | Simular Request Fetch | ❌ | Média |
| Testes de Performance Smoke | k6 / autocannon básico | 💤 | Baixa |

### 10. Documentação & Operação
| Tarefa | Descrição | Status | Prioridade |
| Este Plano | Criado | ✅ | Alta |
| README Execução Multi-runtime | Passos para container, lambda, edge | ❌ | Alta |
| Guia de Observabilidade | Como coletar logs/metrics | ❌ | Média |
| Guia de Migração (Express → Outros) | Passos para adicionar novo adapter | ❌ | Média |
| ADR: Estratégia Multi-Runtime | Formalizar decisão | ❌ | Média |

---
## 🛣 Roadmap (Sprints Propostos)
| Sprint | Foco Principal | Itens Chave |
|--------|----------------|-------------|
| 1 | Observabilidade & Saúde | Health endpoints, logger abstrato, structured error logging, CORS |
| 2 | Adapters Serverless & Conexões | Serverless adapter, pool reuse, idempotência básica |
| 3 | Segurança & Auth | Middleware auth, autorização real, sanitização |
| 4 | Edge & Performance | Edge adapter, timeout interno, normalização datas |
| 5 | Build & CI Multi-target | Docker otimizado, pacotes lambda, pipeline matrix |
| 6 | Refinos / Documentação | README multi-runtime, ADRs, testes faltantes |

---
## ✅ Critérios de Pronto (Definition of Done – Fase Portabilidade)
1. Health endpoints respondem 200/503 com verificação leve de dependências.
2. Adapters: Express + Serverless + Edge implementados e testados.
3. Logger abstrato com implementação console + possibilidade de trocar por provider externo.
4. Erros expostos em formato único e documentado.
5. Pool de DB reutilizável seguro em serverless (sem avalanche de conexões).
6. Dockerfile multi-stage com imagem final < 150MB (objetivo inicial).
7. Pipeline CI executa testes unitários + e2e + build container + pacote serverless.
8. Documentação descreve execução nos 4 cenários.

---
## ⚠️ Riscos & Mitigações
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Explosão de conexões em serverless | Falha de banco | Reuso de pool + limite configurável |
| Aumento de cold start (bundle grande) | Latência elevada | Tree-shaking + dependências enxutas + lazy init |
| Divergência de comportamento entre adapters | Bugs intermitentes | Testes de contrato (shared test suite) |
| Log ruidoso em edge | Custo / rendimento | Nível de log adaptativo (INFO→WARN) |
| Idempotência ausente em POST críticos | Duplicidade de dados | Implementar chave idempotente + storage leve |

---
## 🔝 Próximos Passos Imediatos (Top 5)
1. Structured error mapping (códigos estáveis por domínio).
2. Métricas básicas /metrics (req_total, latency histogram).
3. Graceful shutdown (SIGTERM/SIGINT) liberando pool.
4. Adapter Serverless inicial (handler de entrada → HttpRequest).
5. README execução multi-runtime.

### Referências ADR Relevantes
- ADR-0004 (PostgreSQL)
- ADR-0007 (Infra Azure inicial – App Service + PostgreSQL Flexible + Key Vault + Entra ID B2C)
## 📌 Notas
- Mantida decisão de **não validar payloads na camada HTTP** nesta fase (apenas conversão leve). Planejar camada de validação opcional depois do primeiro corte de portabilidade.
- A autorização atual é um stub – risco conscientemente aceito para acelerar foundation.
- Edge adapter dependerá de revisão de APIs Node usadas (ex: `crypto.randomUUID` é suportado, mas alguns módulos nativos podem não ser).

---
**Última Atualização**: Agosto/2025 – Plano inicial criado a partir do estado atual da codebase.
