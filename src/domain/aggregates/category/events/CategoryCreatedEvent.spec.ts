import { CategoryCreatedEvent } from './CategoryCreatedEvent';
import { CategoryTypeEnum } from '../value-objects/category-type/CategoryType';

describe('CategoryCreatedEvent', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create event with provided properties', () => {
    const event = new CategoryCreatedEvent(
      'cat-id',
      'Food',
      CategoryTypeEnum.EXPENSE,
      'budget-id',
    );

    expect(event.aggregateId).toBe('cat-id');
    expect(event.categoryId).toBe('cat-id');
    expect(event.categoryName).toBe('Food');
    expect(event.categoryType).toBe(CategoryTypeEnum.EXPENSE);
    expect(event.budgetId).toBe('budget-id');
    expect(event.occurredOn).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(event.eventVersion).toBe(1);
  });
});
