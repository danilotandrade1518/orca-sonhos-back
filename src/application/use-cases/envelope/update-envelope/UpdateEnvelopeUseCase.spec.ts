import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EnvelopeUpdatedEvent } from '@domain/aggregates/envelope/events/EnvelopeUpdatedEvent';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { Either } from '@either';
import { UpdateEnvelopeUseCase } from './UpdateEnvelopeUseCase';
import { UpdateEnvelopeDto } from './UpdateEnvelopeDto';
import { IGetEnvelopeRepository } from '../../../contracts/repositories/envelope/IGetEnvelopeRepository';
import { IUpdateEnvelopeRepository } from '../../../contracts/repositories/envelope/IUpdateEnvelopeRepository';
import { EnvelopeNotFoundError } from '../../../shared/errors/EnvelopeNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { DuplicateEnvelopeNameError } from '../../../shared/errors/DuplicateEnvelopeNameError';
import { NoFieldsToUpdateError } from '../../../shared/errors/NoFieldsToUpdateError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

class GetEnvelopeRepositoryStub implements IGetEnvelopeRepository {
  public shouldFail = false;
  public shouldReturnNull = false;
  public exists = false;
  public executeCalls: string[] = [];

  constructor(public mockEnvelope: Envelope) {}

  async execute(id: string): Promise<Either<RepositoryError, Envelope | null>> {
    this.executeCalls.push(id);
    if (this.shouldFail) return Either.error(new RepositoryError('fail'));
    if (this.shouldReturnNull) return Either.success(null);
    return Either.success(this.mockEnvelope);
  }

  async existsByName(
    _budgetId: string,
    _name: string,
    _excludeId?: string,
  ): Promise<Either<RepositoryError, boolean>> {
    return Either.success(this.exists);
  }
}

class UpdateEnvelopeRepositoryStub implements IUpdateEnvelopeRepository {
  public shouldFail = false;
  public executeCalls: Envelope[] = [];
  async execute(
    envelope: Envelope,
  ): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(envelope);
    if (this.shouldFail) return Either.error(new RepositoryError('fail'));
    return Either.success();
  }
}

describe('UpdateEnvelopeUseCase', () => {
  let envelope: Envelope;
  let getRepo: GetEnvelopeRepositoryStub;
  let updateRepo: UpdateEnvelopeRepositoryStub;
  let authService: BudgetAuthorizationServiceStub;
  let publisher: EventPublisherStub;
  let useCase: UpdateEnvelopeUseCase;
  let budgetId: string;

  beforeEach(() => {
    budgetId = EntityId.create().value!.id;
    const result = Envelope.create({
      budgetId,
      name: 'Food',
      monthlyAllocation: 1000,
      associatedCategories: [],
    });
    if (result.hasError) throw new Error('invalid');
    envelope = result.data!;
    envelope.clearEvents();

    getRepo = new GetEnvelopeRepositoryStub(envelope);
    updateRepo = new UpdateEnvelopeRepositoryStub();
    authService = new BudgetAuthorizationServiceStub();
    publisher = new EventPublisherStub();
    useCase = new UpdateEnvelopeUseCase(getRepo, updateRepo, authService, publisher);
  });

  it('should update name successfully', async () => {
    const dto: UpdateEnvelopeDto = {
      userId: 'user',
      budgetId,
      envelopeId: envelope.id,
      name: 'Groceries',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(false);
    expect(result.data!.id).toBe(envelope.id);
  });

  it('should validate duplicate name', async () => {
    getRepo.exists = true;
    const dto: UpdateEnvelopeDto = {
      userId: 'user',
      budgetId,
      envelopeId: envelope.id,
      name: 'Groceries',
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(DuplicateEnvelopeNameError);
  });

  it('should return error when no fields provided', async () => {
    const dto: UpdateEnvelopeDto = {
      userId: 'user',
      budgetId,
      envelopeId: envelope.id,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(NoFieldsToUpdateError);
  });

  it('should return error if envelope not found', async () => {
    getRepo.shouldReturnNull = true;
    const dto: UpdateEnvelopeDto = {
      userId: 'user',
      budgetId,
      envelopeId: envelope.id,
      name: 'Groceries',
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeNotFoundError);
  });

  it('should return error when user has no permission', async () => {
    authService.mockHasAccess = false;
    const dto: UpdateEnvelopeDto = {
      userId: 'user',
      budgetId,
      envelopeId: envelope.id,
      name: 'Groceries',
    };
    const result = await useCase.execute(dto);
    expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
  });

  it('should publish event after update', async () => {
    const dto: UpdateEnvelopeDto = {
      userId: 'user',
      budgetId,
      envelopeId: envelope.id,
      name: 'Groceries',
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(false);
    expect(publisher.publishManyCalls[0][0]).toBeInstanceOf(EnvelopeUpdatedEvent);
  });
});
