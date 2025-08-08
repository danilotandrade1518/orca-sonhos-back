import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EnvelopeLimitExceededError } from '@domain/aggregates/envelope/errors/EnvelopeLimitExceededError';
import { InsufficientEnvelopeBalanceError } from '@domain/aggregates/envelope/errors/InsufficientEnvelopeBalanceError';
import { TransferBetweenEnvelopesService } from '@domain/aggregates/envelope/services/TransferBetweenEnvelopesService';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { EnvelopeNotFoundError } from '../../../shared/errors/EnvelopeNotFoundError';
import { EnvelopeRepositoryError } from '../../../shared/errors/EnvelopeRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetEnvelopeRepositoryStub } from '../../../shared/tests/stubs/GetEnvelopeRepositoryStub';
import { TransferBetweenEnvelopesUnitOfWorkStub } from '../../../shared/tests/stubs/TransferBetweenEnvelopesUnitOfWorkStub';
import { TransferBetweenEnvelopesDto } from './TransferBetweenEnvelopesDto';
import { TransferBetweenEnvelopesUseCase } from './TransferBetweenEnvelopesUseCase';

describe('TransferBetweenEnvelopesUseCase', () => {
  let useCase: TransferBetweenEnvelopesUseCase;
  let getEnvelopeRepositoryStub: GetEnvelopeRepositoryStub;
  let uowStub: TransferBetweenEnvelopesUnitOfWorkStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let transferService: TransferBetweenEnvelopesService;
  let source: Envelope;
  let target: Envelope;
  let budgetId: string;

  beforeEach(() => {
    getEnvelopeRepositoryStub = new GetEnvelopeRepositoryStub();
    uowStub = new TransferBetweenEnvelopesUnitOfWorkStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    transferService = new TransferBetweenEnvelopesService();

    budgetId = EntityId.create().value!.id;

    source = Envelope.create({
      name: 'Source',
      monthlyLimit: 10000,
      budgetId,
      categoryId: EntityId.create().value!.id,
    }).data!;
    source.addAmount(5000);

    target = Envelope.create({
      name: 'Target',
      monthlyLimit: 10000,
      budgetId,
      categoryId: EntityId.create().value!.id,
    }).data!;
    target.addAmount(1000);

    getEnvelopeRepositoryStub.mockEnvelopes = {
      [source.id]: source,
      [target.id]: target,
    };
    budgetAuthorizationServiceStub.mockHasAccess = true;

    useCase = new TransferBetweenEnvelopesUseCase(
      getEnvelopeRepositoryStub,
      transferService,
      uowStub,
      budgetAuthorizationServiceStub,
    );
  });

  it('should transfer successfully', async () => {
    const dto: TransferBetweenEnvelopesDto = {
      sourceEnvelopeId: source.id,
      targetEnvelopeId: target.id,
      userId: 'user',
      budgetId,
      amount: 2000,
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(false);
    expect(source.currentBalance).toBe(3000);
    expect(target.currentBalance).toBe(3000);
    expect(uowStub.executeTransferCalls).toHaveLength(1);
  });

  it('should return error when unauthorized', async () => {
    budgetAuthorizationServiceStub.mockHasAccess = false;
    const dto: TransferBetweenEnvelopesDto = {
      sourceEnvelopeId: source.id,
      targetEnvelopeId: target.id,
      userId: 'user',
      budgetId,
      amount: 2000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
  });

  it('should return error when source envelope not found', async () => {
    const dto: TransferBetweenEnvelopesDto = {
      sourceEnvelopeId: 'missing',
      targetEnvelopeId: target.id,
      userId: 'user',
      budgetId,
      amount: 1000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeNotFoundError);
  });

  it('should return error when target envelope not found', async () => {
    const dto: TransferBetweenEnvelopesDto = {
      sourceEnvelopeId: source.id,
      targetEnvelopeId: 'missing',
      userId: 'user',
      budgetId,
      amount: 1000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeNotFoundError);
  });

  it('should return error when service fails due to insufficient balance', async () => {
    const dto: TransferBetweenEnvelopesDto = {
      sourceEnvelopeId: source.id,
      targetEnvelopeId: target.id,
      userId: 'user',
      budgetId,
      amount: 6000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientEnvelopeBalanceError);
  });

  it('should return error when service fails due to target limit', async () => {
    target.addAmount(8000); // total 9000
    const dto: TransferBetweenEnvelopesDto = {
      sourceEnvelopeId: source.id,
      targetEnvelopeId: target.id,
      userId: 'user',
      budgetId,
      amount: 2000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeLimitExceededError);
  });

  it('should return error when repository fails', async () => {
    getEnvelopeRepositoryStub.shouldFail = true;
    const dto: TransferBetweenEnvelopesDto = {
      sourceEnvelopeId: source.id,
      targetEnvelopeId: target.id,
      userId: 'user',
      budgetId,
      amount: 1000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeRepositoryError);
  });

  it('should return error when unit of work fails', async () => {
    uowStub.shouldFail = true;
    const dto: TransferBetweenEnvelopesDto = {
      sourceEnvelopeId: source.id,
      targetEnvelopeId: target.id,
      userId: 'user',
      budgetId,
      amount: 1000,
    };
    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeRepositoryError);
  });
});
