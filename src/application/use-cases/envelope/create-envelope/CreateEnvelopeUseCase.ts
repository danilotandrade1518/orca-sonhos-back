import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IAddEnvelopeRepository } from '../../../contracts/repositories/envelope/IAddEnvelopeRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { CreateEnvelopeDto } from './CreateEnvelopeDto';

export class CreateEnvelopeUseCase implements IUseCase<CreateEnvelopeDto> {
  constructor(
    private readonly addEnvelopeRepository: IAddEnvelopeRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: CreateEnvelopeDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors(authResult.errors);
    }

    const envelopeResult = Envelope.create({
      name: dto.name,
      monthlyLimit: dto.monthlyLimit,
      budgetId: dto.budgetId,
      categoryId: dto.categoryId,
    });

    if (envelopeResult.hasError) {
      return Either.errors(envelopeResult.errors);
    }

    const envelope = envelopeResult.data!;

    const saveResult = await this.addEnvelopeRepository.execute(envelope);
    if (saveResult.hasError) {
      return Either.errors(saveResult.errors);
    }

    return Either.success({
      id: envelope.id,
    });
  }
}
