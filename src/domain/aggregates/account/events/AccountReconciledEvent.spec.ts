import { AccountReconciledEvent } from './AccountReconciledEvent';

describe('AccountReconciledEvent', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create event with provided properties', () => {
    const event = new AccountReconciledEvent(
      'acc-id',
      'budget-id',
      100,
      150,
      50,
      'ajuste',
    );

    expect(event.aggregateId).toBe('acc-id');
    expect(event.budgetId).toBe('budget-id');
    expect(event.previousBalance).toBe(100);
    expect(event.newBalance).toBe(150);
    expect(event.difference).toBe(50);
    expect(event.justification).toBe('ajuste');
    expect(event.occurredOn).toEqual(new Date('2025-01-01T00:00:00.000Z'));
    expect(event.eventVersion).toBe(1);
  });
});
