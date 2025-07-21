import { CreditCardCreatedEvent } from './CreditCardCreatedEvent';

describe('CreditCardCreatedEvent', () => {
  it('should set properties', () => {
    const event = new CreditCardCreatedEvent(
      'id',
      'name',
      1000,
      1,
      10,
      'budget',
    );
    expect(event.aggregateId).toBe('id');
    expect(event.creditCardName).toBe('name');
    expect(event.limit).toBe(1000);
    expect(event.closingDay).toBe(1);
    expect(event.dueDay).toBe(10);
    expect(event.budgetId).toBe('budget');
    expect(event.eventVersion).toBe(1);
    expect(event.occurredOn).toBeInstanceOf(Date);
  });
});
