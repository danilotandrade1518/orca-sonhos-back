import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { ExpressHttpServerAdapter } from '@http/adapters/express-adapter';
import { MeController } from '@http/controllers/auth/me.controller';
import { RouteDefinition } from '@http/server-adapter';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { buildAccountQueryRoutes } from './contexts/queries/accounts-query-route-registry';
import { buildBudgetQueryRoutes } from './contexts/queries/budgets-query-route-registry';
import { buildCategoryQueryRoutes } from './contexts/queries/categories-query-route-registry';
import { buildEnvelopeQueryRoutes } from './contexts/queries/envelopes-query-route-registry';
import { buildGoalQueryRoutes } from './contexts/queries/goals-query-route-registry';
import { buildTransactionQueryRoutes } from './contexts/queries/transactions-query-route-registry';
import { buildUsersQueryRoutes } from './contexts/queries/users-query-route-registry';

export interface QueryRegistryDeps {
  server: ExpressHttpServerAdapter;
  connection: IPostgresConnectionAdapter;
  budgetAuthorizationService: IBudgetAuthorizationService;
}

export function registerQueryRoutes(deps: QueryRegistryDeps) {
  const { server, connection, budgetAuthorizationService } = deps;

  const routes: RouteDefinition[] = [
    ...buildBudgetQueryRoutes({
      connection,
      auth: budgetAuthorizationService,
    }),
    ...buildUsersQueryRoutes({ connection }),
    ...buildAccountQueryRoutes({
      connection,
      auth: budgetAuthorizationService,
    }),
    ...buildEnvelopeQueryRoutes({
      connection,
      auth: budgetAuthorizationService,
    }),
    ...buildGoalQueryRoutes({
      connection,
      auth: budgetAuthorizationService,
    }),
    ...buildTransactionQueryRoutes({
      connection,
      auth: budgetAuthorizationService,
    }),
    ...buildCategoryQueryRoutes({ connection }),
    { method: 'GET', path: '/me', controller: new MeController() },
  ];

  server.registerRoutes(routes);
}
