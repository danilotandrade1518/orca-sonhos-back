# ADR-0007: Infraestrutura Inicial – Azure App Service + PostgreSQL Flexible + Entra ID B2C + Key Vault

## Status

Aceito (primeira versão) – revisar em 6 meses ou antes se surgirem novos requisitos de escala / custo.

## Data

2025-08-15

## Contexto

O projeto encontra-se em fase de consolidação da camada HTTP e preparação para execução multi-runtime (container, serverless, edge). Precisamos disponibilizar um primeiro ambiente de produção / pré-produção para:

- Testar fluxo real de uso (até ~300 usuários previstos inicialmente)
- Validar integrações de autorização/autenticação
- Obter métricas básicas de saúde e performance
- Garantir persistência confiável (PostgreSQL – já decidido no ADR-0004)

Requisitos e restrições atuais:

1. Baixo esforço operacional (time pequeno, foco ainda em features).
2. Custos controlados e previsíveis (estudante / early stage – sem otimizações complexas agora).
3. Minimizar lock-in forte em APIs proprietárias do provedor (manter possibilidade futura de migração).
4. Segurança básica: gestão de segredos centralizada, autenticação de usuários externos.
5. Deploy simples via container (já existe Dockerfile inicial; futura otimização multi-stage pendente).
6. Banco relacional gerenciado (PostgreSQL) com backup automático.

## Problema

Escolher um conjunto mínimo de serviços de infraestrutura que atenda aos requisitos acima sem introduzir complexidade desnecessária, mantendo portabilidade arquitetural.

## Opções Consideradas

### A. Azure App Service + PostgreSQL Flexible Server + Entra ID B2C + Key Vault (DECISÃO)

**Prós**

- PaaS maduro para aplicações HTTP (autoscale básico, slots de deploy).
- Deploy direto de container ou build integrado (flexibilidade).
- PostgreSQL Flexible Server: backups, HA opcional, performance configurável.
- Key Vault: gestão central de segredos + rotação futura.
- Entra ID B2C: fluxo de autenticação de usuários finais sem construir Identity internamente.
- Integração nativa entre serviços (diagnostics, logging centralizado) sem esforço inicial.
- Permite manter código da aplicação essencialmente neutro (HTTP + pg driver + abstrações).
  **Contras**
- Custo um pouco maior que um único Droplet + DB self-managed.
- Some vendor coupling em modelos de identity (claims/flows B2C) e segredos (Key Vault APIs) – mitigável via abstrações.
- Escala horizontal mais cara que container-based bare metal / providers alternativos para picos abruptos.

### B. Azure Container Apps + PostgreSQL Flexible + Key Vault + Entra ID B2C

**Prós**: Melhor granularidade de escala (scale to zero), sidecars, Dapr opcional.  
**Contras**: Complexidade maior de configuração inicial; sobrecarga desnecessária agora; latência fria potencial (scale-to-zero) não crítica para MVP.

### C. DigitalOcean Droplet (App + pg) ou Droplet + Managed PostgreSQL

**Prós**: Custo inicial menor; simplicidade operacional (1-2 recursos).  
**Contras**: Mais responsabilidade de sistema (patching SO se DB no mesmo droplet); ecossistema menor de serviços gerenciados (sem equivalente direto a B2C). Migração futura para features avançadas exigiria ajustes.

### D. AWS Fargate / ECS + RDS PostgreSQL + Secrets Manager + Cognito

**Prós**: Plataforma ampla, escalabilidade alta, parallels com Azure stack.  
**Contras**: Curva de aprendizado (ECS task definitions, networking); custo potencialmente maior em baixa escala; mais verbose para primeira entrega.

### E. EC2 / VM Genérica + PostgreSQL self-managed + Vault (self-host) / arquivos env

**Prós**: Custo potencial mínimo; controle total.  
**Contras**: Alto esforço operacional (patches, backups, hardening); risco de falhas de disponibilidade; distração do foco principal (produto).

## Decisão

Adotar o conjunto: **Azure App Service (container)** + **Azure Database for PostgreSQL Flexible Server** + **Azure Key Vault** + **Microsoft Entra ID B2C** como infraestrutura inicial gerenciada.

## Justificativas Principais

1. **Rapidez de entrega**: App Service abstrai orchestration e provisiona HTTPS, logging básico e scaling sem definir cluster.
2. **Operação reduzida**: Banco gerenciado e segredos centralizados removem necessidade de rotinas de backup manual / rotação improvisada.
3. **Autenticação pronta**: Entra ID B2C evita construir user management + flows OAuth/OIDC do zero; integra via JWT padrão.
4. **Portabilidade preservada**: Código continuará usando contratos internos (ex: `ISecretsProvider`, `IAuthTokenValidator` – a serem implementados) e não SDKs proprietários diretamente em objetos de domínio.
5. **Escalabilidade incremental**: Possibilidade de escalar plano App Service posteriormente ou migrar para Container Apps/Kubernetes mantendo container.
6. **Observabilidade inicial integrada**: Facilita coleta de logs/health enquanto métricas custom ainda não existem (/metrics pendente).

## Consequências

### Positivas

- Menor tempo até o primeiro deploy funcional.
- Redução de riscos de perda de dados (backups automáticos PostgreSQL).
- Canal futuro claro para rotação de segredos (Key Vault) sem refatorar core.
- Simplificação de login de usuários sem stack de Identity interna.

### Negativas

- Dependência nas particularidades de configuração B2C (nomenclatura de atributos, política de fluxo) – abstração necessária.
- Custos fixos mínimos superiores a uma VM única de baixo custo.
- Eventual necessidade de ajuste se latência fria ou escala fina for requisito mais à frente (nesse caso Container Apps ou Functions).

## Mitigações de Lock-in

| Área     | Risco                                                      | Mitigação Técnica                                                                    | Status   |
| -------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| Segredos | Uso direto de SDK Key Vault em toda a codebase             | Introduzir `ISecretsProvider` adaptador; implementação Azure & fallback env          | Pendente |
| Auth     | Dependência de claims específicos B2C                      | `IAuthTokenValidator` parse genérico JWT + mapeamento claims → objeto Principal      | Pendente |
| Storage  | Feature específica de PostgreSQL (extensões não portáveis) | Limitar inicialmente a funcionalidades padrão + JSONB; avaliar extensões caso a caso | Em uso   |
| Logs     | Formato vendor (App Insights)                              | Manter logger stdout estruturado (JSON) consumível por qualquer agregador            | Em uso   |
| Config   | Variáveis com prefixos provider específicos                | Continuar namespacing neutro (`HTTP_`, `DB_`, `AUTH_`, `SECRETS_`)                   | Em uso   |

## Plano de Implementação (Incremental)

1. Docker: revisitar Dockerfile para multi-stage otimizado (tarefa já no plano de portabilidade).
2. Abstrações: criar interfaces `ISecretsProvider`, `IAuthTokenValidator` e adapters Azure.
3. Auth Flow: configurar B2C tenant + app registration; expor metadata (/.well-known) para validação de JWKS.
4. Segredos: migrar credenciais sensíveis (DB, JWT issuers) para Key Vault; leitura via adapter na inicialização.
5. Deploy Inicial: App Service (Plano básico) + PostgreSQL Flexible (SKU mínimo viável) em mesma região.
6. Observabilidade: ativar diagnósticos de App Service; logs stdout → coleta externa futura (opcional).
7. Health & Readiness: garantir /readyz verifica conectividade DB real antes de sinalizar saudável.
8. Métricas: implementar `/metrics` (Prometheus style) antes de escalar análises.
9. Revisão de Custos: após 30 dias coletar baseline (CPU, memória, storage) e reavaliar SKU.

## Impacto em Documentos Relacionados

- Atualizar `docs/plano-portabilidade.md` para referenciar este ADR em seção de build & operação.
- Futuro ADR específico para abstrações de Auth & Segredos se complexidade aumentar.

## Critérios de Revisão Futuras

Rever esta decisão quando ocorrer um ou mais:

- Pico > 10x usuários esperados ou necessidade de scale-to-zero.
- Requisito de custo ultra baixo que justifique troca para provider mais simples.
- Introdução de eventos/streams que demandem outra plataforma (ex: Event Hub / Kafka).

## Métricas de Sucesso

1. Deploy executado em < 15 minutos (build + release) de forma reprodutível.
2. Erro de autenticação < 1% após estabilização inicial.
3. Sem incidências de segredos hardcoded em commits futuros (scan automatizado opcional).
4. Tempo médio de resposta P95 < 500ms para rotas principais no plano inicial.

## Alternativas Rejeitadas (Resumo)

| Opção           | Motivo Principal de Rejeição Agora                           |
| --------------- | ------------------------------------------------------------ |
| Container Apps  | Overhead inicial desnecessário & complexidade extra          |
| DO Droplet      | Mais operação manual / menos serviços gerenciados integrados |
| AWS ECS/Fargate | Curva de aprendizado + tooling extra neste momento           |
| VM Genérica     | Operação e segurança onerosa ao time pequeno                 |

## Acompanhamento

Este ADR deve ser revisado em: 2026-02-15. Antes se surgir necessidade.

---

**Autor:** Equipe OrçaSonhos  
**Revisão:** 2026-02-15  
**Status:** Aceito
