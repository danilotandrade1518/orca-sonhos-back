import { Either } from '@either';

import { IBudgetAuthorizationService } from '../../../application/services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../application/shared/errors/ApplicationError';
import { InsufficientPermissionsError } from '../../../application/shared/errors/InsufficientPermissionsError';

export class MockBudgetAuthorizationService
  implements IBudgetAuthorizationService
{
  private permissions: Map<string, Set<string>> = new Map();
  private shouldReject = false;

  setUserPermissions(userId: string, budgetIds: string[]): void {
    this.permissions.set(userId, new Set(budgetIds));
  }

  setRejectAll(reject: boolean): void {
    this.shouldReject = reject;
  }

  clearPermissions(): void {
    this.permissions.clear();
    this.shouldReject = false;
  }

  async canAccessBudget(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    budgetId: string,
  ): Promise<Either<ApplicationError, boolean>> {
    if (this.shouldReject) {
      return Either.error(new InsufficientPermissionsError());
    }

    return Either.success(true);
  }
}
