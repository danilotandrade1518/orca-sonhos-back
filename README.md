# OrçaSonhos Backend

API de gestão financeira familiar, focada em orçamentos, metas e controle de gastos.

## Como rodar

```bash
# Instale as dependências
npm install

# Rode em modo desenvolvimento
npm run dev

# Com Docker
# (garante que o banco MySQL também suba)
docker-compose up --build
```

## Testes

```bash
# Testes unitários (arquivos .spec.ts)
npm run test:watch

# Testes integrados (arquivos .test.ts)
npm run test:integration

# Cobertura de testes
npm test:coverage
```

## Scripts úteis

- `npm run lint` — Lint do código
- `npm run format` — Formata o código com Prettier

## Contribuição

- Siga o padrão de código (ESLint/Prettier)
- Crie testes para novas funcionalidades
- Use variáveis de ambiente conforme `.env.example`

## Migrations

- As migrations do banco são gerenciadas com [umzug](https://github.com/sequelize/umzug).
- Para rodar as migrations, utilize o script npm correspondente (ver abaixo).
