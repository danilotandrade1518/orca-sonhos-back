import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { Envelope } from '../envelope-entity/Envelope';
import { EnvelopeLimitExceededError } from '../errors/EnvelopeLimitExceededError';
import { InsufficientEnvelopeBalanceError } from '../errors/InsufficientEnvelopeBalanceError';
import { TransferBetweenEnvelopesService } from './TransferBetweenEnvelopesService';

const makeEnvelope = (budgetId: string, limit: number, balance = 0) => {
  const env = Envelope.create({
    name: 'Env',
    monthlyLimit: limit,
    budgetId,
    categoryId: EntityId.create().value!.id,
  }).data!;
  if (balance > 0) env.addAmount(balance);
  return env;
};

describe('TransferBetweenEnvelopesService', () => {
  let service: TransferBetweenEnvelopesService;
  const budgetId = EntityId.create().value!.id;

  beforeEach(() => {
    service = new TransferBetweenEnvelopesService();
  });

  it('should transfer amount successfully', () => {
    const source = makeEnvelope(budgetId, 10000, 5000);
    const target = makeEnvelope(budgetId, 10000, 1000);

    const result = service.createTransferOperation(source, target, 2000, budgetId);

    expect(result.hasError).toBe(false);
    expect(source.currentBalance).toBe(3000);
    expect(target.currentBalance).toBe(3000);
  });

  it('should fail when budgets differ', () => {
    const source = makeEnvelope(budgetId, 10000, 5000);
    const target = makeEnvelope(EntityId.create().value!.id, 10000, 1000);

    const result = service.createTransferOperation(source, target, 1000, budgetId);

    expect(result.hasError).toBe(true);
  });

  it('should fail with non positive amount', () => {
    const source = makeEnvelope(budgetId, 10000, 5000);
    const target = makeEnvelope(budgetId, 10000, 1000);

    const result = service.createTransferOperation(source, target, 0, budgetId);

    expect(result.hasError).toBe(true);
  });

  it('should fail when source has insufficient balance', () => {
    const source = makeEnvelope(budgetId, 10000, 500);
    const target = makeEnvelope(budgetId, 10000, 1000);

    const result = service.createTransferOperation(source, target, 1000, budgetId);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientEnvelopeBalanceError);
  });

  it('should fail when target exceeds limit', () => {
    const source = makeEnvelope(budgetId, 10000, 8000);
    const target = makeEnvelope(budgetId, 10000, 9000);

    const result = service.createTransferOperation(source, target, 2000, budgetId);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(EnvelopeLimitExceededError);
  });
});
