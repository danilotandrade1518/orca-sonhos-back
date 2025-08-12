import { DeleteAccountUseCase } from '@application/use-cases/account/delete-account/DeleteAccountUseCase';
import { IGetAccountRepository } from '@application/contracts/repositories/account/IGetAccountRepository';
import { IDeleteAccountRepository } from '@application/contracts/repositories/account/IDeleteAccountRepository';
import { ICheckAccountDependenciesRepository } from '@application/contracts/repositories/account/ICheckAccountDependenciesRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makeDeleteAccountUseCase = (
  getAccountRepository: IGetAccountRepository,
  deleteAccountRepository: IDeleteAccountRepository,
  checkAccountDependenciesRepository: ICheckAccountDependenciesRepository,
  budgetAuthorizationService: IBudgetAuthorizationService,
): DeleteAccountUseCase => {
  return new DeleteAccountUseCase(
    getAccountRepository,
    deleteAccountRepository,
    checkAccountDependenciesRepository,
    budgetAuthorizationService,
  );
};
