import { DomainError } from '@domain/shared/DomainError';

import { Either } from '../../../../shared/core/either';
import { IDeleteTransactionRepository } from '../../../contracts/repositories/transaction/IDeleteTransactionRepository';
import { IGetTransactionRepository } from '../../../contracts/repositories/transaction/IGetTransactionRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionNotFoundError } from '../../../shared/errors/TransactionNotFoundError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { DeleteTransactionDto } from './DeleteTransactionDto';

export class DeleteTransactionUseCase
  implements IUseCase<DeleteTransactionDto>
{
  constructor(
    private readonly getTransactionRepository: IGetTransactionRepository,
    private readonly deleteTransactionRepository: IDeleteTransactionRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: DeleteTransactionDto) {
    const transactionResult = await this.getTransactionRepository.execute(
      dto.id,
    );

    if (transactionResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>([
        new TransactionNotFoundError(),
      ]);
    }

    if (!transactionResult.data) {
      return Either.errors<ApplicationError, UseCaseResponse>([
        new TransactionNotFoundError(),
      ]);
    }

    const transaction = transactionResult.data;

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      transaction.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        authResult.errors,
      );
    }

    if (!authResult.data) {
      return Either.errors<ApplicationError, UseCaseResponse>([
        new InsufficientPermissionsError(),
      ]);
    }

    const deleteResult = transaction.delete();

    if (deleteResult.hasError) {
      return Either.errors<DomainError, UseCaseResponse>(deleteResult.errors);
    }

    const deletedTransaction = deleteResult.data!;

    const repositoryResult = await this.deleteTransactionRepository.execute(
      dto.id,
    );

    if (repositoryResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>([
        new TransactionPersistenceFailedError(),
      ]);
    }

    const events = deletedTransaction.getEvents();
    if (events.length > 0) {
      try {
        await this.eventPublisher.publishMany(events);
        deletedTransaction.clearEvents();
      } catch (error) {
        console.error('Failed to publish events:', error);
      }
    }

    return Either.success<ApplicationError, UseCaseResponse>({
      id: deletedTransaction.id,
    });
  }
}
