import { CreateAccountUseCase } from '@application/use-cases/account/create-account/CreateAccountUseCase';
import { IAddAccountRepository } from '@application/contracts/repositories/account/IAddAccountRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makeCreateAccountUseCase = (
  addAccountRepository: IAddAccountRepository,
  budgetAuthorizationService: IBudgetAuthorizationService,
): CreateAccountUseCase => {
  return new CreateAccountUseCase(
    addAccountRepository,
    budgetAuthorizationService,
  );
};
