import { RouteDefinition } from '@http/server-adapter';
import { DefaultResponseBuilder } from '@http/builders/DefaultResponseBuilder';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { AuthTokenInvalidError } from '@application/shared/errors/AuthTokenInvalidError';

import { ListAccountsQueryHandler } from '@application/queries/budget/list-accounts/ListAccountsQueryHandler';
import { ListAccountsDao } from '@infrastructure/database/pg/daos/account/list-accounts/ListAccountsDao';
import {
  queriesTotal,
  queryLatencyMs,
} from '@shared/observability/query-metrics';

export function buildAccountQueryRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const accountsDao = new ListAccountsDao(params.connection);

  return [
    {
      method: 'GET',
      path: '/accounts',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'ListAccounts';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new ListAccountsQueryHandler(
              accountsDao,
              params.auth,
            );
            const budgetId = req.query.budgetId;
            const data = await handler.execute({
              budgetId,
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
  ];
}
