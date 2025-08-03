import { ScheduledTransactionCancelledEvent } from './ScheduledTransactionCancelledEvent';
import { TransactionTypeEnum } from '../value-objects/transaction-type/TransactionType';

describe('ScheduledTransactionCancelledEvent', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should create event with all data', () => {
    const event = new ScheduledTransactionCancelledEvent(
      'tx-1',
      'acc-1',
      'budget-1',
      100,
      TransactionTypeEnum.EXPENSE,
      'Reason',
      new Date('2024-01-02T00:00:00.000Z'),
      'cat-1',
      'cc-1',
      new Date('2024-01-10T00:00:00.000Z'),
    );

    expect(event.aggregateId).toBe('tx-1');
    expect(event.accountId).toBe('acc-1');
    expect(event.budgetId).toBe('budget-1');
    expect(event.amount).toBe(100);
    expect(event.type).toBe(TransactionTypeEnum.EXPENSE);
    expect(event.reason).toBe('Reason');
    expect(event.cancelledAt).toEqual(new Date('2024-01-02T00:00:00.000Z'));
    expect(event.categoryId).toBe('cat-1');
    expect(event.creditCardId).toBe('cc-1');
    expect(event.transactionDate).toEqual(new Date('2024-01-10T00:00:00.000Z'));
    expect(event.occurredOn).toEqual(new Date('2024-01-01T00:00:00.000Z'));
  });
});
