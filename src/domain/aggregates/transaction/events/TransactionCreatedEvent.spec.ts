import { TransactionCreatedEvent } from './TransactionCreatedEvent';
import { TransactionTypeEnum } from '../value-objects/transaction-type/TransactionType';

describe('TransactionCreatedEvent', () => {
  const validParams = {
    aggregateId: 'transaction-123',
    accountId: 'account-456',
    amount: 250.75,
    type: TransactionTypeEnum.INCOME,
    categoryId: 'category-789',
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
      const event = new TransactionCreatedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.amount,
        validParams.type,
        validParams.categoryId,
      );

      expect(event.aggregateId).toBe(validParams.aggregateId);
      expect(event.accountId).toBe(validParams.accountId);
      expect(event.amount).toBe(validParams.amount);
      expect(event.type).toBe(validParams.type);
      expect(event.categoryId).toBe(validParams.categoryId);
      expect(event.occurredOn).toEqual(new Date('2024-01-15T10:30:00.000Z'));
      expect(event.eventVersion).toBe(1);
    });

    it('should create event without optional categoryId', () => {
      const event = new TransactionCreatedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.amount,
        validParams.type,
      );

      expect(event.aggregateId).toBe(validParams.aggregateId);
      expect(event.accountId).toBe(validParams.accountId);
      expect(event.amount).toBe(validParams.amount);
      expect(event.type).toBe(validParams.type);
      expect(event.categoryId).toBeUndefined();
    });

    it('should handle categoryId as undefined explicitly', () => {
      const event = new TransactionCreatedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.amount,
        validParams.type,
        undefined,
      );

      expect(event.categoryId).toBeUndefined();
    });
  });

  describe('transaction types', () => {
    it('should handle INCOME type', () => {
      const event = new TransactionCreatedEvent(
        'transaction-income',
        'account-123',
        1500,
        TransactionTypeEnum.INCOME,
      );

      expect(event.type).toBe(TransactionTypeEnum.INCOME);
      expect(event.amount).toBe(1500);
    });

    it('should handle EXPENSE type', () => {
      const event = new TransactionCreatedEvent(
        'transaction-expense',
        'account-123',
        -500,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.type).toBe(TransactionTypeEnum.EXPENSE);
      expect(event.amount).toBe(-500);
    });

    it('should handle TRANSFER type', () => {
      const event = new TransactionCreatedEvent(
        'transaction-transfer',
        'account-123',
        750,
        TransactionTypeEnum.TRANSFER,
      );

      expect(event.type).toBe(TransactionTypeEnum.TRANSFER);
      expect(event.amount).toBe(750);
    });
  });

  describe('amount validation scenarios', () => {
    it('should handle positive amounts', () => {
      const event = new TransactionCreatedEvent(
        'transaction-123',
        'account-456',
        999.99,
        TransactionTypeEnum.INCOME,
      );

      expect(event.amount).toBe(999.99);
    });

    it('should handle negative amounts', () => {
      const event = new TransactionCreatedEvent(
        'transaction-123',
        'account-456',
        -150.5,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.amount).toBe(-150.5);
    });

    it('should handle zero amount', () => {
      const event = new TransactionCreatedEvent(
        'transaction-123',
        'account-456',
        0,
        TransactionTypeEnum.TRANSFER,
      );

      expect(event.amount).toBe(0);
    });

    it('should handle decimal amounts', () => {
      const event = new TransactionCreatedEvent(
        'transaction-123',
        'account-456',
        123.456,
        TransactionTypeEnum.INCOME,
      );

      expect(event.amount).toBe(123.456);
    });

    it('should handle very large amounts', () => {
      const largeAmount = 9999999999.99;
      const event = new TransactionCreatedEvent(
        'transaction-123',
        'account-456',
        largeAmount,
        TransactionTypeEnum.INCOME,
      );

      expect(event.amount).toBe(largeAmount);
    });

    it('should handle very small amounts', () => {
      const smallAmount = 0.01;
      const event = new TransactionCreatedEvent(
        'transaction-123',
        'account-456',
        smallAmount,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.amount).toBe(smallAmount);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string IDs', () => {
      const event = new TransactionCreatedEvent(
        '',
        '',
        100,
        TransactionTypeEnum.INCOME,
        '',
      );

      expect(event.aggregateId).toBe('');
      expect(event.accountId).toBe('');
      expect(event.categoryId).toBe('');
    });

    it('should handle very long string IDs', () => {
      const longId = 'a'.repeat(1000);
      const event = new TransactionCreatedEvent(
        longId,
        longId + '-account',
        100,
        TransactionTypeEnum.INCOME,
        longId + '-category',
      );

      expect(event.aggregateId).toBe(longId);
      expect(event.accountId).toBe(longId + '-account');
      expect(event.categoryId).toBe(longId + '-category');
    });

    it('should handle special characters in IDs', () => {
      const specialId = 'test-123_@#$%^&*()ñáéíóú事件🎯';
      const event = new TransactionCreatedEvent(
        specialId,
        specialId + '-account',
        100,
        TransactionTypeEnum.INCOME,
        specialId + '-category',
      );

      expect(event.aggregateId).toBe(specialId);
      expect(event.accountId).toBe(specialId + '-account');
      expect(event.categoryId).toBe(specialId + '-category');
    });

    it('should handle infinity amounts', () => {
      const event = new TransactionCreatedEvent(
        'transaction-123',
        'account-456',
        Number.POSITIVE_INFINITY,
        TransactionTypeEnum.INCOME,
      );

      expect(event.amount).toBe(Number.POSITIVE_INFINITY);
    });

    it('should handle negative infinity amounts', () => {
      const event = new TransactionCreatedEvent(
        'transaction-123',
        'account-456',
        Number.NEGATIVE_INFINITY,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.amount).toBe(Number.NEGATIVE_INFINITY);
    });
  });

  describe('domain event interface compliance', () => {
    it('should implement IDomainEvent interface', () => {
      const event = new TransactionCreatedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.amount,
        validParams.type,
        validParams.categoryId,
      );

      expect(event).toHaveProperty('aggregateId');
      expect(event).toHaveProperty('occurredOn');
      expect(event).toHaveProperty('eventVersion');

      expect(typeof event.aggregateId).toBe('string');
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(typeof event.eventVersion).toBe('number');
    });

    it('should maintain immutable properties', () => {
      const event = new TransactionCreatedEvent(
        validParams.aggregateId,
        validParams.accountId,
        validParams.amount,
        validParams.type,
        validParams.categoryId,
      );

      expect(event.aggregateId).toBeDefined();
      expect(event.accountId).toBeDefined();
      expect(event.amount).toBeDefined();
      expect(event.type).toBeDefined();
      expect(event.categoryId).toBeDefined();
      expect(event.occurredOn).toBeDefined();
      expect(event.eventVersion).toBeDefined();
    });
  });

  describe('business logic scenarios', () => {
    it('should represent salary income transaction', () => {
      const event = new TransactionCreatedEvent(
        'transaction-salary-001',
        'account-checking',
        3500,
        TransactionTypeEnum.INCOME,
        'category-salary',
      );

      expect(event.type).toBe(TransactionTypeEnum.INCOME);
      expect(event.amount).toBe(3500);
      expect(event.categoryId).toBe('category-salary');
    });

    it('should represent grocery expense transaction', () => {
      const event = new TransactionCreatedEvent(
        'transaction-grocery-001',
        'account-checking',
        -125.75,
        TransactionTypeEnum.EXPENSE,
        'category-groceries',
      );

      expect(event.type).toBe(TransactionTypeEnum.EXPENSE);
      expect(event.amount).toBe(-125.75);
      expect(event.categoryId).toBe('category-groceries');
    });

    it('should represent transfer between accounts', () => {
      const event = new TransactionCreatedEvent(
        'transaction-transfer-001',
        'account-checking',
        -1000,
        TransactionTypeEnum.TRANSFER,
        'category-transfers',
      );

      expect(event.type).toBe(TransactionTypeEnum.TRANSFER);
      expect(event.amount).toBe(-1000);
      expect(event.categoryId).toBe('category-transfers');
    });

    it('should represent uncategorized transaction', () => {
      const event = new TransactionCreatedEvent(
        'transaction-misc-001',
        'account-checking',
        50,
        TransactionTypeEnum.INCOME,
      );

      expect(event.type).toBe(TransactionTypeEnum.INCOME);
      expect(event.amount).toBe(50);
      expect(event.categoryId).toBeUndefined();
    });

    it('should represent investment income', () => {
      const event = new TransactionCreatedEvent(
        'transaction-investment-001',
        'account-investment',
        275.33,
        TransactionTypeEnum.INCOME,
        'category-investments',
      );

      expect(event.type).toBe(TransactionTypeEnum.INCOME);
      expect(event.amount).toBe(275.33);
      expect(event.accountId).toBe('account-investment');
      expect(event.categoryId).toBe('category-investments');
    });

    it('should represent bill payment', () => {
      const event = new TransactionCreatedEvent(
        'transaction-bill-001',
        'account-checking',
        -89.99,
        TransactionTypeEnum.EXPENSE,
        'category-utilities',
      );

      expect(event.type).toBe(TransactionTypeEnum.EXPENSE);
      expect(event.amount).toBe(-89.99);
      expect(event.categoryId).toBe('category-utilities');
    });
  });
});
