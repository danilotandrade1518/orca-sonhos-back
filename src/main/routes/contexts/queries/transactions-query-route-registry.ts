import { RouteDefinition } from '@http/server-adapter';
import { DefaultResponseBuilder } from '@http/builders/DefaultResponseBuilder';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { AuthTokenInvalidError } from '@application/shared/errors/AuthTokenInvalidError';

import { ListTransactionsQueryHandler } from '@application/queries/budget/list-transactions/ListTransactionsQueryHandler';
import { ListTransactionsDao } from '@infrastructure/database/pg/daos/transaction/list-transactions/ListTransactionsDao';
import {
  queriesTotal,
  queryLatencyMs,
} from '@shared/observability/query-metrics';

export function buildTransactionQueryRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const transactionsDao = new ListTransactionsDao(params.connection);

  return [
    {
      method: 'GET',
      path: '/transactions',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'ListTransactions';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new ListTransactionsQueryHandler(
              transactionsDao,
              params.auth,
            );
            const page = req.query.page ? Number(req.query.page) : undefined;
            const pageSize = req.query.pageSize
              ? Number(req.query.pageSize)
              : undefined;
            const dateFrom = req.query.dateFrom
              ? new Date(req.query.dateFrom)
              : undefined;
            const dateTo = req.query.dateTo
              ? new Date(req.query.dateTo)
              : undefined;
            const result = await handler.execute({
              budgetId: req.query.budgetId,
              userId: req.principal.userId,
              page,
              pageSize,
              accountId: req.query.accountId,
              categoryId: req.query.categoryId,
              dateFrom,
              dateTo,
            });
            const res = DefaultResponseBuilder.ok(req.requestId, {
              data: result.items,
              meta: result.meta,
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
