import { Envelope } from './Envelope';
import { EnvelopeStatus } from './EnvelopeStatus';
import { EnvelopeDeletedEvent } from '../events/EnvelopeDeletedEvent';
import { EnvelopeDeactivatedEvent } from '../events/EnvelopeDeactivatedEvent';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EnvelopeHasBalanceError } from '../errors/EnvelopeHasBalanceError';
import { EnvelopeHasTransactionsError } from '../errors/EnvelopeHasTransactionsError';

const makeDto = (overrides?: Partial<ReturnType<typeof baseData>>) => {
  return { ...baseData(), ...(overrides || {}) } as any;
};

function baseData() {
  return {
    id: EntityId.create().value!.id,
    name: 'Envelope',
    budgetId: EntityId.create().value!.id,
    balance: 0,
    status: EnvelopeStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('Envelope Entity', () => {
  describe('delete', () => {
    it('should delete envelope with zero balance and no transactions', () => {
      const dto = makeDto();
      const env = Envelope.restore(dto).data!;
      const result = env.delete();

      expect(result.hasError).toBe(false);
      expect(env.isDeleted).toBe(true);
      expect(env.getEvents().pop()).toBeInstanceOf(EnvelopeDeletedEvent);
    });

    it('should return error when envelope has balance', () => {
      const dto = makeDto({ balance: 100 });
      const env = Envelope.restore(dto).data!;
      const result = env.delete();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeHasBalanceError);
    });

    it('should return error when envelope has transactions', () => {
      const dto = makeDto();
      dto.hasTransactions = true;
      const env = Envelope.restore(dto).data!;
      const result = env.delete();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeHasTransactionsError);
    });
  });

  describe('deactivate', () => {
    it('should set status to INACTIVE and emit event', () => {
      const env = Envelope.restore(makeDto()).data!;
      const result = env.deactivate();

      expect(result.hasError).toBe(false);
      expect(env.status).toBe(EnvelopeStatus.INACTIVE);
      expect(env.getEvents().pop()).toBeInstanceOf(EnvelopeDeactivatedEvent);
    });
  });
});
