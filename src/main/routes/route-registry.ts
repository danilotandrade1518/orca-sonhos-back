import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { ExpressHttpServerAdapter } from '@http/adapters/express-adapter';
import { RouteDefinition } from '@http/server-adapter';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { buildAccountRoutes } from './contexts/mutations/account-route-registry';
import { buildBudgetRoutes } from './contexts/mutations/budget-route-registry';
import { buildCategoryRoutes } from './contexts/mutations/category-route-registry';
import { buildCreditCardBillRoutes } from './contexts/mutations/credit-card-bill-route-registry';
import { buildCreditCardRoutes } from './contexts/mutations/credit-card-route-registry';
import { buildEnvelopeRoutes } from './contexts/mutations/envelope-route-registry';
import { buildGoalRoutes } from './contexts/mutations/goal-route-registry';
import { buildTransactionRoutes } from './contexts/mutations/transaction-route-registry';

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
    ...buildBudgetRoutes({
      connection,
      auth: budgetAuthorizationService,
    }),
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
    ...buildCategoryRoutes({ connection, auth: budgetAuthorizationService }),
  ];

  server.registerRoutes(routes);
}
