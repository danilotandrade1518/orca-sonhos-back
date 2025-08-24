import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { CancelScheduledTransactionController } from '@http/controllers/transaction/cancel-scheduled-transaction.controller';
import { CreateTransactionController } from '@http/controllers/transaction/create-transaction.controller';
import { DeleteTransactionController } from '@http/controllers/transaction/delete-transaction.controller';
import { MarkTransactionLateController } from '@http/controllers/transaction/mark-transaction-late.controller';
import { UpdateTransactionController } from '@http/controllers/transaction/update-transaction.controller';
import { createBudgetAccessMiddleware } from '@http/middlewares/budget-access-middleware';
import { RouteDefinition } from '@http/server-adapter';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { TransactionCompositionRoot } from '../../../composition';

export function buildTransactionRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const root = new TransactionCompositionRoot(params.connection, params.auth);
  return [
    {
      method: 'POST',
      path: '/transaction/create-transaction',
      controller: new CreateTransactionController(
        root.createCreateTransactionUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/transaction/update-transaction',
      controller: new UpdateTransactionController(
        root.createUpdateTransactionUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/transaction/delete-transaction',
      controller: new DeleteTransactionController(
        root.createDeleteTransactionUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/transaction/cancel-scheduled-transaction',
      controller: new CancelScheduledTransactionController(
        root.createCancelScheduledTransactionUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/transaction/mark-transaction-late',
      controller: new MarkTransactionLateController(
        root.createMarkTransactionLateUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
  ];
}
