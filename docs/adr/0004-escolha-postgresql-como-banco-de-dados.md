# ADR-0004: Escolha do PostgreSQL como Banco de Dados Principal

## Status

Aceito

## Contexto

O projeto OrçaSonhos é um sistema de gestão financeira pessoal que precisa de um banco de dados confiável para armazenar informações críticas como orçamentos, contas, transações e metas financeiras. A escolha do banco de dados impacta diretamente na:

- **Integridade dos dados financeiros** (transações ACID)
- **Performance das consultas** (relatórios e análises)
- **Flexibilidade para evolução** (novos recursos)
- **Integração com o ecossistema TypeScript/Node.js**
- **Facilidade de desenvolvimento e manutenção**

### Características do Sistema

O OrçaSonhos possui as seguintes características que influenciam a escolha do banco:

1. **Estrutura Relacional Forte**

   - Hierarquia: Orçamentos → Contas → Transações
   - Relacionamentos complexos: Usuários ↔ Orçamentos (many-to-many)
   - Integridade referencial crítica

2. **Dados Financeiros**

   - Precisão decimal obrigatória para valores monetários
   - Consistência transacional (transferências entre contas)
   - Auditoria e rastreabilidade

3. **Consultas Complexas**

   - Relatórios por período, categoria, conta
   - Agregações (somas, médias, tendências)
   - Análises temporais para metas

4. **Campos Semi-Estruturados**
   - Configurações de usuário
   - Metadados de transações
   - Listas de participantes em orçamentos

## Opções Consideradas

### 1. PostgreSQL

**Prós:**

- ACID completo com transações robustas
- Tipos de dados avançados (DECIMAL, JSONB, ENUM)
- Performance excelente em consultas analíticas
- Suporte nativo a JSON com índices eficientes
- Ecosystem maduro com TypeORM
- Window functions e CTEs para relatórios
- Open source com comunidade ativa

**Contras:**

- Curva de aprendizado ligeiramente maior
- Consumo de memória um pouco maior que MySQL

### 2. MySQL

**Prós:**

- Popularidade e documentação abundante
- Performance boa para operações simples
- Ecosystem conhecido

**Contras:**

- Suporte a JSON limitado (melhor apenas na versão 8.0+)
- Window functions chegaram tarde (8.0)
- Tipos DECIMAL menos precisos
- Integração com TypeORM menos robusta

### 3. MongoDB

**Prós:**

- Flexibilidade de schema
- Performance em operações simples
- Suporte nativo a JSON

**Contras:**

- Sem ACID multi-documento (crítico para finanças)
- Consultas analíticas complexas são verbosas
- Relacionamentos não são o forte
- Integridade referencial manual
- TypeORM support limitado

## Decisão

**Escolhemos PostgreSQL** como banco de dados principal do OrçaSonhos.

### Justificativas Principais

1. **Integridade Financeira**

   - ACID completo garante consistência em transferências
   - Transações robustas para operações críticas
   - Constraints e triggers para validações

2. **Tipos de Dados Ideais**

   ```sql
   -- Precisão monetária
   amount DECIMAL(15,2) NOT NULL

   -- Enums tipados
   transaction_type transaction_type_enum NOT NULL

   -- Dados semi-estruturados eficientes
   participant_ids JSONB NOT NULL DEFAULT '[]'::jsonb
   ```

3. **Performance Analítica**

   - Window functions para análises temporais
   - CTEs para relatórios complexos
   - Índices GIN para campos JSON
   - Particionamento para grandes volumes

4. **Ecosystem TypeScript**

   - TypeORM com suporte excelente
   - Drivers maduros (pg, pg-pool)
   - Types bem definidos

5. **Flexibilidade Futura**
   - JSONB para configurações dinâmicas
   - Extensões (uuid-ossp, pgcrypto)
   - Replicação e sharding nativos

## Consequências

### Positivas

- **Confiabilidade:** ACID garante consistência dos dados financeiros
- **Performance:** Consultas analíticas otimizadas para relatórios
- **Flexibilidade:** JSONB permite evolução sem migrations complexas
- **Ecosystem:** Integração natural com Node.js/TypeScript
- **Escalabilidade:** Preparado para crescimento futuro

### Negativas

- **Curva de Aprendizado:** Equipe precisa se familiarizar com PostgreSQL
- **Recursos:** Consome um pouco mais de memória que MySQL
- **Deployment:** Configuração inicial ligeiramente mais complexa

## Implementação

### Stack Tecnológica

```typescript
// Banco de Dados
PostgreSQL 15+

// ORM
TypeORM 0.3+ com decorators

// Migrations
TypeORM CLI

// Connection Pool
pg-pool com configuração otimizada
```

### Estrutura Base

```sql
-- Exemplo de tabela otimizada
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type transaction_type_enum NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices otimizados
CREATE INDEX idx_transactions_account_date ON transactions(account_id, created_at);
CREATE INDEX idx_transactions_metadata ON transactions USING GIN (metadata);
```

## Revisão

Este ADR deve ser revisado em 6 meses para avaliar:

- Performance real em produção
- Facilidade de desenvolvimento
- Escalabilidade observada
- Feedback da equipe

---

**Data:** 2025-07-18  
**Autor:** Equipe OrçaSonhos  
**Status:** Aceito  
**Revisão:** 2025-12-18
