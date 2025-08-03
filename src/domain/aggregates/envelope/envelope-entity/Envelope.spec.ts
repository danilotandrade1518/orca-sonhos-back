import { Envelope } from './Envelope';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { EnvelopeUpdatedEvent } from '../events/EnvelopeUpdatedEvent';

describe('Envelope.update', () => {
  const createEnvelope = () => {
    const result = Envelope.create({
      budgetId: EntityId.create().value!.id,
      name: 'Groceries',
      monthlyAllocation: 1000,
      associatedCategories: [EntityId.create().value!.id],
    });
    if (result.hasError) throw new Error('invalid envelope');
    const env = result.data!;
    env.clearEvents();
    return env;
  };

  it('should update name and emit event', () => {
    const env = createEnvelope();
    const res = env.update({ name: 'Food' });
    expect(res.hasError).toBe(false);
    expect(env.name).toBe('Food');
    const events = env.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(EnvelopeUpdatedEvent);
  });

  it('should not emit event if nothing changed', () => {
    const env = createEnvelope();
    const res = env.update({});
    expect(res.hasError).toBe(false);
    expect(env.getEvents()).toHaveLength(0);
  });

  it('should accumulate errors for invalid data', () => {
    const env = createEnvelope();
    const res = env.update({ name: '' });
    expect(res.hasError).toBe(true);
  });
});
