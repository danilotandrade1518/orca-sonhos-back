import { Either } from '@either';

import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { ISaveAccountRepository } from '../../../contracts/repositories/account/ISaveAccountRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountPersistenceFailedError } from '../../../shared/errors/AccountPersistenceFailedError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { AccountUpdateFailedError } from '../../../shared/errors/AccountUpdateFailedError';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { IUseCase } from '../../../shared/IUseCase';
import { UpdateAccountDto } from './UpdateAccountDto';

export class UpdateAccountUseCase implements IUseCase<UpdateAccountDto> {
  constructor(
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly saveAccountRepository: ISaveAccountRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: UpdateAccountDto,
  ): Promise<Either<ApplicationError, { id: string }>> {
    const accountResult = await this.getAccountRepository.execute(dto.id);

    if (accountResult.hasError) {
      return Either.error(new AccountRepositoryError());
    }

    if (!accountResult.data) {
      return Either.error(new AccountNotFoundError());
    }

    const existingAccount = accountResult.data;

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      existingAccount.budgetId!,
    );

    if (authResult.hasError) {
      return Either.errors<ApplicationError, { id: string }>(authResult.errors);
    }

    if (!authResult.data) {
      return Either.error(new InsufficientPermissionsError());
    }

    const updateResult = existingAccount.update({
      name: dto.name,
      description: dto.description,
      initialBalance: dto.initialBalance,
    });

    if (updateResult.hasError) {
      const errorMessage = updateResult.errors.map((e) => e.message).join('; ');
      return Either.error(new AccountUpdateFailedError(errorMessage));
    }

    const updatedAccount = updateResult.data!;

    const saveResult = await this.saveAccountRepository.execute(updatedAccount);

    if (saveResult.hasError) {
      return Either.error(new AccountPersistenceFailedError());
    }

    return Either.success({ id: updatedAccount.id });
  }
}
