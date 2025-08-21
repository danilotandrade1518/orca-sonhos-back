// Registry de rotas de queries (views/read)
import { ExpressHttpServerAdapter } from '@http/adapters/express-adapter';
import { RouteDefinition } from '@http/server-adapter';
import { BudgetOverviewQueryHandler } from '@application/queries/budget/budget-overview/BudgetOverviewQueryHandler';
import { BudgetOverviewDao } from '@infrastructure/database/pg/daos/budget/budget-overview/BudgetOverviewDao';
import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { loadEnv } from '../../config/env';

const env = loadEnv();
const pgConnection = new PostgresConnectionAdapter({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

// Dependências a serem injetadas (DAOs, serviços, etc.)
export interface QueryRegistryDeps {
  server: ExpressHttpServerAdapter;
}

export function registerQueryRoutes(deps: QueryRegistryDeps) {
  const { server } = deps;
  const handler = new BudgetOverviewQueryHandler(
    new BudgetOverviewDao(pgConnection),
  );

  const routes: RouteDefinition[] = [
    {
      method: 'GET',
      path: '/budget/:budgetId/overview',
      controller: {
        handle: async (req) => {
          const result = await handler.execute({
            budgetId: req.params.budgetId,
            userId: req.principal?.userId || '',
          });
          return { status: 200, body: { data: result } };
        },
      },
    },
  ];

  server.registerRoutes(routes);
}
