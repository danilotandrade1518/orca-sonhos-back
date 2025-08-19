# ADR 0009 - Postergacões para Simplificação do MVP (Mutações & Observabilidade)

## Status

Proposed - 2025-08-19

## Contexto

Durante a implementação inicial das funcionalidades de mutação (Unit of Work para transferências, pagamento de fatura, reconciliação, etc.) e da camada mínima de observabilidade (logs estruturados de mutação, duração, slow queries, counters em memória), surgiram diversos aprimoramentos potenciais.

Para atingir o MVP com menor tempo de entrega e risco reduzido, decidimos adiar itens que não são estritamente necessários para garantir correção funcional básica, segurança mínima e rastreabilidade essencial.

Este ADR documenta explicitamente o que foi ADIADO para evitar "scope creep" e permitir retomada futura consciente.

## Decisão

Adiar a implementação dos itens listados em "Backlog Pós-MVP". Manter no MVP apenas:

- Execução transacional básica por UoW.
- Logging estruturado de início/fim de mutação com duração e outcome.
- Logger com requestId (correlação) por requisição.
- Slow query logging simples (`timedQuery`) com threshold configurável (`DB_SLOW_QUERY_MS`).
- Contadores em memória de sucesso/erro por operação (endpoint interno `/internal/metrics/mutations`).

## Backlog Pós-MVP (Itens Adiados)

### Concorrência & Integridade

1. Controle de concorrência otimista (version / updated_at no WHERE de UPDATE ou coluna `version`).
2. Locks pessimistas explícitos (`SELECT ... FOR UPDATE`) em contas/envelopes/faturas durante cálculos sensíveis.
3. Testes de corrida simulando operações concorrentes (transferências simultâneas, pagamento repetido).
4. Idempotency keys para comandos sensíveis a retry (transfer, pay-credit-card-bill, reconcile, envelope-transfer).
5. Retry automático para deadlocks / erros transientes (backoff limitado).

### Persistência & Consistência Assíncrona

6. Outbox / event log para side-effects externos ou integração futura.
7. Mecanismo de audit trail detalhado (além dos logs de mutação atuais).

### Observabilidade Avançada

8. Métricas temporais agregadas (p95/p99 latência por operação) e export em formato Prometheus.
9. Dashboards / tracing distribuído (OpenTelemetry) e propagação de trace/span id.
10. Limpeza / rotação de counters em memória (persistência externa ou reset periódico).
11. Log sanitization / mascaramento de campos sensíveis (análise posterior dos payloads necessários).
12. Enriquecimento de logs de queries com requestId (wrapper por requisição do adapter ou context binding).
13. Correlation id cross-service (quando existir outro serviço consumidor ou produtor de eventos).

### Robustez & Resiliência

14. Circuit breaker / bulkhead para camada de banco (ex: open após N falhas rápidas).
15. Graceful degradation / fila de compensação para mutações não críticas.
16. Monitoramento de deriva de contadores vs. estado real (consistência eventual).

### Segurança & Governança

17. Rate limiting / anti-replay específico para comandos financeiros.
18. Assinatura / verificação de payload para operações críticas (futuro compliance).
19. Política de retenção e anonimização de logs (LGPD) além do estágio inicial.

### Qualidade de Código & Testes

20. Cobertura uniforme de testes para todos os cenários de erro inesperado em cada UoW (alguns já cobertos, falta auditoria completa).
21. Testes de performance sintéticos para estimar throughput de mutações.
22. Fixtures / builders para reduzir repetição de criação de entidades em testes de UoW.

### API & DX

23. Documentação automatizada (Swagger/OpenAPI) de todos os comandos já com exemplos enriquecidos de erro.
24. Paginação / filtros e endpoints diferenciados para queries (ADR futuro).

### Operação & Tooling

25. Healthcheck mais rico (incluindo latência média, backlog de filas futuras, etc.).
26. Export de métricas para sistema externo (Prometheus / StatsD / Azure Monitor) ao invés de endpoint interno simples.

## Justificativa

Motivos para adiar:

- Complexidade adicional não necessária para verificar a proposta de valor inicial do produto.
- Redução de risco de atrasos antes de validar adoção / feedback de usuários.
- Evitar sobrecarga operacional inicial (manter stack de observabilidade mínima e barata).

Os itens escolhidos oferecem retornos significativos só após existir volume real de uso, múltiplos serviços ou exigências regulatórias mais fortes.

## Consequências

### Positivas

- Entrega mais rápida do MVP.
- Menor superfície de falha inicial.
- Foco da equipe em validação funcional e feedback de usuário final.

### Negativas / Riscos Aceitos

- Possibilidade de conflitos de atualização silenciosos em cenários concorrentes extremos.
- Risco de double-processing se houver retries de cliente sem idempotency key.
- Observabilidade limitada (sem métricas agregadas ou tracing distribuído).
- Ausência de garantias fortes contra deadlocks ou flutuações de latência.
- Crescimento futuro exigirá refatoração para introduzir versionamento e mecanismos de resiliência.

## Critérios para Retomar (Triggers)

Retomar itens adiados quando ocorrer um ou mais:

- Aumento consistente de erros de concorrência / inconsistências detectadas manualmente.
- Necessidade de relatórios de auditoria detalhados ou compliance regulatório.
- Volume de requisições > X req/min sustentado (definir limiar ao medir produção).
- Planejamento de integração com outro serviço externo (event-driven ou RPC).
- Incidentes de performance (p95 de mutações > Y ms) sem visibilidade suficiente.

## Alternativas Consideradas

- Implementar todos incrementalmente agora (rejeitado: aumenta tempo e risco sem validação do produto).
- Reduzir ainda mais (ex.: sem slow query logging) — rejeitado por dificultar diagnósticos básicos.

## Passos Seguintes Imediatos (Dentro do MVP)

- Auditoria rápida de formato de erro HTTP e consistência de release de client (concluir).
- Documentar threshold `DB_SLOW_QUERY_MS` (feito no README).

## Referências

- `README.md` (seção Observabilidade)
- ADR 0008 (padrão endpoints de mutação)
- Código em `src/shared/observability` e UoWs instrumentados
