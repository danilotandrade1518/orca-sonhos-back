import { RouteDefinition } from '@http/server-adapter';
import { DefaultResponseBuilder } from '@http/builders/DefaultResponseBuilder';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { AuthTokenInvalidError } from '@application/shared/errors/AuthTokenInvalidError';

// Handlers
import { ListBudgetsQueryHandler } from '@application/queries/budget/list-budgets/ListBudgetsQueryHandler';
import { BudgetOverviewQueryHandler } from '@application/queries/budget/budget-overview/BudgetOverviewQueryHandler';

// DAOs
import { ListBudgetsDao } from '@infrastructure/database/pg/daos/budget/list-budgets/ListBudgetsDao';
import { BudgetOverviewDao } from '@infrastructure/database/pg/daos/budget/budget-overview/BudgetOverviewDao';

// Metrics
import {
  queriesTotal,
  queryLatencyMs,
} from '@shared/observability/query-metrics';

export function buildBudgetQueryRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const budgetsDao = new ListBudgetsDao(params.connection);
  const overviewDao = new BudgetOverviewDao(params.connection);

  return [
    // GET /budgets
    {
      method: 'GET',
      path: '/budgets',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'ListBudgets';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new ListBudgetsQueryHandler(budgetsDao);
            const data = await handler.execute({
              userId: req.principal.userId,
            });
            const res = DefaultResponseBuilder.ok(req.requestId, {
              data,
              meta: { count: data.length },
            });
            queriesTotal.labels(queryName, 'true', '200').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            return res;
          } catch (err) {
            queriesTotal.labels(queryName, 'false', '500').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            throw err;
          }
        },
      },
    },

    // GET /budget/:budgetId/overview
    {
      method: 'GET',
      path: '/budget/:budgetId/overview',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'BudgetOverview';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new BudgetOverviewQueryHandler(
              overviewDao,
              params.auth,
            );
            const budgetId = req.params.budgetId;
            const data = await handler.execute({
              budgetId,
              userId: req.principal.userId,
            });
            const res = DefaultResponseBuilder.ok(req.requestId, { data });
            queriesTotal.labels(queryName, 'true', '200').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            return res;
          } catch (err) {
            queriesTotal.labels(queryName, 'false', '500').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            throw err;
          }
        },
      },
    },
  ];
}
