import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { Either } from '@either';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { IUseCase } from '../../../shared/IUseCase';
import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IGetEnvelopeRepository } from '../../../contracts/repositories/envelope/IGetEnvelopeRepository';
import { IUpdateEnvelopeRepository } from '../../../contracts/repositories/envelope/IUpdateEnvelopeRepository';
import { UpdateEnvelopeDto } from './UpdateEnvelopeDto';
import { EnvelopeNotFoundError } from '../../../shared/errors/EnvelopeNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { EnvelopeRepositoryError } from '../../../shared/errors/EnvelopeRepositoryError';
import { EnvelopePersistenceFailedError } from '../../../shared/errors/EnvelopePersistenceFailedError';
import { DuplicateEnvelopeNameError } from '../../../shared/errors/DuplicateEnvelopeNameError';
import { NoFieldsToUpdateError } from '../../../shared/errors/NoFieldsToUpdateError';
import { EnvelopeUpdateFailedError } from '../../../shared/errors/EnvelopeUpdateFailedError';

export class UpdateEnvelopeUseCase implements IUseCase<UpdateEnvelopeDto> {
  constructor(
    private readonly getEnvelopeRepository: IGetEnvelopeRepository,
    private readonly updateEnvelopeRepository: IUpdateEnvelopeRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(dto: UpdateEnvelopeDto): Promise<Either<ApplicationError, { id: string }>> {
    const envelopeResult = await this.getEnvelopeRepository.execute(dto.envelopeId);
    if (envelopeResult.hasError) {
      return Either.error(new EnvelopeRepositoryError());
    }

    const envelope = envelopeResult.data;
    if (!envelope) {
      return Either.error(new EnvelopeNotFoundError());
    }

    const auth = await this.budgetAuthorizationService.canAccessBudget(dto.userId, envelope.budgetId);
    if (auth.hasError) return Either.errors(auth.errors);
    if (!auth.data) return Either.error(new InsufficientPermissionsError());

    if (
      dto.name === undefined &&
      dto.description === undefined &&
      dto.monthlyAllocation === undefined &&
      dto.associatedCategories === undefined &&
      dto.color === undefined &&
      dto.icon === undefined
    ) {
      return Either.error(new NoFieldsToUpdateError());
    }

    if (dto.name && dto.name !== envelope.name && this.getEnvelopeRepository.existsByName) {
      const existsResult = await this.getEnvelopeRepository.existsByName(dto.budgetId, dto.name, envelope.id);
      if (existsResult.hasError) return Either.error(new EnvelopeRepositoryError());
      if (existsResult.data) return Either.error(new DuplicateEnvelopeNameError());
    }

    const updateResult = envelope.update({
      name: dto.name,
      description: dto.description,
      monthlyAllocation: dto.monthlyAllocation,
      associatedCategories: dto.associatedCategories,
      color: dto.color,
      icon: dto.icon,
    });

    if (updateResult.hasError) {
      const errorMessage = updateResult.errors.map((e) => e.message).join('; ');
      return Either.error(new EnvelopeUpdateFailedError(errorMessage));
    }

    const persist = await this.updateEnvelopeRepository.execute(envelope);
    if (persist.hasError) return Either.error(new EnvelopePersistenceFailedError());

    const events = envelope.getEvents();
    if (events.length > 0) {
      try {
        await this.eventPublisher.publishMany(events);
        envelope.clearEvents();
      } catch (e) {
        console.error('Failed to publish events:', e);
      }
    }

    return Either.success({ id: envelope.id });
  }
}
