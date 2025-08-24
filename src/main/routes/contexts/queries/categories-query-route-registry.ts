import { RouteDefinition } from '@http/server-adapter';
import { DefaultResponseBuilder } from '@http/builders/DefaultResponseBuilder';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { AuthTokenInvalidError } from '@application/shared/errors/AuthTokenInvalidError';

import { ListCategoriesQueryHandler } from '@application/queries/category/list-categories/ListCategoriesQueryHandler';
import { ListCategoriesDao } from '@infrastructure/database/pg/daos/category/list-categories/ListCategoriesDao';
import {
  queriesTotal,
  queryLatencyMs,
} from '@shared/observability/query-metrics';

export function buildCategoryQueryRoutes(params: {
  connection: IPostgresConnectionAdapter;
}): RouteDefinition[] {
  const categoriesDao = new ListCategoriesDao(params.connection);

  return [
    {
      method: 'GET',
      path: '/categories',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'ListCategories';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new ListCategoriesQueryHandler(categoriesDao);
            const data = await handler.execute({
              userId: req.principal.userId,
              budgetId: req.query.budgetId,
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
