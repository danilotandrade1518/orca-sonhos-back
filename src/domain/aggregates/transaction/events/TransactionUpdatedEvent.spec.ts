import { TransactionUpdatedEvent } from './TransactionUpdatedEvent';
import { TransactionTypeEnum } from '../value-objects/transaction-type/TransactionType';

describe('TransactionUpdatedEvent', () => {
  const validParams = {
    aggregateId: 'transaction-123',
    previousAccountId: 'account-456',
    newAccountId: 'account-789',
    previousAmount: 100.5,
    newAmount: 150.75,
    previousType: TransactionTypeEnum.INCOME,
    newType: TransactionTypeEnum.EXPENSE,
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create event with all required properties', () => {
      const event = new TransactionUpdatedEvent(
        validParams.aggregateId,
        validParams.previousAccountId,
        validParams.newAccountId,
        validParams.previousAmount,
        validParams.newAmount,
        validParams.previousType,
        validParams.newType,
      );

      expect(event.aggregateId).toBe(validParams.aggregateId);
      expect(event.previousAccountId).toBe(validParams.previousAccountId);
      expect(event.newAccountId).toBe(validParams.newAccountId);
      expect(event.previousAmount).toBe(validParams.previousAmount);
      expect(event.newAmount).toBe(validParams.newAmount);
      expect(event.previousType).toBe(validParams.previousType);
      expect(event.newType).toBe(validParams.newType);
      expect(event.occurredOn).toEqual(new Date('2024-01-15T10:30:00.000Z'));
      expect(event.eventVersion).toBe(1);
    });

    it('should handle same account id update', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-456', // Same account
        100,
        200,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.INCOME,
      );

      expect(event.previousAccountId).toBe(event.newAccountId);
      expect(event.previousAmount).not.toBe(event.newAmount);
    });

    it('should handle same amount update', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-789',
        150.75,
        150.75, // Same amount
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.previousAmount).toBe(event.newAmount);
      expect(event.previousType).not.toBe(event.newType);
    });

    it('should handle same type update', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-789',
        100,
        200,
        TransactionTypeEnum.TRANSFER,
        TransactionTypeEnum.TRANSFER, // Same type
      );

      expect(event.previousType).toBe(event.newType);
      expect(event.previousAccountId).not.toBe(event.newAccountId);
    });
  });

  describe('account changes', () => {
    it('should handle account transfer scenario', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-transfer',
        'account-checking',
        'account-savings',
        500,
        500,
        TransactionTypeEnum.TRANSFER,
        TransactionTypeEnum.TRANSFER,
      );

      expect(event.previousAccountId).toBe('account-checking');
      expect(event.newAccountId).toBe('account-savings');
      expect(event.previousAmount).toBe(event.newAmount);
      expect(event.previousType).toBe(event.newType);
    });

    it('should handle empty account ids', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        '',
        '',
        100,
        200,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.previousAccountId).toBe('');
      expect(event.newAccountId).toBe('');
    });

    it('should handle very long account ids', () => {
      const longId = 'a'.repeat(1000);
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        longId,
        longId + '-updated',
        100,
        200,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.previousAccountId).toBe(longId);
      expect(event.newAccountId).toBe(longId + '-updated');
    });
  });

  describe('amount changes', () => {
    it('should handle positive to negative amount change', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-456',
        100.5,
        -50.25,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.previousAmount).toBe(100.5);
      expect(event.newAmount).toBe(-50.25);
    });

    it('should handle negative to positive amount change', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-456',
        -200.75,
        300.25,
        TransactionTypeEnum.EXPENSE,
        TransactionTypeEnum.INCOME,
      );

      expect(event.previousAmount).toBe(-200.75);
      expect(event.newAmount).toBe(300.25);
    });

    it('should handle zero amounts', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-456',
        0,
        0,
        TransactionTypeEnum.TRANSFER,
        TransactionTypeEnum.TRANSFER,
      );

      expect(event.previousAmount).toBe(0);
      expect(event.newAmount).toBe(0);
    });

    it('should handle large amount values', () => {
      const largeAmount = 9999999999.99;
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-456',
        largeAmount,
        largeAmount * 2,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.INCOME,
      );

      expect(event.previousAmount).toBe(largeAmount);
      expect(event.newAmount).toBe(largeAmount * 2);
    });

    it('should handle decimal precision', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-456',
        123.456789,
        987.654321,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.INCOME,
      );

      expect(event.previousAmount).toBe(123.456789);
      expect(event.newAmount).toBe(987.654321);
    });
  });

  describe('transaction type changes', () => {
    it('should handle INCOME to EXPENSE change', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-456',
        100,
        -100,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.previousType).toBe(TransactionTypeEnum.INCOME);
      expect(event.newType).toBe(TransactionTypeEnum.EXPENSE);
    });

    it('should handle EXPENSE to TRANSFER change', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-789',
        -150,
        150,
        TransactionTypeEnum.EXPENSE,
        TransactionTypeEnum.TRANSFER,
      );

      expect(event.previousType).toBe(TransactionTypeEnum.EXPENSE);
      expect(event.newType).toBe(TransactionTypeEnum.TRANSFER);
    });

    it('should handle TRANSFER to INCOME change', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-123',
        'account-456',
        'account-456',
        200,
        200,
        TransactionTypeEnum.TRANSFER,
        TransactionTypeEnum.INCOME,
      );

      expect(event.previousType).toBe(TransactionTypeEnum.TRANSFER);
      expect(event.newType).toBe(TransactionTypeEnum.INCOME);
    });

    it('should handle all transaction type combinations', () => {
      const types = [
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
        TransactionTypeEnum.TRANSFER,
      ];

      types.forEach((previousType) => {
        types.forEach((newType) => {
          const event = new TransactionUpdatedEvent(
            `transaction-${previousType}-${newType}`,
            'account-prev',
            'account-new',
            100,
            200,
            previousType,
            newType,
          );

          expect(event.previousType).toBe(previousType);
          expect(event.newType).toBe(newType);
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const event = new TransactionUpdatedEvent(
        '',
        '',
        '',
        0,
        0,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.aggregateId).toBe('');
      expect(event.previousAccountId).toBe('');
      expect(event.newAccountId).toBe('');
    });

    it('should handle special characters in IDs', () => {
      const specialId = 'test-123_@#$%^&*()ñáéíóú事件🎯';
      const event = new TransactionUpdatedEvent(
        specialId,
        specialId + '-prev',
        specialId + '-new',
        100,
        200,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.aggregateId).toBe(specialId);
      expect(event.previousAccountId).toBe(specialId + '-prev');
      expect(event.newAccountId).toBe(specialId + '-new');
    });

    it('should handle infinity amounts', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-infinity',
        'account-456',
        'account-789',
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.previousAmount).toBe(Number.POSITIVE_INFINITY);
      expect(event.newAmount).toBe(Number.NEGATIVE_INFINITY);
    });

    it('should handle NaN amounts', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-nan',
        'account-456',
        'account-789',
        NaN,
        NaN,
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
      );

      expect(Number.isNaN(event.previousAmount)).toBe(true);
      expect(Number.isNaN(event.newAmount)).toBe(true);
    });
  });

  describe('domain event interface compliance', () => {
    it('should implement IDomainEvent interface', () => {
      const event = new TransactionUpdatedEvent(
        validParams.aggregateId,
        validParams.previousAccountId,
        validParams.newAccountId,
        validParams.previousAmount,
        validParams.newAmount,
        validParams.previousType,
        validParams.newType,
      );

      expect(event).toHaveProperty('aggregateId');
      expect(event).toHaveProperty('occurredOn');
      expect(event).toHaveProperty('eventVersion');

      expect(typeof event.aggregateId).toBe('string');
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(typeof event.eventVersion).toBe('number');
    });

    it('should maintain immutable properties', () => {
      const event = new TransactionUpdatedEvent(
        validParams.aggregateId,
        validParams.previousAccountId,
        validParams.newAccountId,
        validParams.previousAmount,
        validParams.newAmount,
        validParams.previousType,
        validParams.newType,
      );

      expect(event.aggregateId).toBeDefined();
      expect(event.previousAccountId).toBeDefined();
      expect(event.newAccountId).toBeDefined();
      expect(event.previousAmount).toBeDefined();
      expect(event.newAmount).toBeDefined();
      expect(event.previousType).toBeDefined();
      expect(event.newType).toBeDefined();
      expect(event.occurredOn).toBeDefined();
      expect(event.eventVersion).toBeDefined();
    });
  });

  describe('business logic scenarios', () => {
    it('should represent account correction scenario', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-correction-001',
        'account-wrong',
        'account-correct',
        250,
        250,
        TransactionTypeEnum.EXPENSE,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.previousAccountId).toBe('account-wrong');
      expect(event.newAccountId).toBe('account-correct');
      expect(event.previousAmount).toBe(event.newAmount);
      expect(event.previousType).toBe(event.newType);
    });

    it('should represent amount correction scenario', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-amount-fix-001',
        'account-checking',
        'account-checking',
        125.5, // Wrong amount
        135.75, // Correct amount
        TransactionTypeEnum.EXPENSE,
        TransactionTypeEnum.EXPENSE,
      );

      expect(event.previousAmount).toBe(125.5);
      expect(event.newAmount).toBe(135.75);
      expect(event.previousAccountId).toBe(event.newAccountId);
      expect(event.previousType).toBe(event.newType);
    });

    it('should represent transaction type reclassification', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-reclassify-001',
        'account-checking',
        'account-checking',
        -500, // Was classified as expense
        500, // Now classified as income (refund)
        TransactionTypeEnum.EXPENSE,
        TransactionTypeEnum.INCOME,
      );

      expect(event.previousType).toBe(TransactionTypeEnum.EXPENSE);
      expect(event.newType).toBe(TransactionTypeEnum.INCOME);
      expect(event.previousAmount).toBe(-500);
      expect(event.newAmount).toBe(500);
    });

    it('should represent complete transaction update', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-complete-update-001',
        'account-old',
        'account-new',
        -100.25,
        250.75,
        TransactionTypeEnum.EXPENSE,
        TransactionTypeEnum.INCOME,
      );

      // All properties changed
      expect(event.previousAccountId).not.toBe(event.newAccountId);
      expect(event.previousAmount).not.toBe(event.newAmount);
      expect(event.previousType).not.toBe(event.newType);

      // Specific values
      expect(event.previousAccountId).toBe('account-old');
      expect(event.newAccountId).toBe('account-new');
      expect(event.previousAmount).toBe(-100.25);
      expect(event.newAmount).toBe(250.75);
      expect(event.previousType).toBe(TransactionTypeEnum.EXPENSE);
      expect(event.newType).toBe(TransactionTypeEnum.INCOME);
    });

    it('should represent transfer between accounts', () => {
      const event = new TransactionUpdatedEvent(
        'transaction-transfer-update-001',
        'account-checking',
        'account-savings',
        -1000, // Outgoing from checking
        1000, // Incoming to savings
        TransactionTypeEnum.TRANSFER,
        TransactionTypeEnum.TRANSFER,
      );

      expect(event.previousAccountId).toBe('account-checking');
      expect(event.newAccountId).toBe('account-savings');
      expect(event.previousAmount).toBe(-1000);
      expect(event.newAmount).toBe(1000);
      expect(event.previousType).toBe(TransactionTypeEnum.TRANSFER);
      expect(event.newType).toBe(TransactionTypeEnum.TRANSFER);
    });
  });
});
