import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { DomainError } from '@domain/shared/DomainError';

import { Either } from '../../../../shared/core/either';
import { IAddAccountRepository } from '../../../contracts/repositories/account/IAddAccountRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { IUseCase, UseCaseResponse } from './../../../shared/IUseCase';
import { CreateAccountDto } from './CreateAccountDto';

export class CreateAccountUseCase implements IUseCase<CreateAccountDto> {
  constructor(private readonly addAccountRepository: IAddAccountRepository) {}

  async execute(dto: CreateAccountDto) {
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
