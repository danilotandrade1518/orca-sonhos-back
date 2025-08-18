# Convenções de Persistência

Este documento formaliza padrões adotados para a camada de persistência (PostgreSQL + repositories/UnitOfWorks).

## 1. Modelagem e Tipos

- Identificadores: UUID gerados via `gen_random_uuid()` no banco ou `EntityId` no domínio.
- Valores monetários: sempre armazenados em centavos (`bigint`), convertidos para objetos `MoneyVo` no domínio.
- Dates: `timestamp` (UTC). Sempre usar NOW() no seed/migrations; domínio recebe `Date` nativa.
- Soft delete: coluna `is_deleted boolean default false not null`; queries devem filtrar `is_deleted = false` quando retornam entidades ativas.
- Enums de domínio: mapeados para enums PostgreSQL (ex: `budget_type_enum`, `category_type_enum`). Manter nomes coerentes e sufixo `_enum`.

## 2. Naming Conventions

- Tabelas: plural snake_case (ex: `credit_card_bills`).
- Colunas: snake_case; datas terminam com `_at`.
- Índices: `<tabela>_<coluna>_index` ou compostos `<tabela>_<colA>_<colB>_index`.
- Migrations: timestamp prefix + descrição em inglês (consistente com já criado).

## 3. Regras de Integridade

- FK: `ON DELETE CASCADE` quando dependente não faz sentido sem o pai (ex: categories -> budgets).
- Operações de deleção lógica: nunca executar `DELETE`; usar update `SET is_deleted = true`.
- Repositories de leitura devem garantir `WHERE is_deleted = false`.

## 4. Padrões de Repositories

- Cada repository retorna `Either<Data, DomainError[]>`.
- Erros de infraestrutura encapsulados em `RepositoryError`.
- Mapper sempre isola conversões banco <-> domínio; não acessar linhas direto no use case.
- Save/Update: usar `updated_at = NOW()`.
- Insert: setar `created_at` e `updated_at` para `NOW()` caso não venham do domínio.

## 5. Transações / UnitOfWork

- Via `connection.transaction(async (client) => { ... })`.
- Rollback automático em erro; log reduzido (não expor SQL sensível).
- Cada UnitOfWork é atômica e retorna Either.

## 6. Índices Recomendados

- Colunas de Filtro frequente: `is_deleted`, `budget_id`, `category_id`, `account_id`.
- Composto: `(budget_id, is_deleted)` em entidades multi-orçamento.
- Futuro: índices parciais para `status` em transações agendadas/overdue se houver alta volumetria.

## 7. Migrations

- Idempotentes via histórico em `pgmigrations`.
- Nunca alterar migration já aplicada em produção; criar nova migration de ajuste.

## 8. Boas Práticas de Evolução

- Adicionar nova coluna: default + not null se possível; senão, 2 migrations (criar nullable -> preencher -> alterar constraint).
- Renomeações: preferir criar nova coluna + backfill + remover antiga.
- Manter `docs/persistence-conventions.md` atualizado a cada mudança estrutural relevante.

## 9. Auditoria (Planejado)

- Potencial adicionar `created_by`, `updated_by` nas principais tabelas.
- Registrar eventos sensíveis (transferências, pagamentos) em tabela `audit_logs` (futuro).

## 10. Checklist Pull Request (Persistência)

- [ ] Migration criada e revisada.
- [ ] Índices necessários criados.
- [ ] Repositories filtrando `is_deleted`.
- [ ] Mappers atualizados.
- [ ] Testes (unit + integration) cobrindo novo fluxo.
- [ ] Documentação atualizada.

---

Atualize este documento conforme novas necessidades surgirem.
