import { RouteDefinition } from '@http/server-adapter';
import { CreditCardCompositionRoot } from '../../composition';
import { CreateCreditCardController } from '@http/controllers/credit-card/create-credit-card.controller';
import { UpdateCreditCardController } from '@http/controllers/credit-card/update-credit-card.controller';
import { DeleteCreditCardController } from '@http/controllers/credit-card/delete-credit-card.controller';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

export function buildCreditCardRoutes(params: {
  connection: IPostgresConnectionAdapter;
}): RouteDefinition[] {
  const root = new CreditCardCompositionRoot(params.connection);
  return [
    {
      method: 'POST',
      path: '/credit-card/create-credit-card',
      controller: new CreateCreditCardController(
        root.createCreateCreditCardUseCase(),
      ),
    },
    {
      method: 'POST',
      path: '/credit-card/update-credit-card',
      controller: new UpdateCreditCardController(
        root.createUpdateCreditCardUseCase(),
      ),
    },
    {
      method: 'POST',
      path: '/credit-card/delete-credit-card',
      controller: new DeleteCreditCardController(
        root.createDeleteCreditCardUseCase(),
      ),
    },
  ];
}
