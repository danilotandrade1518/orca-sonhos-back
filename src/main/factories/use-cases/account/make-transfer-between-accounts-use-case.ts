import { TransferBetweenAccountsUseCase } from '@application/use-cases/account/transfer-between-accounts/TransferBetweenAccountsUseCase';
import { IGetAccountRepository } from '@application/contracts/repositories/account/IGetAccountRepository';
import { ITransferBetweenAccountsUnitOfWork } from '@application/contracts/unit-of-works/ITransferBetweenAccountsUnitOfWork';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makeTransferBetweenAccountsUseCase = (
  getAccountRepository: IGetAccountRepository,
  transferUnitOfWork: ITransferBetweenAccountsUnitOfWork,
  budgetAuthorizationService: IBudgetAuthorizationService,
  transferCategoryId: string,
): TransferBetweenAccountsUseCase => {
  return new TransferBetweenAccountsUseCase(
    getAccountRepository,
    transferUnitOfWork,
    budgetAuthorizationService,
    transferCategoryId,
  );
};
