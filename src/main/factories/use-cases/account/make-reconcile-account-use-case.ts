import { ReconcileAccountUseCase } from '@application/use-cases/account/reconcile-account/ReconcileAccountUseCase';
import { IGetAccountRepository } from '@application/contracts/repositories/account/IGetAccountRepository';
import { IReconcileAccountUnitOfWork } from '@application/contracts/unit-of-works/IReconcileAccountUnitOfWork';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makeReconcileAccountUseCase = (
  getAccountRepository: IGetAccountRepository,
  reconcileAccountUnitOfWork: IReconcileAccountUnitOfWork,
  budgetAuthorizationService: IBudgetAuthorizationService,
  adjustmentCategoryId: string,
): ReconcileAccountUseCase => {
  return new ReconcileAccountUseCase(
    getAccountRepository,
    reconcileAccountUnitOfWork,
    budgetAuthorizationService,
    adjustmentCategoryId,
  );
};
