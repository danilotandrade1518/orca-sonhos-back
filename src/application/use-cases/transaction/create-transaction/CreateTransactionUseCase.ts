import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IAddTransactionRepository } from '../../../contracts/repositories/transaction/IAddTransactionRepository';
import { IFindAccountByIdRepository } from '../../../contracts/repositories/account/IFindAccountByIdRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { TransactionCreationFailedError } from '../../../shared/errors/TransactionCreationFailedError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { IUseCase } from '../../../shared/IUseCase';
import { UseCaseResponse } from '../../../shared/IUseCase';
import { CreateTransactionDto } from './CreateTransactionDto';

export class CreateTransactionUseCase
  implements IUseCase<CreateTransactionDto>
{
  constructor(
    private readonly addTransactionRepository: IAddTransactionRepository,
    private readonly findAccountRepository: IFindAccountByIdRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: CreateTransactionDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const accountResult = await this.findAccountRepository.execute(
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

    const events = transaction.getEvents();
    if (events.length > 0) {
      try {
        await this.eventPublisher.publishMany(events);
        transaction.clearEvents();
      } catch (error) {
        console.error('Failed to publish events:', error);
      }
    }

    return Either.success<DomainError | ApplicationError, UseCaseResponse>({
      id: transaction.id,
    });
  }
}
