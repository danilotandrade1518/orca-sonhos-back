import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { CreateCategoryController } from '@http/controllers/category/create-category.controller';
import { DeleteCategoryController } from '@http/controllers/category/delete-category.controller';
import { UpdateCategoryController } from '@http/controllers/category/update-category.controller';
import { createBudgetAccessMiddleware } from '@http/middlewares/budget-access-middleware';
import { RouteDefinition } from '@http/server-adapter';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { CategoryCompositionRoot } from '../../../composition/CategoryCompositionRoot';

export function buildCategoryRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const root = new CategoryCompositionRoot(params.connection);

  return [
    {
      method: 'POST',
      path: '/category/create-category',
      controller: new CreateCategoryController(
        root.createCreateCategoryUseCase(),
      ),
      middlewares: [createBudgetAccessMiddleware(params.auth, 'budgetId')],
    },
    {
      method: 'POST',
      path: '/category/update-category',
      controller: new UpdateCategoryController(
        root.createUpdateCategoryUseCase(),
      ),
      // Nota: Update não tem budgetId no body, apenas id da categoria
      // A autorização precisaria buscar a categoria primeiro para obter o budgetId
      // Por enquanto sem middleware, mas isso pode ser uma questão de segurança
    },
    {
      method: 'POST',
      path: '/category/delete-category',
      controller: new DeleteCategoryController(
        root.createDeleteCategoryUseCase(),
      ),
      // Nota: Delete não tem budgetId no body, apenas id da categoria
      // A autorização precisaria buscar a categoria primeiro para obter o budgetId
      // Por enquanto sem middleware, mas isso pode ser uma questão de segurança
    },
  ];
}
