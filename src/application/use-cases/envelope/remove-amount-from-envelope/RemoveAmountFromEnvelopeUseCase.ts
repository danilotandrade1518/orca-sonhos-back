import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IGetEnvelopeRepository } from '../../../contracts/repositories/envelope/IGetEnvelopeRepository';
import { ISaveEnvelopeRepository } from '../../../contracts/repositories/envelope/ISaveEnvelopeRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { EnvelopeNotFoundError } from '../../../shared/errors/EnvelopeNotFoundError';
import { EnvelopeRepositoryError } from '../../../shared/errors/EnvelopeRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { RemoveAmountFromEnvelopeDto } from './RemoveAmountFromEnvelopeDto';

export class RemoveAmountFromEnvelopeUseCase
  implements IUseCase<RemoveAmountFromEnvelopeDto>
{
  constructor(
    private readonly getEnvelopeRepository: IGetEnvelopeRepository,
    private readonly saveEnvelopeRepository: ISaveEnvelopeRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: RemoveAmountFromEnvelopeDto,
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

    const removeResult = envelope.removeAmount(dto.amount);
    if (removeResult.hasError) {
      return Either.errors(removeResult.errors);
    }

    const saveResult = await this.saveEnvelopeRepository.execute(envelope);
    if (saveResult.hasError) {
      return Either.error(new EnvelopeRepositoryError());
    }

    return Either.success({ id: envelope.id });
  }
}
