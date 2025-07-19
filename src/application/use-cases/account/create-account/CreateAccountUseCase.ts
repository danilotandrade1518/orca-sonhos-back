import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IAddAccountRepository } from '../../../contracts/repositories/account/IAddAccountRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { IUseCase, UseCaseResponse } from './../../../shared/IUseCase';
import { CreateAccountDto } from './CreateAccountDto';

export class CreateAccountUseCase implements IUseCase<CreateAccountDto> {
  constructor(
    private readonly addAccountRepository: IAddAccountRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: CreateAccountDto,
  ): Promise<Either<ApplicationError | DomainError, UseCaseResponse>> {
    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors<ApplicationError | DomainError, UseCaseResponse>(
        authResult.errors,
      );
    }

    if (!authResult.data) {
      return Either.error(new InsufficientPermissionsError());
    }

    const accountResult = Account.create({
      name: dto.name,
      type: dto.type as AccountTypeEnum,
      budgetId: dto.budgetId,
      initialBalance: dto.initialBalance,
      description: dto.description,
    });

    if (accountResult.hasError)
      return Either.errors<DomainError, UseCaseResponse>(accountResult.errors);

    const account = accountResult.data!;

    const persistResult = await this.addAccountRepository.execute(account);

    if (persistResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        persistResult.errors,
      );
    }

    return Either.success<ApplicationError, UseCaseResponse>({
      id: account.id,
    });
  }
}
