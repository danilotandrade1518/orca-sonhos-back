import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { SaveCreditCardRepository } from './SaveCreditCardRepository';

describe('SaveCreditCardRepository', () => {
  let repository: SaveCreditCardRepository;
  let mockConnection: {
    queryOne: jest.Mock;
  };

  beforeEach(() => {
    mockConnection = {
      queryOne: jest.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repository = new SaveCreditCardRepository(mockConnection as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createValidCreditCard = (): CreditCard => {
    return CreditCard.create({
      name: 'Test Credit Card',
      limit: 500000,
      closingDay: 15,
      dueDay: 10,
      budgetId: EntityId.create().value!.id,
    }).data!;
  };

  describe('execute', () => {
    it('should save credit card successfully', async () => {
      const creditCard = createValidCreditCard();

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledTimes(1);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        expect.arrayContaining([
          creditCard.id,
          'Test Credit Card',
          500000,
          15,
          10,
          creditCard.budgetId,
          false,
          creditCard.updatedAt,
        ]),
      );
    });

    it('should call UPDATE with correct SQL structure', async () => {
      const creditCard = createValidCreditCard();
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(creditCard);

      const [query, params] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('UPDATE credit_cards');
      expect(query).toContain('name = $2');
      expect(query).toContain('limit = $3');
      expect(query).toContain('closing_day = $4');
      expect(query).toContain('due_day = $5');
      expect(query).toContain('budget_id = $6');
      expect(query).toContain('is_deleted = $7');
      expect(query).toContain('updated_at = $8');
      expect(query).toContain('WHERE id = $1');
      expect(params).toHaveLength(8);
    });

    it('should handle credit card with different limit', async () => {
      const creditCard = CreditCard.create({
        name: 'Premium Card',
        limit: 1000000,
        closingDay: 5,
        dueDay: 25,
        budgetId: EntityId.create().value!.id,
      }).data!;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        expect.arrayContaining(['Premium Card', 1000000, 5, 25]),
      );
    });

    it('should handle credit card with different closing and due days', async () => {
      const creditCard = CreditCard.create({
        name: 'Business Card',
        limit: 750000,
        closingDay: 20,
        dueDay: 15,
        budgetId: EntityId.create().value!.id,
      }).data!;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        expect.arrayContaining([20, 15]),
      );
    });

    it('should handle deleted credit card', async () => {
      const creditCard = createValidCreditCard();
      creditCard.delete();

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        expect.arrayContaining([true]), // is_deleted = true
      );
    });

    it('should handle credit card with minimum limit', async () => {
      const creditCard = CreditCard.create({
        name: 'Basic Card',
        limit: 100000, // R$ 1000.00
        closingDay: 1,
        dueDay: 1,
        budgetId: EntityId.create().value!.id,
      }).data!;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        expect.arrayContaining([100000]),
      );
    });

    it('should handle credit card with maximum closing and due days', async () => {
      const creditCard = CreditCard.create({
        name: 'End of Month Card',
        limit: 300000,
        closingDay: 31,
        dueDay: 31,
        budgetId: EntityId.create().value!.id,
      }).data!;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        expect.arrayContaining([31, 31]),
      );
    });

    it('should return error when credit card not found', async () => {
      const creditCard = createValidCreditCard();
      mockConnection.queryOne.mockResolvedValue({ rowCount: 0 });

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Credit card with id');
      expect(result.errors[0].message).toContain('not found for update');
      expect(result.errors[0].message).toContain(creditCard.id);
    });

    it('should return error when query returns null', async () => {
      const creditCard = createValidCreditCard();
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('not found for update');
    });

    it('should return error when database fails', async () => {
      const creditCard = createValidCreditCard();
      const dbError = new Error('Database connection failed');
      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to save credit card');
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should preserve all credit card properties during update', async () => {
      const budgetId = EntityId.create().value!.id;
      const creditCard = CreditCard.create({
        name: 'Complete Card',
        limit: 600000,
        closingDay: 12,
        dueDay: 8,
        budgetId,
      }).data!;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(creditCard);

      const [, params] = mockConnection.queryOne.mock.calls[0];
      expect(params[0]).toBe(creditCard.id); // id
      expect(params[1]).toBe('Complete Card'); // name
      expect(params[2]).toBe(600000); // limit
      expect(params[3]).toBe(12); // closing_day
      expect(params[4]).toBe(8); // due_day
      expect(params[5]).toBe(budgetId); // budget_id
      expect(params[6]).toBe(false); // is_deleted
      expect(params[7]).toBeInstanceOf(Date); // updated_at
    });

    it('should handle credit card with different budget', async () => {
      const newBudgetId = EntityId.create().value!.id;
      const creditCard = CreditCard.create({
        name: 'New Budget Card',
        limit: 450000,
        closingDay: 7,
        dueDay: 2,
        budgetId: newBudgetId,
      }).data!;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        expect.arrayContaining([newBudgetId]),
      );
    });

    it('should handle credit card name changes', async () => {
      const creditCard = createValidCreditCard();
      // Simula mudança de nome (através de um novo objeto com mesmo ID)
      const updatedCreditCard = CreditCard.create({
        name: 'Updated Card Name',
        limit: 500000,
        closingDay: 15,
        dueDay: 10,
        budgetId: creditCard.budgetId,
      }).data!;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(updatedCreditCard);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        expect.arrayContaining(['Updated Card Name']),
      );
    });
  });
});
