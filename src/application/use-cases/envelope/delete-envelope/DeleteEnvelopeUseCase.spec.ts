import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { EnvelopeDeletionFailedError } from '../../../shared/errors/EnvelopeDeletionFailedError';
import { EnvelopeNotFoundError } from '../../../shared/errors/EnvelopeNotFoundError';
import { EnvelopeRepositoryError } from '../../../shared/errors/EnvelopeRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetEnvelopeRepositoryStub } from '../../../shared/tests/stubs/GetEnvelopeRepositoryStub';
import { SaveEnvelopeRepositoryStub } from '../../../shared/tests/stubs/SaveEnvelopeRepositoryStub';
import { DeleteEnvelopeDto } from './DeleteEnvelopeDto';
import { DeleteEnvelopeUseCase } from './DeleteEnvelopeUseCase';

describe('DeleteEnvelopeUseCase', () => {
  let useCase: DeleteEnvelopeUseCase;
  let getEnvelopeRepositoryStub: GetEnvelopeRepositoryStub;
  let saveEnvelopeRepositoryStub: SaveEnvelopeRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let envelope: Envelope;
  let budgetId: string;

  beforeEach(() => {
    getEnvelopeRepositoryStub = new GetEnvelopeRepositoryStub();
    saveEnvelopeRepositoryStub = new SaveEnvelopeRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();

    budgetId = EntityId.create().value!.id;

    envelope = Envelope.create({
      name: 'Env',
      monthlyLimit: 5000,
      budgetId,
      categoryId: EntityId.create().value!.id,
    }).data!;

    getEnvelopeRepositoryStub.mockEnvelopes = { [envelope.id]: envelope };
    budgetAuthorizationServiceStub.mockHasAccess = true;

    useCase = new DeleteEnvelopeUseCase(
      getEnvelopeRepositoryStub,
      saveEnvelopeRepositoryStub,
      budgetAuthorizationServiceStub,
    );
  });

  it('should delete envelope successfully', async () => {
    const dto: DeleteEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(false);
    expect(result.data!.id).toBe(envelope.id);
    expect(envelope.isDeleted).toBe(true);
  });

  it('should not delete envelope with balance', async () => {
    envelope.addAmount(1000);
    const dto: DeleteEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeDeletionFailedError);
  });

  it('should return error when unauthorized', async () => {
    budgetAuthorizationServiceStub.mockHasAccess = false;
    const dto: DeleteEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
  });

  it('should return error when envelope not found', async () => {
    const dto: DeleteEnvelopeDto = {
      envelopeId: 'non-existent',
      userId: 'user',
      budgetId,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeNotFoundError);
  });

  it('should return error when repository fails', async () => {
    getEnvelopeRepositoryStub.shouldFail = true;
    const dto: DeleteEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeRepositoryError);
  });

  it('should return error when save fails', async () => {
    saveEnvelopeRepositoryStub.shouldFail = true;
    const dto: DeleteEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeRepositoryError);
  });
});
