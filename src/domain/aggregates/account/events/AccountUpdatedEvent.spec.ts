import { AccountUpdatedEvent } from './AccountUpdatedEvent';

describe('AccountUpdatedEvent', () => {
  const validParams = {
    aggregateId: 'account-123',
    budgetId: 'budget-456',
    previousName: 'Old Account Name',
    newName: 'New Account Name',
    previousInitialBalance: 1000,
    newInitialBalance: 1500,
    previousDescription: 'Old description',
    newDescription: 'New description',
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
      const event = new AccountUpdatedEvent(
        validParams.aggregateId,
        validParams.budgetId,
        validParams.previousName,
        validParams.newName,
        validParams.previousInitialBalance,
        validParams.newInitialBalance,
        validParams.previousDescription,
        validParams.newDescription,
      );

      expect(event.aggregateId).toBe(validParams.aggregateId);
      expect(event.budgetId).toBe(validParams.budgetId);
      expect(event.previousName).toBe(validParams.previousName);
      expect(event.newName).toBe(validParams.newName);
      expect(event.previousInitialBalance).toBe(
        validParams.previousInitialBalance,
      );
      expect(event.newInitialBalance).toBe(validParams.newInitialBalance);
      expect(event.previousDescription).toBe(validParams.previousDescription);
      expect(event.newDescription).toBe(validParams.newDescription);
      expect(event.occurredOn).toEqual(new Date('2024-01-15T10:30:00.000Z'));
      expect(event.eventVersion).toBe(1);
    });

    it('should create event without optional description parameters', () => {
      const event = new AccountUpdatedEvent(
        validParams.aggregateId,
        validParams.budgetId,
        validParams.previousName,
        validParams.newName,
        validParams.previousInitialBalance,
        validParams.newInitialBalance,
      );

      expect(event.aggregateId).toBe(validParams.aggregateId);
      expect(event.budgetId).toBe(validParams.budgetId);
      expect(event.previousName).toBe(validParams.previousName);
      expect(event.newName).toBe(validParams.newName);
      expect(event.previousInitialBalance).toBe(
        validParams.previousInitialBalance,
      );
      expect(event.newInitialBalance).toBe(validParams.newInitialBalance);
      expect(event.previousDescription).toBeUndefined();
      expect(event.newDescription).toBeUndefined();
    });

    it('should handle only previous description provided', () => {
      const event = new AccountUpdatedEvent(
        validParams.aggregateId,
        validParams.budgetId,
        validParams.previousName,
        validParams.newName,
        validParams.previousInitialBalance,
        validParams.newInitialBalance,
        'Previous description only',
      );

      expect(event.previousDescription).toBe('Previous description only');
      expect(event.newDescription).toBeUndefined();
    });

    it('should handle both description parameters as undefined explicitly', () => {
      const event = new AccountUpdatedEvent(
        validParams.aggregateId,
        validParams.budgetId,
        validParams.previousName,
        validParams.newName,
        validParams.previousInitialBalance,
        validParams.newInitialBalance,
        undefined,
        undefined,
      );

      expect(event.previousDescription).toBeUndefined();
      expect(event.newDescription).toBeUndefined();
    });
  });

  describe('data validation scenarios', () => {
    it('should handle name changes only', () => {
      const event = new AccountUpdatedEvent(
        'account-123',
        'budget-456',
        'Old Name',
        'New Name',
        1000,
        1000, // Same balance
      );

      expect(event.previousName).toBe('Old Name');
      expect(event.newName).toBe('New Name');
      expect(event.previousInitialBalance).toBe(event.newInitialBalance);
    });

    it('should handle balance changes only', () => {
      const event = new AccountUpdatedEvent(
        'account-123',
        'budget-456',
        'Same Name',
        'Same Name',
        500,
        1500,
      );

      expect(event.previousName).toBe(event.newName);
      expect(event.previousInitialBalance).toBe(500);
      expect(event.newInitialBalance).toBe(1500);
    });

    it('should handle description changes only', () => {
      const event = new AccountUpdatedEvent(
        'account-123',
        'budget-456',
        'Same Name',
        'Same Name',
        1000,
        1000,
        'Old description',
        'New description',
      );

      expect(event.previousName).toBe(event.newName);
      expect(event.previousInitialBalance).toBe(event.newInitialBalance);
      expect(event.previousDescription).toBe('Old description');
      expect(event.newDescription).toBe('New description');
    });

    it('should handle negative balance values', () => {
      const event = new AccountUpdatedEvent(
        'account-123',
        'budget-456',
        'Account Name',
        'Account Name',
        -500,
        -200,
      );

      expect(event.previousInitialBalance).toBe(-500);
      expect(event.newInitialBalance).toBe(-200);
    });

    it('should handle zero balance values', () => {
      const event = new AccountUpdatedEvent(
        'account-123',
        'budget-456',
        'Account Name',
        'Account Name',
        0,
        0,
      );

      expect(event.previousInitialBalance).toBe(0);
      expect(event.newInitialBalance).toBe(0);
    });

    it('should handle large balance values', () => {
      const largeValue = 999999999.99;
      const event = new AccountUpdatedEvent(
        'account-123',
        'budget-456',
        'Account Name',
        'Account Name',
        largeValue,
        largeValue * 2,
      );

      expect(event.previousInitialBalance).toBe(largeValue);
      expect(event.newInitialBalance).toBe(largeValue * 2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const event = new AccountUpdatedEvent('', '', '', '', 0, 0, '', '');

      expect(event.aggregateId).toBe('');
      expect(event.budgetId).toBe('');
      expect(event.previousName).toBe('');
      expect(event.newName).toBe('');
      expect(event.previousDescription).toBe('');
      expect(event.newDescription).toBe('');
    });

    it('should handle very long string values', () => {
      const longString = 'a'.repeat(1000);
      const event = new AccountUpdatedEvent(
        'account-123',
        'budget-456',
        longString,
        longString + 'modified',
        1000,
        1500,
        longString,
        longString + 'modified',
      );

      expect(event.previousName).toBe(longString);
      expect(event.newName).toBe(longString + 'modified');
      expect(event.previousDescription).toBe(longString);
      expect(event.newDescription).toBe(longString + 'modified');
    });

    it('should handle special characters in strings', () => {
      const specialChars = 'Test-Name_123@#$%^&*()ñáéíóú事件🎯';
      const event = new AccountUpdatedEvent(
        'account-123',
        'budget-456',
        specialChars,
        specialChars + '-updated',
        1000,
        1500,
        specialChars,
        specialChars + '-updated',
      );

      expect(event.previousName).toBe(specialChars);
      expect(event.newName).toBe(specialChars + '-updated');
      expect(event.previousDescription).toBe(specialChars);
      expect(event.newDescription).toBe(specialChars + '-updated');
    });

    it('should handle decimal balance values', () => {
      const event = new AccountUpdatedEvent(
        'account-123',
        'budget-456',
        'Account Name',
        'Account Name',
        123.45,
        678.9,
      );

      expect(event.previousInitialBalance).toBe(123.45);
      expect(event.newInitialBalance).toBe(678.9);
    });
  });

  describe('domain event interface compliance', () => {
    it('should implement IDomainEvent interface', () => {
      const event = new AccountUpdatedEvent(
        validParams.aggregateId,
        validParams.budgetId,
        validParams.previousName,
        validParams.newName,
        validParams.previousInitialBalance,
        validParams.newInitialBalance,
      );

      expect(event).toHaveProperty('aggregateId');
      expect(event).toHaveProperty('occurredOn');
      expect(event).toHaveProperty('eventVersion');

      expect(typeof event.aggregateId).toBe('string');
      expect(event.occurredOn).toBeInstanceOf(Date);
      expect(typeof event.eventVersion).toBe('number');
    });

    it('should maintain immutable properties', () => {
      const event = new AccountUpdatedEvent(
        validParams.aggregateId,
        validParams.budgetId,
        validParams.previousName,
        validParams.newName,
        validParams.previousInitialBalance,
        validParams.newInitialBalance,
        validParams.previousDescription,
        validParams.newDescription,
      );

      // All properties should be readonly and accessible
      expect(event.aggregateId).toBeDefined();
      expect(event.budgetId).toBeDefined();
      expect(event.previousName).toBeDefined();
      expect(event.newName).toBeDefined();
      expect(event.previousInitialBalance).toBeDefined();
      expect(event.newInitialBalance).toBeDefined();
      expect(event.previousDescription).toBeDefined();
      expect(event.newDescription).toBeDefined();
      expect(event.occurredOn).toBeDefined();
      expect(event.eventVersion).toBeDefined();
    });
  });

  describe('business logic scenarios', () => {
    it('should represent account name update scenario', () => {
      const event = new AccountUpdatedEvent(
        'account-abc123',
        'budget-def456',
        'Conta Corrente',
        'Conta Corrente Principal',
        2500,
        2500,
        'Conta bancária principal',
        'Conta bancária principal da família',
      );

      expect(event.previousName).toBe('Conta Corrente');
      expect(event.newName).toBe('Conta Corrente Principal');
      expect(event.previousDescription).toBe('Conta bancária principal');
      expect(event.newDescription).toBe('Conta bancária principal da família');
    });

    it('should represent balance adjustment scenario', () => {
      const event = new AccountUpdatedEvent(
        'account-xyz789',
        'budget-ghi012',
        'Poupança',
        'Poupança',
        15000,
        18500.5,
        'Conta poupança para emergências',
        'Conta poupança para emergências',
      );

      expect(event.previousInitialBalance).toBe(15000);
      expect(event.newInitialBalance).toBe(18500.5);
      expect(event.previousDescription).toBe(event.newDescription);
    });

    it('should represent complete account update scenario', () => {
      const event = new AccountUpdatedEvent(
        'account-full123',
        'budget-update456',
        'Cartão de Crédito',
        'Cartão de Crédito Platinum',
        -1500,
        -2000,
        'Cartão principal',
        'Cartão principal com limite aumentado',
      );

      // All properties changed
      expect(event.previousName).not.toBe(event.newName);
      expect(event.previousInitialBalance).not.toBe(event.newInitialBalance);
      expect(event.previousDescription).not.toBe(event.newDescription);

      // Negative balance for credit card debt
      expect(event.previousInitialBalance).toBe(-1500);
      expect(event.newInitialBalance).toBe(-2000);
    });
  });
});
