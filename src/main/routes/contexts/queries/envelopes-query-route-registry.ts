import { RouteDefinition } from '@http/server-adapter';
import { DefaultResponseBuilder } from '@http/builders/DefaultResponseBuilder';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { AuthTokenInvalidError } from '@application/shared/errors/AuthTokenInvalidError';

import { ListEnvelopesQueryHandler } from '@application/queries/budget/list-envelopes/ListEnvelopesQueryHandler';
import { ListEnvelopesDao } from '@infrastructure/database/pg/daos/envelope/list-envelopes/ListEnvelopesDao';
import {
  queriesTotal,
  queryLatencyMs,
} from '@shared/observability/query-metrics';

export function buildEnvelopeQueryRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const envelopesDao = new ListEnvelopesDao(params.connection);

  return [
    {
      method: 'GET',
      path: '/envelopes',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'ListEnvelopes';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new ListEnvelopesQueryHandler(
              envelopesDao,
              params.auth,
            );
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
