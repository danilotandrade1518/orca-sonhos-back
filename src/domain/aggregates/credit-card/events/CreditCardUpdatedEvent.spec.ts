import { CreditCardUpdatedEvent } from './CreditCardUpdatedEvent';

describe('CreditCardUpdatedEvent', () => {
  it('should set properties', () => {
    const event = new CreditCardUpdatedEvent(
      'id',
      'old',
      'new',
      1000,
      2000,
      1,
      2,
      10,
      20,
    );
    expect(event.aggregateId).toBe('id');
    expect(event.previousName).toBe('old');
    expect(event.newName).toBe('new');
    expect(event.previousLimit).toBe(1000);
    expect(event.newLimit).toBe(2000);
    expect(event.previousClosingDay).toBe(1);
    expect(event.newClosingDay).toBe(2);
    expect(event.previousDueDay).toBe(10);
    expect(event.newDueDay).toBe(20);
    expect(event.eventVersion).toBe(1);
  });
});
