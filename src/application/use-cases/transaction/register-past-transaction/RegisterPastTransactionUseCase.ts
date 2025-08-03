import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IAddTransactionRepository } from '../../../contracts/repositories/transaction/IAddTransactionRepository';
import { ISaveAccountRepository } from '../../../contracts/repositories/account/ISaveAccountRepository';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IGetCategoryByIdRepository } from '../../../contracts/repositories/category/IGetCategoryByIdRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { CategoryNotFoundError } from '../../../shared/errors/CategoryNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionCreationFailedError } from '../../../shared/errors/TransactionCreationFailedError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { AccountPersistenceFailedError } from '../../../shared/errors/AccountPersistenceFailedError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { RegisterPastTransactionDto } from './RegisterPastTransactionDto';

export class RegisterPastTransactionUseCase
  implements IUseCase<RegisterPastTransactionDto>
{
  constructor(
    private readonly addTransactionRepository: IAddTransactionRepository,
    private readonly saveAccountRepository: ISaveAccountRepository,
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly getCategoryRepository: IGetCategoryByIdRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: RegisterPastTransactionDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const accountResult = await this.getAccountRepository.execute(dto.accountId);

    if (accountResult.hasError) {
      return Either.errors([new AccountRepositoryError()]);
    }

    if (!accountResult.data) {
      return Either.errors([new AccountNotFoundError()]);
    }

    const account = accountResult.data;

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      account.budgetId!,
    );

    if (authResult.hasError) {
      return Either.errors(authResult.errors);
    }

    if (!authResult.data) {
      return Either.errors([new InsufficientPermissionsError()]);
    }

    const categoryResult = await this.getCategoryRepository.execute(dto.categoryId);
    if (categoryResult.hasError) {
      return Either.errors(categoryResult.errors);
    }

    if (!categoryResult.data) {
      return Either.errors([new CategoryNotFoundError()]);
    }

    const transactionResult = Transaction.createPastTransaction({
      description: dto.description,
      amount: dto.amount,
      type: dto.type,
      accountId: dto.accountId,
      categoryId: dto.categoryId,
      budgetId: dto.budgetId,
      transactionDate: dto.transactionDate,
    });

    if (transactionResult.hasError) {
      const message = transactionResult.errors.map((e) => e.message).join('; ');
      return Either.errors([new TransactionCreationFailedError(message)]);
    }

    const transaction = transactionResult.data!;

    const balanceResult =
      transaction.type === TransactionTypeEnum.INCOME
        ? account.addAmount(transaction.amount)
        : account.subtractAmount(transaction.amount);

    if (balanceResult.hasError) {
      return Either.errors(balanceResult.errors);
    }

    const saveAccountResult = await this.saveAccountRepository.execute(account);
    if (saveAccountResult.hasError) {
      return Either.errors([new AccountPersistenceFailedError()]);
    }

    const saveTransactionResult = await this.addTransactionRepository.execute(transaction);
    if (saveTransactionResult.hasError) {
      return Either.errors([new TransactionPersistenceFailedError()]);
    }

    const events = transaction.getEvents();
    if (events.length > 0) {
      try {
        await this.eventPublisher.publishMany(events);
        transaction.clearEvents();
      } catch (error) {
        console.error('Failed to publish events:', error);
      }
    }

    return Either.success({ id: transaction.id });
  }
}
