import { TransactionDeletedEvent } from './TransactionDeletedEvent';
import { TransactionTypeEnum } from '../value-objects/transaction-type/TransactionType';
import { TransactionStatusEnum } from '../value-objects/transaction-status/TransactionStatus';

describe('TransactionDeletedEvent', () => {
  const validParams = {
    aggregateId: 'transaction-123',
    accountId: 'account-456',
    budgetId: 'budget-789',
    amount: 250.75,
    type: TransactionTypeEnum.EXPENSE,
    description: 'Grocery shopping',
    status: TransactionStatusEnum.COMPLETED,
    categoryId: 'category-groceries',
    creditCardId: 'credit-card-123',
    transactionDate: new Date('2024-01-10T15:30:00.000Z'),
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create event with all required and optional properties', () => {
      const event = new TransactionDeletedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.budgetId,
        validParams.amount,
        validParams.type,
        validParams.description,
        validParams.status,
        validParams.categoryId,
        validParams.creditCardId,
        validParams.transactionDate,
      );

      expect(event.aggregateId).toBe(validParams.aggregateId);
      expect(event.accountId).toBe(validParams.accountId);
      expect(event.budgetId).toBe(validParams.budgetId);
      expect(event.amount).toBe(validParams.amount);
      expect(event.type).toBe(validParams.type);
      expect(event.description).toBe(validParams.description);
      expect(event.status).toBe(validParams.status);
      expect(event.categoryId).toBe(validParams.categoryId);
      expect(event.creditCardId).toBe(validParams.creditCardId);
      expect(event.transactionDate).toBe(validParams.transactionDate);
      expect(event.occurredOn).toEqual(new Date('2024-01-15T10:30:00.000Z'));
      expect(event.eventVersion).toBe(1);
    });

    it('should create event with only required properties', () => {
      const event = new TransactionDeletedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.budgetId,
        validParams.amount,
        validParams.type,
        validParams.description,
        validParams.status,
      );

      expect(event.aggregateId).toBe(validParams.aggregateId);
      expect(event.accountId).toBe(validParams.accountId);
      expect(event.budgetId).toBe(validParams.budgetId);
      expect(event.amount).toBe(validParams.amount);
      expect(event.type).toBe(validParams.type);
      expect(event.description).toBe(validParams.description);
      expect(event.status).toBe(validParams.status);
      expect(event.categoryId).toBeUndefined();
      expect(event.creditCardId).toBeUndefined();
      expect(event.transactionDate).toBeUndefined();
    });

    it('should handle undefined optional properties explicitly', () => {
      const event = new TransactionDeletedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.budgetId,
        validParams.amount,
        validParams.type,
        validParams.description,
        validParams.status,
        undefined,
        undefined,
        undefined,
      );

      expect(event.categoryId).toBeUndefined();
      expect(event.creditCardId).toBeUndefined();
      expect(event.transactionDate).toBeUndefined();
    });

    it('should handle partial optional properties', () => {
      const event = new TransactionDeletedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.budgetId,
        validParams.amount,
        validParams.type,
        validParams.description,
        validParams.status,
        'category-test',
        undefined,
        new Date('2024-01-01'),
      );

      expect(event.categoryId).toBe('category-test');
      expect(event.creditCardId).toBeUndefined();
      expect(event.transactionDate).toEqual(new Date('2024-01-01'));
    });
  });

  describe('transaction types and status', () => {
    it('should handle INCOME transaction deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-income',
        'account-123',
        'budget-456',
        1500.75,
        TransactionTypeEnum.INCOME,
        'Salary payment',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.type).toBe(TransactionTypeEnum.INCOME);
      expect(event.amount).toBe(1500.75);
      expect(event.status).toBe(TransactionStatusEnum.COMPLETED);
    });

    it('should handle EXPENSE transaction deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-expense',
        'account-123',
        'budget-456',
        -89.99,
        TransactionTypeEnum.EXPENSE,
        'Utility bill',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.type).toBe(TransactionTypeEnum.EXPENSE);
      expect(event.amount).toBe(-89.99);
      expect(event.status).toBe(TransactionStatusEnum.COMPLETED);
    });

    it('should handle TRANSFER transaction deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-transfer',
        'account-123',
        'budget-456',
        500,
        TransactionTypeEnum.TRANSFER,
        'Account transfer',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.type).toBe(TransactionTypeEnum.TRANSFER);
      expect(event.amount).toBe(500);
      expect(event.status).toBe(TransactionStatusEnum.COMPLETED);
    });

    it('should handle SCHEDULED transaction deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-scheduled',
        'account-123',
        'budget-456',
        200,
        TransactionTypeEnum.EXPENSE,
        'Scheduled payment',
        TransactionStatusEnum.SCHEDULED,
      );

      expect(event.status).toBe(TransactionStatusEnum.SCHEDULED);
      expect(event.description).toBe('Scheduled payment');
    });

    it('should handle CANCELLED transaction deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-cancelled',
        'account-123',
        'budget-456',
        100,
        TransactionTypeEnum.INCOME,
        'Cancelled transaction',
        TransactionStatusEnum.CANCELLED,
      );

      expect(event.status).toBe(TransactionStatusEnum.CANCELLED);
      expect(event.description).toBe('Cancelled transaction');
    });
  });

  describe('amount validation scenarios', () => {
    it('should handle positive amounts', () => {
      const event = new TransactionDeletedEvent(
        'transaction-positive',
        'account-123',
        'budget-456',
        999.99,
        TransactionTypeEnum.INCOME,
        'Income transaction',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.amount).toBe(999.99);
    });

    it('should handle negative amounts', () => {
      const event = new TransactionDeletedEvent(
        'transaction-negative',
        'account-123',
        'budget-456',
        -150.5,
        TransactionTypeEnum.EXPENSE,
        'Expense transaction',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.amount).toBe(-150.5);
    });

    it('should handle zero amount', () => {
      const event = new TransactionDeletedEvent(
        'transaction-zero',
        'account-123',
        'budget-456',
        0,
        TransactionTypeEnum.TRANSFER,
        'Zero amount transaction',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.amount).toBe(0);
    });

    it('should handle decimal amounts with precision', () => {
      const event = new TransactionDeletedEvent(
        'transaction-decimal',
        'account-123',
        'budget-456',
        123.456789,
        TransactionTypeEnum.INCOME,
        'Precise amount',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.amount).toBe(123.456789);
    });

    it('should handle very large amounts', () => {
      const largeAmount = 9999999999.99;
      const event = new TransactionDeletedEvent(
        'transaction-large',
        'account-123',
        'budget-456',
        largeAmount,
        TransactionTypeEnum.INCOME,
        'Large transaction',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.amount).toBe(largeAmount);
    });
  });

  describe('date handling', () => {
    it('should handle transaction date in the past', () => {
      const pastDate = new Date('2023-12-01T09:00:00.000Z');
      const event = new TransactionDeletedEvent(
        'transaction-past',
        'account-123',
        'budget-456',
        100,
        TransactionTypeEnum.EXPENSE,
        'Past transaction',
        TransactionStatusEnum.COMPLETED,
        undefined,
        undefined,
        pastDate,
      );

      expect(event.transactionDate).toBe(pastDate);
    });

    it('should handle transaction date in the future', () => {
      const futureDate = new Date('2025-12-01T18:00:00.000Z');
      const event = new TransactionDeletedEvent(
        'transaction-future',
        'account-123',
        'budget-456',
        200,
        TransactionTypeEnum.INCOME,
        'Future transaction',
        TransactionStatusEnum.SCHEDULED,
        undefined,
        undefined,
        futureDate,
      );

      expect(event.transactionDate).toBe(futureDate);
    });

    it('should handle same date as deletion', () => {
      const sameDate = new Date('2024-01-15T10:30:00.000Z');
      const event = new TransactionDeletedEvent(
        'transaction-same-date',
        'account-123',
        'budget-456',
        150,
        TransactionTypeEnum.TRANSFER,
        'Same date transaction',
        TransactionStatusEnum.COMPLETED,
        undefined,
        undefined,
        sameDate,
      );

      expect(event.transactionDate).toBe(sameDate);
      expect(event.occurredOn).toEqual(sameDate);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const event = new TransactionDeletedEvent(
        '',
        '',
        '',
        0,
        TransactionTypeEnum.INCOME,
        '',
        TransactionStatusEnum.COMPLETED,
        '',
        '',
      );

      expect(event.aggregateId).toBe('');
      expect(event.accountId).toBe('');
      expect(event.budgetId).toBe('');
      expect(event.description).toBe('');
      expect(event.categoryId).toBe('');
      expect(event.creditCardId).toBe('');
    });

    it('should handle very long string values', () => {
      const longString = 'a'.repeat(1000);
      const event = new TransactionDeletedEvent(
        longString,
        longString + '-account',
        longString + '-budget',
        100,
        TransactionTypeEnum.EXPENSE,
        longString + '-description',
        TransactionStatusEnum.COMPLETED,
        longString + '-category',
        longString + '-credit',
      );

      expect(event.aggregateId).toBe(longString);
      expect(event.accountId).toBe(longString + '-account');
      expect(event.budgetId).toBe(longString + '-budget');
      expect(event.description).toBe(longString + '-description');
      expect(event.categoryId).toBe(longString + '-category');
      expect(event.creditCardId).toBe(longString + '-credit');
    });

    it('should handle special characters in strings', () => {
      const specialChars = 'test-123_@#$%^&*()ñáéíóú事件🎯';
      const event = new TransactionDeletedEvent(
        specialChars,
        specialChars + '-account',
        specialChars + '-budget',
        100,
        TransactionTypeEnum.INCOME,
        specialChars + '-description',
        TransactionStatusEnum.COMPLETED,
        specialChars + '-category',
        specialChars + '-credit',
      );

      expect(event.aggregateId).toBe(specialChars);
      expect(event.description).toBe(specialChars + '-description');
    });

    it('should handle infinity amounts', () => {
      const event = new TransactionDeletedEvent(
        'transaction-infinity',
        'account-123',
        'budget-456',
        Number.POSITIVE_INFINITY,
        TransactionTypeEnum.INCOME,
        'Infinity amount',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.amount).toBe(Number.POSITIVE_INFINITY);
    });

    it('should handle negative infinity amounts', () => {
      const event = new TransactionDeletedEvent(
        'transaction-neg-infinity',
        'account-123',
        'budget-456',
        Number.NEGATIVE_INFINITY,
        TransactionTypeEnum.EXPENSE,
        'Negative infinity',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.amount).toBe(Number.NEGATIVE_INFINITY);
    });

    it('should handle NaN amounts', () => {
      const event = new TransactionDeletedEvent(
        'transaction-nan',
        'account-123',
        'budget-456',
        NaN,
        TransactionTypeEnum.TRANSFER,
        'NaN amount',
        TransactionStatusEnum.COMPLETED,
      );

      expect(Number.isNaN(event.amount)).toBe(true);
    });
  });

  describe('domain event interface compliance', () => {
    it('should implement IDomainEvent interface', () => {
      const event = new TransactionDeletedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.budgetId,
        validParams.amount,
        validParams.type,
        validParams.description,
        validParams.status,
      );

      expect(event).toHaveProperty('aggregateId');
      expect(event).toHaveProperty('occurredOn');
      expect(event).toHaveProperty('eventVersion');

      expect(typeof event.aggregateId).toBe('string');
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(typeof event.eventVersion).toBe('number');
    });

    it('should maintain immutable properties', () => {
      const event = new TransactionDeletedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.budgetId,
        validParams.amount,
        validParams.type,
        validParams.description,
        validParams.status,
        validParams.categoryId,
        validParams.creditCardId,
        validParams.transactionDate,
      );

      expect(event.aggregateId).toBeDefined();
      expect(event.accountId).toBeDefined();
      expect(event.budgetId).toBeDefined();
      expect(event.amount).toBeDefined();
      expect(event.type).toBeDefined();
      expect(event.description).toBeDefined();
      expect(event.status).toBeDefined();
      expect(event.categoryId).toBeDefined();
      expect(event.creditCardId).toBeDefined();
      expect(event.transactionDate).toBeDefined();
      expect(event.occurredOn).toBeDefined();
      expect(event.eventVersion).toBeDefined();
    });
  });

  describe('business logic scenarios', () => {
    it('should represent salary transaction deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-salary-001',
        'account-checking',
        'budget-personal',
        3500,
        TransactionTypeEnum.INCOME,
        'Monthly salary',
        TransactionStatusEnum.COMPLETED,
        'category-salary',
        undefined,
        new Date('2024-01-01T00:00:00.000Z'),
      );

      expect(event.type).toBe(TransactionTypeEnum.INCOME);
      expect(event.amount).toBe(3500);
      expect(event.description).toBe('Monthly salary');
      expect(event.categoryId).toBe('category-salary');
      expect(event.creditCardId).toBeUndefined();
    });

    it('should represent credit card expense deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-credit-001',
        'account-credit-card',
        'budget-personal',
        -299.99,
        TransactionTypeEnum.EXPENSE,
        'Online shopping',
        TransactionStatusEnum.COMPLETED,
        'category-shopping',
        'credit-card-platinum',
        new Date('2024-01-05T14:30:00.000Z'),
      );

      expect(event.type).toBe(TransactionTypeEnum.EXPENSE);
      expect(event.amount).toBe(-299.99);
      expect(event.description).toBe('Online shopping');
      expect(event.categoryId).toBe('category-shopping');
      expect(event.creditCardId).toBe('credit-card-platinum');
    });

    it('should represent scheduled transaction deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-scheduled-001',
        'account-checking',
        'budget-personal',
        -150,
        TransactionTypeEnum.EXPENSE,
        'Scheduled bill payment',
        TransactionStatusEnum.SCHEDULED,
        'category-utilities',
        undefined,
        new Date('2024-01-20T09:00:00.000Z'),
      );

      expect(event.status).toBe(TransactionStatusEnum.SCHEDULED);
      expect(event.description).toBe('Scheduled bill payment');
      expect(event.transactionDate).toEqual(
        new Date('2024-01-20T09:00:00.000Z'),
      );
    });

    it('should represent transfer deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-transfer-001',
        'account-checking',
        'budget-personal',
        -1000,
        TransactionTypeEnum.TRANSFER,
        'Transfer to savings',
        TransactionStatusEnum.COMPLETED,
        'category-transfers',
        undefined,
        new Date('2024-01-10T16:45:00.000Z'),
      );

      expect(event.type).toBe(TransactionTypeEnum.TRANSFER);
      expect(event.amount).toBe(-1000);
      expect(event.description).toBe('Transfer to savings');
      expect(event.categoryId).toBe('category-transfers');
    });

    it('should represent cancelled transaction deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-cancelled-001',
        'account-checking',
        'budget-personal',
        0,
        TransactionTypeEnum.EXPENSE,
        'Cancelled payment',
        TransactionStatusEnum.CANCELLED,
        undefined,
        undefined,
        new Date('2024-01-12T12:00:00.000Z'),
      );

      expect(event.status).toBe(TransactionStatusEnum.CANCELLED);
      expect(event.amount).toBe(0);
      expect(event.description).toBe('Cancelled payment');
      expect(event.categoryId).toBeUndefined();
      expect(event.creditCardId).toBeUndefined();
    });

    it('should represent uncategorized transaction deletion', () => {
      const event = new TransactionDeletedEvent(
        'transaction-uncategorized-001',
        'account-checking',
        'budget-personal',
        -75.25,
        TransactionTypeEnum.EXPENSE,
        'Miscellaneous expense',
        TransactionStatusEnum.COMPLETED,
      );

      expect(event.description).toBe('Miscellaneous expense');
      expect(event.categoryId).toBeUndefined();
      expect(event.creditCardId).toBeUndefined();
      expect(event.transactionDate).toBeUndefined();
    });
  });
});
