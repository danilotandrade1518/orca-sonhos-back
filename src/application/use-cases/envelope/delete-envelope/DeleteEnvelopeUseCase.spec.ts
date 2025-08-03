import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EnvelopeStatus } from '@domain/aggregates/envelope/envelope-entity/EnvelopeStatus';
import { EnvelopeDeletedEvent } from '@domain/aggregates/envelope/events/EnvelopeDeletedEvent';
import { EnvelopeDeactivatedEvent } from '@domain/aggregates/envelope/events/EnvelopeDeactivatedEvent';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { EnvelopeDeletionFailedError } from '../../../shared/errors/EnvelopeDeletionFailedError';
import { EnvelopeNotFoundError } from '../../../shared/errors/EnvelopeNotFoundError';
import { EnvelopeRepositoryError } from '../../../shared/errors/EnvelopeRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { DeleteEnvelopeRepositoryStub } from '../../../shared/tests/stubs/DeleteEnvelopeRepositoryStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetEnvelopeRepositoryStub } from '../../../shared/tests/stubs/GetEnvelopeRepositoryStub';
import { SaveEnvelopeRepositoryStub } from '../../../shared/tests/stubs/SaveEnvelopeRepositoryStub';
import { TransactionRepositoryStub } from '../../../shared/tests/stubs/TransactionRepositoryStub';
import { DeleteEnvelopeDto } from './DeleteEnvelopeDto';
import { DeleteEnvelopeUseCase } from './DeleteEnvelopeUseCase';

const makeEnvelope = (balance = 0) => {
  const dto = {
    id: EntityId.create().value!.id,
    name: 'Env',
    budgetId: EntityId.create().value!.id,
    balance,
    status: EnvelopeStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return Envelope.restore(dto).data!;
};

describe('DeleteEnvelopeUseCase', () => {
  let useCase: DeleteEnvelopeUseCase;
  let getRepo: GetEnvelopeRepositoryStub;
  let deleteRepo: DeleteEnvelopeRepositoryStub;
  let saveRepo: SaveEnvelopeRepositoryStub;
  let txRepo: TransactionRepositoryStub;
  let authService: BudgetAuthorizationServiceStub;
  let eventPublisher: EventPublisherStub;
  let envelope: Envelope;

  beforeEach(() => {
    getRepo = new GetEnvelopeRepositoryStub();
    deleteRepo = new DeleteEnvelopeRepositoryStub();
    saveRepo = new SaveEnvelopeRepositoryStub();
    txRepo = new TransactionRepositoryStub();
    authService = new BudgetAuthorizationServiceStub();
    eventPublisher = new EventPublisherStub();
    envelope = makeEnvelope();
    getRepo.mockEnvelope = envelope;
    authService.mockHasAccess = true;
    useCase = new DeleteEnvelopeUseCase(
      getRepo,
      deleteRepo,
      saveRepo,
      txRepo,
      authService,
      eventPublisher,
    );
  });

  it('should delete envelope physically when empty', async () => {
    const dto: DeleteEnvelopeDto = {
      userId: 'user',
      budgetId: envelope.budgetId,
      envelopeId: envelope.id,
    };

    const result = await useCase.execute(dto);

    expect(result.hasData).toBe(true);
    expect(deleteRepo.executeCalls).toContain(envelope.id);
    expect(eventPublisher.publishManyCalls[0][0]).toBeInstanceOf(
      EnvelopeDeletedEvent,
    );
  });

  it('should deactivate envelope when has balance', async () => {
    envelope = makeEnvelope(100);
    getRepo.mockEnvelope = envelope;

    const dto: DeleteEnvelopeDto = {
      userId: 'user',
      budgetId: envelope.budgetId,
      envelopeId: envelope.id,
    };

    const result = await useCase.execute(dto);

    expect(result.hasData).toBe(true);
    expect(saveRepo.executeCalls[0]).toBe(envelope);
    expect(eventPublisher.publishManyCalls[0][0]).toBeInstanceOf(
      EnvelopeDeactivatedEvent,
    );
  });

  it('should deactivate envelope when has transactions', async () => {
    txRepo.hasTransactionsResult = true;

    const dto: DeleteEnvelopeDto = {
      userId: 'user',
      budgetId: envelope.budgetId,
      envelopeId: envelope.id,
    };

    const result = await useCase.execute(dto);

    expect(result.hasData).toBe(true);
    expect(saveRepo.executeCalls[0]).toBe(envelope);
    expect(eventPublisher.publishManyCalls[0][0]).toBeInstanceOf(
      EnvelopeDeactivatedEvent,
    );
  });

  it('should return error when envelope not found', async () => {
    getRepo.shouldReturnNull = true;
    const dto: DeleteEnvelopeDto = {
      userId: 'user',
      budgetId: envelope.budgetId,
      envelopeId: 'invalid',
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeNotFoundError);
  });

  it('should return error when user has no permission', async () => {
    authService.mockHasAccess = false;
    const dto: DeleteEnvelopeDto = {
      userId: 'user',
      budgetId: envelope.budgetId,
      envelopeId: envelope.id,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
  });

  it('should return error when repositories fail', async () => {
    getRepo.shouldFail = true;
    const dto: DeleteEnvelopeDto = {
      userId: 'user',
      budgetId: envelope.budgetId,
      envelopeId: envelope.id,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeRepositoryError);
  });

  it('should return error when delete repository fails', async () => {
    deleteRepo.shouldFail = true;
    const dto: DeleteEnvelopeDto = {
      userId: 'user',
      budgetId: envelope.budgetId,
      envelopeId: envelope.id,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeDeletionFailedError);
  });
});
