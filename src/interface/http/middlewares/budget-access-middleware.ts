import { IBudgetAuthorizationService } from '../../../application/services/authorization/IBudgetAuthorizationService';
import { PermissionDeniedError } from '../../../application/shared/errors/PermissionDeniedError';
import { HttpMiddleware } from '../http-types';

export function createBudgetAccessMiddleware(
  authorizationService: IBudgetAuthorizationService,
  budgetIdParam: string = 'budgetId',
): HttpMiddleware {
  return async (req, next) => {
    const principal = req.principal;
    if (!principal) throw new PermissionDeniedError('Missing principal');

    const params = req.params as Record<string, string>;

    const budgetId = params[budgetIdParam];
    if (!budgetId) return next(); // if route doesn't have budget id param, skip

    const result = await authorizationService.canAccessBudget(
      principal.userId,
      budgetId,
    );

    if (result.hasError || !result.data)
      throw new PermissionDeniedError('User cannot access budget');

    return next();
  };
}
