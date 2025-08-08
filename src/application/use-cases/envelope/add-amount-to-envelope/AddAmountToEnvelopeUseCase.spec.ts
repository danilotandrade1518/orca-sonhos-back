import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EnvelopeLimitExceededError } from '@domain/aggregates/envelope/errors/EnvelopeLimitExceededError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { EnvelopeNotFoundError } from '../../../shared/errors/EnvelopeNotFoundError';
import { EnvelopeRepositoryError } from '../../../shared/errors/EnvelopeRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetEnvelopeRepositoryStub } from '../../../shared/tests/stubs/GetEnvelopeRepositoryStub';
import { SaveEnvelopeRepositoryStub } from '../../../shared/tests/stubs/SaveEnvelopeRepositoryStub';
import { AddAmountToEnvelopeDto } from './AddAmountToEnvelopeDto';
import { AddAmountToEnvelopeUseCase } from './AddAmountToEnvelopeUseCase';

describe('AddAmountToEnvelopeUseCase', () => {
  let useCase: AddAmountToEnvelopeUseCase;
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

    useCase = new AddAmountToEnvelopeUseCase(
      getEnvelopeRepositoryStub,
      saveEnvelopeRepositoryStub,
      budgetAuthorizationServiceStub,
    );
  });

  it('should add amount successfully', async () => {
    const dto: AddAmountToEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      amount: 1000,
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(false);
    expect(envelope.currentBalance).toBe(1000);
  });

  it('should return error when unauthorized', async () => {
    budgetAuthorizationServiceStub.mockHasAccess = false;
    const dto: AddAmountToEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      amount: 1000,
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
  });

  it('should return error when envelope not found', async () => {
    const dto: AddAmountToEnvelopeDto = {
      envelopeId: 'non-existent',
      userId: 'user',
      budgetId,
      amount: 1000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeNotFoundError);
  });

  it('should return error when amount exceeds limit', async () => {
    const dto: AddAmountToEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      amount: 10000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeLimitExceededError);
  });

  it('should return error when repository fails', async () => {
    getEnvelopeRepositoryStub.shouldFail = true;
    const dto: AddAmountToEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      amount: 1000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeRepositoryError);
  });

  it('should return error when save fails', async () => {
    saveEnvelopeRepositoryStub.shouldFail = true;
    const dto: AddAmountToEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      amount: 1000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeRepositoryError);
  });
});
