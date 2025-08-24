import { RouteDefinition } from '@http/server-adapter';
import { DefaultResponseBuilder } from '@http/builders/DefaultResponseBuilder';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { AuthTokenInvalidError } from '@application/shared/errors/AuthTokenInvalidError';

import { ListGoalsQueryHandler } from '@application/queries/budget/list-goals/ListGoalsQueryHandler';
import { ListGoalsDao } from '@infrastructure/database/pg/daos/goal/list-goals/ListGoalsDao';
import {
  queriesTotal,
  queryLatencyMs,
} from '@shared/observability/query-metrics';

export function buildGoalQueryRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const goalsDao = new ListGoalsDao(params.connection);

  return [
    {
      method: 'GET',
      path: '/goals',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'ListGoals';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new ListGoalsQueryHandler(goalsDao, params.auth);
            const data = await handler.execute({
              budgetId: req.query.budgetId,
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
