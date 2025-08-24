import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { CreateCreditCardBillController } from '@http/controllers/credit-card-bill/create-credit-card-bill.controller';
import { DeleteCreditCardBillController } from '@http/controllers/credit-card-bill/delete-credit-card-bill.controller';
import { PayCreditCardBillController } from '@http/controllers/credit-card-bill/pay-credit-card-bill.controller';
import { ReopenCreditCardBillController } from '@http/controllers/credit-card-bill/reopen-credit-card-bill.controller';
import { UpdateCreditCardBillController } from '@http/controllers/credit-card-bill/update-credit-card-bill.controller';
import { RouteDefinition } from '@http/server-adapter';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { CreditCardBillCompositionRoot } from '../../../composition';

export function buildCreditCardBillRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const root = new CreditCardBillCompositionRoot(
    params.connection,
    params.auth,
  );
  return [
    {
      method: 'POST',
      path: '/credit-card-bill/create-credit-card-bill',
      controller: new CreateCreditCardBillController(
        root.createCreateCreditCardBillUseCase(),
      ),
    },
    {
      method: 'POST',
      path: '/credit-card-bill/update-credit-card-bill',
      controller: new UpdateCreditCardBillController(
        root.createUpdateCreditCardBillUseCase(),
      ),
    },
    {
      method: 'POST',
      path: '/credit-card-bill/delete-credit-card-bill',
      controller: new DeleteCreditCardBillController(
        root.createDeleteCreditCardBillUseCase(),
      ),
    },
    {
      method: 'POST',
      path: '/credit-card-bill/pay-credit-card-bill',
      controller: new PayCreditCardBillController(
        root.createPayCreditCardBillUseCase(),
      ),
    },
    {
      method: 'POST',
      path: '/credit-card-bill/reopen-credit-card-bill',
      controller: new ReopenCreditCardBillController(
        root.createReopenCreditCardBillUseCase(),
      ),
    },
  ];
}
