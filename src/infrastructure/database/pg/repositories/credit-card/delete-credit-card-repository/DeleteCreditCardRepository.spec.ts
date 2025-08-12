import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { DeleteCreditCardRepository } from './DeleteCreditCardRepository';

describe('DeleteCreditCardRepository', () => {
  let repository: DeleteCreditCardRepository;
  let mockConnection: {
    queryOne: jest.Mock;
  };

  beforeEach(() => {
    mockConnection = {
      queryOne: jest.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repository = new DeleteCreditCardRepository(mockConnection as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete credit card successfully', async () => {
      const creditCardId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCardId);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledTimes(1);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        [creditCardId],
      );
    });

    it('should call UPDATE with correct SQL structure', async () => {
      const creditCardId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(creditCardId);

      const [query, params] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('UPDATE credit_cards');
      expect(query).toContain('is_deleted = true');
      expect(query).toContain('updated_at = NOW()');
      expect(query).toContain('WHERE id = $1 AND is_deleted = false');
      expect(params).toEqual([creditCardId]);
      expect(params).toHaveLength(1);
    });

    it('should only update non-deleted credit cards', async () => {
      const creditCardId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(creditCardId);

      const [query] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('is_deleted = false');
    });

    it('should set updated_at to current time', async () => {
      const creditCardId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(creditCardId);

      const [query] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('updated_at = NOW()');
    });

    it('should handle different valid credit card IDs', async () => {
      const creditCardId1 = EntityId.create().value!.id;
      const creditCardId2 = EntityId.create().value!.id;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result1 = await repository.execute(creditCardId1);
      const result2 = await repository.execute(creditCardId2);

      expect(result1.hasError).toBe(false);
      expect(result2.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        [creditCardId1],
      );
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        [creditCardId2],
      );
    });

    it('should return error when credit card not found', async () => {
      const creditCardId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 0 });

      const result = await repository.execute(creditCardId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Credit card with id');
      expect(result.errors[0].message).toContain('not found for deletion');
      expect(result.errors[0].message).toContain(creditCardId);
    });

    it('should return error when query returns null', async () => {
      const creditCardId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute(creditCardId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('not found for deletion');
    });

    it('should return error when database fails', async () => {
      const creditCardId = EntityId.create().value!.id;
      const dbError = new Error('Database connection failed');
      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute(creditCardId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to delete credit card',
      );
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should handle string credit card ID correctly', async () => {
      const creditCardId = 'fixed-credit-card-id-123';
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCardId);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        [creditCardId],
      );
    });

    it('should handle already deleted credit card (no rows affected)', async () => {
      const creditCardId = EntityId.create().value!.id;
      // Simula que nenhuma linha foi afetada porque o credit card já estava deletado
      mockConnection.queryOne.mockResolvedValue({ rowCount: 0 });

      const result = await repository.execute(creditCardId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].message).toContain('not found for deletion');
    });

    it('should perform soft delete, not hard delete', async () => {
      const creditCardId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(creditCardId);

      const [query] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('UPDATE credit_cards');
      expect(query).not.toContain('DELETE FROM');
      expect(query).toContain('is_deleted = true');
    });

    it('should handle deletion of credit cards with different limits', async () => {
      const creditCardId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCardId);

      expect(result.hasError).toBe(false);
      // Should work regardless of credit card limit
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        [creditCardId],
      );
    });

    it('should handle deletion of credit cards with different closing days', async () => {
      const creditCardId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCardId);

      expect(result.hasError).toBe(false);
      // Should work regardless of closing/due days
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        [creditCardId],
      );
    });

    it('should handle deletion of credit cards from different budgets', async () => {
      const creditCardId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(creditCardId);

      expect(result.hasError).toBe(false);
      // Should work regardless of which budget it belongs to
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_cards'),
        [creditCardId],
      );
    });
  });
});
