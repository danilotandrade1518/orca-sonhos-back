import { RouteDefinition } from '@http/server-adapter';
import { AccountCompositionRoot } from '../../composition';
import { CreateAccountController } from '@http/controllers/account/create-account.controller';
import { UpdateAccountController } from '@http/controllers/account/update-account.controller';
import { DeleteAccountController } from '@http/controllers/account/delete-account.controller';
import { ReconcileAccountController } from '@http/controllers/account/reconcile-account.controller';
import { TransferBetweenAccountsController } from '@http/controllers/account/transfer-between-accounts.controller';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { createBudgetAccessMiddleware } from '@http/middlewares/budget-access-middleware';

export function buildAccountRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
  adjustmentCategoryId: string;
  transferCategoryId: string;
}): RouteDefinition[] {
  const root = new AccountCompositionRoot(
    params.connection,
    params.auth,
    params.adjustmentCategoryId,
    params.transferCategoryId,
  );
  return [
    {
      method: 'POST',
      path: '/account/create-account',
      controller: new CreateAccountController(
        root.createCreateAccountUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/account/update-account',
      controller: new UpdateAccountController(
        root.createUpdateAccountUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/account/delete-account',
      controller: new DeleteAccountController(
        root.createDeleteAccountUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/account/reconcile-account',
      controller: new ReconcileAccountController(
        root.createReconcileAccountUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/account/transfer-between-accounts',
      controller: new TransferBetweenAccountsController(
        root.createTransferBetweenAccountsUseCase(),
      ),
      middlewares: [
        createBudgetAccessMiddleware(params.auth, 'sourceBudgetId'),
      ],
    },
  ];
}
