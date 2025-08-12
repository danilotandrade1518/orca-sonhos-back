import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { AddCreditCardRepository } from './AddCreditCardRepository';

describe('AddCreditCardRepository', () => {
  let repository: AddCreditCardRepository;
  let mockConnection: {
    queryOne: jest.Mock;
  };

  beforeEach(() => {
    mockConnection = {
      queryOne: jest.fn().mockResolvedValue(undefined),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repository = new AddCreditCardRepository(mockConnection as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createValidCreditCard = (): CreditCard => {
    return CreditCard.create({
      name: 'Visa Credit Card',
      limit: 500000,
      closingDay: 15,
      dueDay: 10,
      budgetId: EntityId.create().value!.id,
    }).data!;
  };

  describe('execute', () => {
    it('should add credit card successfully', async () => {
      const creditCard = createValidCreditCard();

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledTimes(1);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_cards'),
        expect.arrayContaining([
          creditCard.id,
          'Visa Credit Card',
          500000,
          15,
          10,
          creditCard.budgetId,
          false, // is_deleted
          creditCard.createdAt,
          creditCard.updatedAt,
        ]),
      );
    });

    it('should call INSERT with correct SQL structure', async () => {
      const creditCard = createValidCreditCard();

      await repository.execute(creditCard);

      const [query, params] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('INSERT INTO credit_cards');
      expect(query).toContain(
        'id, name, credit_limit, closing_day, due_day, budget_id',
      );
      expect(query).toContain('is_deleted, created_at, updated_at');
      expect(query).toContain('VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)');
      expect(params).toHaveLength(9);
    });

    it('should handle credit card with different closing and due days', async () => {
      const creditCard = CreditCard.create({
        name: 'Mastercard',
        limit: 300000,
        closingDay: 25,
        dueDay: 15,
        budgetId: EntityId.create().value!.id,
      }).data!;

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_cards'),
        expect.arrayContaining([25, 15]),
      );
    });

    it('should handle credit card with large limit', async () => {
      const creditCard = CreditCard.create({
        name: 'Premium Card',
        limit: 1000000, // 10,000.00
        closingDay: 30,
        dueDay: 20,
        budgetId: EntityId.create().value!.id,
      }).data!;

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_cards'),
        expect.arrayContaining([1000000]),
      );
    });

    it('should handle deleted credit card', async () => {
      const creditCard = createValidCreditCard();
      creditCard.delete();

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_cards'),
        expect.arrayContaining([true]), // is_deleted = true
      );
    });

    it('should return error when database fails with duplicate key', async () => {
      const creditCard = createValidCreditCard();
      const dbError = new Error('Duplicate key violation') as Error & {
        code: string;
      };
      dbError.code = '23505';

      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Credit card with id already exists',
      );
    });

    it('should return error when database fails with generic error', async () => {
      const creditCard = createValidCreditCard();
      const dbError = new Error('Database connection failed');

      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to add credit card');
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should handle unknown error type', async () => {
      const creditCard = createValidCreditCard();
      const unknownError = 'Unknown error string';

      mockConnection.queryOne.mockRejectedValue(unknownError);

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to add credit card');
      expect(result.errors[0].message).toContain('Unknown error');
    });

    it('should preserve all credit card properties', async () => {
      const budgetId = EntityId.create().value!.id;
      const creditCard = CreditCard.create({
        name: 'Complete Card',
        limit: 750000,
        closingDay: 12,
        dueDay: 5,
        budgetId,
      }).data!;

      await repository.execute(creditCard);

      const [, params] = mockConnection.queryOne.mock.calls[0];
      expect(params[0]).toBe(creditCard.id); // id
      expect(params[1]).toBe('Complete Card'); // name
      expect(params[2]).toBe(750000); // limit
      expect(params[3]).toBe(12); // closing_day
      expect(params[4]).toBe(5); // due_day
      expect(params[5]).toBe(budgetId); // budget_id
      expect(params[6]).toBe(false); // is_deleted
      expect(params[7]).toBeInstanceOf(Date); // created_at
      expect(params[8]).toBeInstanceOf(Date); // updated_at
    });

    it('should handle credit card with minimum valid closing and due days', async () => {
      const creditCard = CreditCard.create({
        name: 'Min Days Card',
        limit: 100000,
        closingDay: 1,
        dueDay: 1,
        budgetId: EntityId.create().value!.id,
      }).data!;

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO credit_cards'),
        expect.arrayContaining([1, 1]),
      );
    });
  });
});
