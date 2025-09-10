import { AddAmountGoalController } from '@http/controllers/goal/add-amount-goal.controller';
import { CreateGoalController } from '@http/controllers/goal/create-goal.controller';
import { DeleteGoalController } from '@http/controllers/goal/delete-goal.controller';
import { RemoveAmountGoalController } from '@http/controllers/goal/remove-amount-goal.controller';
import { UpdateGoalController } from '@http/controllers/goal/update-goal.controller';
import { RouteDefinition } from '@http/server-adapter';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { GoalCompositionRoot } from '../../../composition';

export function buildGoalRoutes(params: {
  connection: IPostgresConnectionAdapter;
}): RouteDefinition[] {
  const root = new GoalCompositionRoot(params.connection);
  return [
    {
      method: 'POST',
      path: '/goal/create-goal',
      controller: new CreateGoalController(root.createCreateGoalUseCase()),
    },
    {
      method: 'POST',
      path: '/goal/update-goal',
      controller: new UpdateGoalController(root.createUpdateGoalUseCase()),
    },
    {
      method: 'POST',
      path: '/goal/delete-goal',
      controller: new DeleteGoalController(root.createDeleteGoalUseCase()),
    },
    {
      method: 'POST',
      path: '/goal/add-amount-goal',
      controller: new AddAmountGoalController(
        root.createAddAmountToGoalUseCase(),
      ),
    },
    {
      method: 'POST',
      path: '/goal/remove-amount-goal',
      controller: new RemoveAmountGoalController(
        root.createRemoveAmountFromGoalUseCase(),
      ),
    },
  ];
}
