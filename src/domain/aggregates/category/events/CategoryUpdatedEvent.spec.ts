import { CategoryUpdatedEvent } from './CategoryUpdatedEvent';
import { CategoryTypeEnum } from '../value-objects/category-type/CategoryType';

describe('CategoryUpdatedEvent', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-02T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create event with provided properties', () => {
    const event = new CategoryUpdatedEvent(
      'cat-id',
      'Food',
      'Groceries',
      CategoryTypeEnum.EXPENSE,
      CategoryTypeEnum.EXPENSE,
    );

    expect(event.aggregateId).toBe('cat-id');
    expect(event.previousName).toBe('Food');
    expect(event.newName).toBe('Groceries');
    expect(event.previousType).toBe(CategoryTypeEnum.EXPENSE);
    expect(event.newType).toBe(CategoryTypeEnum.EXPENSE);
    expect(event.occurredOn).toEqual(new Date('2024-01-02T00:00:00.000Z'));
    expect(event.eventVersion).toBe(1);
  });
});
