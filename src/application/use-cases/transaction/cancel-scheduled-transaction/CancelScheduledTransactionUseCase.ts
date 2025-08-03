import { CancellationReason } from '@domain/aggregates/transaction/value-objects/cancellation-reason/CancellationReason';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IGetTransactionRepository } from '../../../contracts/repositories/transaction/IGetTransactionRepository';
import { ISaveTransactionRepository } from '../../../contracts/repositories/transaction/ISaveTransactionRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionNotFoundError } from '../../../shared/errors/TransactionNotFoundError';
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
    const transactionResult = await this.getTransactionRepository.execute(
      dto.id,
    );

    if (transactionResult.hasError || !transactionResult.data) {
      return Either.errors([new TransactionNotFoundError()]);
    }

    const transaction = transactionResult.data;

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      transaction.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors(authResult.errors);
    }

    if (!authResult.data) {
      return Either.error(new InsufficientPermissionsError());
    }

    const reasonVo = CancellationReason.create(dto.reason);

    if (reasonVo.hasError) {
      return Either.errors(reasonVo.errors);
    }

    const cancelResult = transaction.cancel(reasonVo);

    if (cancelResult.hasError) {
      return Either.errors(cancelResult.errors);
    }

    const saveResult =
      await this.saveTransactionRepository.execute(transaction);

    if (saveResult.hasError) {
      return Either.error(new TransactionPersistenceFailedError());
    }

    if (transaction.hasEvents()) {
      try {
        await this.eventPublisher.publishMany(transaction.getEvents());
        transaction.clearEvents();
      } catch (error) {
        console.error('Failed to publish events:', error);
      }
    }

    return Either.success({ id: transaction.id });
  }
}
