import { CreditCardDeletedEvent } from './CreditCardDeletedEvent';

describe('CreditCardDeletedEvent', () => {
  it('should have aggregate id', () => {
    const event = new CreditCardDeletedEvent('id');
    expect(event.aggregateId).toBe('id');
    expect(event.eventVersion).toBe(1);
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
