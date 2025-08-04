import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EnvelopeHasBalanceError } from '../errors/EnvelopeHasBalanceError';
import { EnvelopeHasTransactionsError } from '../errors/EnvelopeHasTransactionsError';
import { EnvelopeDeactivatedEvent } from '../events/EnvelopeDeactivatedEvent';
import { EnvelopeDeletedEvent } from '../events/EnvelopeDeletedEvent';
import { ContributionSource } from '../value-objects/ContributionSource';
import { Envelope, RestoreEnvelopeDTO } from './Envelope';
import { EnvelopeStatus } from './EnvelopeStatus';

const makeRestoreEnvelopeDTO = (
  overrides: Partial<RestoreEnvelopeDTO> = {},
): RestoreEnvelopeDTO => {
  const baseData = {
    id: EntityId.create().value!.id,
    name: 'Envelope',
    budgetId: EntityId.create().value!.id,
    balance: 0,
    status: EnvelopeStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { ...baseData, ...overrides };
};

const makeEnvelope = () => {
  const result = Envelope.create({
    budgetId: EntityId.create().value!.id,
    name: 'Test',
    balance: 100,
  });

  return result.data!;
};

describe('Envelope Entity', () => {
  describe('delete', () => {
    it('should delete envelope with zero balance and no transactions', () => {
      const dto = makeRestoreEnvelopeDTO();
      const env = Envelope.restore(dto).data!;
      const result = env.delete();

      expect(result.hasError).toBe(false);
      expect(env.isDeleted).toBe(true);
      expect(env.getEvents().pop()).toBeInstanceOf(EnvelopeDeletedEvent);
    });

    it('should return error when envelope has balance', () => {
      const dto = makeRestoreEnvelopeDTO({ balance: 100 });
      const env = Envelope.restore(dto).data!;
      const result = env.delete();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeHasBalanceError);
    });

    it('should return error when envelope has transactions', () => {
      const dto = makeRestoreEnvelopeDTO();
      dto.hasTransactions = true;
      const env = Envelope.restore(dto).data!;
      const result = env.delete();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeHasTransactionsError);
    });
  });

  describe('deactivate', () => {
    it('should set status to INACTIVE and emit event', () => {
      const env = Envelope.restore(makeRestoreEnvelopeDTO()).data!;
      const result = env.deactivate();

      expect(result.hasError).toBe(false);
      expect(env.status).toBe(EnvelopeStatus.INACTIVE);
      expect(env.getEvents().pop()).toBeInstanceOf(EnvelopeDeactivatedEvent);
    });
  });

  describe('EnvelopeContribution', () => {
    it('should create contribution with valid data', () => {
      const envelope = makeEnvelope();
      const result = envelope.makeContribution({
        amount: 100,
        source: ContributionSource.MANUAL,
        description: 'Aporte',
      });
      expect(result.hasError).toBe(false);
      expect(envelope.balance).toBe(200);
      expect(envelope.contributions.length).toBe(1);
    });

    it('should not allow negative contribution amount', () => {
      const envelope = makeEnvelope();
      const result = envelope.makeContribution({
        amount: -10,
        source: ContributionSource.MANUAL,
      });
      expect(result.hasError).toBe(true);
    });

    it('should emit event on contribution', () => {
      const envelope = makeEnvelope();
      envelope.makeContribution({
        amount: 50,
        source: ContributionSource.MANUAL,
      });
      const events = envelope.getEvents();
      expect(events.length).toBe(1);
    });
  });
});
