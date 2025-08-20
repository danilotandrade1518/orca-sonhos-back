import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { ExpressHttpServerAdapter } from '@http/adapters/express-adapter';
import { RouteDefinition } from '@http/server-adapter';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { buildAccountRoutes } from './contexts/account-route-registry';
import { buildCreditCardBillRoutes } from './contexts/credit-card-bill-route-registry';
import { buildCreditCardRoutes } from './contexts/credit-card-route-registry';
import { buildEnvelopeRoutes } from './contexts/envelope-route-registry';
import { buildGoalRoutes } from './contexts/goal-route-registry';
import { buildHealthRoutes } from './contexts/health-route-registry';
import { buildTransactionRoutes } from './contexts/transaction-route-registry';
import { MeController } from '@http/controllers/auth/me.controller';

// Controllers
export interface RouteRegistryDeps {
  server: ExpressHttpServerAdapter;
  connection: IPostgresConnectionAdapter;
  budgetAuthorizationService: IBudgetAuthorizationService;
  categoryIds: {
    adjustmentCategoryId: string;
    transferCategoryId: string;
  };
}

export function registerMutationRoutes(deps: RouteRegistryDeps) {
  const {
    server,
    connection,
    budgetAuthorizationService,
    categoryIds: { adjustmentCategoryId, transferCategoryId },
  } = deps;

  const routes: RouteDefinition[] = [
    ...buildAccountRoutes({
      connection,
      auth: budgetAuthorizationService,
      adjustmentCategoryId,
      transferCategoryId,
    }),
    ...buildTransactionRoutes({ connection, auth: budgetAuthorizationService }),
    ...buildCreditCardRoutes({ connection }),
    ...buildCreditCardBillRoutes({
      connection,
      auth: budgetAuthorizationService,
    }),
    ...buildEnvelopeRoutes({ connection, auth: budgetAuthorizationService }),
    ...buildGoalRoutes({ connection }),
    ...buildHealthRoutes(),
    { method: 'GET', path: '/me', controller: new MeController() },
  ];

  server.registerRoutes(routes);
}
