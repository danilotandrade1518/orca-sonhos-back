import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IAddTransactionRepository } from '../../../contracts/repositories/transaction/IAddTransactionRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionCreationFailedError } from '../../../shared/errors/TransactionCreationFailedError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { CreateTransactionDto } from './CreateTransactionDto';

export class CreateTransactionUseCase
  implements IUseCase<CreateTransactionDto>
{
  constructor(
    private readonly addTransactionRepository: IAddTransactionRepository,
    private readonly getAccountRepository: IGetAccountRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: CreateTransactionDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        authResult.errors,
      );
    }

    if (!authResult.data) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new InsufficientPermissionsError(),
      ]);
    }

    const accountResult = await this.getAccountRepository.execute(
      dto.accountId,
    );

    if (accountResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new AccountRepositoryError(),
      ]);
    }

    if (!accountResult.data) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new AccountNotFoundError(),
      ]);
    }

    const transactionResult = Transaction.create({
      description: dto.description,
      amount: dto.amount,
      type: dto.type,
      accountId: dto.accountId,
      categoryId: dto.categoryId,
      budgetId: dto.budgetId,
      transactionDate: dto.transactionDate || new Date(),
    });

    if (transactionResult.hasError) {
      const errorMessage = transactionResult.errors
        .map((e) => e.message)
        .join('; ');
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new TransactionCreationFailedError(errorMessage),
      ]);
    }

    const transaction = transactionResult.data!;

    const saveResult = await this.addTransactionRepository.execute(transaction);

    if (saveResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>([
        new TransactionPersistenceFailedError(),
      ]);
    }

    return Either.success<DomainError | ApplicationError, UseCaseResponse>({
      id: transaction.id,
    });
  }
}
