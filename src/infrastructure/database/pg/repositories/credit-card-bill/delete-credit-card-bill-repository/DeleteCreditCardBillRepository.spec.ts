import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { DeleteCreditCardBillRepository } from './DeleteCreditCardBillRepository';

describe('DeleteCreditCardBillRepository', () => {
  let repository: DeleteCreditCardBillRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    mockConnection = {
      query: jest.fn(),
      getClient: jest.fn(),
      transaction: jest.fn(),
    };
    repository = new DeleteCreditCardBillRepository(mockConnection);
  });

  describe('execute', () => {
    const validId = 'valid-credit-card-bill-id';

    it('should delete credit card bill successfully', async () => {
      const mockResult = { rowCount: 1 };
      mockConnection.query.mockResolvedValue({
        rows: [mockResult],
        rowCount: 1,
      });

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_card_bills'),
        [validId],
      );
    });

    it('should call UPDATE with correct SQL structure for soft delete', async () => {
      const mockResult = { rowCount: 1 };
      mockConnection.query.mockResolvedValue({
        rows: [mockResult],
        rowCount: 1,
      });

      await repository.execute(validId);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringMatching(
          /UPDATE\s+credit_card_bills\s+SET\s+is_deleted\s*=\s*true,\s*updated_at\s*=\s*NOW\(\)\s+WHERE\s+id\s*=\s*\$1\s+AND\s+is_deleted\s*=\s*false/i,
        ),
        [validId],
      );
    });

    it('should return error when credit card bill not found', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe(
        'Credit card bill not found or already deleted',
      );
    });

    it('should return error when result is null', async () => {
      mockConnection.query.mockResolvedValue(null);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe(
        'Credit card bill not found or already deleted',
      );
    });

    it('should return error when result is null', async () => {
      mockConnection.query.mockResolvedValue(null);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe(
        'Credit card bill not found or already deleted',
      );
    });

    it('should handle empty string id', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute('');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe(
        'Credit card bill not found or already deleted',
      );
    });

    it('should handle whitespace-only id', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute('   ');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe(
        'Credit card bill not found or already deleted',
      );
    });

    it('should handle non-existent credit card bill id', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute('non-existent-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe(
        'Credit card bill not found or already deleted',
      );
    });

    it('should handle malformed credit card bill id', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute('invalid-uuid-format');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe(
        'Credit card bill not found or already deleted',
      );
    });

    it('should return error when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to delete credit card bill',
      );
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should preserve error details when database operation fails', async () => {
      const originalError = new Error('Constraint violation');
      mockConnection.query.mockRejectedValue(originalError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe(
        'Failed to delete credit card bill: Constraint violation',
      );
      expect(result.errors[0].cause).toBe(originalError);
    });

    it('should handle very long credit card bill id', async () => {
      const longId = 'a'.repeat(1000);
      mockConnection.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute(longId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe(
        'Credit card bill not found or already deleted',
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_card_bills'),
        [longId],
      );
    });

    it('should handle special characters in credit card bill id', async () => {
      const specialId = 'bill-id-with-special-chars-!@#$%';
      const mockResult = { rowCount: 1 };
      mockConnection.query.mockResolvedValue({
        rows: [mockResult],
        rowCount: 1,
      });

      const result = await repository.execute(specialId);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE credit_card_bills'),
        [specialId],
      );
    });

    it('should handle successful deletion with exactly one row affected', async () => {
      const mockResult = { rowCount: 1 };
      mockConnection.query.mockResolvedValue({
        rows: [mockResult],
        rowCount: 1,
      });

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
    });

    it('should return success result with correct type', async () => {
      const mockResult = { rowCount: 1 };
      mockConnection.query.mockResolvedValue({
        rows: [mockResult],
        rowCount: 1,
      });

      const result = await repository.execute(validId);

      expect(result).toBeInstanceOf(Either);
      expect(result.hasError).toBe(false);
    });
  });
});
