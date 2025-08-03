import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IGetCategoryByIdRepository } from '../../../contracts/repositories/category/IGetCategoryByIdRepository';
import { IRegisterPastTransactionUnitOfWork } from '../../../contracts/unit-of-works/IRegisterPastTransactionUnitOfWork';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { CategoryNotFoundError } from '../../../shared/errors/CategoryNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionCreationFailedError } from '../../../shared/errors/TransactionCreationFailedError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { RegisterPastTransactionDto } from './RegisterPastTransactionDto';

export class RegisterPastTransactionUseCase
  implements IUseCase<RegisterPastTransactionDto>
{
  constructor(
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly getCategoryRepository: IGetCategoryByIdRepository,
    private readonly unitOfWork: IRegisterPastTransactionUnitOfWork,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: RegisterPastTransactionDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors(authResult.errors);
    }

    if (!authResult.data) {
      return Either.error(new InsufficientPermissionsError());
    }

    const accountResult = await this.getAccountRepository.execute(dto.accountId);

    if (accountResult.hasError) {
      return Either.error(new AccountRepositoryError());
    }

    const account = accountResult.data;
    if (!account || account.budgetId !== dto.budgetId) {
      return Either.error(new AccountNotFoundError());
    }

    const categoryResult = await this.getCategoryRepository.execute(dto.categoryId);
    if (categoryResult.hasError) {
      return Either.errors(categoryResult.errors);
    }

    const category = categoryResult.data;
    if (!category || category.budgetId !== dto.budgetId) {
      return Either.error(new CategoryNotFoundError());
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
      const reason = transactionResult.errors.map((e) => e.message).join('; ');
      return Either.error(new TransactionCreationFailedError(reason));
    }

    const transaction = transactionResult.data!;

    const operation =
      transaction.type === TransactionTypeEnum.EXPENSE
        ? account.subtractAmount(transaction.amount)
        : account.addAmount(transaction.amount);
    if (operation.hasError) {
      return Either.errors(operation.errors);
    }

    const uowResult = await this.unitOfWork.execute({
      account,
      transaction,
    });

    if (uowResult.hasError) {
      return Either.error(new TransactionPersistenceFailedError());
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
