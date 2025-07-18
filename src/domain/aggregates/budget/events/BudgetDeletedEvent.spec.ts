import { BudgetDeletedEvent } from './BudgetDeletedEvent';

describe('BudgetDeletedEvent', () => {
  const budgetId = 'budget-123';
  const ownerId = 'owner-456';
  const name = 'Test Budget';

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create event with required properties', () => {
    const event = new BudgetDeletedEvent(budgetId, ownerId, name);

    expect(event.aggregateId).toBe(budgetId);
    expect(event.ownerId).toBe(ownerId);
    expect(event.name).toBe(name);
    expect(event.occurredOn).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(event.eventVersion).toBe(1);
  });
});
