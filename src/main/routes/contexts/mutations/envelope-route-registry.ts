import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { CreateEnvelopeController } from '@http/controllers/envelope/create-envelope.controller';
import { DeleteEnvelopeController } from '@http/controllers/envelope/delete-envelope.controller';
import { UpdateEnvelopeController } from '@http/controllers/envelope/update-envelope.controller';
import { createBudgetAccessMiddleware } from '@http/middlewares/budget-access-middleware';
import { RouteDefinition } from '@http/server-adapter';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { EnvelopeCompositionRoot } from '../../../composition';

export function buildEnvelopeRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const root = new EnvelopeCompositionRoot(params.connection, params.auth);
  return [
    {
      method: 'POST',
      path: '/envelope/create-envelope',
      controller: new CreateEnvelopeController(
        root.createCreateEnvelopeUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/envelope/update-envelope',
      controller: new UpdateEnvelopeController(
        root.createUpdateEnvelopeUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/envelope/delete-envelope',
      controller: new DeleteEnvelopeController(
        root.createDeleteEnvelopeUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
  ];
}
