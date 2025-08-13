import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { EnvelopeNotFoundError } from '../../../shared/errors/EnvelopeNotFoundError';
import { EnvelopeRepositoryError } from '../../../shared/errors/EnvelopeRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetEnvelopeRepositoryStub } from '../../../shared/tests/stubs/GetEnvelopeRepositoryStub';
import { SaveEnvelopeRepositoryStub } from '../../../shared/tests/stubs/SaveEnvelopeRepositoryStub';
import { UpdateEnvelopeDto } from './UpdateEnvelopeDto';
import { UpdateEnvelopeUseCase } from './UpdateEnvelopeUseCase';

describe('UpdateEnvelopeUseCase', () => {
  let useCase: UpdateEnvelopeUseCase;
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

    useCase = new UpdateEnvelopeUseCase(
      getEnvelopeRepositoryStub,
      saveEnvelopeRepositoryStub,
      budgetAuthorizationServiceStub,
    );
  });

  it('should update name successfully', async () => {
    const dto: UpdateEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      name: 'New Name',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(false);
    expect(result.data!.id).toBe(envelope.id);
    expect(envelope.name).toBe('New Name');
  });

  it('should update limit successfully', async () => {
    const dto: UpdateEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      monthlyLimit: 10000,
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(false);
    expect(envelope.monthlyLimit).toBe(10000);
  });

  it('should return error when unauthorized', async () => {
    budgetAuthorizationServiceStub.mockHasAccess = false;

    const dto: UpdateEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      name: 'Name',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
  });

  it('should return error when envelope not found', async () => {
    const dto: UpdateEnvelopeDto = {
      envelopeId: 'non-existent',
      userId: 'user',
      budgetId,
      name: 'Name',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeNotFoundError);
  });

  it('should return error when repository fails', async () => {
    getEnvelopeRepositoryStub.shouldFail = true;
    const dto: UpdateEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      name: 'Name',
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeRepositoryError);
  });

  it('should return error when save fails', async () => {
    saveEnvelopeRepositoryStub.shouldFail = true;
    const dto: UpdateEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      name: 'Name',
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeRepositoryError);
  });

  it('should return error for invalid name', async () => {
    const dto: UpdateEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      name: '',
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
  });

  it('should return error for invalid limit', async () => {
    const dto: UpdateEnvelopeDto = {
      envelopeId: envelope.id,
      userId: 'user',
      budgetId,
      monthlyLimit: -1,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
  });
});
