import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { ISaveTransactionRepository } from '../../../contracts/repositories/transaction/ISaveTransactionRepository';
import { IGetTransactionRepository } from '../../../contracts/repositories/transaction/IGetTransactionRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { ScheduledTransactionNotFoundError } from '../../../shared/errors/ScheduledTransactionNotFoundError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { CancelScheduledTransactionDto } from './CancelScheduledTransactionDto';

export class CancelScheduledTransactionUseCase
  implements IUseCase<CancelScheduledTransactionDto>
{
  constructor(
    private readonly getTransactionRepository: IGetTransactionRepository,
    private readonly saveTransactionRepository: ISaveTransactionRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: CancelScheduledTransactionDto,
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

    const txResult = await this.getTransactionRepository.execute(
      dto.transactionId,
    );
    if (txResult.hasError || !txResult.data) {
      return Either.error(new ScheduledTransactionNotFoundError());
    }

    const transaction = txResult.data;
    if (transaction.budgetId !== dto.budgetId) {
      return Either.error(new ScheduledTransactionNotFoundError());
    }

    const cancelResult = transaction.cancel(dto.cancellationReason);
    if (cancelResult.hasError) {
      return Either.errors(cancelResult.errors);
    }

    const repoResult =
      await this.saveTransactionRepository.execute(transaction);
    if (repoResult.hasError) {
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
