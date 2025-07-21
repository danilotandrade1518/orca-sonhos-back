import { CategoryDeletedEvent } from './CategoryDeletedEvent';

describe('CategoryDeletedEvent', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-03T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create event with provided properties', () => {
    const event = new CategoryDeletedEvent('cat-id', 'Food', 'budget-id');

    expect(event.aggregateId).toBe('cat-id');
    expect(event.categoryName).toBe('Food');
    expect(event.budgetId).toBe('budget-id');
    expect(event.occurredOn).toEqual(new Date('2024-01-03T00:00:00.000Z'));
    expect(event.eventVersion).toBe(1);
  });
});
