import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IDeleteEnvelopeRepository } from '../../../contracts/repositories/envelope/IDeleteEnvelopeRepository';
import { IGetEnvelopeRepository } from '../../../contracts/repositories/envelope/IGetEnvelopeRepository';
import { ISaveEnvelopeRepository } from '../../../contracts/repositories/envelope/ISaveEnvelopeRepository';
import { ITransactionRepository } from '../../../contracts/repositories/transaction/ITransactionRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { EnvelopeDeletionFailedError } from '../../../shared/errors/EnvelopeDeletionFailedError';
import { EnvelopeNotFoundError } from '../../../shared/errors/EnvelopeNotFoundError';
import { EnvelopeRepositoryError } from '../../../shared/errors/EnvelopeRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { DeleteEnvelopeDto } from './DeleteEnvelopeDto';

export class DeleteEnvelopeUseCase implements IUseCase<DeleteEnvelopeDto> {
  constructor(
    private readonly getEnvelopeRepository: IGetEnvelopeRepository,
    private readonly deleteEnvelopeRepository: IDeleteEnvelopeRepository,
    private readonly saveEnvelopeRepository: ISaveEnvelopeRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: DeleteEnvelopeDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const envelopeResult = await this.getEnvelopeRepository.execute(
      dto.envelopeId,
    );

    if (envelopeResult.hasError) {
      return Either.error(new EnvelopeRepositoryError());
    }

    const envelope = envelopeResult.data;
    if (!envelope || envelope.budgetId !== dto.budgetId) {
      return Either.error(new EnvelopeNotFoundError());
    }

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(authResult.errors);
    }

    if (!authResult.data) {
      return Either.error(new InsufficientPermissionsError());
    }

    const txResult = await this.transactionRepository.hasByEnvelope(
      dto.envelopeId,
    );

    if (txResult.hasError) {
      return Either.error(new EnvelopeRepositoryError());
    }

    const hasTransactions = txResult.data ?? false;

    if (!hasTransactions && envelope.balance === 0 && !dto.forceDelete) {
      const delResult = envelope.delete();
      if (delResult.hasError) {
        return Either.errors(delResult.errors);
      }

      const persistResult = await this.deleteEnvelopeRepository.execute(
        envelope.id,
      );

      if (persistResult.hasError) {
        return Either.error(new EnvelopeDeletionFailedError());
      }

      const events = envelope.getEvents();
      if (events.length > 0) {
        try {
          await this.eventPublisher.publishMany(events);
          envelope.clearEvents();
        } catch (error) {
          console.error('Failed to publish events:', error);
        }
      }

      return Either.success({ id: envelope.id, deleted: true });
    } else {
      const deactivateResult = envelope.deactivate();
      if (deactivateResult.hasError) {
        return Either.errors(deactivateResult.errors);
      }

      envelope.setHasTransactions(hasTransactions);

      const persist = await this.saveEnvelopeRepository.execute(envelope);
      if (persist.hasError) {
        return Either.error(new EnvelopeDeletionFailedError());
      }

      const events = envelope.getEvents();
      if (events.length > 0) {
        try {
          await this.eventPublisher.publishMany(events);
          envelope.clearEvents();
        } catch (error) {
          console.error('Failed to publish events:', error);
        }
      }

      return Either.success({ id: envelope.id, deactivated: true });
    }
  }
}
