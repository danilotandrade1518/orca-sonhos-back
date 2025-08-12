import { UpdateAccountUseCase } from '@application/use-cases/account/update-account/UpdateAccountUseCase';
import { IGetAccountRepository } from '@application/contracts/repositories/account/IGetAccountRepository';
import { ISaveAccountRepository } from '@application/contracts/repositories/account/ISaveAccountRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makeUpdateAccountUseCase = (
  getAccountRepository: IGetAccountRepository,
  saveAccountRepository: ISaveAccountRepository,
  budgetAuthorizationService: IBudgetAuthorizationService,
): UpdateAccountUseCase => {
  return new UpdateAccountUseCase(
    getAccountRepository,
    saveAccountRepository,
    budgetAuthorizationService,
  );
};
