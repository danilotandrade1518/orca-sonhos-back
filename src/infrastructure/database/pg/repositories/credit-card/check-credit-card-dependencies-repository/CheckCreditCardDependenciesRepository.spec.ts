import { RepositoryError } from '@application/shared/errors/RepositoryError';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { CheckCreditCardDependenciesRepository } from './CheckCreditCardDependenciesRepository';

describe('CheckCreditCardDependenciesRepository', () => {
  let repository: CheckCreditCardDependenciesRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new CheckCreditCardDependenciesRepository(mockConnection);
  });

  describe('execute', () => {
    it('should return true when credit card has dependencies', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_dependencies: true });

      const result = await repository.execute('credit-card-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(expect.any(String), [
        'credit-card-id',
      ]);
    });

    it('should return false when credit card has no dependencies', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_dependencies: false });

      const result = await repository.execute('credit-card-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should return false when queryOne returns undefined', async () => {
      mockConnection.queryOne.mockResolvedValue(undefined);

      const result = await repository.execute('credit-card-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should ignore deleted credit card bills', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_dependencies: false });

      await repository.execute('credit-card-id');

      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['credit-card-id'],
      );
    });

    it('should handle database errors', async () => {
      const err = new Error('Database connection failed');
      mockConnection.queryOne.mockRejectedValue(err);

      const result = await repository.execute('credit-card-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to check credit card dependencies',
      );
    });

    it('should handle unknown errors', async () => {
      const err = 'Unknown error';
      mockConnection.queryOne.mockRejectedValue(err);

      const result = await repository.execute('credit-card-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Unknown error');
    });

    it('should check credit card bills table for dependencies', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_dependencies: false });

      await repository.execute('credit-card-id');

      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('credit_card_bills'),
        expect.any(Array),
      );
    });

    it('should use correct SQL query structure', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_dependencies: false });

      await repository.execute('credit-card-id');

      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT EXISTS'),
        expect.any(Array),
      );
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE credit_card_id = $1'),
        expect.any(Array),
      );
    });
  });
});
