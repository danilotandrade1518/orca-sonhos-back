import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { AddParticipantToBudgetController } from '@http/controllers/budget/add-participant.controller';
import { CreateBudgetController } from '@http/controllers/budget/create-budget.controller';
import { DeleteBudgetController } from '@http/controllers/budget/delete-budget.controller';
import { RemoveParticipantFromBudgetController } from '@http/controllers/budget/remove-participant.controller';
import { UpdateBudgetController } from '@http/controllers/budget/update-budget.controller';
import { createBudgetAccessMiddleware } from '@http/middlewares/budget-access-middleware';
import { RouteDefinition } from '@http/server-adapter';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { BudgetCompositionRoot } from '../../../composition/BudgetCompositionRoot';

export function buildBudgetRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const root = new BudgetCompositionRoot(params.connection, params.auth);

  return [
    {
      method: 'POST',
      path: '/budget/create-budget',
      controller: new CreateBudgetController(root.createCreateBudgetUseCase()),
    },
    {
      method: 'POST',
      path: '/budget/update-budget',
      controller: new UpdateBudgetController(root.createUpdateBudgetUseCase()),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/budget/delete-budget',
      controller: new DeleteBudgetController(root.createDeleteBudgetUseCase()),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/budget/add-participant',
      controller: new AddParticipantToBudgetController(
        root.createAddParticipantToBudgetUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/budget/remove-participant',
      controller: new RemoveParticipantFromBudgetController(
        root.createRemoveParticipantFromBudgetUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
  ];
}
