import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { AddAmountEnvelopeController } from '@http/controllers/envelope/add-amount-envelope.controller';
import { CreateEnvelopeController } from '@http/controllers/envelope/create-envelope.controller';
import { DeleteEnvelopeController } from '@http/controllers/envelope/delete-envelope.controller';
import { RemoveAmountEnvelopeController } from '@http/controllers/envelope/remove-amount-envelope.controller';
import { TransferBetweenEnvelopesController } from '@http/controllers/envelope/transfer-between-envelopes.controller';
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
    {
      method: 'POST',
      path: '/envelope/add-amount-envelope',
      controller: new AddAmountEnvelopeController(
        root.createAddAmountToEnvelopeUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/envelope/remove-amount-envelope',
      controller: new RemoveAmountEnvelopeController(
        root.createRemoveAmountFromEnvelopeUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/envelope/transfer-between-envelopes',
      controller: new TransferBetweenEnvelopesController(
        root.createTransferBetweenEnvelopesUseCase(),
      ),
      middlewares: [
        createBudgetAccessMiddleware(params.auth, 'sourceBudgetId'),
      ],
    },
  ];
}
